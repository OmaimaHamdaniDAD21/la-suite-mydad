import { Router } from "express";
import { dataPipelineController } from "./data-pipeline.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const dataPipelineRoutes = Router();
dataPipelineRoutes.use(authGuard);

// Data sources
dataPipelineRoutes.get("/sources/:orgId", dataPipelineController.listSources);
dataPipelineRoutes.post("/sources/:orgId", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), dataPipelineController.createSource);
dataPipelineRoutes.put("/sources/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), dataPipelineController.updateSource);
dataPipelineRoutes.delete("/sources/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), dataPipelineController.deleteSource);

// Sync
dataPipelineRoutes.post("/sources/:orgId/:id/sync", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), dataPipelineController.triggerSync);
dataPipelineRoutes.get("/sources/:orgId/:id/jobs", dataPipelineController.listSyncJobs);

// Raw data
dataPipelineRoutes.get("/raw/:orgId", dataPipelineController.listRawData);

// Normalized data
dataPipelineRoutes.get("/normalized/:orgId", dataPipelineController.listNormalizedData);

// Computed metrics
dataPipelineRoutes.get("/metrics/:orgId", dataPipelineController.listComputedMetrics);
dataPipelineRoutes.get("/metrics/:orgId/:kpiCode/history", dataPipelineController.getMetricHistory);

// Manual entry
dataPipelineRoutes.post("/manual/:orgId", requireRole("EXPERT_COMPTABLE", "DIRIGEANT", "CONSULTANT"), dataPipelineController.manualEntry);
