import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const auditIdParams = z.object({ auditId: z.string().uuid() });

const auditTypeEnum = z.enum(["PRE_AUDIT", "INTERNAL_AUDIT", "EXTERNAL_AUDIT", "CERTIFICATION"]);

export const auditController = {
  // ─── List Audits ───────────────────────────────────────

  async listAudits(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const query = z
        .object({
          type: auditTypeEnum.optional(),
          status: z.enum(["PLANNED", "IN_PROGRESS", "REVIEW", "COMPLETED", "CERTIFIED", "FAILED"]).optional(),
        })
        .parse(req.query);

      const audits = await prisma.hosmonyAudit.findMany({
        where: {
          organizationId: orgId,
          ...(query.type ? { type: query.type } : {}),
          ...(query.status ? { status: query.status } : {}),
        },
        include: {
          _count: { select: { auditResults: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(audits);
    } catch (err) {
      next(err);
    }
  },

  // ─── Plan Audit ────────────────────────────────────────

  async planAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          type: auditTypeEnum,
          targetLevel: z.number().int().min(1).max(5),
          auditorId: z.string().uuid().optional(),
          auditorName: z.string().optional(),
          auditorOrg: z.string().optional(),
          plannedDate: z.string().datetime().optional(),
        })
        .parse(req.body);

      // Verify journey exists
      const journey = await prisma.hosmonyJourney.findUnique({
        where: { organizationId: orgId },
      });
      if (!journey) {
        throw new AppError(404, "HOSMONY journey not found. Start a journey first.", "JOURNEY_NOT_FOUND");
      }

      const audit = await prisma.hosmonyAudit.create({
        data: {
          journeyId: journey.id,
          organizationId: orgId,
          type: body.type,
          status: "PLANNED",
          targetLevel: body.targetLevel,
          auditorId: body.auditorId,
          auditorName: body.auditorName,
          auditorOrg: body.auditorOrg,
          plannedDate: body.plannedDate ? new Date(body.plannedDate) : null,
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "HosmonyAudit",
        entityId: audit.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { type: body.type, targetLevel: body.targetLevel },
      });

      res.status(201).json(audit);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update Audit ──────────────────────────────────────

  async updateAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = auditIdParams.parse(req.params);
      const body = z
        .object({
          auditorId: z.string().uuid().optional(),
          auditorName: z.string().optional(),
          auditorOrg: z.string().optional(),
          plannedDate: z.string().datetime().nullable().optional(),
          reportUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const existing = await prisma.hosmonyAudit.findUnique({ where: { id: auditId } });
      if (!existing) throw new AppError(404, "Audit not found", "NOT_FOUND");

      if (["COMPLETED", "CERTIFIED"].includes(existing.status)) {
        throw new AppError(400, "Cannot modify a completed or certified audit", "INVALID_STATUS");
      }

      const audit = await prisma.hosmonyAudit.update({
        where: { id: auditId },
        data: {
          ...body,
          plannedDate: body.plannedDate !== undefined
            ? (body.plannedDate ? new Date(body.plannedDate) : null)
            : undefined,
        },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyAudit",
        entityId: auditId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { changes: Object.keys(body) },
      });

      res.json(audit);
    } catch (err) {
      next(err);
    }
  },

  // ─── Start Audit ───────────────────────────────────────

  async startAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = auditIdParams.parse(req.params);

      const existing = await prisma.hosmonyAudit.findUnique({ where: { id: auditId } });
      if (!existing) throw new AppError(404, "Audit not found", "NOT_FOUND");

      if (existing.status !== "PLANNED") {
        throw new AppError(400, "Audit must be in PLANNED status to start", "INVALID_STATUS");
      }

      const audit = await prisma.hosmonyAudit.update({
        where: { id: auditId },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyAudit",
        entityId: auditId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { action: "start" },
      });

      res.json(audit);
    } catch (err) {
      next(err);
    }
  },

  // ─── Record Results ────────────────────────────────────

  async recordResults(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = auditIdParams.parse(req.params);
      const body = z
        .object({
          results: z.array(
            z.object({
              requirementId: z.string().uuid(),
              status: z.enum(["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "NOT_APPLICABLE"]),
              score: z.number().min(0).max(100).optional(),
              comment: z.string().optional(),
              evidenceIds: z.array(z.string().uuid()).optional(),
            })
          ),
        })
        .parse(req.body);

      const existing = await prisma.hosmonyAudit.findUnique({ where: { id: auditId } });
      if (!existing) throw new AppError(404, "Audit not found", "NOT_FOUND");

      if (!["IN_PROGRESS", "REVIEW"].includes(existing.status)) {
        throw new AppError(400, "Audit must be IN_PROGRESS or in REVIEW to record results", "INVALID_STATUS");
      }

      const auditResults = await prisma.$transaction(async (tx) => {
        const results = [];

        for (const r of body.results) {
          const result = await tx.auditResult.upsert({
            where: {
              auditId_requirementId: {
                auditId,
                requirementId: r.requirementId,
              },
            },
            update: {
              status: r.status,
              score: r.score,
              comment: r.comment,
              evidenceIds: r.evidenceIds ?? [],
            },
            create: {
              auditId,
              requirementId: r.requirementId,
              status: r.status,
              score: r.score,
              comment: r.comment,
              evidenceIds: r.evidenceIds ?? [],
            },
          });
          results.push(result);
        }

        // Update audit status to REVIEW if it was IN_PROGRESS
        if (existing.status === "IN_PROGRESS") {
          await tx.hosmonyAudit.update({
            where: { id: auditId },
            data: { status: "REVIEW" },
          });
        }

        return results;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyAudit",
        entityId: auditId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { action: "record_results", resultCount: body.results.length },
      });

      res.json(auditResults);
    } catch (err) {
      next(err);
    }
  },

  // ─── Complete Audit ────────────────────────────────────

  async completeAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = auditIdParams.parse(req.params);
      const body = z
        .object({
          findings: z.array(z.record(z.unknown())).optional(),
          recommendations: z.array(z.record(z.unknown())).optional(),
          reportUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const existing = await prisma.hosmonyAudit.findUnique({
        where: { id: auditId },
        include: { auditResults: true },
      });
      if (!existing) throw new AppError(404, "Audit not found", "NOT_FOUND");

      if (!["IN_PROGRESS", "REVIEW"].includes(existing.status)) {
        throw new AppError(400, "Audit must be IN_PROGRESS or in REVIEW to complete", "INVALID_STATUS");
      }

      if (existing.auditResults.length === 0) {
        throw new AppError(400, "Audit must have at least one result before completing", "NO_RESULTS");
      }

      // Calculate overall score from results
      const scoredResults = existing.auditResults.filter((r) => r.score !== null);
      const overallScore = scoredResults.length > 0
        ? Math.round(
            scoredResults.reduce((sum, r) => sum + (r.score ?? 0), 0) / scoredResults.length
          )
        : null;

      // Calculate dimension scores by grouping results by requirement category
      const requirementIds = existing.auditResults.map((r) => r.requirementId);
      const requirements = await prisma.hosmonyRequirement.findMany({
        where: { id: { in: requirementIds } },
      });
      const reqCategoryMap = new Map(requirements.map((r) => [r.id, r.category]));

      const dimensionScores: Record<string, { total: number; score: number; count: number }> = {};
      for (const result of existing.auditResults) {
        const category = reqCategoryMap.get(result.requirementId) ?? "UNKNOWN";
        if (!dimensionScores[category]) {
          dimensionScores[category] = { total: 0, score: 0, count: 0 };
        }
        if (result.score !== null) {
          dimensionScores[category].total += result.score;
          dimensionScores[category].count++;
        }
      }
      for (const key of Object.keys(dimensionScores)) {
        const d = dimensionScores[key];
        d.score = d.count > 0 ? Math.round(d.total / d.count) : 0;
      }

      // Determine if the audit passed or failed
      const passed = overallScore !== null && overallScore >= 60;

      const audit = await prisma.$transaction(async (tx) => {
        const a = await tx.hosmonyAudit.update({
          where: { id: auditId },
          data: {
            status: passed ? "COMPLETED" : "FAILED",
            completedAt: new Date(),
            overallScore,
            dimensionScores,
            findings: body.findings ?? [],
            recommendations: body.recommendations ?? [],
            reportUrl: body.reportUrl,
            reportGeneratedAt: body.reportUrl ? new Date() : null,
          },
          include: { auditResults: true },
        });

        // Update OrgRequirements based on audit results
        for (const result of existing.auditResults) {
          const reqStatus =
            result.status === "COMPLIANT"
              ? "MET"
              : result.status === "NON_COMPLIANT"
              ? "NOT_MET"
              : result.status === "PARTIAL"
              ? "IN_PROGRESS"
              : undefined;

          if (reqStatus) {
            await tx.orgRequirement.updateMany({
              where: {
                organizationId: existing.organizationId,
                requirementId: result.requirementId,
                status: { not: "WAIVED" },
              },
              data: {
                status: reqStatus,
                lastCheckedAt: new Date(),
                ...(reqStatus === "MET"
                  ? { validatedAt: new Date(), validatedBy: req.user!.userId }
                  : {}),
              },
            });
          }
        }

        return a;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyAudit",
        entityId: auditId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: {
          action: "complete",
          overallScore,
          passed,
          resultCount: existing.auditResults.length,
        },
      });

      res.json(audit);
    } catch (err) {
      next(err);
    }
  },

  // ─── Certify ───────────────────────────────────────────

  async certify(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = auditIdParams.parse(req.params);
      const body = z
        .object({
          certificationDate: z.string().datetime().optional(),
          certificationExpiry: z.string().datetime().optional(),
          certificateUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const existing = await prisma.hosmonyAudit.findUnique({ where: { id: auditId } });
      if (!existing) throw new AppError(404, "Audit not found", "NOT_FOUND");

      if (existing.status !== "COMPLETED") {
        throw new AppError(400, "Only COMPLETED audits can be certified", "INVALID_STATUS");
      }

      if (existing.type !== "CERTIFICATION" && existing.type !== "EXTERNAL_AUDIT") {
        throw new AppError(400, "Only CERTIFICATION or EXTERNAL_AUDIT types can be certified", "INVALID_AUDIT_TYPE");
      }

      const now = new Date();

      const audit = await prisma.$transaction(async (tx) => {
        const a = await tx.hosmonyAudit.update({
          where: { id: auditId },
          data: {
            status: "CERTIFIED",
            certificationStatus: "CERTIFIED",
            certificationDate: body.certificationDate ? new Date(body.certificationDate) : now,
            certificationExpiry: body.certificationExpiry ? new Date(body.certificationExpiry) : null,
            certificateUrl: body.certificateUrl,
          },
        });

        // Update the journey to reflect certification achievement
        const journey = await tx.hosmonyJourney.findUnique({
          where: { id: existing.journeyId },
        });
        if (journey && existing.targetLevel >= journey.targetLevel) {
          await tx.hosmonyJourney.update({
            where: { id: journey.id },
            data: {
              status: "certified",
              levelAchievedAt: now,
            },
          });

          // Record progression
          await tx.journeyProgression.create({
            data: {
              journeyId: journey.id,
              fromLevel: journey.targetLevel,
              toLevel: existing.targetLevel,
              overallScore: existing.overallScore ?? 0,
              dimensionScores: existing.dimensionScores ?? {},
              reason: `Certification achieved for level ${existing.targetLevel}`,
              validatedBy: req.user!.userId,
            },
          });
        }

        return a;
      });

      await logAudit({
        action: "UPDATE",
        entityType: "HosmonyAudit",
        entityId: auditId,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { action: "certify", targetLevel: existing.targetLevel },
      });

      res.json(audit);
    } catch (err) {
      next(err);
    }
  },

  // ─── Pre-Audit (AI Stub) ──────────────────────────────

  async preAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
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

      // Get all requirements for target level
      const orgRequirements = await prisma.orgRequirement.findMany({
        where: {
          organizationId: orgId,
          requirement: {
            level: { level: { lte: targetLevel } },
          },
        },
        include: {
          requirement: {
            include: { level: true },
          },
        },
      });

      // Get all validated evidence
      const validatedEvidence = await prisma.evidence.findMany({
        where: { organizationId: orgId, status: "VALIDATED" },
      });

      // Build evidence map
      const reqEvidenceMap: Record<string, number> = {};
      for (const ev of validatedEvidence) {
        const reqIds = ev.requirementIds as string[] | null;
        if (reqIds) {
          for (const rid of reqIds) {
            reqEvidenceMap[rid] = (reqEvidenceMap[rid] || 0) + 1;
          }
        }
      }

      // Assess each requirement
      const assessment = orgRequirements.map((or) => {
        const evidenceCount = reqEvidenceMap[or.requirementId] || 0;
        const hasEvidence = evidenceCount > 0;
        const isMet = or.status === "MET" || or.status === "WAIVED";

        let readiness: "READY" | "PARTIAL" | "NOT_READY";
        if (isMet && hasEvidence) {
          readiness = "READY";
        } else if (isMet || hasEvidence) {
          readiness = "PARTIAL";
        } else {
          readiness = "NOT_READY";
        }

        return {
          requirementId: or.requirementId,
          code: or.requirement.code,
          name: or.requirement.name,
          level: or.requirement.level.level,
          category: or.requirement.category,
          isMandatory: or.requirement.isMandatory,
          currentStatus: or.status,
          evidenceCount,
          readiness,
          recommendation: readiness === "READY"
            ? null
            : readiness === "PARTIAL"
            ? `Strengthen evidence or complete requirement "${or.requirement.code}"`
            : `Urgent: Address requirement "${or.requirement.code}" before audit`,
        };
      });

      const readyCount = assessment.filter((a) => a.readiness === "READY").length;
      const partialCount = assessment.filter((a) => a.readiness === "PARTIAL").length;
      const notReadyCount = assessment.filter((a) => a.readiness === "NOT_READY").length;
      const totalCount = assessment.length;

      const readinessScore = totalCount > 0
        ? Math.round(((readyCount + partialCount * 0.5) / totalCount) * 100)
        : 0;

      // Create the pre-audit record
      const preAudit = await prisma.hosmonyAudit.create({
        data: {
          journeyId: journey.id,
          organizationId: orgId,
          type: "PRE_AUDIT",
          status: "COMPLETED",
          targetLevel,
          startedAt: new Date(),
          completedAt: new Date(),
          overallScore: readinessScore,
          findings: assessment.filter((a) => a.readiness !== "READY"),
          recommendations: assessment
            .filter((a) => a.recommendation)
            .map((a) => ({ requirement: a.code, action: a.recommendation })),
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "HosmonyAudit",
        entityId: preAudit.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "pre_audit", targetLevel, readinessScore },
      });

      res.status(201).json({
        auditId: preAudit.id,
        targetLevel,
        readinessScore,
        summary: {
          total: totalCount,
          ready: readyCount,
          partial: partialCount,
          notReady: notReadyCount,
        },
        assessment,
      });
    } catch (err) {
      next(err);
    }
  },
};
