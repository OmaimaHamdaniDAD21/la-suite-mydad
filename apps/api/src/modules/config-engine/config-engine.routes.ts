import { Router } from "express";
import { configController } from "./config-engine.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const configRoutes = Router();
configRoutes.use(authGuard);

// Org config
configRoutes.get("/org/:orgId", configController.getOrgConfig);
configRoutes.put("/org/:orgId", requireRole("CONSULTANT"), configController.updateOrgConfig);

// Modules
configRoutes.get("/modules", configController.listModuleDefinitions);
configRoutes.get("/modules/:orgId", configController.listModuleConfigs);
configRoutes.put("/modules/:orgId", requireRole("CONSULTANT"), configController.updateModuleConfigs);

// Feature flags
configRoutes.get("/flags/:orgId", configController.listFeatureFlags);
configRoutes.put("/flags/:orgId", requireRole("CONSULTANT"), configController.updateFeatureFlags);

// KPI configs
configRoutes.get("/kpis/:orgId", configController.listKpiConfigs);
configRoutes.post("/kpis/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), configController.createKpiConfig);
configRoutes.put("/kpis/:orgId/:kpiId", requireRole("CONSULTANT"), configController.updateKpiConfig);
configRoutes.delete("/kpis/:orgId/:kpiId", requireRole("CONSULTANT"), configController.deleteKpiConfig);

// Workflow configs
configRoutes.get("/workflows/:orgId", configController.listWorkflowConfigs);
configRoutes.post("/workflows/:orgId", requireRole("CONSULTANT"), configController.createWorkflowConfig);
configRoutes.put("/workflows/:orgId/:id", requireRole("CONSULTANT"), configController.updateWorkflowConfig);

// Role configs
configRoutes.get("/roles/:orgId", configController.listRoleConfigs);
configRoutes.put("/roles/:orgId", requireRole("CONSULTANT"), configController.updateRoleConfigs);

// Templates
configRoutes.get("/templates", requireRole("CONSULTANT"), configController.listTemplates);
configRoutes.post("/templates", requireRole("CONSULTANT"), configController.createTemplate);
configRoutes.post("/templates/:id/apply/:orgId", requireRole("CONSULTANT"), configController.applyTemplate);

// Deploy
configRoutes.post("/deploy", requireRole("CONSULTANT"), configController.deploy);
