import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const orgIdAndIdParams = z.object({
  orgId: z.string().uuid(),
  id: z.string().uuid(),
});

const materialityIssueCategoryEnum = z.enum([
  "ENVIRONMENTAL_CLIMATE",
  "ENVIRONMENTAL_POLLUTION",
  "ENVIRONMENTAL_WATER",
  "ENVIRONMENTAL_BIODIVERSITY",
  "ENVIRONMENTAL_CIRCULAR",
  "SOCIAL_WORKFORCE",
  "SOCIAL_VALUE_CHAIN",
  "SOCIAL_COMMUNITIES",
  "SOCIAL_CONSUMERS",
  "GOVERNANCE_CONDUCT",
  "GOVERNANCE_ETHICS",
  "GOVERNANCE_LOBBYING",
]);

export const materialityController = {
  // ─── List materiality issues ───────────────────────────
  async listIssues(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const issues = await prisma.materialityIssue.findMany({
        where: { organizationId: orgId },
        orderBy: [{ materialityScore: "desc" }, { createdAt: "asc" }],
      });

      res.json(issues);
    } catch (err) {
      next(err);
    }
  },

  // ─── Create issue ──────────────────────────────────────
  async createIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          code: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          category: materialityIssueCategoryEnum,
          linkedStakeholderIds: z.array(z.string()).optional(),
          linkedKpiCodes: z.array(z.string()).optional(),
          linkedRisks: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body);

      const existing = await prisma.materialityIssue.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: body.code } },
      });
      if (existing) {
        throw new AppError(409, "Materiality issue code already exists for this organization", "DUPLICATE_ISSUE_CODE");
      }

      const issue = await prisma.materialityIssue.create({
        data: {
          organizationId: orgId,
          code: body.code,
          name: body.name,
          description: body.description,
          category: body.category,
          linkedStakeholderIds: body.linkedStakeholderIds ?? [],
          linkedKpiCodes: body.linkedKpiCodes ?? [],
          linkedRisks: body.linkedRisks ?? [],
        },
      });

      res.status(201).json(issue);
    } catch (err) {
      next(err);
    }
  },

  // ─── Score issue (impact + financial scores) ───────────
  async scoreIssue(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          impactScore: z.number().min(0).max(5).optional(),
          impactLikelihood: z.number().min(0).max(5).optional(),
          impactSeverity: z.number().min(0).max(5).optional(),
          impactScope: z.number().min(0).max(5).optional(),
          impactIrreversibility: z.number().min(0).max(5).optional(),
          financialScore: z.number().min(0).max(5).optional(),
          financialLikelihood: z.number().min(0).max(5).optional(),
          financialMagnitude: z.number().min(0).max(5).optional(),
          financialTimeHorizon: z.string().optional(),
          linkedStakeholderIds: z.array(z.string()).optional(),
          linkedKpiCodes: z.array(z.string()).optional(),
          linkedRisks: z.array(z.record(z.unknown())).optional(),
          dataSourceRefs: z.array(z.string()).optional(),
          aiAssisted: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = await prisma.materialityIssue.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) {
        throw new AppError(404, "Materiality issue not found", "NOT_FOUND");
      }

      // Compute impact score if sub-scores provided
      const impactScore =
        body.impactScore ??
        (body.impactLikelihood !== undefined &&
        body.impactSeverity !== undefined &&
        body.impactScope !== undefined &&
        body.impactIrreversibility !== undefined
          ? (body.impactLikelihood + body.impactSeverity + body.impactScope + body.impactIrreversibility) / 4
          : existing.impactScore);

      // Compute financial score if sub-scores provided
      const financialScore =
        body.financialScore ??
        (body.financialLikelihood !== undefined && body.financialMagnitude !== undefined
          ? (body.financialLikelihood + body.financialMagnitude) / 2
          : existing.financialScore);

      // Compute materiality score
      const effectiveImpact = impactScore ?? existing.impactScore;
      const effectiveFinancial = financialScore ?? existing.financialScore;
      const materialityScore =
        effectiveImpact !== null && effectiveFinancial !== null
          ? (effectiveImpact + effectiveFinancial) / 2
          : effectiveImpact ?? effectiveFinancial ?? null;

      const issue = await prisma.materialityIssue.update({
        where: { id },
        data: {
          ...(body.impactLikelihood !== undefined && { impactLikelihood: body.impactLikelihood }),
          ...(body.impactSeverity !== undefined && { impactSeverity: body.impactSeverity }),
          ...(body.impactScope !== undefined && { impactScope: body.impactScope }),
          ...(body.impactIrreversibility !== undefined && { impactIrreversibility: body.impactIrreversibility }),
          ...(body.financialLikelihood !== undefined && { financialLikelihood: body.financialLikelihood }),
          ...(body.financialMagnitude !== undefined && { financialMagnitude: body.financialMagnitude }),
          ...(body.financialTimeHorizon !== undefined && { financialTimeHorizon: body.financialTimeHorizon }),
          ...(body.linkedStakeholderIds !== undefined && { linkedStakeholderIds: body.linkedStakeholderIds }),
          ...(body.linkedKpiCodes !== undefined && { linkedKpiCodes: body.linkedKpiCodes }),
          ...(body.linkedRisks !== undefined && { linkedRisks: body.linkedRisks }),
          ...(body.dataSourceRefs !== undefined && { dataSourceRefs: body.dataSourceRefs }),
          ...(body.aiAssisted !== undefined && { aiAssisted: body.aiAssisted }),
          impactScore: impactScore ?? undefined,
          financialScore: financialScore ?? undefined,
          materialityScore,
        },
      });

      res.json(issue);
    } catch (err) {
      next(err);
    }
  },

  // ─── Run full assessment ───────────────────────────────
  async runAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          impactThreshold: z.number().min(0).max(5).optional(),
          financialThreshold: z.number().min(0).max(5).optional(),
        })
        .parse(req.body);

      const impactThreshold = body.impactThreshold ?? 3.0;
      const financialThreshold = body.financialThreshold ?? 3.0;

      // Fetch all issues for the org
      const issues = await prisma.materialityIssue.findMany({
        where: { organizationId: orgId },
      });

      if (issues.length === 0) {
        throw new AppError(400, "No materiality issues found to assess", "NO_ISSUES");
      }

      // Recalculate materiality scores and determine material issues
      const updates = issues.map((issue) => {
        const impactScore = issue.impactScore;
        const financialScore = issue.financialScore;
        const materialityScore =
          impactScore !== null && financialScore !== null
            ? (impactScore + financialScore) / 2
            : impactScore ?? financialScore ?? null;

        // An issue is material if EITHER impact or financial score exceeds its threshold
        const isMaterial =
          (impactScore !== null && impactScore >= impactThreshold) ||
          (financialScore !== null && financialScore >= financialThreshold);

        return prisma.materialityIssue.update({
          where: { id: issue.id },
          data: {
            materialityScore,
            isMaterial,
          },
        });
      });

      await prisma.$transaction(updates);

      // Fetch updated issues
      const updatedIssues = await prisma.materialityIssue.findMany({
        where: { organizationId: orgId },
        orderBy: { materialityScore: "desc" },
      });

      const materialIssues = updatedIssues.filter((i) => i.isMaterial);
      const topIssues = materialIssues.slice(0, 10).map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        category: i.category,
        materialityScore: i.materialityScore,
        impactScore: i.impactScore,
        financialScore: i.financialScore,
      }));

      // Get the latest assessment version
      const latestAssessment = await prisma.materialityAssessment.findFirst({
        where: { organizationId: orgId },
        orderBy: { version: "desc" },
      });
      const nextVersion = (latestAssessment?.version ?? 0) + 1;

      // Create assessment record
      const assessment = await prisma.materialityAssessment.create({
        data: {
          organizationId: orgId,
          version: nextVersion,
          impactThreshold,
          financialThreshold,
          totalIssues: issues.length,
          materialIssues: materialIssues.length,
          topIssues,
          assessedBy: req.user!.userId,
          assessedAt: new Date(),
        },
      });

      res.json({
        assessment,
        summary: {
          totalIssues: issues.length,
          materialIssues: materialIssues.length,
          nonMaterialIssues: issues.length - materialIssues.length,
          impactThreshold,
          financialThreshold,
        },
        topIssues,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Matrix data for visualization ─────────────────────
  async getMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const issues = await prisma.materialityIssue.findMany({
        where: { organizationId: orgId },
        orderBy: { materialityScore: "desc" },
      });

      // Fetch latest assessment for thresholds
      const latestAssessment = await prisma.materialityAssessment.findFirst({
        where: { organizationId: orgId },
        orderBy: { version: "desc" },
      });

      const impactThreshold = latestAssessment?.impactThreshold ?? 3.0;
      const financialThreshold = latestAssessment?.financialThreshold ?? 3.0;

      const matrixData = issues.map((issue) => ({
        id: issue.id,
        code: issue.code,
        name: issue.name,
        category: issue.category,
        impactScore: issue.impactScore,
        financialScore: issue.financialScore,
        materialityScore: issue.materialityScore,
        isMaterial: issue.isMaterial,
      }));

      res.json({
        issues: matrixData,
        thresholds: {
          impact: impactThreshold,
          financial: financialThreshold,
        },
        quadrants: {
          topRight: matrixData.filter(
            (i) =>
              i.impactScore !== null &&
              i.financialScore !== null &&
              i.impactScore >= impactThreshold &&
              i.financialScore >= financialThreshold
          ),
          topLeft: matrixData.filter(
            (i) =>
              i.impactScore !== null &&
              i.financialScore !== null &&
              i.impactScore < impactThreshold &&
              i.financialScore >= financialThreshold
          ),
          bottomRight: matrixData.filter(
            (i) =>
              i.impactScore !== null &&
              i.financialScore !== null &&
              i.impactScore >= impactThreshold &&
              i.financialScore < financialThreshold
          ),
          bottomLeft: matrixData.filter(
            (i) =>
              i.impactScore !== null &&
              i.financialScore !== null &&
              i.impactScore < impactThreshold &&
              i.financialScore < financialThreshold
          ),
        },
        assessmentVersion: latestAssessment?.version ?? null,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Materiality report data ───────────────────────────
  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const [issues, latestAssessment, allAssessments] = await Promise.all([
        prisma.materialityIssue.findMany({
          where: { organizationId: orgId },
          orderBy: { materialityScore: "desc" },
        }),
        prisma.materialityAssessment.findFirst({
          where: { organizationId: orgId },
          orderBy: { version: "desc" },
        }),
        prisma.materialityAssessment.findMany({
          where: { organizationId: orgId },
          orderBy: { version: "desc" },
        }),
      ]);

      const materialIssues = issues.filter((i) => i.isMaterial);
      const nonMaterialIssues = issues.filter((i) => !i.isMaterial);

      // Group by category
      const byCategory: Record<string, typeof issues> = {};
      for (const issue of issues) {
        const cat = issue.category;
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(issue);
      }

      // Category summary
      const categorySummary = Object.entries(byCategory).map(([category, catIssues]) => ({
        category,
        total: catIssues.length,
        material: catIssues.filter((i) => i.isMaterial).length,
        avgImpactScore:
          catIssues.filter((i) => i.impactScore !== null).length > 0
            ? Math.round(
                (catIssues
                  .filter((i) => i.impactScore !== null)
                  .reduce((sum, i) => sum + i.impactScore!, 0) /
                  catIssues.filter((i) => i.impactScore !== null).length) *
                  100
              ) / 100
            : null,
        avgFinancialScore:
          catIssues.filter((i) => i.financialScore !== null).length > 0
            ? Math.round(
                (catIssues
                  .filter((i) => i.financialScore !== null)
                  .reduce((sum, i) => sum + i.financialScore!, 0) /
                  catIssues.filter((i) => i.financialScore !== null).length) *
                  100
              ) / 100
            : null,
      }));

      res.json({
        assessment: latestAssessment,
        assessmentHistory: allAssessments,
        summary: {
          totalIssues: issues.length,
          materialIssues: materialIssues.length,
          nonMaterialIssues: nonMaterialIssues.length,
          scoredIssues: issues.filter((i) => i.materialityScore !== null).length,
          unscoredIssues: issues.filter((i) => i.materialityScore === null).length,
        },
        materialIssues,
        nonMaterialIssues,
        categorySummary,
      });
    } catch (err) {
      next(err);
    }
  },
};
