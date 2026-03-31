import { Router } from "express";
import { assetsController } from "./assets.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const assetsRoutes = Router();

// Public marketplace routes (no auth required)
assetsRoutes.get("/marketplace", assetsController.marketplaceListing);
assetsRoutes.get("/marketplace/:id", assetsController.marketplaceDetail);

// Auth-protected routes
assetsRoutes.use(authGuard);

// Marketplace interaction
assetsRoutes.post("/marketplace/:id/interest", assetsController.expressInterest);

// Org asset management
assetsRoutes.get("/:orgId", assetsController.list);
assetsRoutes.post("/:orgId", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), assetsController.create);
assetsRoutes.put("/:orgId/:id", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), assetsController.update);
assetsRoutes.post("/:orgId/:id/submit", requireRole("CONSULTANT", "EXPERT_COMPTABLE", "DIRIGEANT"), assetsController.submit);

// Validation & publishing (consultants only)
assetsRoutes.post("/:id/validate", requireRole("CONSULTANT"), assetsController.validate);
assetsRoutes.post("/:id/publish", requireRole("CONSULTANT"), assetsController.publish);
