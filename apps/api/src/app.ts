import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestLogger } from "./middleware/request-logger";
import { rateLimiter } from "./middleware/rate-limiter";

// Route imports — Core
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/users/users.routes";
import { organizationRoutes } from "./modules/organizations/organizations.routes";
import { invitationRoutes } from "./modules/invitations/invitations.routes";
import { configEngineRoutes } from "./modules/config-engine/config-engine.routes";

// Route imports — HOSMONY Engine
import { hosmonyRoutes } from "./modules/hosmony/hosmony.routes";
import { actionsRoutes } from "./modules/actions/actions.routes";
import { evidenceRoutes } from "./modules/evidence/evidence.routes";
import { auditRoutes } from "./modules/audit/audit.routes";

// Route imports — Strategy & Value
import { strategyRoutes } from "./modules/strategy/strategy.routes";
import { materialityRoutes } from "./modules/materiality/materiality.routes";
import { stakeholderRoutes } from "./modules/stakeholders/stakeholders.routes";
import { opportunitiesRoutes } from "./modules/opportunities/opportunities.routes";
import { assetsRoutes } from "./modules/assets/assets.routes";

// Route imports — Data & IA
import { dataPipelineRoutes } from "./modules/data-pipeline/data-pipeline.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { aiStudioRoutes } from "./modules/ai-studio/ai-studio.routes";

// Route imports — Dynamics
import { dynamicsRoutes } from "./modules/dynamics/dynamics.routes";

export const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);
app.use(rateLimiter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═══ Core Routes ═══
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/config", configEngineRoutes);

// ═══ HOSMONY Engine ═══
app.use("/api/hosmony", hosmonyRoutes);
app.use("/api/actions", actionsRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/audit", auditRoutes);

// ═══ Strategy & Value Creation ═══
app.use("/api/strategy", strategyRoutes);
app.use("/api/materiality", materialityRoutes);
app.use("/api/stakeholders", stakeholderRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/assets", assetsRoutes);

// ═══ Data & Intelligence ═══
app.use("/api/data", dataPipelineRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiStudioRoutes);

// ═══ Dynamics ═══
app.use("/api/dynamics", dynamicsRoutes);

// Error handler (must be last)
app.use(errorHandler);
