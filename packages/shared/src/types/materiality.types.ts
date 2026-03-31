export type MaterialityCategory =
  | "ENVIRONMENTAL_CLIMATE"
  | "ENVIRONMENTAL_POLLUTION"
  | "ENVIRONMENTAL_WATER"
  | "ENVIRONMENTAL_BIODIVERSITY"
  | "ENVIRONMENTAL_CIRCULAR"
  | "SOCIAL_WORKFORCE"
  | "SOCIAL_VALUE_CHAIN"
  | "SOCIAL_COMMUNITIES"
  | "SOCIAL_CONSUMERS"
  | "GOVERNANCE_CONDUCT"
  | "GOVERNANCE_ETHICS"
  | "GOVERNANCE_LOBBYING";

export interface MaterialityIssue {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  category: MaterialityCategory;
  impactScore: number | null;
  impactLikelihood: number | null;
  impactSeverity: number | null;
  impactScope: number | null;
  impactIrreversibility: number | null;
  financialScore: number | null;
  financialLikelihood: number | null;
  financialMagnitude: number | null;
  financialTimeHorizon: string | null;
  materialityScore: number | null;
  isMaterial: boolean;
  aiAssisted: boolean;
}

export interface MaterialityAssessment {
  id: string;
  organizationId: string;
  version: number;
  impactThreshold: number;
  financialThreshold: number;
  totalIssues: number | null;
  materialIssues: number | null;
  topIssues: MaterialityIssue[] | null;
  aiSummary: string | null;
  assessedAt: string;
}

export interface MaterialityMatrix {
  issues: MaterialityMatrixPoint[];
  thresholds: { impact: number; financial: number };
}

export interface MaterialityMatrixPoint {
  id: string;
  code: string;
  name: string;
  category: MaterialityCategory;
  impactScore: number;
  financialScore: number;
  isMaterial: boolean;
}

export interface ScoreMaterialityRequest {
  impactLikelihood?: number;
  impactSeverity?: number;
  impactScope?: number;
  impactIrreversibility?: number;
  financialLikelihood?: number;
  financialMagnitude?: number;
  financialTimeHorizon?: string;
}
