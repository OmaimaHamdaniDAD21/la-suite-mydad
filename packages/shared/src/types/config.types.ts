export type ModuleStatus = "ACTIVE" | "INACTIVE" | "BETA";

export interface ModuleDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  isCore: boolean;
  sortOrder: number;
}

export interface ModuleConfig {
  id: string;
  organizationId: string;
  moduleDefinitionId: string;
  moduleCode: string;
  moduleName: string;
  status: ModuleStatus;
  settings: Record<string, unknown>;
}

export interface FeatureFlag {
  id: string;
  organizationId: string;
  key: string;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
}

export interface WorkflowConfig {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  steps: WorkflowStep[];
  triggers: Record<string, unknown> | null;
  isActive: boolean;
}

export interface WorkflowStep {
  order: number;
  name: string;
  description: string;
  assigneeRole: string;
  dueOffset: number;
  dependencies: string[];
}

export interface RoleConfig {
  id: string;
  organizationId: string;
  role: string;
  permissions: string[];
  restrictions: Record<string, unknown> | null;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string | null;
  createdById: string;
  moduleConfigs: Record<string, unknown>[];
  featureFlags: Record<string, unknown>[];
  kpiConfigs: Record<string, unknown>[];
  workflowConfigs: Record<string, unknown>[];
  roleConfigs: Record<string, unknown>[];
  dashboardLayout: Record<string, unknown> | null;
  isPublic: boolean;
  version: number;
}

export interface OrgConfig {
  id: string;
  organizationId: string;
  templateId: string | null;
  globalSettings: Record<string, unknown>;
}

export interface DeployConfigRequest {
  templateId: string;
  organizationIds: string[];
}
