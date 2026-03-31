import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const idParams = z.object({ id: z.string().uuid() });
const orgReqParams = z.object({
  orgId: z.string().uuid(),
  reqId: z.string().uuid(),
});

const evidenceTypeEnum = z.enum([
  "DOCUMENT", "DATA_EXTRACT", "SCREENSHOT", "CERTIFICATE",
  "DECLARATION", "PHOTO", "LINK",
]);
const dataCategoryEnum = z.enum([
  "FINANCIAL", "ESG_ENVIRONMENTAL", "ESG_SOCIAL", "ESG_GOVERNANCE",
  "HR", "OPERATIONAL", "MARKET",
]);

export const evidenceController = {
  // ─── List Evidence ─────────────────────────────────────

  async listEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const query = z
        .object({
          status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "VALIDATED", "REJECTED", "EXPIRED"]).optional(),
          type: evidenceTypeEnum.optional(),
          category: dataCategoryEnum.optional(),
          page: z.coerce.number().int().min(1).default(1),
          limit: z.coerce.number().int().min(1).max(100).default(50),
        })
        .parse(req.query);

      const skip = (query.page - 1) * query.limit;

      const [evidence, total] = await Promise.all([
        prisma.evidence.findMany({
          where: {
            organizationId: orgId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { type: query.type } : {}),
            ...(query.category ? { category: query.category } : {}),
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: query.limit,
        }),
        prisma.evidence.count({
          where: {
            organizationId: orgId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.type ? { type: query.type } : {}),
            ...(query.category ? { category: query.category } : {}),
          },
        }),
      ]);

      res.json({
        data: evidence,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Create Evidence ───────────────────────────────────

  async createEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          type: evidenceTypeEnum,
          category: dataCategoryEnum,
          fileUrl: z.string().url().optional(),
          fileName: z.string().optional(),
          fileSize: z.number().int().optional(),
          mimeType: z.string().optional(),
          externalUrl: z.string().url().optional(),
          requirementIds: z.array(z.string().uuid()).optional(),
          actionIds: z.array(z.string().uuid()).optional(),
          validFrom: z.string().datetime().optional(),
          validUntil: z.string().datetime().optional(),
          checksum: z.string().optional(),
        })
        .parse(req.body);

      const evidence = await prisma.evidence.create({
        data: {
          organizationId: orgId,
          title: body.title,
          description: body.description,
          type: body.type,
          category: body.category,
          fileUrl: body.fileUrl,
          fileName: body.fileName,
          fileSize: body.fileSize,
          mimeType: body.mimeType,
          externalUrl: body.externalUrl,
          requirementIds: body.requirementIds ?? [],
          actionIds: body.actionIds ?? [],
          validFrom: body.validFrom ? new Date(body.validFrom) : null,
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
          checksum: body.checksum,
          status: "DRAFT",
        },
      });

      await logAudit({
        action: "CREATE",
        entityType: "Evidence",
        entityId: evidence.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { title: body.title, type: body.type },
      });

      res.status(201).json(evidence);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update Evidence ───────────────────────────────────

  async updateEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          type: evidenceTypeEnum.optional(),
          category: dataCategoryEnum.optional(),
          fileUrl: z.string().url().optional(),
          fileName: z.string().optional(),
          fileSize: z.number().int().optional(),
          mimeType: z.string().optional(),
          externalUrl: z.string().url().optional(),
          requirementIds: z.array(z.string().uuid()).optional(),
          actionIds: z.array(z.string().uuid()).optional(),
          validFrom: z.string().datetime().nullable().optional(),
          validUntil: z.string().datetime().nullable().optional(),
          checksum: z.string().optional(),
        })
        .parse(req.body);

      const existing = await prisma.evidence.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "Evidence not found", "NOT_FOUND");

      // Only allow editing if DRAFT or REJECTED
      if (!["DRAFT", "REJECTED"].includes(existing.status)) {
        throw new AppError(400, "Evidence can only be edited in DRAFT or REJECTED status", "INVALID_STATUS");
      }

      const evidence = await prisma.evidence.update({
        where: { id },
        data: {
          ...body,
          validFrom: body.validFrom !== undefined ? (body.validFrom ? new Date(body.validFrom) : null) : undefined,
          validUntil: body.validUntil !== undefined ? (body.validUntil ? new Date(body.validUntil) : null) : undefined,
          // Reset to DRAFT if it was REJECTED and being edited
          ...(existing.status === "REJECTED" ? { status: "DRAFT", rejectionReason: null } : {}),
        },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "Evidence",
        entityId: id,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { changes: Object.keys(body) },
      });

      res.json(evidence);
    } catch (err) {
      next(err);
    }
  },

  // ─── Submit for Review ─────────────────────────────────

  async submitEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const existing = await prisma.evidence.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "Evidence not found", "NOT_FOUND");

      if (existing.status !== "DRAFT") {
        throw new AppError(400, "Only DRAFT evidence can be submitted", "INVALID_STATUS");
      }

      // Validate that the evidence has required data
      if (!existing.fileUrl && !existing.externalUrl) {
        throw new AppError(400, "Evidence must have a file or external URL before submission", "MISSING_DATA");
      }

      const evidence = await prisma.evidence.update({
        where: { id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          submittedBy: req.user!.userId,
        },
      });

      await logAudit({
        action: "UPDATE",
        entityType: "Evidence",
        entityId: id,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { action: "submit" },
      });

      res.json(evidence);
    } catch (err) {
      next(err);
    }
  },

  // ─── Review Evidence ───────────────────────────────────

  async reviewEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          decision: z.enum(["VALIDATED", "REJECTED"]),
          reviewNote: z.string().optional(),
          rejectionReason: z.string().optional(),
        })
        .parse(req.body);

      const existing = await prisma.evidence.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "Evidence not found", "NOT_FOUND");

      if (!["SUBMITTED", "UNDER_REVIEW"].includes(existing.status)) {
        throw new AppError(400, "Evidence must be SUBMITTED or UNDER_REVIEW to be reviewed", "INVALID_STATUS");
      }

      if (body.decision === "REJECTED" && !body.rejectionReason) {
        throw new AppError(400, "Rejection reason is required", "MISSING_REJECTION_REASON");
      }

      const evidence = await prisma.evidence.update({
        where: { id },
        data: {
          status: body.decision,
          reviewedAt: new Date(),
          reviewedBy: req.user!.userId,
          reviewNote: body.reviewNote,
          rejectionReason: body.decision === "REJECTED" ? body.rejectionReason : null,
        },
      });

      // If validated, update linked OrgRequirements' evidenceIds
      if (body.decision === "VALIDATED" && existing.requirementIds) {
        const reqIds = existing.requirementIds as string[];
        for (const reqId of reqIds) {
          const orgReq = await prisma.orgRequirement.findUnique({
            where: {
              organizationId_requirementId: {
                organizationId: existing.organizationId,
                requirementId: reqId,
              },
            },
          });
          if (orgReq) {
            const currentEvidenceIds = (orgReq.evidenceIds as string[]) ?? [];
            if (!currentEvidenceIds.includes(id)) {
              await prisma.orgRequirement.update({
                where: { id: orgReq.id },
                data: {
                  evidenceIds: [...currentEvidenceIds, id],
                },
              });
            }
          }
        }
      }

      await logAudit({
        action: "UPDATE",
        entityType: "Evidence",
        entityId: id,
        userId: req.user!.userId,
        organizationId: existing.organizationId,
        details: { action: "review", decision: body.decision },
      });

      res.json(evidence);
    } catch (err) {
      next(err);
    }
  },

  // ─── Evidence by Requirement ───────────────────────────

  async evidenceByRequirement(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, reqId } = orgReqParams.parse(req.params);

      // Find evidence that references this requirement
      const allEvidence = await prisma.evidence.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
      });

      // Filter by requirementIds JSON field
      const filtered = allEvidence.filter((e) => {
        const reqIds = e.requirementIds as string[] | null;
        return reqIds && reqIds.includes(reqId);
      });

      res.json(filtered);
    } catch (err) {
      next(err);
    }
  },

  // ─── Readiness Score ───────────────────────────────────

  async readinessScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // Get all org requirements
      const orgRequirements = await prisma.orgRequirement.findMany({
        where: { organizationId: orgId },
        include: { requirement: true },
      });

      // Get all validated evidence for this org
      const validatedEvidence = await prisma.evidence.findMany({
        where: { organizationId: orgId, status: "VALIDATED" },
      });

      // Build a map of requirement -> validated evidence count
      const reqEvidenceCount: Record<string, number> = {};
      for (const ev of validatedEvidence) {
        const reqIds = ev.requirementIds as string[] | null;
        if (reqIds) {
          for (const rid of reqIds) {
            reqEvidenceCount[rid] = (reqEvidenceCount[rid] || 0) + 1;
          }
        }
      }

      // Score: requirements with at least one validated evidence
      const totalReqs = orgRequirements.length;
      const documentedReqs = orgRequirements.filter(
        (or) => reqEvidenceCount[or.requirementId] && reqEvidenceCount[or.requirementId] > 0
      ).length;

      const readiness = totalReqs > 0 ? Math.round((documentedReqs / totalReqs) * 100) : 0;

      // Breakdown by category
      const byCategory: Record<string, { total: number; documented: number; score: number }> = {};
      for (const or of orgRequirements) {
        const cat = or.requirement.category;
        if (!byCategory[cat]) byCategory[cat] = { total: 0, documented: 0, score: 0 };
        byCategory[cat].total++;
        if (reqEvidenceCount[or.requirementId] > 0) {
          byCategory[cat].documented++;
        }
      }
      for (const key of Object.keys(byCategory)) {
        const c = byCategory[key];
        c.score = c.total > 0 ? Math.round((c.documented / c.total) * 100) : 0;
      }

      res.json({
        readinessScore: readiness,
        totalRequirements: totalReqs,
        documentedRequirements: documentedReqs,
        totalEvidence: validatedEvidence.length,
        byCategory,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Expiring Evidence ─────────────────────────────────

  async expiringEvidence(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const query = z
        .object({
          days: z.coerce.number().int().min(1).max(365).default(30),
        })
        .parse(req.query);

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + query.days);

      const expiring = await prisma.evidence.findMany({
        where: {
          organizationId: orgId,
          status: "VALIDATED",
          validUntil: {
            gte: now,
            lte: futureDate,
          },
        },
        orderBy: { validUntil: "asc" },
      });

      // Also get already expired evidence
      const expired = await prisma.evidence.findMany({
        where: {
          organizationId: orgId,
          status: "VALIDATED",
          validUntil: { lt: now },
          isExpired: false,
        },
        orderBy: { validUntil: "asc" },
      });

      // Mark expired evidence
      if (expired.length > 0) {
        await prisma.evidence.updateMany({
          where: {
            id: { in: expired.map((e) => e.id) },
          },
          data: { isExpired: true, status: "EXPIRED" },
        });
      }

      res.json({
        expiringSoon: expiring,
        newlyExpired: expired,
        expiringSoonCount: expiring.length,
        newlyExpiredCount: expired.length,
      });
    } catch (err) {
      next(err);
    }
  },
};
