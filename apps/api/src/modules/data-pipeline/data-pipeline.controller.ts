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

const dataSourceTypeEnum = z.enum(["API", "FILE_UPLOAD", "WEBHOOK", "DATABASE", "MANUAL"]);

const dataCategoryEnum = z.enum([
  "FINANCIAL",
  "ESG_ENVIRONMENTAL",
  "ESG_SOCIAL",
  "ESG_GOVERNANCE",
  "HR",
  "OPERATIONAL",
  "MARKET",
]);

const syncFrequencyEnum = z.enum(["REALTIME", "HOURLY", "DAILY", "WEEKLY", "MANUAL"]);

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dataPipelineController = {
  // ─── Data Sources ──────────────────────────────────────

  async listSources(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const sources = await prisma.dataSource.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { syncJobs: true, rawData: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(sources);
    } catch (err) {
      next(err);
    }
  },

  async createSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          type: dataSourceTypeEnum,
          category: dataCategoryEnum,
          connectionConfig: z.record(z.unknown()).default({}),
          fieldMapping: z.record(z.unknown()).default({}),
          syncFrequency: syncFrequencyEnum.default("MANUAL"),
        })
        .parse(req.body);

      const source = await prisma.dataSource.create({
        data: {
          organizationId: orgId,
          ...body,
        },
      });

      await logAudit({
        action: "DATA_SYNC",
        entityType: "DataSource",
        entityId: source.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "create", name: body.name, type: body.type },
      });

      res.status(201).json(source);
    } catch (err) {
      next(err);
    }
  },

  async updateSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          type: dataSourceTypeEnum.optional(),
          category: dataCategoryEnum.optional(),
          connectionConfig: z.record(z.unknown()).optional(),
          fieldMapping: z.record(z.unknown()).optional(),
          syncFrequency: syncFrequencyEnum.optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = await prisma.dataSource.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Data source not found", "NOT_FOUND");

      const source = await prisma.dataSource.update({
        where: { id },
        data: body,
      });

      await logAudit({
        action: "DATA_SYNC",
        entityType: "DataSource",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "update", changes: body },
      });

      res.json(source);
    } catch (err) {
      next(err);
    }
  },

  async deleteSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const existing = await prisma.dataSource.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Data source not found", "NOT_FOUND");

      await prisma.dataSource.delete({ where: { id } });

      await logAudit({
        action: "DATA_SYNC",
        entityType: "DataSource",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "delete", name: existing.name },
      });

      res.json({ message: "Data source deleted" });
    } catch (err) {
      next(err);
    }
  },

  // ─── Sync Jobs ─────────────────────────────────────────

  async triggerSync(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);

      const source = await prisma.dataSource.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!source) throw new AppError(404, "Data source not found", "NOT_FOUND");
      if (!source.isActive) throw new AppError(400, "Data source is inactive", "SOURCE_INACTIVE");

      const syncJob = await prisma.syncJob.create({
        data: {
          dataSourceId: id,
          status: "QUEUED",
        },
      });

      // Update data source status
      await prisma.dataSource.update({
        where: { id },
        data: { lastSyncStatus: "QUEUED" },
      });

      await logAudit({
        action: "DATA_SYNC",
        entityType: "SyncJob",
        entityId: syncJob.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "trigger_sync", dataSourceId: id, dataSourceName: source.name },
      });

      res.status(201).json(syncJob);
    } catch (err) {
      next(err);
    }
  },

  async listSyncJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const { page, limit } = paginationQuery.parse(req.query);

      const source = await prisma.dataSource.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!source) throw new AppError(404, "Data source not found", "NOT_FOUND");

      const skip = (page - 1) * limit;

      const [jobs, total] = await Promise.all([
        prisma.syncJob.findMany({
          where: { dataSourceId: id },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.syncJob.count({ where: { dataSourceId: id } }),
      ]);

      res.json({
        data: jobs,
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

  // ─── Raw Data ──────────────────────────────────────────

  async listRawData(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { page, limit } = paginationQuery.parse(req.query);
      const filters = z
        .object({
          category: dataCategoryEnum.optional(),
          dataSourceId: z.string().uuid().optional(),
          isProcessed: z.coerce.boolean().optional(),
        })
        .parse(req.query);

      const skip = (page - 1) * limit;

      const where = {
        organizationId: orgId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.dataSourceId ? { dataSourceId: filters.dataSourceId } : {}),
        ...(filters.isProcessed !== undefined ? { isProcessed: filters.isProcessed } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.rawData.findMany({
          where,
          orderBy: { receivedAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.rawData.count({ where }),
      ]);

      res.json({
        data,
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

  // ─── Normalized Data ───────────────────────────────────

  async listNormalizedData(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { page, limit } = paginationQuery.parse(req.query);
      const filters = z
        .object({
          category: dataCategoryEnum.optional(),
          metricKey: z.string().optional(),
        })
        .parse(req.query);

      const skip = (page - 1) * limit;

      const where = {
        organizationId: orgId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.metricKey ? { metricKey: filters.metricKey } : {}),
      };

      const [data, total] = await Promise.all([
        prisma.normalizedData.findMany({
          where,
          orderBy: { periodStart: "desc" },
          skip,
          take: limit,
        }),
        prisma.normalizedData.count({ where }),
      ]);

      res.json({
        data,
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

  // ─── Computed Metrics ──────────────────────────────────

  async listComputedMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const metrics = await prisma.computedMetric.findMany({
        where: { organizationId: orgId },
        include: { kpiConfig: true },
        orderBy: { computedAt: "desc" },
      });

      res.json(metrics);
    } catch (err) {
      next(err);
    }
  },

  async getMetricHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const { kpiCode } = z.object({ kpiCode: z.string().min(1) }).parse(req.params);
      const { page, limit } = paginationQuery.parse(req.query);

      const kpiConfig = await prisma.kpiConfig.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: kpiCode } },
      });
      if (!kpiConfig) throw new AppError(404, "KPI config not found", "NOT_FOUND");

      const skip = (page - 1) * limit;

      const [metrics, total] = await Promise.all([
        prisma.computedMetric.findMany({
          where: { organizationId: orgId, kpiConfigId: kpiConfig.id },
          orderBy: { periodStart: "desc" },
          skip,
          take: limit,
        }),
        prisma.computedMetric.count({
          where: { organizationId: orgId, kpiConfigId: kpiConfig.id },
        }),
      ]);

      res.json({
        kpiConfig,
        data: metrics,
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

  // ─── Manual Data Entry ─────────────────────────────────

  async manualEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          category: dataCategoryEnum,
          metricKey: z.string().min(1),
          numericValue: z.number().optional(),
          textValue: z.string().optional(),
          jsonValue: z.record(z.unknown()).optional(),
          periodStart: z.coerce.date(),
          periodEnd: z.coerce.date(),
          confidence: z.number().min(0).max(1).optional(),
        })
        .parse(req.body);

      const normalized = await prisma.normalizedData.create({
        data: {
          organizationId: orgId,
          category: body.category,
          metricKey: body.metricKey,
          numericValue: body.numericValue,
          textValue: body.textValue,
          jsonValue: body.jsonValue,
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          source: "MANUAL",
          confidence: body.confidence ?? 1.0,
        },
      });

      await logAudit({
        action: "DATA_SYNC",
        entityType: "NormalizedData",
        entityId: normalized.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "manual_entry", metricKey: body.metricKey, category: body.category },
      });

      res.status(201).json(normalized);
    } catch (err) {
      next(err);
    }
  },
};
