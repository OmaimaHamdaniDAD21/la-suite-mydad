import { Router } from "express";
import { actionsController } from "./actions.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const actionsRoutes = Router();
actionsRoutes.use(authGuard);

// Plans
actionsRoutes.get("/plans/:orgId", actionsController.listPlans);
actionsRoutes.post("/plans/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), actionsController.createPlan);

// Actions within a plan
actionsRoutes.get("/plans/:planId/actions", actionsController.listActions);
actionsRoutes.post("/plans/:planId/actions", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), actionsController.addAction);

// Single action operations
actionsRoutes.put("/:actionId", actionsController.updateAction);
actionsRoutes.put("/:actionId/status", actionsController.updateStatus);

// My actions (current user)
actionsRoutes.get("/my", actionsController.myActions);

// Stats
actionsRoutes.get("/:orgId/stats", actionsController.getStats);

// AI generate
actionsRoutes.post("/plans/:orgId/generate", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), actionsController.generatePlan);
