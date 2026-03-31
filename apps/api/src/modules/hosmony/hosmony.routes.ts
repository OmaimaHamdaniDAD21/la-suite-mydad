import { Router } from "express";
import { hosmonyController } from "./hosmony.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const hosmonyRoutes = Router();
hosmonyRoutes.use(authGuard);

// Levels (read-only, any authenticated user)
hosmonyRoutes.get("/levels", hosmonyController.listLevels);

// Journey
hosmonyRoutes.get("/journey/:orgId", hosmonyController.getJourney);
hosmonyRoutes.post("/journey/:orgId/start", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), hosmonyController.startJourney);
hosmonyRoutes.put("/journey/:orgId/target", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), hosmonyController.updateTarget);
hosmonyRoutes.post("/journey/:orgId/assess", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), hosmonyController.assess);
hosmonyRoutes.get("/journey/:orgId/history", hosmonyController.getHistory);

// Requirements
hosmonyRoutes.get("/requirements/level/:levelId", hosmonyController.getRequirementsForLevel);
hosmonyRoutes.get("/requirements/:orgId", hosmonyController.getOrgRequirements);
hosmonyRoutes.post("/requirements/:orgId/:reqId/validate", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), hosmonyController.validateRequirement);
hosmonyRoutes.post("/requirements/:orgId/:reqId/waive", requireRole("CONSULTANT"), hosmonyController.waiveRequirement);
hosmonyRoutes.post("/requirements/:orgId/check", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), hosmonyController.checkKpiRequirements);
