import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";

const orgIdParams = z.object({ orgId: z.string().uuid() });
const idParams = z.object({ id: z.string().uuid() });

export const strategyController = {
  // ─── Get full strategy ─────────────────────────────────
  async getStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const strategy = await prisma.strategy.findUnique({
        where: { organizationId: orgId },
        include: {
          pillars: {
            orderBy: { sortOrder: "asc" },
            include: {
              objectives: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      if (!strategy) {
        throw new AppError(404, "Strategy not found for this organization", "NOT_FOUND");
      }

      res.json(strategy);
    } catch (err) {
      next(err);
    }
  },

  // ─── Create / init strategy ────────────────────────────
  async createStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          vision: z.string().optional(),
          mission: z.string().optional(),
          values: z.array(z.string()).optional(),
          timeHorizon: z.number().int().min(1).max(10).optional(),
          templateId: z.string().uuid().optional(),
        })
        .parse(req.body);

      const existing = await prisma.strategy.findUnique({
        where: { organizationId: orgId },
      });
      if (existing) {
        throw new AppError(409, "Strategy already exists for this organization", "DUPLICATE_STRATEGY");
      }

      const strategy = await prisma.strategy.create({
        data: {
          organizationId: orgId,
          vision: body.vision,
          mission: body.mission,
          values: body.values ?? [],
          timeHorizon: body.timeHorizon ?? 3,
          templateId: body.templateId,
          status: "draft",
        },
        include: {
          pillars: {
            include: { objectives: true },
          },
        },
      });

      res.status(201).json(strategy);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update vision, mission, values ────────────────────
  async updateStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          vision: z.string().optional(),
          mission: z.string().optional(),
          values: z.array(z.string()).optional(),
          timeHorizon: z.number().int().min(1).max(10).optional(),
          status: z.string().optional(),
        })
        .parse(req.body);

      const existing = await prisma.strategy.findUnique({
        where: { organizationId: orgId },
      });
      if (!existing) {
        throw new AppError(404, "Strategy not found for this organization", "NOT_FOUND");
      }

      const strategy = await prisma.strategy.update({
        where: { organizationId: orgId },
        data: {
          ...(body.vision !== undefined && { vision: body.vision }),
          ...(body.mission !== undefined && { mission: body.mission }),
          ...(body.values !== undefined && { values: body.values }),
          ...(body.timeHorizon !== undefined && { timeHorizon: body.timeHorizon }),
          ...(body.status !== undefined && { status: body.status }),
        },
        include: {
          pillars: {
            orderBy: { sortOrder: "asc" },
            include: {
              objectives: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });

      res.json(strategy);
    } catch (err) {
      next(err);
    }
  },

  // ─── Add pillar ────────────────────────────────────────
  async addPillar(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          color: z.string().optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(req.body);

      const strategy = await prisma.strategy.findUnique({
        where: { organizationId: orgId },
      });
      if (!strategy) {
        throw new AppError(404, "Strategy not found for this organization", "NOT_FOUND");
      }

      const pillar = await prisma.strategyPillar.create({
        data: {
          strategyId: strategy.id,
          name: body.name,
          description: body.description,
          color: body.color,
          sortOrder: body.sortOrder ?? 0,
        },
        include: { objectives: true },
      });

      res.status(201).json(pillar);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update pillar ────────────────────────────────────
  async updatePillar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          color: z.string().optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(req.body);

      const existing = await prisma.strategyPillar.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new AppError(404, "Pillar not found", "NOT_FOUND");
      }

      const pillar = await prisma.strategyPillar.update({
        where: { id },
        data: body,
        include: { objectives: { orderBy: { sortOrder: "asc" } } },
      });

      res.json(pillar);
    } catch (err) {
      next(err);
    }
  },

  // ─── Delete pillar ────────────────────────────────────
  async deletePillar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);

      const existing = await prisma.strategyPillar.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new AppError(404, "Pillar not found", "NOT_FOUND");
      }

      await prisma.strategyPillar.delete({ where: { id } });

      res.json({ message: "Pillar deleted successfully" });
    } catch (err) {
      next(err);
    }
  },

  // ─── Add objective ─────────────────────────────────────
  async addObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: pillarId } = idParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1),
          description: z.string().optional(),
          targetDate: z.string().datetime().optional(),
          linkedKpiCodes: z.array(z.string()).optional(),
          targetValues: z.record(z.number()).optional(),
          linkedActionIds: z.array(z.string()).optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(req.body);

      const pillar = await prisma.strategyPillar.findUnique({
        where: { id: pillarId },
        include: { strategy: true },
      });
      if (!pillar) {
        throw new AppError(404, "Pillar not found", "NOT_FOUND");
      }

      const objective = await prisma.strategyObjective.create({
        data: {
          pillarId,
          organizationId: pillar.strategy.organizationId,
          title: body.title,
          description: body.description,
          targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
          linkedKpiCodes: body.linkedKpiCodes ?? [],
          targetValues: body.targetValues ?? {},
          linkedActionIds: body.linkedActionIds ?? [],
          sortOrder: body.sortOrder ?? 0,
          status: "not_started",
          progressPercent: 0,
        },
      });

      res.status(201).json(objective);
    } catch (err) {
      next(err);
    }
  },

  // ─── Update objective ──────────────────────────────────
  async updateObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParams.parse(req.params);
      const body = z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          targetDate: z.string().datetime().optional(),
          linkedKpiCodes: z.array(z.string()).optional(),
          targetValues: z.record(z.number()).optional(),
          linkedActionIds: z.array(z.string()).optional(),
          status: z.string().optional(),
          progressPercent: z.number().min(0).max(100).optional(),
          sortOrder: z.number().int().optional(),
        })
        .parse(req.body);

      const existing = await prisma.strategyObjective.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new AppError(404, "Objective not found", "NOT_FOUND");
      }

      const objective = await prisma.strategyObjective.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.targetDate !== undefined && { targetDate: new Date(body.targetDate) }),
          ...(body.linkedKpiCodes !== undefined && { linkedKpiCodes: body.linkedKpiCodes }),
          ...(body.targetValues !== undefined && { targetValues: body.targetValues }),
          ...(body.linkedActionIds !== undefined && { linkedActionIds: body.linkedActionIds }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.progressPercent !== undefined && { progressPercent: body.progressPercent }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
          lastReviewedAt: new Date(),
        },
      });

      res.json(objective);
    } catch (err) {
      next(err);
    }
  },

  // ─── Execution tracking ────────────────────────────────
  async getExecution(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const strategy = await prisma.strategy.findUnique({
        where: { organizationId: orgId },
        include: {
          pillars: {
            orderBy: { sortOrder: "asc" },
            include: {
              objectives: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      });

      if (!strategy) {
        throw new AppError(404, "Strategy not found for this organization", "NOT_FOUND");
      }

      // Gather all linked KPI codes across objectives
      const allKpiCodes: string[] = [];
      for (const pillar of strategy.pillars) {
        for (const obj of pillar.objectives) {
          const codes = obj.linkedKpiCodes as string[] | null;
          if (codes && Array.isArray(codes)) {
            allKpiCodes.push(...codes);
          }
        }
      }

      // Fetch KPI configs for those codes
      const uniqueKpiCodes = [...new Set(allKpiCodes)];
      const kpiConfigs = uniqueKpiCodes.length > 0
        ? await prisma.kpiConfig.findMany({
            where: {
              organizationId: orgId,
              code: { in: uniqueKpiCodes },
              isActive: true,
            },
          })
        : [];

      // Fetch latest computed metrics for those KPIs
      const computedMetrics = uniqueKpiCodes.length > 0
        ? await prisma.computedMetric.findMany({
            where: {
              organizationId: orgId,
              kpiCode: { in: uniqueKpiCodes },
            },
            orderBy: { computedAt: "desc" },
          })
        : [];

      // Build KPI lookup maps
      const kpiConfigMap = new Map(kpiConfigs.map((k) => [k.code, k]));
      const latestMetricMap = new Map<string, typeof computedMetrics[0]>();
      for (const metric of computedMetrics) {
        if (!latestMetricMap.has(metric.kpiCode)) {
          latestMetricMap.set(metric.kpiCode, metric);
        }
      }

      // Build execution view per pillar / objective
      const pillarsExecution = strategy.pillars.map((pillar) => {
        const objectivesExecution = pillar.objectives.map((obj) => {
          const codes = (obj.linkedKpiCodes as string[] | null) ?? [];
          const targets = (obj.targetValues as Record<string, number> | null) ?? {};

          const kpis = codes.map((code) => {
            const config = kpiConfigMap.get(code);
            const latestMetric = latestMetricMap.get(code);
            const targetValue = targets[code] ?? config?.targetMax ?? null;
            const currentValue = latestMetric?.value ?? null;

            let progressPercent: number | null = null;
            if (currentValue !== null && targetValue !== null && targetValue !== 0) {
              progressPercent = Math.min(100, Math.round((currentValue / targetValue) * 100));
            }

            return {
              code,
              name: config?.name ?? code,
              unit: config?.unit ?? null,
              targetValue,
              currentValue,
              progressPercent,
              computedAt: latestMetric?.computedAt ?? null,
            };
          });

          // Compute overall objective progress from KPI progress
          const kpiProgresses = kpis
            .map((k) => k.progressPercent)
            .filter((p): p is number => p !== null);
          const computedProgress =
            kpiProgresses.length > 0
              ? Math.round(kpiProgresses.reduce((a, b) => a + b, 0) / kpiProgresses.length)
              : obj.progressPercent;

          return {
            id: obj.id,
            title: obj.title,
            description: obj.description,
            status: obj.status,
            targetDate: obj.targetDate,
            progressPercent: computedProgress,
            kpis,
          };
        });

        // Compute pillar-level progress
        const objProgresses = objectivesExecution.map((o) => o.progressPercent);
        const pillarProgress =
          objProgresses.length > 0
            ? Math.round(objProgresses.reduce((a, b) => a + b, 0) / objProgresses.length)
            : 0;

        return {
          id: pillar.id,
          name: pillar.name,
          color: pillar.color,
          progressPercent: pillarProgress,
          objectives: objectivesExecution,
        };
      });

      // Overall strategy progress
      const allPillarProgresses = pillarsExecution.map((p) => p.progressPercent);
      const overallProgress =
        allPillarProgresses.length > 0
          ? Math.round(allPillarProgresses.reduce((a, b) => a + b, 0) / allPillarProgresses.length)
          : 0;

      res.json({
        strategyId: strategy.id,
        status: strategy.status,
        overallProgress,
        pillars: pillarsExecution,
      });
    } catch (err) {
      next(err);
    }
  },
};
