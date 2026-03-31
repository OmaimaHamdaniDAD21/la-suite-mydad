import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const orgIdAndIdParams = z.object({
  orgId: z.string().uuid(),
  id: z.string().uuid(),
});

const stakeholderTypeEnum = z.enum([
  "CLIENT",
  "SUPPLIER",
  "EMPLOYEE",
  "INVESTOR",
  "REGULATOR",
  "TERRITORY",
  "PARTNER",
  "COMMUNITY",
  "MEDIA",
  "NGO",
  "OTHER",
]);

function computeOverallScore(scores: {
  influenceScore?: number | null;
  impactScore?: number | null;
  proximityScore?: number | null;
  dependencyScore?: number | null;
}): number | null {
  const values = [
    scores.influenceScore,
    scores.impactScore,
    scores.proximityScore,
    scores.dependencyScore,
  ].filter((v): v is number => v !== null && v !== undefined);

  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

export const stakeholdersController = {
  // ─── List stakeholders ─────────────────────────────────
  async listStakeholders(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const stakeholders = await prisma.stakeholder.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: [{ overallScore: "desc" }, { name: "asc" }],
      });

      res.json(stakeholders);
    } catch (err) {
      next(err);
    }
  },

  // ─── Create stakeholder ────────────────────────────────
  async createStakeholder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          type: stakeholderTypeEnum,
          description: z.string().optional(),
          contactInfo: z.record(z.unknown()).optional(),
          influenceScore: z.number().min(0).max(5).optional(),
          impactScore: z.number().min(0).max(5).optional(),
          proximityScore: z.number().min(0).max(5).optional(),
          dependencyScore: z.number().min(0).max(5).optional(),
          attitude: z.string().optional(),
          engagementLevel: z.string().optional(),
          linkedRisks: z.array(z.record(z.unknown())).optional(),
          linkedOpportunities: z.array(z.record(z.unknown())).optional(),
          linkedMaterialityIds: z.array(z.string()).optional(),
          linkedStrategyIds: z.array(z.string()).optional(),
        })
        .parse(req.body);

      const overallScore = computeOverallScore({
        influenceScore: body.influenceScore,
        impactScore: body.impactScore,
        proximityScore: body.proximityScore,
        dependencyScore: body.dependencyScore,
      });

      const stakeholder = await prisma.stakeholder.create({
        data: {
          organizationId: orgId,
          name: body.name,
          type: body.type,
          description: body.description,
          contactInfo: (body.contactInfo ?? {}) as any,
          influenceScore: body.influenceScore,
          impactScore: body.impactScore,
          proximityScore: body.proximityScore,
          dependencyScore: body.dependencyScore,
          overallScore,
          attitude: body.attitude,
          engagementLevel: body.engagementLevel,
          linkedRisks: (body.linkedRisks ?? []) as any,
          linkedOpportunities: (body.linkedOpportunities ?? []) as any,
          linkedMaterialityIds: body.linkedMaterialityIds ?? [],
          linkedStrategyIds: body.linkedStrategyIds ?? [],
        },
      });

      res.status(201).json(stakeholder);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update / score stakeholder ────────────────────────
  async updateStakeholder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          type: stakeholderTypeEnum.optional(),
          description: z.string().optional(),
          contactInfo: z.record(z.unknown()).optional(),
          influenceScore: z.number().min(0).max(5).optional(),
          impactScore: z.number().min(0).max(5).optional(),
          proximityScore: z.number().min(0).max(5).optional(),
          dependencyScore: z.number().min(0).max(5).optional(),
          attitude: z.string().optional(),
          engagementLevel: z.string().optional(),
          linkedRisks: z.array(z.record(z.unknown())).optional(),
          linkedOpportunities: z.array(z.record(z.unknown())).optional(),
          linkedMaterialityIds: z.array(z.string()).optional(),
          linkedStrategyIds: z.array(z.string()).optional(),
        })
        .parse(req.body);

      const existing = await prisma.stakeholder.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new AppError(404, "Stakeholder not found", "NOT_FOUND");
      }

      // Merge scores: use new value if provided, else keep existing
      const mergedScores = {
        influenceScore: body.influenceScore ?? existing.influenceScore,
        impactScore: body.impactScore ?? existing.impactScore,
        proximityScore: body.proximityScore ?? existing.proximityScore,
        dependencyScore: body.dependencyScore ?? existing.dependencyScore,
      };
      const overallScore = computeOverallScore(mergedScores);

      const stakeholder = await prisma.stakeholder.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.type !== undefined && { type: body.type }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.contactInfo !== undefined && { contactInfo: body.contactInfo as any }),
          ...(body.influenceScore !== undefined && { influenceScore: body.influenceScore }),
          ...(body.impactScore !== undefined && { impactScore: body.impactScore }),
          ...(body.proximityScore !== undefined && { proximityScore: body.proximityScore }),
          ...(body.dependencyScore !== undefined && { dependencyScore: body.dependencyScore }),
          ...(body.attitude !== undefined && { attitude: body.attitude }),
          ...(body.engagementLevel !== undefined && { engagementLevel: body.engagementLevel }),
          ...(body.linkedRisks !== undefined && { linkedRisks: body.linkedRisks as any }),
          ...(body.linkedOpportunities !== undefined && { linkedOpportunities: body.linkedOpportunities as any }),
          ...(body.linkedMaterialityIds !== undefined && { linkedMaterialityIds: body.linkedMaterialityIds }),
          ...(body.linkedStrategyIds !== undefined && { linkedStrategyIds: body.linkedStrategyIds }),
          overallScore,
        },
      });

      res.json(stakeholder);
    } catch (err) {
      next(err);
    }
  },

  // ─── Stakeholder map data (influence x impact) ─────────
  async getMap(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const stakeholders = await prisma.stakeholder.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: { overallScore: "desc" },
      });

      const mapData = stakeholders.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        influenceScore: s.influenceScore,
        impactScore: s.impactScore,
        proximityScore: s.proximityScore,
        dependencyScore: s.dependencyScore,
        overallScore: s.overallScore,
        attitude: s.attitude,
        engagementLevel: s.engagementLevel,
      }));

      // Quadrant classification based on influence (y-axis) and impact (x-axis)
      const midInfluence = 2.5;
      const midImpact = 2.5;

      const quadrants = {
        manageClosely: mapData.filter(
          (s) =>
            s.influenceScore !== null &&
            s.impactScore !== null &&
            s.influenceScore >= midInfluence &&
            s.impactScore >= midImpact
        ),
        keepSatisfied: mapData.filter(
          (s) =>
            s.influenceScore !== null &&
            s.impactScore !== null &&
            s.influenceScore >= midInfluence &&
            s.impactScore < midImpact
        ),
        keepInformed: mapData.filter(
          (s) =>
            s.influenceScore !== null &&
            s.impactScore !== null &&
            s.influenceScore < midInfluence &&
            s.impactScore >= midImpact
        ),
        monitor: mapData.filter(
          (s) =>
            s.influenceScore !== null &&
            s.impactScore !== null &&
            s.influenceScore < midInfluence &&
            s.impactScore < midImpact
        ),
      };

      // Group by type
      const byType: Record<string, typeof mapData> = {};
      for (const s of mapData) {
        if (!byType[s.type]) byType[s.type] = [];
        byType[s.type].push(s);
      }

      res.json({
        stakeholders: mapData,
        quadrants,
        byType,
        stats: {
          total: stakeholders.length,
          scored: mapData.filter((s) => s.overallScore !== null).length,
          unscored: mapData.filter((s) => s.overallScore === null).length,
          avgInfluence:
            mapData.filter((s) => s.influenceScore !== null).length > 0
              ? Math.round(
                  (mapData
                    .filter((s) => s.influenceScore !== null)
                    .reduce((sum, s) => sum + s.influenceScore!, 0) /
                    mapData.filter((s) => s.influenceScore !== null).length) *
                    100
                ) / 100
              : null,
          avgImpact:
            mapData.filter((s) => s.impactScore !== null).length > 0
              ? Math.round(
                  (mapData
                    .filter((s) => s.impactScore !== null)
                    .reduce((sum, s) => sum + s.impactScore!, 0) /
                    mapData.filter((s) => s.impactScore !== null).length) *
                    100
                ) / 100
              : null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Log interaction ───────────────────────────────────
  async logInteraction(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          type: z.string().min(1),
          summary: z.string().min(1),
          date: z.string().datetime().optional(),
          outcome: z.string().optional(),
          nextAction: z.string().optional(),
          participants: z.array(z.string()).optional(),
        })
        .parse(req.body);

      const existing = await prisma.stakeholder.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new AppError(404, "Stakeholder not found", "NOT_FOUND");
      }

      // Append interaction to notes (stored as JSON array)
      const currentNotes = (existing.notes as Array<Record<string, unknown>> | null) ?? [];
      const interaction = {
        id: crypto.randomUUID(),
        type: body.type,
        summary: body.summary,
        date: body.date ?? new Date().toISOString(),
        outcome: body.outcome ?? null,
        nextAction: body.nextAction ?? null,
        participants: body.participants ?? [],
        loggedBy: req.user!.userId,
        loggedAt: new Date().toISOString(),
      };

      const updatedNotes = [...currentNotes, interaction];

      const stakeholder = await prisma.stakeholder.update({
        where: { id },
        data: {
          notes: updatedNotes as any,
          lastInteractionAt: new Date(interaction.date),
        },
      });

      res.status(201).json({
        stakeholder,
        interaction,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Remove stakeholder (soft delete) ──────────────────
  async deleteStakeholder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const existing = await prisma.stakeholder.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new AppError(404, "Stakeholder not found", "NOT_FOUND");
      }

      const stakeholder = await prisma.stakeholder.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({ message: "Stakeholder removed successfully", stakeholder });
    } catch (err) {
      next(err);
    }
  },
};
