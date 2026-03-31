import { Router } from "express";
import { aiStudioController } from "./ai-studio.controller";
import { authGuard } from "../../middleware/auth.guard";
import { requireRole } from "../../middleware/role.guard";

export const aiStudioRoutes = Router();
aiStudioRoutes.use(authGuard);

// Agents
aiStudioRoutes.get("/agents/:orgId", aiStudioController.listAgents);
aiStudioRoutes.post("/agents/:orgId", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.createAgent);
aiStudioRoutes.put("/agents/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.updateAgent);
aiStudioRoutes.delete("/agents/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.archiveAgent);

// Agent runs
aiStudioRoutes.post("/agents/:orgId/:id/run", aiStudioController.runAgent);
aiStudioRoutes.get("/agents/:orgId/:id/runs", aiStudioController.listAgentRuns);

// Prompts
aiStudioRoutes.get("/prompts/:orgId", aiStudioController.listPrompts);
aiStudioRoutes.post("/prompts/:orgId", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.createPrompt);
aiStudioRoutes.put("/prompts/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.updatePrompt);

// Knowledge bases
aiStudioRoutes.get("/knowledge/:orgId", aiStudioController.listKnowledgeBases);
aiStudioRoutes.post("/knowledge/:orgId", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.createKnowledgeBase);
aiStudioRoutes.post("/knowledge/:orgId/:id/documents", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.addDocument);
aiStudioRoutes.delete("/knowledge/:orgId/:id", requireRole("EXPERT_COMPTABLE", "CONSULTANT"), aiStudioController.deleteKnowledgeBase);
