import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });

const orgIdAndIdParams = z.object({
  orgId: z.string().uuid(),
  id: z.string().uuid(),
});

const agentStatusEnum = z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]);

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const aiStudioController = {
  // ─── Agents ────────────────────────────────────────────

  async listAgents(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const agents = await prisma.agent.findMany({
        where: { organizationId: orgId, status: { not: "ARCHIVED" } },
        include: {
          _count: { select: { runs: true, prompts: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(agents);
    } catch (err) {
      next(err);
    }
  },

  async createAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          type: z.string().min(1),
          systemPrompt: z.string().min(1),
          model: z.string().default("claude-sonnet-4-6"),
          temperature: z.number().min(0).max(2).default(0.7),
          maxTokens: z.number().int().min(1).max(100000).default(4096),
          dataScopeConfig: z.record(z.unknown()).optional(),
          knowledgeBaseIds: z.array(z.string().uuid()).optional(),
          toolsConfig: z.record(z.unknown()).optional(),
          isTemplate: z.boolean().default(false),
        })
        .parse(req.body);

      const agent = await prisma.agent.create({
        data: {
          organizationId: orgId,
          createdById: req.user!.userId,
          ...body,
        },
      });

      await logAudit({
        action: "AGENT_RUN",
        entityType: "Agent",
        entityId: agent.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "create", name: body.name, type: body.type },
      });

      res.status(201).json(agent);
    } catch (err) {
      next(err);
    }
  },

  async updateAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          type: z.string().min(1).optional(),
          status: agentStatusEnum.optional(),
          systemPrompt: z.string().min(1).optional(),
          model: z.string().optional(),
          temperature: z.number().min(0).max(2).optional(),
          maxTokens: z.number().int().min(1).max(100000).optional(),
          dataScopeConfig: z.record(z.unknown()).optional(),
          knowledgeBaseIds: z.array(z.string().uuid()).optional(),
          toolsConfig: z.record(z.unknown()).optional(),
          isTemplate: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = await prisma.agent.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Agent not found", "NOT_FOUND");

      const agent = await prisma.agent.update({
        where: { id },
        data: body,
      });

      await logAudit({
        action: "AGENT_RUN",
        entityType: "Agent",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "update", changes: Object.keys(body) },
      });

      res.json(agent);
    } catch (err) {
      next(err);
    }
  },

  async archiveAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const existing = await prisma.agent.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Agent not found", "NOT_FOUND");

      const agent = await prisma.agent.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await logAudit({
        action: "AGENT_RUN",
        entityType: "Agent",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "archive", name: existing.name },
      });

      res.json(agent);
    } catch (err) {
      next(err);
    }
  },

  // ─── Agent Runs ────────────────────────────────────────

  async runAgent(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          input: z.record(z.unknown()),
        })
        .parse(req.body);

      const agent = await prisma.agent.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!agent) throw new AppError(404, "Agent not found", "NOT_FOUND");
      if (agent.status !== "ACTIVE") {
        throw new AppError(400, "Agent is not active", "AGENT_NOT_ACTIVE");
      }

      // Create the run record with QUEUED status
      // Actual AI execution will be handled by a background worker
      const run = await prisma.agentRun.create({
        data: {
          agentId: id,
          userId: req.user!.userId,
          status: "QUEUED",
          input: body.input,
        },
      });

      await logAudit({
        action: "AGENT_RUN",
        entityType: "AgentRun",
        entityId: run.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { agentId: id, agentName: agent.name },
      });

      res.status(201).json({
        run,
        message: "Agent run queued. The response will be available once processing completes.",
      });
    } catch (err) {
      next(err);
    }
  },

  async listAgentRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const { page, limit } = paginationQuery.parse(req.query);

      const agent = await prisma.agent.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!agent) throw new AppError(404, "Agent not found", "NOT_FOUND");

      const skip = (page - 1) * limit;

      const [runs, total] = await Promise.all([
        prisma.agentRun.findMany({
          where: { agentId: id },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),
        prisma.agentRun.count({ where: { agentId: id } }),
      ]);

      res.json({
        data: runs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Prompts ───────────────────────────────────────────

  async listPrompts(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // List prompts belonging to agents in this org, plus global prompts
      const orgAgentIds = await prisma.agent.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });
      const agentIds = orgAgentIds.map((a) => a.id);

      const prompts = await prisma.prompt.findMany({
        where: {
          OR: [
            { agentId: { in: agentIds } },
            { isGlobal: true },
          ],
        },
        include: { agent: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      });

      res.json(prompts);
    } catch (err) {
      next(err);
    }
  },

  async createPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          agentId: z.string().uuid().optional(),
          name: z.string().min(1),
          content: z.string().min(1),
          category: z.string().min(1),
          variables: z.record(z.unknown()).optional(),
          isGlobal: z.boolean().default(false),
        })
        .parse(req.body);

      // If agentId provided, verify it belongs to this org
      if (body.agentId) {
        const agent = await prisma.agent.findFirst({
          where: { id: body.agentId, organizationId: orgId },
        });
        if (!agent) throw new AppError(404, "Agent not found in this organization", "NOT_FOUND");
      }

      const prompt = await prisma.prompt.create({
        data: body,
      });

      await logAudit({
        action: "CREATE",
        entityType: "Prompt",
        entityId: prompt.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { name: body.name, category: body.category },
      });

      res.status(201).json(prompt);
    } catch (err) {
      next(err);
    }
  },

  async updatePrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          content: z.string().min(1).optional(),
          category: z.string().min(1).optional(),
          variables: z.record(z.unknown()).optional(),
          isGlobal: z.boolean().optional(),
          version: z.number().int().optional(),
        })
        .parse(req.body);

      // Verify prompt belongs to an agent in this org or is global
      const existing = await prisma.prompt.findUnique({
        where: { id },
        include: { agent: true },
      });
      if (!existing) throw new AppError(404, "Prompt not found", "NOT_FOUND");

      if (existing.agent && existing.agent.organizationId !== orgId) {
        throw new AppError(403, "Prompt does not belong to this organization", "FORBIDDEN");
      }

      const prompt = await prisma.prompt.update({
        where: { id },
        data: body,
      });

      await logAudit({
        action: "UPDATE",
        entityType: "Prompt",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { changes: Object.keys(body) },
      });

      res.json(prompt);
    } catch (err) {
      next(err);
    }
  },

  // ─── Knowledge Bases ───────────────────────────────────

  async listKnowledgeBases(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const kbs = await prisma.knowledgeBase.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(kbs);
    } catch (err) {
      next(err);
    }
  },

  async createKnowledgeBase(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          type: z.string().min(1),
        })
        .parse(req.body);

      const kb = await prisma.knowledgeBase.create({
        data: {
          organizationId: orgId,
          ...body,
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "KnowledgeBase",
        entityId: kb.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { name: body.name, type: body.type },
      });

      res.status(201).json(kb);
    } catch (err) {
      next(err);
    }
  },

  async addDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1),
          content: z.string().optional(),
          fileUrl: z.string().url().optional(),
          mimeType: z.string().optional(),
        })
        .parse(req.body);

      // Verify knowledge base belongs to this org
      const kb = await prisma.knowledgeBase.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!kb) throw new AppError(404, "Knowledge base not found", "NOT_FOUND");

      const doc = await prisma.knowledgeDocument.create({
        data: {
          knowledgeBaseId: id,
          title: body.title,
          content: body.content,
          fileUrl: body.fileUrl,
          mimeType: body.mimeType,
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "KnowledgeDocument",
        entityId: doc.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { knowledgeBaseId: id, title: body.title },
      });

      res.status(201).json(doc);
    } catch (err) {
      next(err);
    }
  },

  async deleteKnowledgeBase(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const existing = await prisma.knowledgeBase.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Knowledge base not found", "NOT_FOUND");

      await prisma.knowledgeBase.delete({ where: { id } });

      await logAudit({
        action: "DELETE",
        entityType: "KnowledgeBase",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { name: existing.name },
      });

      res.json({ message: "Knowledge base deleted" });
    } catch (err) {
      next(err);
    }
  },
};
