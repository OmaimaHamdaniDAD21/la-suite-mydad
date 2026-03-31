export type AgentStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type AgentRunStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface Agent {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  status: AgentStatus;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  dataScopeConfig: Record<string, unknown> | null;
  knowledgeBaseIds: string[] | null;
  toolsConfig: Record<string, unknown> | null;
  isTemplate: boolean;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  userId: string;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  output: string | null;
  tokensUsed: number | null;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Prompt {
  id: string;
  agentId: string | null;
  name: string;
  content: string;
  category: string;
  variables: PromptVariable[] | null;
  isGlobal: boolean;
  version: number;
}

export interface PromptVariable {
  name: string;
  type: string;
  description: string;
}

export interface KnowledgeBase {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: string;
  documentCount?: number;
}

export interface KnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  fileUrl: string | null;
  mimeType: string | null;
  chunkCount: number;
  isEmbedded: boolean;
  createdAt: string;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  type: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  dataScopeConfig?: Record<string, unknown>;
  knowledgeBaseIds?: string[];
}

export interface RunAgentRequest {
  message: string;
  context?: Record<string, unknown>;
}
