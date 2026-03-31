import { prisma } from "@mydad/database";

/**
 * Agent Worker — Executes AI agent runs
 *
 * In production, this integrates with Claude API (Anthropic SDK)
 * and pgvector for RAG. For now, provides the orchestration logic.
 */

interface AgentJobPayload {
  agentRunId: string;
}

export async function processAgentRun(payload: AgentJobPayload): Promise<void> {
  const { agentRunId } = payload;

  // Mark as running
  await prisma.agentRun.update({
    where: { id: agentRunId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: agentRunId },
      include: { agent: true },
    });

    if (!run || !run.agent) {
      throw new Error("Agent run or agent not found");
    }

    const agent = run.agent;
    const input = run.input as { message: string; context?: Record<string, unknown> };
    const startTime = Date.now();

    // Step 1: Build context from org data if configured
    let dataContext = "";
    if (agent.dataScopeConfig) {
      const scope = agent.dataScopeConfig as { categories?: string[] };
      if (scope.categories) {
        const metrics = await prisma.computedMetric.findMany({
          where: {
            organizationId: agent.organizationId,
            kpiConfig: { category: { in: scope.categories as any[] } },
          },
          include: { kpiConfig: true },
          orderBy: { periodEnd: "desc" },
          take: 20,
        });

        dataContext = metrics
          .map((m) => `${m.kpiConfig.name}: ${m.value} ${m.kpiConfig.unit}${m.trend ? ` (${m.trend > 0 ? "+" : ""}${m.trend.toFixed(1)}%)` : ""}`)
          .join("\n");
      }
    }

    // Step 2: RAG — Retrieve relevant knowledge chunks
    let ragContext = "";
    const knowledgeBaseIds = agent.knowledgeBaseIds as string[] | null;
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      // In production: generate embedding for input.message, then vector search
      // For now: retrieve recent chunks from linked knowledge bases
      const chunks = await prisma.documentChunk.findMany({
        where: {
          document: {
            knowledgeBase: { id: { in: knowledgeBaseIds } },
          },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
      });

      ragContext = chunks.map((c) => c.content).join("\n\n---\n\n");
    }

    // Step 3: Build the prompt
    const systemPrompt = agent.systemPrompt;
    const contextParts: string[] = [];
    if (dataContext) contextParts.push(`[Données organisation]\n${dataContext}`);
    if (ragContext) contextParts.push(`[Base de connaissances]\n${ragContext}`);

    const fullPrompt = [
      systemPrompt,
      contextParts.length > 0 ? `\n\nContexte:\n${contextParts.join("\n\n")}` : "",
      `\n\nMessage de l'utilisateur: ${input.message}`,
    ].join("");

    // Step 4: Call AI (placeholder — in production, use Anthropic SDK)
    // const anthropic = new Anthropic();
    // const response = await anthropic.messages.create({
    //   model: agent.model,
    //   max_tokens: agent.maxTokens,
    //   temperature: agent.temperature,
    //   messages: [{ role: 'user', content: fullPrompt }],
    // });

    // Placeholder response for development
    const output = generatePlaceholderResponse(agent.type, input.message, dataContext);

    const durationMs = Date.now() - startTime;
    const tokensUsed = Math.ceil(fullPrompt.length / 4) + Math.ceil(output.length / 4);

    // Step 5: Save result
    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: "COMPLETED",
        output,
        tokensUsed,
        durationMs,
        completedAt: new Date(),
      },
    });

    console.log(`[agent-worker] Run ${agentRunId} completed in ${durationMs}ms`);
  } catch (err) {
    await prisma.agentRun.update({
      where: { id: agentRunId },
      data: {
        status: "FAILED",
        errorLog: (err as Error).message,
        completedAt: new Date(),
      },
    });
    console.error(`[agent-worker] Run ${agentRunId} failed:`, err);
  }
}

/**
 * Generate a contextual placeholder response based on agent type
 * This will be replaced by actual Claude API calls in production
 */
function generatePlaceholderResponse(
  agentType: string,
  message: string,
  dataContext: string
): string {
  const responses: Record<string, string> = {
    regulatory: `**Analyse réglementaire**\n\nSur la base de votre question "${message.substring(0, 50)}...", voici mon analyse :\n\n1. **Conformité actuelle** : Vos indicateurs sont globalement alignés avec les exigences réglementaires en vigueur.\n2. **Points d'attention** : Vérifiez les échéances CSRD et la mise à jour des normes sectorielles.\n3. **Recommandation** : Planifiez un pré-audit réglementaire dans les 30 prochains jours.\n\n${dataContext ? `_Données analysées :_\n${dataContext.split("\n").slice(0, 3).join("\n")}` : ""}`,

    funding: `**Recherche de financements**\n\nPour votre demande "${message.substring(0, 50)}...", j'ai identifié les pistes suivantes :\n\n1. **Aide régionale transition écologique** — Jusqu'à 12 000 € (éligibilité estimée : 71%)\n2. **FNE-Formation** — Prise en charge formation RSE (éligibilité : 85%)\n3. **Crédit d'impôt innovation** — Si vous développez des processus innovants\n\n**Action recommandée** : Préparez le dossier pour l'aide régionale avant la date limite.`,

    business: `**Analyse business**\n\nConcernant "${message.substring(0, 50)}..." :\n\n- **Tendance marché** : Les entreprises de votre secteur investissent de plus en plus dans la RSE.\n- **Opportunités** : 3 appels d'offres compatibles avec votre profil HOSMONY.\n- **Positionnement** : Votre niveau HOSMONY vous différencie de 78% de vos concurrents.\n\n${dataContext ? `_Indicateurs clés :_\n${dataContext.split("\n").slice(0, 3).join("\n")}` : ""}`,

    custom: `**Réponse de l'assistant**\n\nJ'ai analysé votre demande : "${message.substring(0, 80)}..."\n\nSur la base des données disponibles, voici mes recommandations :\n\n1. Continuez à suivre vos indicateurs clés régulièrement\n2. Priorisez les actions à fort impact et faible effort\n3. Consultez votre expert-comptable pour valider les décisions stratégiques\n\n${dataContext ? `_Contexte analysé :_\n${dataContext.split("\n").slice(0, 3).join("\n")}` : ""}`,
  };

  return responses[agentType] || responses.custom;
}
