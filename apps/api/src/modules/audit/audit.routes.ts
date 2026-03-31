import { Router } from "express";
import { auditController } from "./audit.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const auditRoutes = Router();
auditRoutes.use(authGuard);

// List & plan
auditRoutes.get("/:orgId", auditController.listAudits);
auditRoutes.post("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.planAudit);

// Audit lifecycle
auditRoutes.put("/:auditId", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.updateAudit);
auditRoutes.post("/:auditId/start", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.startAudit);
auditRoutes.post("/:auditId/results", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.recordResults);
auditRoutes.post("/:auditId/complete", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.completeAudit);
auditRoutes.post("/:auditId/certify", requireRole("CONSULTANT"), auditController.certify);

// Pre-audit (AI)
auditRoutes.post("/:orgId/pre-audit", requireRole("CONSULTANT", "EXPERT_COMPTABLE"), auditController.preAudit);
