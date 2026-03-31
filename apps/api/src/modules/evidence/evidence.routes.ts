import { Router } from "express";
import { evidenceController } from "./evidence.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const evidenceRoutes = Router();
evidenceRoutes.use(authGuard);

// Evidence CRUD
evidenceRoutes.get("/:orgId", evidenceController.listEvidence);
evidenceRoutes.post("/:orgId", evidenceController.createEvidence);
evidenceRoutes.put("/:id", evidenceController.updateEvidence);

// Submit & Review workflow
evidenceRoutes.post("/:id/submit", evidenceController.submitEvidence);
evidenceRoutes.post("/:id/review", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), evidenceController.reviewEvidence);

// Queries
evidenceRoutes.get("/:orgId/by-requirement/:reqId", evidenceController.evidenceByRequirement);
evidenceRoutes.get("/:orgId/readiness", evidenceController.readinessScore);
evidenceRoutes.get("/:orgId/expiring", evidenceController.expiringEvidence);
