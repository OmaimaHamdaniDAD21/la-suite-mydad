import { Router } from "express";
import { opportunitiesController } from "./opportunities.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const opportunitiesRoutes = Router();
opportunitiesRoutes.use(authGuard);

// Opportunities CRUD
opportunitiesRoutes.get("/:orgId", opportunitiesController.list);
opportunitiesRoutes.post("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), opportunitiesController.create);
opportunitiesRoutes.put("/:orgId/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), opportunitiesController.update);

// Eligibility & detection
opportunitiesRoutes.post("/:orgId/:id/check-eligibility", opportunitiesController.checkEligibility);
opportunitiesRoutes.post("/:orgId/detect", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), opportunitiesController.detect);

// Value tracking
opportunitiesRoutes.get("/:orgId/value-summary", opportunitiesController.valueSummary);
opportunitiesRoutes.get("/:orgId/value-tracker", opportunitiesController.valueTrackerHistory);
opportunitiesRoutes.post("/:orgId/value-tracker", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), opportunitiesController.recordValue);
