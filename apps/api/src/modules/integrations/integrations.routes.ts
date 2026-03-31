import { Router } from "express";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";
import * as ctrl from "./integrations.controller";

export const integrationsRoutes = Router();

integrationsRoutes.use(authGuard);

// Webhooks
integrationsRoutes.get("/:orgId/webhooks", ctrl.listWebhooks);
integrationsRoutes.post("/:orgId/webhooks", requireRole(["CONSULTANT"]), ctrl.createWebhook);
integrationsRoutes.put("/webhooks/:id", requireRole(["CONSULTANT"]), ctrl.updateWebhook);
integrationsRoutes.delete("/webhooks/:id", requireRole(["CONSULTANT"]), ctrl.deleteWebhook);

// Public webhook receiver (no auth)
// This would be mounted separately: app.post("/api/webhooks/:inboundUrl", receiveWebhook)
