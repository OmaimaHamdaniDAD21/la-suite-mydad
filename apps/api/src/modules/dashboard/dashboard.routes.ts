import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authGuard } from "../../middleware/auth.guard";

export const dashboardRoutes = Router();
dashboardRoutes.use(authGuard);

// Dashboard overview
dashboardRoutes.get("/overview/:orgId", dashboardController.getOverview);

// Dashboard layout config (per user per org)
dashboardRoutes.get("/config/:orgId", dashboardController.getConfig);
dashboardRoutes.put("/config/:orgId", dashboardController.saveConfig);

// KPIs with latest computed values
dashboardRoutes.get("/kpis/:orgId", dashboardController.listKpisWithValues);
