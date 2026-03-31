import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─────────────────────────────────────────
  // 1. HOSMONY LEVELS
  // ─────────────────────────────────────────
  console.log("  → HOSMONY Levels...");
  const levels = await Promise.all([
    prisma.hosmonyLevel.upsert({
      where: { level: 1 },
      update: {},
      create: {
        level: 1,
        name: "Essentiel",
        description:
          "Prise de conscience et premiers pas vers la durabilité. Diagnostic initial, premiers KPI, plateforme collaborative, veille IA, PRIDE.",
        minScore: 0,
        color: "#94A3B8",
        iconName: "seed",
        criteria: {
          summary: "Diagnostic initial + premiers KPI",
          items: [
            "Réaliser le diagnostic initial",
            "Définir 5 premiers KPI (3 financiers + 2 ESG)",
            "Mettre en place la plateforme collaborative",
            "Activer la veille IA réglementaire",
          ],
        },
      },
    }),
    prisma.hosmonyLevel.upsert({
      where: { level: 2 },
      update: {},
      create: {
        level: 2,
        name: "Dynamique",
        description:
          "Structuration de la démarche et formalisation de la stratégie. Stratégie formalisée, suivi semestriel, financement, RH/compétences.",
        minScore: 20,
        color: "#3B82F6",
        iconName: "sprout",
        criteria: {
          summary: "Stratégie formalisée + suivi structuré",
          items: [
            "Formaliser la stratégie (vision, piliers, objectifs)",
            "Mettre en place le suivi semestriel des KPI",
            "Identifier les premières opportunités de financement",
            "Cartographier les compétences clés",
            "Configurer le dashboard de performance",
          ],
        },
      },
    }),
    prisma.hosmonyLevel.upsert({
      where: { level: 3 },
      update: {},
      create: {
        level: 3,
        name: "Performance",
        description:
          "Exécution maîtrisée et mobilisation des équipes. Plan d'action détaillé, accompagnement VSME/CSRD, conseil stratégique IA.",
        minScore: 40,
        color: "#10B981",
        iconName: "tree",
        criteria: {
          summary: "Plan d'action exécuté + équipes mobilisées",
          items: [
            "Déployer un plan d'action détaillé et priorisé",
            "Mobiliser les équipes (initiatives internes)",
            "Suivi trimestriel des KPI",
            "Préparer la conformité VSME/CSRD",
            "Utiliser le conseil stratégique IA",
            "Compléter 70% des exigences du niveau",
          ],
        },
      },
    }),
    prisma.hosmonyLevel.upsert({
      where: { level: 4 },
      update: {},
      create: {
        level: 4,
        name: "Excellence",
        description:
          "Double matérialité, crédibilité marché et label externe. Scoring parties prenantes, analyse de réputation, certification AFNOR.",
        minScore: 65,
        color: "#F59E0B",
        iconName: "award",
        criteria: {
          summary: "Double matérialité + label externe",
          items: [
            "Réaliser l'analyse de double matérialité",
            "Cartographier et scorer les parties prenantes",
            "Obtenir un label externe (AFNOR ou équivalent)",
            "Analyser l'image de marque et la réputation",
            "Atteindre un score global ≥ 65/100",
          ],
        },
      },
    }),
    prisma.hosmonyLevel.upsert({
      where: { level: 5 },
      update: {},
      create: {
        level: 5,
        name: "Étoile",
        description:
          "Avantage concurrentiel, actifs hosmoniques et marketplace. Produits/services alignés HOSMONY, indicateurs d'impact avancés.",
        minScore: 85,
        color: "#8B5CF6",
        iconName: "star",
        criteria: {
          summary: "Actifs hosmoniques + marketplace",
          items: [
            "Créer au moins un actif hosmonique mesurable",
            "Atteindre un score global ≥ 85/100",
            "Publier sur la marketplace HOSMONY",
            "Démontrer un ROI positif de la démarche",
            "Indicateurs d'impact avancés validés",
          ],
        },
      },
    }),
  ]);

  console.log(`  ✔ ${levels.length} HOSMONY levels created`);

  // ─────────────────────────────────────────
  // 2. MODULE DEFINITIONS
  // ─────────────────────────────────────────
  console.log("  → Module Definitions...");
  const modules = [
    { code: "dashboard", name: "Dashboard", description: "Tableau de bord de performance configurable", category: "core", isCore: true, sortOrder: 1 },
    { code: "hosmony", name: "Parcours HOSMONY", description: "Parcours de transformation en 5 niveaux", category: "core", isCore: true, sortOrder: 2 },
    { code: "actions", name: "Plan d'Actions", description: "Gestion des plans d'actions et suivi opérationnel", category: "core", isCore: true, sortOrder: 3 },
    { code: "evidence", name: "Preuves & Documents", description: "Gestion documentaire et preuves de conformité", category: "core", isCore: true, sortOrder: 4 },
    { code: "audit", name: "Audit & Certification", description: "Pré-audit, audit et processus de certification", category: "core", isCore: true, sortOrder: 5 },
    { code: "strategy", name: "Stratégie", description: "Structuration et suivi de la stratégie d'entreprise", category: "analytics", isCore: false, sortOrder: 6 },
    { code: "materiality", name: "Double Matérialité", description: "Analyse de matérialité ESG et financière", category: "analytics", isCore: false, sortOrder: 7 },
    { code: "stakeholders", name: "Parties Prenantes", description: "Cartographie et gestion des parties prenantes", category: "analytics", isCore: false, sortOrder: 8 },
    { code: "ai_studio", name: "Studio IA", description: "Création et gestion d'agents IA personnalisés", category: "ai", isCore: false, sortOrder: 9 },
    { code: "integrations", name: "Intégrations", description: "Connecteurs et synchronisation de données externes", category: "integration", isCore: false, sortOrder: 10 },
    { code: "opportunities", name: "Opportunités & Valeur", description: "Détection d'opportunités et suivi du ROI", category: "finance", isCore: false, sortOrder: 11 },
    { code: "marketplace", name: "Marketplace", description: "Publication et valorisation d'actifs hosmoniques", category: "finance", isCore: false, sortOrder: 12 },
    { code: "dynamics", name: "Dynamiques Internes", description: "Challenges, événements et engagement collaborateurs", category: "hr", isCore: false, sortOrder: 13 },
    { code: "competences", name: "MyDAD Compétences", description: "GPEC, cartographie et montée en compétences", category: "hr", isCore: false, sortOrder: 14 },
    { code: "pride", name: "PRIDE", description: "Mutualisation des ressources inter-entreprises", category: "operations", isCore: false, sortOrder: 15 },
  ];

  for (const mod of modules) {
    await prisma.moduleDefinition.upsert({
      where: { code: mod.code },
      update: {},
      create: mod,
    });
  }
  console.log(`  ✔ ${modules.length} module definitions created`);

  // ─────────────────────────────────────────
  // 3. HOSMONY REQUIREMENTS (par niveau)
  // ─────────────────────────────────────────
  console.log("  → HOSMONY Requirements...");

  const levelMap = new Map(levels.map((l) => [l.level, l.id]));

  const requirements = [
    // Level 1 — Essentiel
    { code: "L1_KPI_REVENUE", name: "Suivi du chiffre d'affaires", type: "KPI" as const, category: "FINANCIAL" as const, levelNum: 1, isMandatory: true, validationRule: { kpiCode: "revenue", operator: "exists" } },
    { code: "L1_KPI_MARGIN", name: "Suivi de la marge", type: "KPI" as const, category: "FINANCIAL" as const, levelNum: 1, isMandatory: true, validationRule: { kpiCode: "net_margin", operator: "exists" } },
    { code: "L1_KPI_CARBON", name: "Mesure empreinte carbone", type: "KPI" as const, category: "ESG_ENVIRONMENTAL" as const, levelNum: 1, isMandatory: false, validationRule: { kpiCode: "carbon_footprint", operator: "exists" } },
    { code: "L1_ACTION_DIAG", name: "Diagnostic initial réalisé", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 1, isMandatory: true, validationRule: { actionCategory: "diagnostic", minCompleted: 1 } },
    { code: "L1_DOC_POLICY", name: "Politique RSE documentée", type: "DOCUMENT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 1, isMandatory: false, validationRule: { documentType: "rse_policy" } },

    // Level 2 — Dynamique
    { code: "L2_KPI_GROWTH", name: "Croissance CA ≥ 0%", type: "KPI" as const, category: "FINANCIAL" as const, levelNum: 2, isMandatory: true, validationRule: { kpiCode: "revenue_growth", operator: ">=", threshold: 0 } },
    { code: "L2_KPI_SATISFACTION", name: "Satisfaction collaborateurs mesurée", type: "KPI" as const, category: "ESG_SOCIAL" as const, levelNum: 2, isMandatory: true, validationRule: { kpiCode: "employee_satisfaction", operator: "exists" } },
    { code: "L2_ACTION_STRATEGY", name: "Stratégie formalisée", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 2, isMandatory: true, validationRule: { actionCategory: "strategy", minCompleted: 1 } },
    { code: "L2_DOC_REPORT", name: "Rapport semestriel produit", type: "DOCUMENT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 2, isMandatory: true, validationRule: { documentType: "semestrial_report" } },
    { code: "L2_PROCESS_DASHBOARD", name: "Dashboard de performance actif", type: "PROCESS" as const, category: "ESG_GOVERNANCE" as const, levelNum: 2, isMandatory: true, validationRule: { workflowCode: "dashboard_review", mustBeActive: true } },

    // Level 3 — Performance
    { code: "L3_KPI_GROWTH5", name: "Croissance CA ≥ 5%", type: "KPI" as const, category: "FINANCIAL" as const, levelNum: 3, isMandatory: true, validationRule: { kpiCode: "revenue_growth", operator: ">=", threshold: 5 } },
    { code: "L3_KPI_ENERGY", name: "Réduction consommation énergétique", type: "KPI" as const, category: "ESG_ENVIRONMENTAL" as const, levelNum: 3, isMandatory: true, validationRule: { kpiCode: "energy_consumption", operator: "<=_trend", threshold: -5 } },
    { code: "L3_KPI_TRAINING", name: "Heures formation ≥ 20h/an", type: "KPI" as const, category: "ESG_SOCIAL" as const, levelNum: 3, isMandatory: true, validationRule: { kpiCode: "training_hours", operator: ">=", threshold: 20 } },
    { code: "L3_ACTION_PLAN", name: "Plan d'action ≥ 70% complété", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 3, isMandatory: true, validationRule: { planCompletion: 70 } },
    { code: "L3_AUDIT_PRE", name: "Pré-audit réalisé", type: "AUDIT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 3, isMandatory: true, validationRule: { auditType: "PRE_AUDIT", status: "COMPLETED" } },

    // Level 4 — Excellence
    { code: "L4_KPI_GOVERNANCE", name: "Score gouvernance ≥ 7/10", type: "KPI" as const, category: "ESG_GOVERNANCE" as const, levelNum: 4, isMandatory: true, validationRule: { kpiCode: "governance_score", operator: ">=", threshold: 7 } },
    { code: "L4_ACTION_MATERIALITY", name: "Analyse double matérialité réalisée", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 4, isMandatory: true, validationRule: { actionCategory: "materiality", minCompleted: 1 } },
    { code: "L4_ACTION_STAKEHOLDERS", name: "Cartographie parties prenantes", type: "ACTION" as const, category: "ESG_SOCIAL" as const, levelNum: 4, isMandatory: true, validationRule: { actionCategory: "stakeholders", minCompleted: 1 } },
    { code: "L4_AUDIT_EXT", name: "Audit externe réalisé", type: "AUDIT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 4, isMandatory: true, validationRule: { auditType: "EXTERNAL_AUDIT", status: "COMPLETED" } },
    { code: "L4_DOC_CERT", name: "Certification externe obtenue", type: "DOCUMENT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 4, isMandatory: true, validationRule: { documentType: "external_certification" } },

    // Level 5 — Étoile
    { code: "L5_KPI_ROI", name: "ROI démarche HOSMONY positif", type: "KPI" as const, category: "FINANCIAL" as const, levelNum: 5, isMandatory: true, validationRule: { kpiCode: "hosmony_roi", operator: ">", threshold: 0 } },
    { code: "L5_ACTION_ASSET", name: "Actif hosmonique créé et validé", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 5, isMandatory: true, validationRule: { actionCategory: "asset_creation", minCompleted: 1 } },
    { code: "L5_ACTION_MARKETPLACE", name: "Publication marketplace", type: "ACTION" as const, category: "ESG_GOVERNANCE" as const, levelNum: 5, isMandatory: true, validationRule: { actionCategory: "marketplace", minCompleted: 1 } },
    { code: "L5_AUDIT_CERT", name: "Certification HOSMONY Étoile", type: "AUDIT" as const, category: "ESG_GOVERNANCE" as const, levelNum: 5, isMandatory: true, validationRule: { auditType: "CERTIFICATION", status: "CERTIFIED" } },
  ];

  for (const req of requirements) {
    const levelId = levelMap.get(req.levelNum);
    if (!levelId) continue;

    await prisma.hosmonyRequirement.upsert({
      where: { code: req.code },
      update: {},
      create: {
        code: req.code,
        name: req.name,
        type: req.type,
        category: req.category,
        levelId,
        isMandatory: req.isMandatory,
        weight: 1.0,
        validationRule: req.validationRule,
        sortOrder: requirements.indexOf(req),
      },
    });
  }
  console.log(`  ✔ ${requirements.length} HOSMONY requirements created`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
