export type AuditType = "PRE_AUDIT" | "INTERNAL_AUDIT" | "EXTERNAL_AUDIT" | "CERTIFICATION";
export type AuditStatus = "PLANNED" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CERTIFIED" | "FAILED";

export interface HosmonyAudit {
  id: string;
  journeyId: string;
  organizationId: string;
  type: AuditType;
  status: AuditStatus;
  targetLevel: number;
  auditorId: string | null;
  auditorName: string | null;
  auditorOrg: string | null;
  plannedDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  overallScore: number | null;
  findings: AuditFinding[] | null;
  recommendations: string[] | null;
  certificationStatus: string | null;
  certificationDate: string | null;
  certificationExpiry: string | null;
  results: AuditResult[];
}

export interface AuditFinding {
  type: "conformity" | "observation" | "non_conformity";
  description: string;
  severity: "minor" | "major" | "critical";
  requirementId: string | null;
}

export interface AuditResult {
  id: string;
  requirementId: string;
  status: "conforming" | "observation" | "minor_nc" | "major_nc";
  score: number | null;
  comment: string | null;
  evidenceIds: string[] | null;
}

export interface CreateAuditRequest {
  type: AuditType;
  targetLevel: number;
  auditorId?: string;
  auditorName?: string;
  auditorOrg?: string;
  plannedDate?: string;
}

export interface SubmitAuditResultRequest {
  requirementId: string;
  status: "conforming" | "observation" | "minor_nc" | "major_nc";
  score?: number;
  comment?: string;
  evidenceIds?: string[];
}
