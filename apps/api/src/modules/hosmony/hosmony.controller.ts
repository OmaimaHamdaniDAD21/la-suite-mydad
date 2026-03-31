import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const levelIdParams = z.object({ levelId: z.string().uuid() });
const orgIdReqIdParams = z.object({
  orgId: z.string().uuid(),
  reqId: z.string().uuid(),
});

export const hosmonyController = {
  // ─── Levels ────────────────────────────────────────────

  async listLevels(_req: Request, res: Response, next: NextFunction) {
    try {
      const levels = await prisma.hosmonyLevel.findMany({
        orderBy: { level: "asc" },
        include: {
          requirements: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      res.json(levels);
    } catch (err) {
      next(err);
    }
  },

  // ─── Journey ───────────────────────────────────────────

  async getJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
        include: {
          currentLevel: true,
          progressions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });
      if (!journey) throw new AppError(404, "Journey not found for this organization", "NOT_FOUND");

      res.json(journey);
    } catch (err) {
      next(err);
    }
  },

  async startJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          targetLevel: z.number().int().min(1).max(5),
        })
        .parse(req.body);

      // Check if journey already exists
      const existing = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
      });
      if (existing) {
        throw new AppError(409, "Journey already exists for this organization", "JOURNEY_EXISTS");
      }

      // Verify the organization exists
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new AppError(404, "Organization not found", "NOT_FOUND");

      // Get level 1 as starting point
      const level1 = await prisma.hosmonyLevel.findUnique({ where: { level: 1 } });
      if (!level1) throw new AppError(500, "HOSMONY level 1 not configured", "CONFIG_ERROR");

      const journey = await prisma.$transaction(async (tx) => {
        // Create the journey
        const j = await tx.hosmonyJourney.create({
          data: {
            organizationId: orgId,
            currentLevelId: level1.id,
            targetLevel: body.targetLevel,
            overallScore: 0,
            dimensionScores: {},
            progressPercent: 0,
            status: "in_progress",
            startedAt: new Date(),
            lastAssessedAt: new Date(),
          },
          include: { currentLevel: true },
        });

        // Initialize OrgRequirements for all requirements up to target level
        const requirements = await tx.hosmonyRequirement.findMany({
          where: {
            level: { level: { lte: body.targetLevel } },
          },
        });

        if (requirements.length > 0) {
          await tx.orgRequirement.createMany({
            data: requirements.map((r) => ({
              organizationId: orgId,
              requirementId: r.id,
              status: "NOT_STARTED",
            })),
            skipDuplicates: true,
          });
        }

        // Record initial progression
        await tx.journeyProgression.create({
          data: {
            journeyId: j.id,
            fromLevel: 1,
            toLevel: 1,
            overallScore: 0,
            dimensionScores: {},
            reason: "Journey started",
            validatedBy: req.user!.userId,
          },
        });

        return j;
      });

      await logAudit({
        action: "CREATE",
        entityType: "HosmonyJourney",
        entityId: journey.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { targetLevel: body.targetLevel },
      });

      res.status(201).json(journey);
    } catch (err) {
      next(err);
    }
  },

  async updateTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          targetLevel: z.number().int().min(1).max(5),
        })
        .parse(req.body);

      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
        include: { currentLevel: true },
      });
      if (!journey) throw new AppError(404, "Journey not found", "NOT_FOUND");

      if (body.targetLevel < journey.currentLevel.level) {
        throw new AppError(400, "Target level cannot be below current level", "INVALID_TARGET");
      }

      const updated = await prisma.$transaction(async (tx) => {
        const j = await tx.hosmonyJourney.update({
          where: { organizationId: orgId },
          data: { targetLevel: body.targetLevel },
          include: { currentLevel: true },
        });

        // Initialize OrgRequirements for new requirements up to the new target
        const requirements = await tx.hosmonyRequirement.findMany({
          where: {
            level: { level: { lte: body.targetLevel } },
          },
        });

        if (requirements.length > 0) {
          await tx.orgRequirement.createMany({
            data: requirements.map((r) => ({
              organizationId: orgId,
              requirementId: r.id,
              status: "NOT_STARTED" as const,
            })),
            skipDuplicates: true,
          });
        }

        return j;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyJourney",
        entityId: journey.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { oldTarget: journey.targetLevel, newTarget: body.targetLevel },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async assess(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
        include: { currentLevel: true },
      });
      if (!journey) throw new AppError(404, "Journey not found", "NOT_FOUND");

      // Get all org requirements up to target level
      const orgRequirements = await prisma.orgRequirement.findMany({
        where: { organizationId: orgId },
        include: {
          requirement: {
            include: { level: true },
          },
        },
      });

      // Calculate dimension scores grouped by category
      const dimensionScores: Record<string, { met: number; total: number; score: number }> = {};
      let totalWeight = 0;
      let weightedScore = 0;

      for (const or of orgRequirements) {
        const category = or.requirement.category;
        if (!dimensionScores[category]) {
          dimensionScores[category] = { met: 0, total: 0, score: 0 };
        }

        const weight = or.requirement.weight;
        dimensionScores[category].total += weight;
        totalWeight += weight;

        if (or.status === "MET" || or.status === "WAIVED") {
          dimensionScores[category].met += weight;
          weightedScore += weight;
        }
      }

      // Calculate dimension percentages
      for (const key of Object.keys(dimensionScores)) {
        const d = dimensionScores[key];
        d.score = d.total > 0 ? Math.round((d.met / d.total) * 100) : 0;
      }

      const overallScore = totalWeight > 0
        ? Math.round((weightedScore / totalWeight) * 100)
        : 0;

      // Determine achieved level: highest level where ALL mandatory requirements are met
      const levels = await prisma.hosmonyLevel.findMany({
        where: { level: { lte: journey.targetLevel } },
        orderBy: { level: "asc" },
        include: { requirements: true },
      });

      let achievedLevel = levels[0];
      for (const lvl of levels) {
        const lvlReqs = orgRequirements.filter(
          (or) => or.requirement.levelId === lvl.id && or.requirement.isMandatory
        );
        const allMet = lvlReqs.length > 0 && lvlReqs.every(
          (or) => or.status === "MET" || or.status === "WAIVED"
        );
        if (allMet) {
          achievedLevel = lvl;
        } else {
          break;
        }
      }

      // Calculate progress toward target
      const targetReqs = orgRequirements.filter(
        (or) => or.requirement.level.level <= journey.targetLevel
      );
      const metReqs = targetReqs.filter(
        (or) => or.status === "MET" || or.status === "WAIVED"
      );
      const progressPercent = targetReqs.length > 0
        ? Math.round((metReqs.length / targetReqs.length) * 100)
        : 0;

      const previousLevel = journey.currentLevel.level;

      const updated = await prisma.$transaction(async (tx) => {
        const j = await tx.hosmonyJourney.update({
          where: { organizationId: orgId },
          data: {
            currentLevelId: achievedLevel.id,
            overallScore,
            dimensionScores,
            progressPercent,
            lastAssessedAt: new Date(),
            ...(achievedLevel.level >= journey.targetLevel
              ? { status: "completed", levelAchievedAt: new Date() }
              : {}),
          },
          include: { currentLevel: true },
        });

        // Record progression if level changed
        if (achievedLevel.level !== previousLevel) {
          await tx.journeyProgression.create({
            data: {
              journeyId: j.id,
              fromLevel: previousLevel,
              toLevel: achievedLevel.level,
              overallScore,
              dimensionScores,
              reason: "Assessment recalculation",
              validatedBy: req.user!.userId,
            },
          });
        }

        return j;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyJourney",
        entityId: journey.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: {
          action: "assess",
          overallScore,
          previousLevel,
          achievedLevel: achievedLevel.level,
          progressPercent,
        },
      });

      res.json({
        ...updated,
        assessment: {
          overallScore,
          dimensionScores,
          achievedLevel: achievedLevel.level,
          progressPercent,
          totalRequirements: targetReqs.length,
          metRequirements: metReqs.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
      });
      if (!journey) throw new AppError(404, "Journey not found", "NOT_FOUND");

      const progressions = await prisma.journeyProgression.findMany({
        where: { journeyId: journey.id },
        orderBy: { createdAt: "desc" },
      });

      res.json(progressions);
    } catch (err) {
      next(err);
    }
  },

  // ─── Requirements ──────────────────────────────────────

  async getRequirementsForLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const { levelId } = levelIdParams.parse(req.params);

      const level = await prisma.hosmonyLevel.findUnique({ where: { id: levelId } });
      if (!level) throw new AppError(404, "Level not found", "NOT_FOUND");

      const requirements = await prisma.hosmonyRequirement.findMany({
        where: { levelId },
        orderBy: { sortOrder: "asc" },
      });

      res.json(requirements);
    } catch (err) {
      next(err);
    }
  },

  async getOrgRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const query = z
        .object({
          status: z.enum(["NOT_STARTED", "IN_PROGRESS", "MET", "NOT_MET", "WAIVED"]).optional(),
          category: z.string().optional(),
        })
        .parse(req.query);

      const orgRequirements = await prisma.orgRequirement.findMany({
        where: {
          organizationId: orgId,
          ...(query.status ? { status: query.status } : {}),
          ...(query.category
            ? { requirement: { category: query.category as any } }
            : {}),
        },
        include: {
          requirement: {
            include: { level: true },
          },
        },
        orderBy: { requirement: { sortOrder: "asc" } },
      });

      res.json(orgRequirements);
    } catch (err) {
      next(err);
    }
  },

  async validateRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, reqId } = orgIdReqIdParams.parse(req.params);
      const body = z
        .object({
          status: z.enum(["MET", "NOT_MET", "IN_PROGRESS"]),
          currentValue: z.number().optional(),
          validationNote: z.string().optional(),
        })
        .parse(req.body);

      const orgReq = await prisma.orgRequirement.findUnique({
        where: { organizationId_requirementId: { organizationId: orgId, requirementId: reqId } },
      });
      if (!orgReq) throw new AppError(404, "Org requirement not found", "NOT_FOUND");

      const updated = await prisma.orgRequirement.update({
        where: { id: orgReq.id },
        data: {
          status: body.status,
          currentValue: body.currentValue,
          validationNote: body.validationNote,
          validatedAt: body.status === "MET" ? new Date() : null,
          validatedBy: body.status === "MET" ? req.user!.userId : null,
          lastCheckedAt: new Date(),
        },
        include: { requirement: true },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "OrgRequirement",
        entityId: orgReq.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "validate", status: body.status, requirementId: reqId },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async waiveRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, reqId } = orgIdReqIdParams.parse(req.params);
      const body = z
        .object({
          reason: z.string().min(1),
        })
        .parse(req.body);

      const orgReq = await prisma.orgRequirement.findUnique({
        where: { organizationId_requirementId: { organizationId: orgId, requirementId: reqId } },
        include: { requirement: true },
      });
      if (!orgReq) throw new AppError(404, "Org requirement not found", "NOT_FOUND");

      if (orgReq.requirement.isMandatory) {
        throw new AppError(400, "Cannot waive a mandatory requirement", "CANNOT_WAIVE_MANDATORY");
      }

      const updated = await prisma.orgRequirement.update({
        where: { id: orgReq.id },
        data: {
          status: "WAIVED",
          waivedReason: body.reason,
          validatedAt: new Date(),
          validatedBy: req.user!.userId,
        },
        include: { requirement: true },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "OrgRequirement",
        entityId: orgReq.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "waive", reason: body.reason, requirementId: reqId },
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  async checkKpiRequirements(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // Get all KPI-type requirements for this org
      const orgRequirements = await prisma.orgRequirement.findMany({
        where: {
          organizationId: orgId,
          requirement: { type: "KPI" },
        },
        include: {
          requirement: true,
        },
      });

      const results: Array<{
        requirementId: string;
        code: string;
        previousStatus: string;
        newStatus: string;
        currentValue: number | null;
      }> = [];

      for (const orgReq of orgRequirements) {
        const validationRule = orgReq.requirement.validationRule as {
          kpiCode?: string;
          operator?: string;
          threshold?: number;
        } | null;

        if (!validationRule?.kpiCode) continue;

        // Get latest computed metric for this KPI
        const kpiConfig = await prisma.kpiConfig.findFirst({
          where: { organizationId: orgId, code: validationRule.kpiCode, isActive: true },
        });

        if (!kpiConfig) continue;

        const latestMetric = await prisma.computedMetric.findFirst({
          where: { organizationId: orgId, kpiConfigId: kpiConfig.id },
          orderBy: { computedAt: "desc" },
        });

        if (!latestMetric) continue;

        // Evaluate the rule
        let met = false;
        const threshold = validationRule.threshold ?? 0;
        switch (validationRule.operator) {
          case "gte":
            met = latestMetric.value >= threshold;
            break;
          case "lte":
            met = latestMetric.value <= threshold;
            break;
          case "gt":
            met = latestMetric.value > threshold;
            break;
          case "lt":
            met = latestMetric.value < threshold;
            break;
          case "eq":
            met = latestMetric.value === threshold;
            break;
          default:
            met = latestMetric.value >= threshold;
        }

        const newStatus = met ? "MET" : "NOT_MET";

        if (orgReq.status !== "WAIVED") {
          await prisma.orgRequirement.update({
            where: { id: orgReq.id },
            data: {
              status: newStatus,
              currentValue: latestMetric.value,
              lastCheckedAt: new Date(),
              ...(met
                ? { validatedAt: new Date(), validatedBy: "system" }
                : {}),
            },
          });
        }

        results.push({
          requirementId: orgReq.requirementId,
          code: orgReq.requirement.code,
          previousStatus: orgReq.status,
          newStatus: orgReq.status === "WAIVED" ? "WAIVED" : newStatus,
          currentValue: latestMetric.value,
        });
      }

      await logAudit({
        action: "UPDATE",
        entityType: "OrgRequirement",
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "auto_check_kpi", checkedCount: results.length },
      });

      res.json({ checkedCount: results.length, results });
    } catch (err) {
      next(err);
    }
  },
};
