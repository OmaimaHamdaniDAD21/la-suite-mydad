import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });

export const dashboardController = {
  // ─── Dashboard Overview ────────────────────────────────

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      // Fetch all overview data in parallel
      const [
        latestMetrics,
        hosmonyJourney,
        actionPlanStats,
        recentAuditLogs,
        kpiConfigs,
        dataSources,
      ] = await Promise.all([
        // Latest computed metrics with their KPI config
        prisma.computedMetric.findMany({
          where: { organizationId: orgId },
          include: { kpiConfig: true },
          orderBy: { computedAt: "desc" },
          distinct: ["kpiConfigId"],
        }),

        // HOSMONY journey status
        prisma.hosmonyJourney.findUnique({
          where: { organizationId: orgId },
          include: {
            currentLevel: true,
            actionPlans: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                totalActions: true,
                completedActions: true,
                progressPercent: true,
              },
            },
          },
        }),

        // Action plan aggregate stats
        prisma.actionPlan.aggregate({
          where: { organizationId: orgId, isActive: true },
          _sum: { totalActions: true, completedActions: true },
          _count: true,
        }),

        // Recent audit logs as alerts/activity feed
        prisma.auditLog.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        }),

        // Active KPI count
        prisma.kpiConfig.count({
          where: { organizationId: orgId, isActive: true },
        }),

        // Data source status summary
        prisma.dataSource.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, type: true, lastSyncStatus: true, lastSyncAt: true, isActive: true },
        }),
      ]);

      res.json({
        metrics: latestMetrics,
        hosmony: hosmonyJourney
          ? {
              currentLevel: hosmonyJourney.currentLevel,
              overallScore: hosmonyJourney.overallScore,
              dimensionScores: hosmonyJourney.dimensionScores,
              progressPercent: hosmonyJourney.progressPercent,
              status: hosmonyJourney.status,
              targetLevel: hosmonyJourney.targetLevel,
              actionPlans: hosmonyJourney.actionPlans,
            }
          : null,
        actionPlanStats: {
          activePlans: actionPlanStats._count,
          totalActions: actionPlanStats._sum.totalActions ?? 0,
          completedActions: actionPlanStats._sum.completedActions ?? 0,
        },
        recentActivity: recentAuditLogs,
        summary: {
          activeKpis: kpiConfigs,
          dataSources,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ─── Dashboard Config (Layout) ─────────────────────────

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const userId = req.user!.userId;

      const config = await prisma.dashboardConfig.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } },
      });

      if (!config) {
        // Return default empty layout if none saved
        res.json({
          userId,
          organizationId: orgId,
          layout: {},
          widgetConfigs: null,
          filters: null,
        });
        return;
      }

      res.json(config);
    } catch (err) {
      next(err);
    }
  },

  async saveConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const userId = req.user!.userId;
      const body = z
        .object({
          layout: z.record(z.unknown()),
          widgetConfigs: z.record(z.unknown()).optional(),
          filters: z.record(z.unknown()).optional(),
        })
        .parse(req.body);

      const config = await prisma.dashboardConfig.upsert({
        where: { userId_organizationId: { userId, organizationId: orgId } },
        update: {
          layout: body.layout,
          ...(body.widgetConfigs !== undefined ? { widgetConfigs: body.widgetConfigs } : {}),
          ...(body.filters !== undefined ? { filters: body.filters } : {}),
        },
        create: {
          userId,
          organizationId: orgId,
          layout: body.layout,
          widgetConfigs: body.widgetConfigs ?? null,
          filters: body.filters ?? null,
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "DashboardConfig",
        entityId: config.id,
        userId,
        organizationId: orgId,
        details: { action: "save_layout" },
      });

      res.json(config);
    } catch (err) {
      next(err);
    }
  },

  // ─── KPIs with Latest Values ───────────────────────────

  async listKpisWithValues(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const kpiConfigs = await prisma.kpiConfig.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: { sortOrder: "asc" },
      });

      // Get the latest computed metric for each KPI
      const kpiIds = kpiConfigs.map((k) => k.id);

      const latestMetrics = kpiIds.length > 0
        ? await prisma.computedMetric.findMany({
            where: {
              organizationId: orgId,
              kpiConfigId: { in: kpiIds },
            },
            orderBy: { computedAt: "desc" },
            distinct: ["kpiConfigId"],
          })
        : [];

      // Build a map for quick lookup
      const metricsMap = new Map(latestMetrics.map((m) => [m.kpiConfigId, m]));

      const result = kpiConfigs.map((kpi) => {
        const metric = metricsMap.get(kpi.id);
        return {
          ...kpi,
          latestValue: metric?.value ?? null,
          previousValue: metric?.previousValue ?? null,
          trend: metric?.trend ?? null,
          computedAt: metric?.computedAt ?? null,
          periodStart: metric?.periodStart ?? null,
          periodEnd: metric?.periodEnd ?? null,
        };
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
