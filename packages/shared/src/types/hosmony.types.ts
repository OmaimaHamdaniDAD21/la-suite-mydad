export interface HosmonyLevel {
  id: string;
  level: number;
  name: string;
  description: string | null;
  minScore: number;
  color: string;
  iconName: string | null;
  criteria: Record<string, unknown>;
}

export interface HosmonyJourney {
  id: string;
  organizationId: string;
  currentLevel: HosmonyLevel;
  targetLevel: number;
  overallScore: number;
  dimensionScores: DimensionScores;
  progressPercent: number;
  status: JourneyStatus;
  startedAt: string;
  lastAssessedAt: string;
  levelAchievedAt: string | null;
}

export interface DimensionScores {
  financial: number;
  esg_env: number;
  esg_social: number;
  esg_gov: number;
  operational: number;
  hr: number;
}

export type JourneyStatus = "not_started" | "in_progress" | "level_achieved" | "certified";

export type RequirementType = "KPI" | "ACTION" | "DOCUMENT" | "AUDIT" | "PROCESS";

export type RequirementStatus = "NOT_STARTED" | "IN_PROGRESS" | "MET" | "NOT_MET" | "WAIVED";

export interface HosmonyRequirement {
  id: string;
  levelId: string;
  level: number;
  code: string;
  name: string;
  description: string | null;
  type: RequirementType;
  category: string;
  isMandatory: boolean;
  weight: number;
  validationRule: Record<string, unknown> | null;
}

export interface OrgRequirement {
  id: string;
  organizationId: string;
  requirement: HosmonyRequirement;
  status: RequirementStatus;
  currentValue: number | null;
  targetValue: number | null;
  validatedAt: string | null;
  validatedBy: string | null;
  waivedReason: string | null;
}

export interface JourneyProgression {
  id: string;
  fromLevel: number;
  toLevel: number;
  overallScore: number;
  reason: string | null;
  createdAt: string;
}
