import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const idParams = z.object({ id: z.string().uuid() });

const initiativeTypeEnum = z.enum([
  "CHALLENGE",
  "IDEA_BOX",
  "EVENT",
  "SURVEY",
  "TRAINING",
  "COMMITTEE",
]);

const initiativeStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const dynamicsController = {
  // ─── List initiatives ─────────────────────────────────────
  async listInitiatives(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { type, status, page = "1", limit = "20" } = req.query;

      const where: Record<string, unknown> = { organizationId: orgId };
      if (type) {
        initiativeTypeEnum.parse(type);
        where.type = type;
      }
      if (status) {
        initiativeStatusEnum.parse(status);
        where.status = status;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      const [initiatives, total] = await Promise.all([
        prisma.initiative.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          include: {
            _count: { select: { participations: true } },
          },
        }),
        prisma.initiative.count({ where }),
      ]);

      res.json({ data: initiatives, total, page: pageNum, limit: limitNum });
    } catch (err) {
      next(err);
    }
  },

  // ─── Create initiative ────────────────────────────────────
  async createInitiative(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          type: initiativeTypeEnum,
          title: z.string().min(1),
          description: z.string().optional(),
          objectives: z.array(z.string()).optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          settings: z.record(z.unknown()).optional(),
          targetRoles: z.array(z.string()).optional(),
          linkedActionIds: z.array(z.string().uuid()).optional(),
        })
        .parse(req.body);

      const initiative = await prisma.initiative.create({
        data: {
          organizationId: orgId,
          type: body.type,
          title: body.title,
          description: body.description,
          objectives: body.objectives,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
          settings: body.settings as any,
          targetRoles: body.targetRoles,
          linkedActionIds: body.linkedActionIds,
          createdById: req.user!.userId,
        },
      });

      res.status(201).json(initiative);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update initiative ────────────────────────────────────
  async updateInitiative(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          status: initiativeStatusEnum.optional(),
          objectives: z.array(z.string()).optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          settings: z.record(z.unknown()).optional(),
          targetRoles: z.array(z.string()).optional(),
          linkedActionIds: z.array(z.string().uuid()).optional(),
          completionRate: z.number().min(0).max(100).optional(),
        })
        .parse(req.body);

      const existing = await prisma.initiative.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "Initiative not found", "NOT_FOUND");

      const initiative = await prisma.initiative.update({
        where: { id },
        data: {
          ...body,
          settings: body.settings as any,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
      });

      res.json(initiative);
    } catch (err) {
      next(err);
    }
  },

  // ─── Participate in initiative ────────────────────────────
  async participate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const initiative = await prisma.initiative.findUnique({ where: { id } });
      if (!initiative) throw new AppError(404, "Initiative not found", "NOT_FOUND");

      if (initiative.status !== "ACTIVE") {
        throw new AppError(400, "Can only join ACTIVE initiatives", "INVALID_STATUS");
      }

      // Check if user is already participating
      const existingParticipation = await prisma.participation.findUnique({
        where: {
          initiativeId_userId: {
            initiativeId: id,
            userId: req.user!.userId,
          },
        },
      });

      if (existingParticipation) {
        throw new AppError(409, "Already participating in this initiative", "ALREADY_PARTICIPATING");
      }

      const [participation] = await prisma.$transaction([
        prisma.participation.create({
          data: {
            initiativeId: id,
            userId: req.user!.userId,
            status: "enrolled",
          },
        }),
        prisma.initiative.update({
          where: { id },
          data: { participantCount: { increment: 1 } },
        }),
      ]);

      res.status(201).json(participation);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update participation ─────────────────────────────────
  async updateParticipation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          status: z.enum(["enrolled", "active", "completed", "withdrawn"]).optional(),
          contribution: z.record(z.unknown()).optional(),
          score: z.number().min(0).max(100).optional(),
        })
        .parse(req.body);

      const existing = await prisma.participation.findUnique({
        where: {
          initiativeId_userId: {
            initiativeId: id,
            userId: req.user!.userId,
          },
        },
      });

      if (!existing) {
        throw new AppError(404, "Participation not found. Join the initiative first.", "NOT_FOUND");
      }

      const updateData: Record<string, unknown> = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.contribution !== undefined) updateData.contribution = body.contribution;
      if (body.score !== undefined) updateData.score = body.score;
      if (body.status === "completed") updateData.completedAt = new Date();

      const participation = await prisma.participation.update({
        where: { id: existing.id },
        data: updateData,
      });

      // Recalculate initiative completion rate
      const allParticipations = await prisma.participation.findMany({
        where: { initiativeId: id },
      });
      const completedCount = allParticipations.filter((p) => p.status === "completed").length;
      const totalCount = allParticipations.length;
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100 * 100) / 100 : 0;

      await prisma.initiative.update({
        where: { id },
        data: { completionRate },
      });

      res.json(participation);
    } catch (err) {
      next(err);
    }
  },

  // ─── Engagement score ─────────────────────────────────────
  async engagementScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // Get all active initiatives for the org
      const initiatives = await prisma.initiative.findMany({
        where: {
          organizationId: orgId,
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        include: {
          participations: true,
          _count: { select: { participations: true } },
        },
      });

      if (initiatives.length === 0) {
        res.json({
          engagementScore: 0,
          totalInitiatives: 0,
          activeInitiatives: 0,
          totalParticipants: 0,
          averageCompletionRate: 0,
          byType: {},
        });
        return;
      }

      // Calculate engagement metrics
      let totalCompletionRate = 0;
      let initiativesWithCompletion = 0;
      let totalParticipants = 0;
      const activeCount = initiatives.filter((i) => i.status === "ACTIVE").length;

      const byType: Record<string, { count: number; avgCompletion: number; participants: number }> = {};

      for (const initiative of initiatives) {
        const participations = initiative.participations;
        totalParticipants += participations.length;

        const completedCount = participations.filter((p) => p.status === "completed").length;
        const completionRate = participations.length > 0
          ? (completedCount / participations.length) * 100
          : 0;

        if (participations.length > 0) {
          totalCompletionRate += completionRate;
          initiativesWithCompletion++;
        }

        if (!byType[initiative.type]) {
          byType[initiative.type] = { count: 0, avgCompletion: 0, participants: 0 };
        }
        byType[initiative.type].count++;
        byType[initiative.type].participants += participations.length;
        byType[initiative.type].avgCompletion += completionRate;
      }

      // Finalize per-type averages
      for (const type of Object.keys(byType)) {
        if (byType[type].count > 0) {
          byType[type].avgCompletion = Math.round((byType[type].avgCompletion / byType[type].count) * 100) / 100;
        }
      }

      const averageCompletionRate = initiativesWithCompletion > 0
        ? Math.round((totalCompletionRate / initiativesWithCompletion) * 100) / 100
        : 0;

      // Engagement score = average completion rate across active initiatives
      const engagementScore = averageCompletionRate;

      res.json({
        engagementScore,
        totalInitiatives: initiatives.length,
        activeInitiatives: activeCount,
        totalParticipants,
        averageCompletionRate,
        byType,
      });
    } catch (err) {
      next(err);
    }
  },
};
