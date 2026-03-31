import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const orgIdAndIdParams = z.object({ orgId: z.string().uuid(), id: z.string().uuid() });

const opportunityTypeEnum = z.enum([
  "PUBLIC_FUNDING",
  "TAX_CREDIT",
  "SUBSIDY",
  "TENDER",
  "NEW_MARKET",
  "PARTNERSHIP",
  "GRANT",
  "LOAN",
  "CERTIFICATION_VALUE",
]);

const opportunityStatusEnum = z.enum([
  "DETECTED",
  "ELIGIBLE",
  "IN_APPLICATION",
  "SUBMITTED",
  "AWARDED",
  "REJECTED",
  "EXPIRED",
]);

export const opportunitiesController = {
  // ─── List opportunities ───────────────────────────────────
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { type, status, page = "1", limit = "20" } = req.query;

      const where: Record<string, unknown> = { organizationId: orgId };
      if (type) {
        opportunityTypeEnum.parse(type);
        where.type = type;
      }
      if (status) {
        opportunityStatusEnum.parse(status);
        where.status = status;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      const [opportunities, total] = await Promise.all([
        prisma.opportunity.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.opportunity.count({ where }),
      ]);

      res.json({ data: opportunities, total, page: pageNum, limit: limitNum });
    } catch (err) {
      next(err);
    }
  },

  // ─── Create opportunity ───────────────────────────────────
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          type: opportunityTypeEnum,
          source: z.string().optional(),
          sourceUrl: z.string().url().optional(),
          estimatedValue: z.number().positive().optional(),
          currency: z.string().default("EUR"),
          valueType: z.string().optional(),
          requiredLevel: z.number().int().min(1).max(10).optional(),
          requiredKpis: z.array(z.string()).optional(),
          requiredActions: z.array(z.string()).optional(),
          requiredDocuments: z.array(z.string()).optional(),
          applicationDeadline: z.string().datetime().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          assigneeId: z.string().uuid().optional(),
        })
        .parse(req.body);

      const opportunity = await prisma.opportunity.create({
        data: {
          organizationId: orgId,
          ...body,
          detectedBy: "manual",
          applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : undefined,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
      });

      res.status(201).json(opportunity);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update opportunity ───────────────────────────────────
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          status: opportunityStatusEnum.optional(),
          estimatedValue: z.number().positive().optional(),
          currency: z.string().optional(),
          applicationDeadline: z.string().datetime().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          applicationData: z.record(z.unknown()).optional(),
          applicationFileUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const existing = await prisma.opportunity.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Opportunity not found", "NOT_FOUND");

      const opportunity = await prisma.opportunity.update({
        where: { id },
        data: {
          ...body,
          applicationData: body.applicationData as any,
          applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : undefined,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
      });

      res.json(opportunity);
    } catch (err) {
      next(err);
    }
  },

  // ─── Check eligibility ────────────────────────────────────
  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const opportunity = await prisma.opportunity.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!opportunity) throw new AppError(404, "Opportunity not found", "NOT_FOUND");

      const checks: Array<{ criterion: string; met: boolean; detail: string }> = [];
      let eligible = true;

      // 1. Check HOSMONY level requirement
      if (opportunity.requiredLevel != null) {
        const journey = await prisma.hosmonyJourney.findUnique({
          where: { organizationId: orgId },
          include: { currentLevel: true },
        });

        const currentLevel = journey?.currentLevel?.level ?? 0;
        const levelMet = currentLevel >= opportunity.requiredLevel;
        checks.push({
          criterion: "HOSMONY Level",
          met: levelMet,
          detail: `Required: ${opportunity.requiredLevel}, Current: ${currentLevel}`,
        });
        if (!levelMet) eligible = false;
      }

      // 2. Check required KPIs
      const requiredKpis = (opportunity.requiredKpis as string[] | null) ?? [];
      if (requiredKpis.length > 0) {
        const kpiConfigs = await prisma.kpiConfig.findMany({
          where: { organizationId: orgId, code: { in: requiredKpis }, isActive: true },
        });
        const kpiConfigIds = kpiConfigs.map((k) => k.id);

        const metrics = kpiConfigIds.length > 0
          ? await prisma.computedMetric.findMany({
              where: {
                organizationId: orgId,
                kpiConfigId: { in: kpiConfigIds },
              },
              orderBy: { periodEnd: "desc" },
            })
          : [];

        for (const kpiCode of requiredKpis) {
          const config = kpiConfigs.find((k) => k.code === kpiCode);
          if (!config) {
            checks.push({ criterion: `KPI: ${kpiCode}`, met: false, detail: "KPI not configured" });
            eligible = false;
            continue;
          }

          const latestMetric = metrics.find((m) => m.kpiConfigId === config.id);
          if (!latestMetric) {
            checks.push({ criterion: `KPI: ${kpiCode}`, met: false, detail: "No computed value found" });
            eligible = false;
            continue;
          }

          const meetsTarget =
            (config.targetMin == null || latestMetric.value >= config.targetMin) &&
            (config.targetMax == null || latestMetric.value <= config.targetMax);
          checks.push({
            criterion: `KPI: ${kpiCode}`,
            met: meetsTarget,
            detail: `Value: ${latestMetric.value}, Target: [${config.targetMin ?? "-inf"}, ${config.targetMax ?? "+inf"}]`,
          });
          if (!meetsTarget) eligible = false;
        }
      }

      // 3. Check required documents
      const requiredDocuments = (opportunity.requiredDocuments as string[] | null) ?? [];
      if (requiredDocuments.length > 0) {
        const evidences = await prisma.evidence.findMany({
          where: {
            organizationId: orgId,
            status: "VALIDATED",
          },
        });
        const validatedTitles = evidences.map((e) => e.title.toLowerCase());

        for (const doc of requiredDocuments) {
          const found = validatedTitles.some((t) => t.includes(doc.toLowerCase()));
          checks.push({
            criterion: `Document: ${doc}`,
            met: found,
            detail: found ? "Validated document found" : "No validated document matching this requirement",
          });
          if (!found) eligible = false;
        }
      }

      // Compute eligibility score
      const totalChecks = checks.length;
      const metChecks = checks.filter((c) => c.met).length;
      const eligibilityScore = totalChecks > 0 ? Math.round((metChecks / totalChecks) * 100) : 100;

      // Update opportunity with eligibility results
      await prisma.opportunity.update({
        where: { id },
        data: {
          eligibilityScore,
          eligibilityCriteria: checks,
          status: eligible ? "ELIGIBLE" : opportunity.status,
        },
      });

      res.json({
        opportunityId: id,
        eligible,
        eligibilityScore,
        checks,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Detect opportunities (AI stub) ───────────────────────
  async detect(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // Verify org exists
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (!org) throw new AppError(404, "Organization not found", "NOT_FOUND");

      // AI stub: create sample detected opportunities based on org profile
      const sampleOpportunities = [
        {
          title: "Credit Impot Recherche (CIR)",
          description: "Tax credit for research and development activities. Eligible companies can receive up to 30% of qualifying R&D expenditure.",
          type: "TAX_CREDIT" as const,
          estimatedValue: 50000,
          requiredLevel: 3,
          requiredKpis: ["rd_spending", "innovation_rate"],
        },
        {
          title: "BPI France Innovation Grant",
          description: "Public funding for innovative projects. Covers up to 50% of eligible costs.",
          type: "GRANT" as const,
          estimatedValue: 100000,
          requiredLevel: 4,
          requiredKpis: ["revenue_growth", "rd_spending"],
        },
        {
          title: "ESG Certification Premium",
          description: "Market premium from achieving high ESG ratings, attracting sustainable investment.",
          type: "CERTIFICATION_VALUE" as const,
          estimatedValue: 25000,
          requiredLevel: 5,
          requiredKpis: ["esg_score", "carbon_footprint"],
        },
      ];

      const created = await prisma.$transaction(
        sampleOpportunities.map((opp) =>
          prisma.opportunity.create({
            data: {
              organizationId: orgId,
              title: opp.title,
              description: opp.description,
              type: opp.type,
              status: "DETECTED",
              detectedBy: "ai",
              estimatedValue: opp.estimatedValue,
              currency: "EUR",
              requiredLevel: opp.requiredLevel,
              requiredKpis: opp.requiredKpis,
              aiAnalysis: "Auto-detected based on organization profile and market data.",
              aiMatchScore: Math.round((70 + Math.random() * 25) * 100) / 100,
            },
          })
        )
      );

      res.status(201).json({
        message: `Detected ${created.length} opportunities`,
        opportunities: created,
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Value summary (ROI aggregation) ──────────────────────
  async valueSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { periodStart, periodEnd } = req.query;

      const where: Record<string, unknown> = { organizationId: orgId };
      if (periodStart || periodEnd) {
        const periodFilter: Record<string, Date> = {};
        if (periodStart) periodFilter.gte = new Date(periodStart as string);
        if (periodEnd) periodFilter.lte = new Date(periodEnd as string);
        where.periodStart = periodFilter;
      }

      const trackers = await prisma.valueTracker.findMany({ where });

      // Aggregate by category
      const byCategory: Record<string, { total: number; count: number; verified: number }> = {};
      let grandTotal = 0;
      let verifiedTotal = 0;

      for (const t of trackers) {
        if (!byCategory[t.category]) {
          byCategory[t.category] = { total: 0, count: 0, verified: 0 };
        }
        byCategory[t.category].total += t.amount;
        byCategory[t.category].count += 1;
        if (t.verified) byCategory[t.category].verified += t.amount;
        grandTotal += t.amount;
        if (t.verified) verifiedTotal += t.amount;
      }

      // Count opportunities by status
      const opportunityCounts = await prisma.opportunity.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { id: true },
        _sum: { estimatedValue: true },
      });

      res.json({
        summary: {
          totalRealizedValue: grandTotal,
          verifiedValue: verifiedTotal,
          unverifiedValue: grandTotal - verifiedTotal,
          entryCount: trackers.length,
        },
        byCategory,
        opportunities: opportunityCounts.map((o) => ({
          status: o.status,
          count: o._count.id,
          estimatedValue: o._sum.estimatedValue ?? 0,
        })),
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Value tracker history ────────────────────────────────
  async valueTrackerHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { category, page = "1", limit = "50" } = req.query;

      const where: Record<string, unknown> = { organizationId: orgId };
      if (category) where.category = category;

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));

      const [entries, total] = await Promise.all([
        prisma.valueTracker.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.valueTracker.count({ where }),
      ]);

      res.json({ data: entries, total, page: pageNum, limit: limitNum });
    } catch (err) {
      next(err);
    }
  },

  // ─── Record realized value ────────────────────────────────
  async recordValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          category: z.string().min(1),
          description: z.string().min(1),
          amount: z.number(),
          periodStart: z.string().datetime(),
          periodEnd: z.string().datetime(),
          opportunityId: z.string().uuid().optional(),
          actionId: z.string().uuid().optional(),
          kpiCode: z.string().optional(),
          verified: z.boolean().default(false),
          verifiedBy: z.string().uuid().optional(),
        })
        .parse(req.body);

      // Validate linked opportunity belongs to org if provided
      if (body.opportunityId) {
        const opp = await prisma.opportunity.findFirst({
          where: { id: body.opportunityId, organizationId: orgId },
        });
        if (!opp) throw new AppError(404, "Linked opportunity not found in this organization", "NOT_FOUND");
      }

      const entry = await prisma.valueTracker.create({
        data: {
          organizationId: orgId,
          category: body.category,
          description: body.description,
          amount: body.amount,
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
          opportunityId: body.opportunityId,
          actionId: body.actionId,
          kpiCode: body.kpiCode,
          verified: body.verified,
          verifiedBy: body.verifiedBy,
        },
      });

      res.status(201).json(entry);
    } catch (err) {
      next(err);
    }
  },
};
