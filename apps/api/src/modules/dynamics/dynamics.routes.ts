import { Router } from "express";
import { dynamicsController } from "./dynamics.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const dynamicsRoutes = Router();
dynamicsRoutes.use(authGuard);

// Initiatives
dynamicsRoutes.get("/:orgId/initiatives", dynamicsController.listInitiatives);
dynamicsRoutes.post("/:orgId/initiatives", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), dynamicsController.createInitiative);
dynamicsRoutes.put("/initiatives/:id", dynamicsController.updateInitiative);

// Participation
dynamicsRoutes.post("/initiatives/:id/participate", dynamicsController.participate);
dynamicsRoutes.put("/initiatives/:id/participation", dynamicsController.updateParticipation);

// Engagement
dynamicsRoutes.get("/:orgId/engagement", dynamicsController.engagementScore);
