import { Request, Response, NextFunction } from "express";
import { prisma } from "@mydad/database";
import { z } from "zod";
import { AppError } from "../../middleware/error-handler";
import { logAudit } from "../../middleware/audit-logger";

const orgIdParams = z.object({ orgId: z.string().uuid() });

const orgIdKpiIdParams = z.object({
  orgId: z.string().uuid(),
  kpiId: z.string().uuid(),
});

const orgIdAndIdParams = z.object({
  orgId: z.string().uuid(),
  id: z.string().uuid(),
});

const templateApplyParams = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
});

const moduleStatusEnum = z.enum(["ACTIVE", "INACTIVE", "BETA"]);

const dataCategoryEnum = z.enum([
  "FINANCIAL",
  "ESG_ENVIRONMENTAL",
  "ESG_SOCIAL",
  "ESG_GOVERNANCE",
  "HR",
  "OPERATIONAL",
  "MARKET",
]);

const roleEnum = z.enum([
  "EXPERT_COMPTABLE",
  "DIRIGEANT",
  "COLLABORATEUR",
  "CONSULTANT",
]);

export const configController = {
  // ─── Org Config ──────────────────────────────────────────

  async getOrgConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const orgConfig = await prisma.orgConfig.findUnique({
        where: { organizationId: orgId },
      });
      if (!orgConfig) throw new AppError(404, "Org config not found", "NOT_FOUND");

      const [moduleConfigs, featureFlags, kpiConfigs, workflowConfigs, roleConfigs] =
        await Promise.all([
          prisma.moduleConfig.findMany({
            where: { organizationId: orgId },
            include: { moduleDefinition: true },
          }),
          prisma.featureFlag.findMany({ where: { organizationId: orgId } }),
          prisma.kpiConfig.findMany({
            where: { organizationId: orgId, isActive: true },
            orderBy: { sortOrder: "asc" },
          }),
          prisma.workflowConfig.findMany({
            where: { organizationId: orgId, isActive: true },
          }),
          prisma.roleConfig.findMany({ where: { organizationId: orgId } }),
        ]);

      res.json({
        ...orgConfig,
        moduleConfigs,
        featureFlags,
        kpiConfigs,
        workflowConfigs,
        roleConfigs,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateOrgConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({ globalSettings: z.record(z.unknown()) })
        .parse(req.body);

      const orgConfig = await prisma.orgConfig.update({
        where: { organizationId: orgId },
        data: { globalSettings: body.globalSettings as any },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "OrgConfig",
        entityId: orgConfig.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { globalSettings: body.globalSettings },
      });

      res.json(orgConfig);
    } catch (err) {
      next(err);
    }
  },

  // ─── Module Definitions & Configs ────────────────────────

  async listModuleDefinitions(req: Request, res: Response, next: NextFunction) {
    try {
      const definitions = await prisma.moduleDefinition.findMany({
        orderBy: { sortOrder: "asc" },
      });
      res.json(definitions);
    } catch (err) {
      next(err);
    }
  },

  async listModuleConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);

      const configs = await prisma.moduleConfig.findMany({
        where: { organizationId: orgId },
        include: { moduleDefinition: true },
      });
      res.json(configs);
    } catch (err) {
      next(err);
    }
  },

  async updateModuleConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          modules: z.array(
            z.object({
              moduleCode: z.string().min(1),
              status: moduleStatusEnum,
              settings: z.record(z.unknown()).optional(),
            }),
          ),
        })
        .parse(req.body);

      const results = await prisma.$transaction(
        body.modules.map((mod) =>
          prisma.moduleConfig.upsert({
            where: {
              organizationId_moduleDefinitionId: {
                organizationId: orgId,
                moduleDefinitionId: mod.moduleCode,
              },
            },
            update: {
              status: mod.status,
              ...(mod.settings !== undefined ? { settings: mod.settings as any } : {}),
            },
            create: {
              organizationId: orgId,
              moduleDefinitionId: mod.moduleCode,
              status: mod.status,
              settings: (mod.settings ?? {}) as any,
            },
          }),
        ),
      );

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "ModuleConfig",
        userId: req.user!.userId,
        organizationId: orgId,
        details: { modules: body.modules },
      });

      res.json(results);
    } catch (err) {
      next(err);
    }
  },

  // ─── Feature Flags ───────────────────────────────────────

  async listFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const flags = await prisma.featureFlag.findMany({
        where: { organizationId: orgId },
      });
      res.json(flags);
    } catch (err) {
      next(err);
    }
  },

  async updateFeatureFlags(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          flags: z.array(
            z.object({
              key: z.string().min(1),
              enabled: z.boolean(),
            }),
          ),
        })
        .parse(req.body);

      const results = await prisma.$transaction(
        body.flags.map((flag) =>
          prisma.featureFlag.upsert({
            where: {
              organizationId_key: {
                organizationId: orgId,
                key: flag.key,
              },
            },
            update: { enabled: flag.enabled },
            create: {
              organizationId: orgId,
              key: flag.key,
              enabled: flag.enabled,
            },
          }),
        ),
      );

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "FeatureFlag",
        userId: req.user!.userId,
        organizationId: orgId,
        details: { flags: body.flags },
      });

      res.json(results);
    } catch (err) {
      next(err);
    }
  },

  // ─── KPI Configs ─────────────────────────────────────────

  async listKpiConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const kpis = await prisma.kpiConfig.findMany({
        where: { organizationId: orgId, isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      res.json(kpis);
    } catch (err) {
      next(err);
    }
  },

  async createKpiConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          code: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          category: dataCategoryEnum,
          unit: z.string().min(1),
          formula: z.string().optional(),
          dataSourceRef: z.string().optional(),
          targetMin: z.number().optional(),
          targetMax: z.number().optional(),
          sortOrder: z.number().int().optional(),
          displayConfig: z.record(z.unknown()).optional(),
        })
        .parse(req.body);

      // Check uniqueness of code within org
      const existing = await prisma.kpiConfig.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: body.code } },
      });
      if (existing) {
        throw new AppError(409, "KPI code already exists for this organization", "DUPLICATE_KPI_CODE");
      }

      const kpi = await prisma.kpiConfig.create({
        data: {
          organizationId: orgId,
          ...body,
          displayConfig: body.displayConfig as any,
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "KpiConfig",
        entityId: kpi.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "create", code: body.code },
      });

      res.status(201).json(kpi);
    } catch (err) {
      next(err);
    }
  },

  async updateKpiConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, kpiId } = orgIdKpiIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          category: dataCategoryEnum.optional(),
          unit: z.string().min(1).optional(),
          formula: z.string().optional(),
          dataSourceRef: z.string().optional(),
          targetMin: z.number().optional(),
          targetMax: z.number().optional(),
          sortOrder: z.number().int().optional(),
          displayConfig: z.record(z.unknown()).optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = await prisma.kpiConfig.findFirst({
        where: { id: kpiId, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "KPI config not found", "NOT_FOUND");

      const kpi = await prisma.kpiConfig.update({
        where: { id: kpiId },
        data: {
          ...body,
          displayConfig: body.displayConfig as any,
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "KpiConfig",
        entityId: kpiId,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "update", changes: body },
      });

      res.json(kpi);
    } catch (err) {
      next(err);
    }
  },

  async deleteKpiConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, kpiId } = orgIdKpiIdParams.parse(req.params);

      const existing = await prisma.kpiConfig.findFirst({
        where: { id: kpiId, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "KPI config not found", "NOT_FOUND");

      const kpi = await prisma.kpiConfig.update({
        where: { id: kpiId },
        data: { isActive: false },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "KpiConfig",
        entityId: kpiId,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "soft_delete" },
      });

      res.json(kpi);
    } catch (err) {
      next(err);
    }
  },

  // ─── Workflow Configs ────────────────────────────────────

  async listWorkflowConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const workflows = await prisma.workflowConfig.findMany({
        where: { organizationId: orgId, isActive: true },
      });
      res.json(workflows);
    } catch (err) {
      next(err);
    }
  },

  async createWorkflowConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          code: z.string().min(1),
          name: z.string().min(1),
          description: z.string().optional(),
          steps: z.array(z.record(z.unknown())),
          triggers: z.array(z.record(z.unknown())).optional(),
        })
        .parse(req.body);

      const existing = await prisma.workflowConfig.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: body.code } },
      });
      if (existing) {
        throw new AppError(409, "Workflow code already exists for this organization", "DUPLICATE_WORKFLOW_CODE");
      }

      const workflow = await prisma.workflowConfig.create({
        data: {
          organizationId: orgId,
          ...body,
          steps: body.steps as any,
          triggers: body.triggers as any,
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "WorkflowConfig",
        entityId: workflow.id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "create", code: body.code },
      });

      res.status(201).json(workflow);
    } catch (err) {
      next(err);
    }
  },

  async updateWorkflowConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId, id } = orgIdAndIdParams.parse(req.params);
      const body = z
        .object({
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          steps: z.array(z.record(z.unknown())).optional(),
          triggers: z.array(z.record(z.unknown())).optional(),
          isActive: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = await prisma.workflowConfig.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!existing) throw new AppError(404, "Workflow config not found", "NOT_FOUND");

      const workflow = await prisma.workflowConfig.update({
        where: { id },
        data: {
          ...body,
          steps: body.steps as any,
          triggers: body.triggers as any,
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "WorkflowConfig",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "update", changes: body },
      });

      res.json(workflow);
    } catch (err) {
      next(err);
    }
  },

  // ─── Role Configs ────────────────────────────────────────

  async listRoleConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const roles = await prisma.roleConfig.findMany({
        where: { organizationId: orgId },
      });
      res.json(roles);
    } catch (err) {
      next(err);
    }
  },

  async updateRoleConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const { orgId } = orgIdParams.parse(req.params);
      const body = z
        .object({
          roles: z.array(
            z.object({
              role: roleEnum,
              permissions: z.array(z.string()),
              restrictions: z.record(z.unknown()).optional(),
            }),
          ),
        })
        .parse(req.body);

      const results = await prisma.$transaction(
        body.roles.map((r) =>
          prisma.roleConfig.upsert({
            where: {
              organizationId_role: {
                organizationId: orgId,
                role: r.role,
              },
            },
            update: {
              permissions: r.permissions,
              ...(r.restrictions !== undefined
                ? { restrictions: r.restrictions as any }
                : {}),
            },
            create: {
              organizationId: orgId,
              role: r.role,
              permissions: r.permissions,
              restrictions: (r.restrictions ?? null) as any,
            },
          }),
        ),
      );

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "RoleConfig",
        userId: req.user!.userId,
        organizationId: orgId,
        details: { roles: body.roles.map((r) => r.role) },
      });

      res.json(results);
    } catch (err) {
      next(err);
    }
  },

  // ─── Templates ───────────────────────────────────────────

  async listTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await prisma.configTemplate.findMany({
        where: {
          OR: [
            { isPublic: true },
            { createdById: req.user!.userId },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(templates);
    } catch (err) {
      next(err);
    }
  },

  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z
        .object({
          name: z.string().min(1),
          description: z.string().optional(),
          fromOrgId: z.string().uuid(),
          isPublic: z.boolean().optional(),
        })
        .parse(req.body);

      // Snapshot all configs from the source org
      const [moduleConfigs, featureFlags, kpiConfigs, workflowConfigs, roleConfigs] =
        await Promise.all([
          prisma.moduleConfig.findMany({
            where: { organizationId: body.fromOrgId },
            include: { moduleDefinition: { select: { code: true } } },
          }),
          prisma.featureFlag.findMany({
            where: { organizationId: body.fromOrgId },
          }),
          prisma.kpiConfig.findMany({
            where: { organizationId: body.fromOrgId, isActive: true },
          }),
          prisma.workflowConfig.findMany({
            where: { organizationId: body.fromOrgId, isActive: true },
          }),
          prisma.roleConfig.findMany({
            where: { organizationId: body.fromOrgId },
          }),
        ]);

      const template = await prisma.configTemplate.create({
        data: {
          name: body.name,
          description: body.description,
          createdById: req.user!.userId,
          isPublic: body.isPublic ?? false,
          moduleConfigs: moduleConfigs.map((mc) => ({
            moduleCode: mc.moduleDefinition.code,
            moduleDefinitionId: mc.moduleDefinitionId,
            status: mc.status,
            settings: mc.settings,
          })),
          featureFlags: featureFlags.map((ff) => ({
            key: ff.key,
            enabled: ff.enabled,
            metadata: ff.metadata,
          })),
          kpiConfigs: kpiConfigs.map((kpi) => ({
            code: kpi.code,
            name: kpi.name,
            description: kpi.description,
            category: kpi.category,
            unit: kpi.unit,
            formula: kpi.formula,
            dataSourceRef: kpi.dataSourceRef,
            targetMin: kpi.targetMin,
            targetMax: kpi.targetMax,
            sortOrder: kpi.sortOrder,
            displayConfig: kpi.displayConfig,
          })),
          workflowConfigs: workflowConfigs.map((wf) => ({
            code: wf.code,
            name: wf.name,
            description: wf.description,
            steps: wf.steps,
            triggers: wf.triggers,
          })),
          roleConfigs: roleConfigs.map((rc) => ({
            role: rc.role,
            permissions: rc.permissions,
            restrictions: rc.restrictions,
          })),
        },
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "ConfigTemplate",
        entityId: template.id,
        userId: req.user!.userId,
        details: { action: "create", name: body.name, fromOrgId: body.fromOrgId },
      });

      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  },

  async applyTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, orgId } = templateApplyParams.parse(req.params);

      const template = await prisma.configTemplate.findUnique({ where: { id } });
      if (!template) throw new AppError(404, "Template not found", "NOT_FOUND");

      const moduleSnaps = template.moduleConfigs as Array<{
        moduleDefinitionId: string;
        status: string;
        settings: unknown;
      }>;
      const flagSnaps = template.featureFlags as Array<{
        key: string;
        enabled: boolean;
        metadata?: unknown;
      }>;
      const kpiSnaps = template.kpiConfigs as Array<{
        code: string;
        name: string;
        description?: string;
        category: string;
        unit: string;
        formula?: string;
        dataSourceRef?: string;
        targetMin?: number;
        targetMax?: number;
        sortOrder?: number;
        displayConfig?: unknown;
      }>;
      const wfSnaps = template.workflowConfigs as Array<{
        code: string;
        name: string;
        description?: string;
        steps: unknown;
        triggers?: unknown;
      }>;
      const roleSnaps = template.roleConfigs as Array<{
        role: "EXPERT_COMPTABLE" | "DIRIGEANT" | "COLLABORATEUR" | "CONSULTANT";
        permissions: unknown;
        restrictions?: unknown;
      }>;

      await prisma.$transaction(async (tx) => {
        // Link template to org config
        await tx.orgConfig.update({
          where: { organizationId: orgId },
          data: { templateId: id },
        });

        // Modules
        for (const mod of moduleSnaps) {
          await tx.moduleConfig.upsert({
            where: {
              organizationId_moduleDefinitionId: {
                organizationId: orgId,
                moduleDefinitionId: mod.moduleDefinitionId,
              },
            },
            update: { status: mod.status as "ACTIVE" | "INACTIVE" | "BETA", settings: mod.settings as object },
            create: {
              organizationId: orgId,
              moduleDefinitionId: mod.moduleDefinitionId,
              status: mod.status as "ACTIVE" | "INACTIVE" | "BETA",
              settings: mod.settings as object,
            },
          });
        }

        // Feature flags
        for (const flag of flagSnaps) {
          await tx.featureFlag.upsert({
            where: { organizationId_key: { organizationId: orgId, key: flag.key } },
            update: { enabled: flag.enabled, metadata: flag.metadata as object | undefined },
            create: {
              organizationId: orgId,
              key: flag.key,
              enabled: flag.enabled,
              metadata: flag.metadata as object | undefined,
            },
          });
        }

        // KPI configs
        for (const kpi of kpiSnaps) {
          await tx.kpiConfig.upsert({
            where: { organizationId_code: { organizationId: orgId, code: kpi.code } },
            update: {
              name: kpi.name,
              description: kpi.description,
              category: kpi.category as "FINANCIAL" | "ESG_ENVIRONMENTAL" | "ESG_SOCIAL" | "ESG_GOVERNANCE" | "HR" | "OPERATIONAL" | "MARKET",
              unit: kpi.unit,
              formula: kpi.formula,
              dataSourceRef: kpi.dataSourceRef,
              targetMin: kpi.targetMin,
              targetMax: kpi.targetMax,
              sortOrder: kpi.sortOrder,
              displayConfig: kpi.displayConfig as object | undefined,
              isActive: true,
            },
            create: {
              organizationId: orgId,
              code: kpi.code,
              name: kpi.name,
              description: kpi.description,
              category: kpi.category as "FINANCIAL" | "ESG_ENVIRONMENTAL" | "ESG_SOCIAL" | "ESG_GOVERNANCE" | "HR" | "OPERATIONAL" | "MARKET",
              unit: kpi.unit,
              formula: kpi.formula,
              dataSourceRef: kpi.dataSourceRef,
              targetMin: kpi.targetMin,
              targetMax: kpi.targetMax,
              sortOrder: kpi.sortOrder,
              displayConfig: kpi.displayConfig as object | undefined,
            },
          });
        }

        // Workflow configs
        for (const wf of wfSnaps) {
          await tx.workflowConfig.upsert({
            where: { organizationId_code: { organizationId: orgId, code: wf.code } },
            update: {
              name: wf.name,
              description: wf.description,
              steps: wf.steps as object,
              triggers: wf.triggers as object | undefined,
              isActive: true,
            },
            create: {
              organizationId: orgId,
              code: wf.code,
              name: wf.name,
              description: wf.description,
              steps: wf.steps as object,
              triggers: wf.triggers as object | undefined,
            },
          });
        }

        // Role configs
        for (const rc of roleSnaps) {
          await tx.roleConfig.upsert({
            where: { organizationId_role: { organizationId: orgId, role: rc.role } },
            update: {
              permissions: rc.permissions as object,
              restrictions: rc.restrictions as object | undefined,
            },
            create: {
              organizationId: orgId,
              role: rc.role,
              permissions: rc.permissions as object,
              restrictions: rc.restrictions as object | undefined,
            },
          });
        }
      });

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "ConfigTemplate",
        entityId: id,
        userId: req.user!.userId,
        organizationId: orgId,
        details: { action: "apply", templateName: template.name },
      });

      res.json({ message: "Template applied successfully", templateId: id, organizationId: orgId });
    } catch (err) {
      next(err);
    }
  },

  // ─── Deploy ──────────────────────────────────────────────

  async deploy(req: Request, res: Response, next: NextFunction) {
    try {
      const body = z
        .object({
          templateId: z.string().uuid(),
          organizationIds: z.array(z.string().uuid()).min(1),
        })
        .parse(req.body);

      const template = await prisma.configTemplate.findUnique({
        where: { id: body.templateId },
      });
      if (!template) throw new AppError(404, "Template not found", "NOT_FOUND");

      const results: Array<{ organizationId: string; success: boolean; error?: string }> = [];

      for (const orgId of body.organizationIds) {
        try {
          // Verify org config exists
          const orgConfig = await prisma.orgConfig.findUnique({
            where: { organizationId: orgId },
          });
          if (!orgConfig) {
            results.push({ organizationId: orgId, success: false, error: "Org config not found" });
            continue;
          }

          const moduleSnaps = template.moduleConfigs as Array<{
            moduleDefinitionId: string;
            status: string;
            settings: unknown;
          }>;
          const flagSnaps = template.featureFlags as Array<{
            key: string;
            enabled: boolean;
            metadata?: unknown;
          }>;
          const kpiSnaps = template.kpiConfigs as Array<{
            code: string;
            name: string;
            description?: string;
            category: string;
            unit: string;
            formula?: string;
            dataSourceRef?: string;
            targetMin?: number;
            targetMax?: number;
            sortOrder?: number;
            displayConfig?: unknown;
          }>;
          const wfSnaps = template.workflowConfigs as Array<{
            code: string;
            name: string;
            description?: string;
            steps: unknown;
            triggers?: unknown;
          }>;
          const roleSnaps = template.roleConfigs as Array<{
            role: "EXPERT_COMPTABLE" | "DIRIGEANT" | "COLLABORATEUR" | "CONSULTANT";
            permissions: unknown;
            restrictions?: unknown;
          }>;

          await prisma.$transaction(async (tx) => {
            await tx.orgConfig.update({
              where: { organizationId: orgId },
              data: { templateId: body.templateId },
            });

            for (const mod of moduleSnaps) {
              await tx.moduleConfig.upsert({
                where: {
                  organizationId_moduleDefinitionId: {
                    organizationId: orgId,
                    moduleDefinitionId: mod.moduleDefinitionId,
                  },
                },
                update: { status: mod.status as "ACTIVE" | "INACTIVE" | "BETA", settings: mod.settings as object },
                create: {
                  organizationId: orgId,
                  moduleDefinitionId: mod.moduleDefinitionId,
                  status: mod.status as "ACTIVE" | "INACTIVE" | "BETA",
                  settings: mod.settings as object,
                },
              });
            }

            for (const flag of flagSnaps) {
              await tx.featureFlag.upsert({
                where: { organizationId_key: { organizationId: orgId, key: flag.key } },
                update: { enabled: flag.enabled, metadata: flag.metadata as object | undefined },
                create: {
                  organizationId: orgId,
                  key: flag.key,
                  enabled: flag.enabled,
                  metadata: flag.metadata as object | undefined,
                },
              });
            }

            for (const kpi of kpiSnaps) {
              await tx.kpiConfig.upsert({
                where: { organizationId_code: { organizationId: orgId, code: kpi.code } },
                update: {
                  name: kpi.name,
                  description: kpi.description,
                  category: kpi.category as "FINANCIAL" | "ESG_ENVIRONMENTAL" | "ESG_SOCIAL" | "ESG_GOVERNANCE" | "HR" | "OPERATIONAL" | "MARKET",
                  unit: kpi.unit,
                  formula: kpi.formula,
                  dataSourceRef: kpi.dataSourceRef,
                  targetMin: kpi.targetMin,
                  targetMax: kpi.targetMax,
                  sortOrder: kpi.sortOrder,
                  displayConfig: kpi.displayConfig as object | undefined,
                  isActive: true,
                },
                create: {
                  organizationId: orgId,
                  code: kpi.code,
                  name: kpi.name,
                  description: kpi.description,
                  category: kpi.category as "FINANCIAL" | "ESG_ENVIRONMENTAL" | "ESG_SOCIAL" | "ESG_GOVERNANCE" | "HR" | "OPERATIONAL" | "MARKET",
                  unit: kpi.unit,
                  formula: kpi.formula,
                  dataSourceRef: kpi.dataSourceRef,
                  targetMin: kpi.targetMin,
                  targetMax: kpi.targetMax,
                  sortOrder: kpi.sortOrder,
                  displayConfig: kpi.displayConfig as object | undefined,
                },
              });
            }

            for (const wf of wfSnaps) {
              await tx.workflowConfig.upsert({
                where: { organizationId_code: { organizationId: orgId, code: wf.code } },
                update: {
                  name: wf.name,
                  description: wf.description,
                  steps: wf.steps as object,
                  triggers: wf.triggers as object | undefined,
                  isActive: true,
                },
                create: {
                  organizationId: orgId,
                  code: wf.code,
                  name: wf.name,
                  description: wf.description,
                  steps: wf.steps as object,
                  triggers: wf.triggers as object | undefined,
                },
              });
            }

            for (const rc of roleSnaps) {
              await tx.roleConfig.upsert({
                where: { organizationId_role: { organizationId: orgId, role: rc.role } },
                update: {
                  permissions: rc.permissions as object,
                  restrictions: rc.restrictions as object | undefined,
                },
                create: {
                  organizationId: orgId,
                  role: rc.role,
                  permissions: rc.permissions as object,
                  restrictions: rc.restrictions as object | undefined,
                },
              });
            }
          });

          results.push({ organizationId: orgId, success: true });
        } catch {
          results.push({ organizationId: orgId, success: false, error: "Failed to apply template" });
        }
      }

      await logAudit({
        action: "CONFIG_CHANGE",
        entityType: "ConfigTemplate",
        entityId: body.templateId,
        userId: req.user!.userId,
        details: {
          action: "deploy",
          templateName: template.name,
          organizationIds: body.organizationIds,
          results,
        },
      });

      res.json({ templateId: body.templateId, results });
    } catch (err) {
      next(err);
    }
  },
};
