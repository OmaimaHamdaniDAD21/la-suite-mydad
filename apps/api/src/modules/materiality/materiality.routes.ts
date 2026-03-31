import { Router } from "express";
import { materialityController } from "./materiality.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const materialityRoutes = Router();
materialityRoutes.use(authGuard);

// Issues
materialityRoutes.get("/:orgId/issues", materialityController.listIssues);
materialityRoutes.post("/:orgId/issues", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), materialityController.createIssue);
materialityRoutes.put("/:orgId/issues/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), materialityController.scoreIssue);

// Assessment
materialityRoutes.post("/:orgId/assess", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), materialityController.runAssessment);

// Visualization
materialityRoutes.get("/:orgId/matrix", materialityController.getMatrix);
materialityRoutes.get("/:orgId/report", materialityController.getReport);
