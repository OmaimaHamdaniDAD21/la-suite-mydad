import { Router } from "express";
import { organizationsController } from "./organizations.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const organizationRoutes = Router();

organizationRoutes.use(authGuard);

organizationRoutes.get("/", organizationsController.list);
organizationRoutes.get("/:id", organizationsController.get);
organizationRoutes.put("/:id", requireRole("EXPERT_COMPTABLE", "DIRIGEANT", "CONSULTANT"), organizationsController.update);
organizationRoutes.get("/:id/members", organizationsController.listMembers);
organizationRoutes.get("/:id/clients", requireRole("EXPERT_COMPTABLE"), organizationsController.listClients);
organizationRoutes.post("/:id/clients", requireRole("EXPERT_COMPTABLE"), organizationsController.addClient);
