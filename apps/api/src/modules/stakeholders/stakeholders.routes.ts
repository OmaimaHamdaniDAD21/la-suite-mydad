import { Router } from "express";
import { stakeholdersController } from "./stakeholders.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const stakeholdersRoutes = Router();
stakeholdersRoutes.use(authGuard);

// Map (must be before /:orgId/:id to avoid conflict)
stakeholdersRoutes.get("/:orgId/map", stakeholdersController.getMap);

// CRUD
stakeholdersRoutes.get("/:orgId", stakeholdersController.listStakeholders);
stakeholdersRoutes.post("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), stakeholdersController.createStakeholder);
stakeholdersRoutes.put("/:orgId/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), stakeholdersController.updateStakeholder);
stakeholdersRoutes.delete("/:orgId/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), stakeholdersController.deleteStakeholder);

// Interactions
stakeholdersRoutes.post("/:orgId/:id/interaction", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), stakeholdersController.logInteraction);
