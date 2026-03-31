import { Router } from "express";
import { strategyController } from "./strategy.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const strategyRoutes = Router();
strategyRoutes.use(authGuard);

// Full strategy (vision + pillars + objectives)
strategyRoutes.get("/:orgId", strategyController.getStrategy);
strategyRoutes.post("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.createStrategy);
strategyRoutes.put("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.updateStrategy);

// Execution tracking
strategyRoutes.get("/:orgId/execution", strategyController.getExecution);

// Pillars
strategyRoutes.post("/:orgId/pillars", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.addPillar);
strategyRoutes.put("/pillars/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.updatePillar);
strategyRoutes.delete("/pillars/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.deletePillar);

// Objectives
strategyRoutes.post("/pillars/:id/objectives", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.addObjective);
strategyRoutes.put("/objectives/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), strategyController.updateObjective);
