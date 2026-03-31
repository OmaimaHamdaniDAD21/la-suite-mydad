import { Router } from "express";
import { invitationsController } from "./invitations.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const invitationRoutes = Router();

// Public routes (no auth)
invitationRoutes.get("/:token/validate", invitationsController.validate);
invitationRoutes.post("/:token/accept", invitationsController.accept);

// Protected routes
invitationRoutes.use(authGuard);
invitationRoutes.post("/", requireRole("EXPERT_COMPTABLE", "DIRIGEANT", "CONSULTANT"), invitationsController.send);
invitationRoutes.get("/", invitationsController.list);
invitationRoutes.delete("/:id", requireRole("EXPERT_COMPTABLE", "DIRIGEANT", "CONSULTANT"), invitationsController.revoke);
