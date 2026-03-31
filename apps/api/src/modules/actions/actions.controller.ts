import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const planIdParams = z.object({ planId: z.string().uuid() });
const actionIdParams = z.object({ actionId: z.string().uuid() });

const actionPriorityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const actionStatusEnum = z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "CANCELLED"]);
const actionSourceEnum = z.enum(["REQUIREMENT", "AI_SUGGESTION", "MANUAL", "WORKFLOW"]);
const dataCategoryEnum = z.enum([
  "FINANCIAL", "ESG_ENVIRONMENTAL", "ESG_SOCIAL", "ESG_GOVERNANCE",
  "HR", "OPERATIONAL", "MARKET",
]);

export const actionsController = {
  // ─── Plans ─────────────────────────────────────────────

  async listPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const plans = await prisma.actionPlan.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { actions: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(plans);
    } catch (err) {
      next(err);
    }
  },

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          targetLevel: z.number().int().min(1).max(5),
          startDate: z.string().datetime().optional(),
          targetDate: z.string().datetime().optional(),
        })
        .parse(req.body);

      // Verify journey exists
      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
      });
      if (!journey) {
        throw new AppError(404, "HOSMONY journey not found. Start a journey first.", "JOURNEY_NOT_FOUND");
      }

      const plan = await prisma.actionPlan.create({
        data: {
          journeyId: journey.id,
          organizationId: orgId,
          name: body.name,
          description: body.description,
          targetLevel: body.targetLevel,
          startDate: body.startDate ? new Date(body.startDate) : null,
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "ActionPlan",
        entityId: plan.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { name: body.name, targetLevel: body.targetLevel },
      });

      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  },

  // ─── Actions ───────────────────────────────────────────

  async listActions(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = planIdParams.parse(req.params);

      const query = z
        .object({
          status: actionStatusEnum.optional(),
          priority: actionPriorityEnum.optional(),
          assigneeId: z.string().uuid().optional(),
        })
        .parse(req.query);

      const plan = await prisma.actionPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new AppError(404, "Action plan not found", "NOT_FOUND");

      const actions = await prisma.action.findMany({
        where: {
          actionPlanId: planId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.priority ? { priority: query.priority } : {}),
          ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });

      res.json(actions);
    } catch (err) {
      next(err);
    }
  },

  async addAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { planId } = planIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          category: dataCategoryEnum,
          source: actionSourceEnum.default("MANUAL"),
          priority: actionPriorityEnum.default("MEDIUM"),
          impactScore: z.number().min(0).max(10).optional(),
          effortScore: z.number().min(0).max(10).optional(),
          assigneeId: z.string().uuid().optional(),
          assigneeRole: z.enum(["EXPERT_COMPTABLE", "DIRIGEANT", "COLLABORATEUR", "CONSULTANT"]).optional(),
          teamId: z.string().uuid().optional(),
          dueDate: z.string().datetime().optional(),
          requirementId: z.string().uuid().optional(),
          aiRationale: z.string().optional(),
        })
        .parse(req.body);

      const plan = await prisma.actionPlan.findUnique({ where: { id: planId } });
      if (!plan) throw new AppError(404, "Action plan not found", "NOT_FOUND");

      // Calculate impact/effort ratio if both are provided
      const impactEffortRatio =
        body.impactScore !== undefined && body.effortScore !== undefined && body.effortScore > 0
          ? body.impactScore / body.effortScore
          : null;

      const action = await prisma.$transaction(async (tx) => {
        const a = await tx.action.create({
          data: {
            actionPlanId: planId,
            organizationId: plan.organizationId,
            title: body.title,
            description: body.description,
            category: body.category,
            source: body.source,
            priority: body.priority,
            impactScore: body.impactScore,
            effortScore: body.effortScore,
            impactEffortRatio,
            assigneeId: body.assigneeId,
            assigneeRole: body.assigneeRole,
            teamId: body.teamId,
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            requirementId: body.requirementId,
            aiRationale: body.aiRationale,
          },
        });

        // Update plan counters
        const actionCount = await tx.action.count({ where: { actionPlanId: planId } });
        const completedCount = await tx.action.count({
          where: { actionPlanId: planId, status: "COMPLETED" },
        });
        await tx.actionPlan.update({
          where: { id: planId },
          data: {
            totalActions: actionCount,
            completedActions: completedCount,
            progressPercent: actionCount > 0 ? Math.round((completedCount / actionCount) * 100) : 0,
          },
        });

        return a;
      });

      await logAudit({
        action: "CREATE",
        entityType: "Action",
        entityId: action.id,
        userId: req.user!.userId,
        organizationId: plan.organizationId,
        details: { title: body.title, planId, priority: body.priority },
      });

      res.status(201).json(action);
    } catch (err) {
      next(err);
    }
  },

  async updateAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { actionId } = actionIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          category: dataCategoryEnum.optional(),
          priority: actionPriorityEnum.optional(),
          impactScore: z.number().min(0).max(10).optional(),
          effortScore: z.number().min(0).max(10).optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          assigneeRole: z.enum(["EXPERT_COMPTABLE", "DIRIGEANT", "COLLABORATEUR", "CONSULTANT"]).nullable().optional(),
          teamId: z.string().uuid().nullable().optional(),
          dueDate: z.string().datetime().nullable().optional(),
          requirementId: z.string().uuid().nullable().optional(),
          notes: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body);

      const existing = await prisma.action.findUnique({ where: { id: actionId } });
      if (!existing) throw new AppError(404, "Action not found", "NOT_FOUND");

      // Recalculate ratio if impact or effort changed
      const impact = body.impactScore ?? existing.impactScore;
      const effort = body.effortScore ?? existing.effortScore;
      const impactEffortRatio =
        impact !== null && impact !== undefined && effort !== null && effort !== undefined && effort > 0
          ? impact / effort
          : existing.impactEffortRatio;

      const action = await prisma.action.update({
        where: { id: actionId },
        data: {
          ...body,
          dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
          impactEffortRatio,
        },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "Action",
        entityId: actionId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { changes: Object.keys(body) },
      });

      res.json(action);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { actionId } = actionIdParams.parse(req.params);
      const body = z
        .object({
          status: actionStatusEnum,
        })
        .parse(req.body);

      const existing = await prisma.action.findUnique({ where: { id: actionId } });
      if (!existing) throw new AppError(404, "Action not found", "NOT_FOUND");

      const now = new Date();
      const statusData: Record<string, unknown> = { status: body.status };

      if (body.status === "IN_PROGRESS" && !existing.startedAt) {
        statusData.startedAt = now;
      }
      if (body.status === "COMPLETED") {
        statusData.completedAt = now;
      }
      if (body.status !== "COMPLETED" && existing.completedAt) {
        statusData.completedAt = null;
      }

      const action = await prisma.$transaction(async (tx) => {
        const a = await tx.action.update({
          where: { id: actionId },
          data: statusData,
        });

        // Update plan counters
        const actionCount = await tx.action.count({
          where: { actionPlanId: existing.actionPlanId },
        });
        const completedCount = await tx.action.count({
          where: { actionPlanId: existing.actionPlanId, status: "COMPLETED" },
        });
        const progressPercent = actionCount > 0
          ? Math.round((completedCount / actionCount) * 100)
          : 0;

        await tx.actionPlan.update({
          where: { id: existing.actionPlanId },
          data: {
            totalActions: actionCount,
            completedActions: completedCount,
            progressPercent,
            ...(progressPercent === 100 ? { completedAt: now } : { completedAt: null }),
          },
        });

        return a;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "Action",
        entityId: actionId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: {
          action: "status_change",
          from: existing.status,
          to: body.status,
        },
      });

      res.json(action);
    } catch (err) {
      next(err);
    }
  },

  async myActions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = z
        .object({
          status: actionStatusEnum.optional(),
          orgId: z.string().uuid().optional(),
        })
        .parse(req.query);

      const actions = await prisma.action.findMany({
        where: {
          assigneeId: req.user!.userId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.orgId ? { organizationId: query.orgId } : {}),
        },
        include: {
          actionPlan: { select: { id: true, name: true, targetLevel: true } },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      });

      res.json(actions);
    } catch (err) {
      next(err);
    }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const plans = await prisma.actionPlan.findMany({
        where: { organizationId: orgId, isActive: true },
        include: {
          actions: {
            select: {
              id: true,
              status: true,
              priority: true,
              category: true,
              assigneeId: true,
              dueDate: true,
              completedAt: true,
            },
          },
        },
      });

      const allActions = plans.flatMap((p) => p.actions);

      // Status breakdown
      const byStatus: Record<string, number> = {};
      for (const a of allActions) {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      }

      // Priority breakdown
      const byPriority: Record<string, number> = {};
      for (const a of allActions) {
        byPriority[a.priority] = (byPriority[a.priority] || 0) + 1;
      }

      // Category breakdown
      const byCategory: Record<string, number> = {};
      for (const a of allActions) {
        byCategory[a.category] = (byCategory[a.category] || 0) + 1;
      }

      // Overdue count
      const now = new Date();
      const overdue = allActions.filter(
        (a) =>
          a.dueDate &&
          new Date(a.dueDate) < now &&
          a.status !== "COMPLETED" &&
          a.status !== "CANCELLED"
      ).length;

      // Completion rate
      const total = allActions.length;
      const completed = allActions.filter((a) => a.status === "COMPLETED").length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      res.json({
        totalPlans: plans.length,
        totalActions: total,
        completedActions: completed,
        completionRate,
        overdueActions: overdue,
        byStatus,
        byPriority,
        byCategory,
        planSummaries: plans.map((p) => ({
          id: p.id,
          name: p.name,
          targetLevel: p.targetLevel,
          totalActions: p.totalActions,
          completedActions: p.completedActions,
          progressPercent: p.progressPercent,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  async generatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).default("AI-Generated Action Plan"),
          targetLevel: z.number().int().min(1).max(5).optional(),
        })
        .parse(req.body);

      // Verify journey exists
      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
        include: { currentLevel: true },
      });
      if (!journey) {
        throw new AppError(404, "HOSMONY journey not found. Start a journey first.", "JOURNEY_NOT_FOUND");
      }

      const targetLevel = body.targetLevel ?? journey.targetLevel;

      // Get unmet requirements
      const unmetRequirements = await prisma.orgRequirement.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["NOT_STARTED", "NOT_MET", "IN_PROGRESS"] },
          requirement: {
            level: { level: { lte: targetLevel } },
          },
        },
        include: {
          requirement: {
            include: { level: true },
          },
        },
        orderBy: { requirement: { sortOrder: "asc" } },
      });

      if (unmetRequirements.length === 0) {
        throw new AppError(400, "All requirements are already met or waived", "NO_UNMET_REQUIREMENTS");
      }

      // Create a plan with actions derived from unmet requirements
      const plan = await prisma.$transaction(async (tx) => {
        const p = await tx.actionPlan.create({
          data: {
            journeyId: journey.id,
            organizationId: orgId,
            name: body.name,
            description: `Auto-generated plan to achieve level ${targetLevel}. Covers ${unmetRequirements.length} unmet requirements.`,
            targetLevel,
            totalActions: unmetRequirements.length,
            startDate: new Date(),
          },
        });

        // Create one action per unmet requirement
        await tx.action.createMany({
          data: unmetRequirements.map((or, index) => ({
            actionPlanId: p.id,
            organizationId: orgId,
            title: `Address requirement: ${or.requirement.name}`,
            description: or.requirement.description || `Work on requirement ${or.requirement.code} to achieve compliance.`,
            category: or.requirement.category,
            source: "AI_SUGGESTION" as const,
            priority: or.requirement.isMandatory ? "HIGH" as const : "MEDIUM" as const,
            impactScore: or.requirement.weight * 2,
            effortScore: 5,
            impactEffortRatio: (or.requirement.weight * 2) / 5,
            requirementId: or.requirementId,
            aiRationale: `This action addresses requirement "${or.requirement.code}" (Level ${or.requirement.level.level}). ${or.requirement.isMandatory ? "This is a mandatory requirement." : "This is an optional requirement."}`,
            status: "BACKLOG" as const,
          })),
        });

        return tx.actionPlan.findUnique({
          where: { id: p.id },
          include: { actions: true },
        });
      });

      await logAudit({
        action: "CREATE",
        entityType: "ActionPlan",
        entityId: plan!.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: {
          action: "ai_generate",
          targetLevel,
          actionsGenerated: unmetRequirements.length,
        },
      });

      res.status(201).json(plan);
    } catch (err) {
      next(err);
    }
  },
};
