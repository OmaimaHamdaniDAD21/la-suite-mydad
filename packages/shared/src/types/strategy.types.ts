export interface Strategy {
  id: string;
  organizationId: string;
  vision: string | null;
  mission: string | null;
  values: StrategyValue[] | null;
  timeHorizon: number;
  status: "draft" | "active" | "under_review" | "archived";
  version: number;
  pillars: StrategyPillar[];
}

export interface StrategyValue {
  name: string;
  description: string;
}

export interface StrategyPillar {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  objectives: StrategyObjective[];
}

export interface StrategyObjective {
  id: string;
  pillarId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  linkedKpiCodes: string[] | null;
  targetValues: Record<string, { target: number; unit: string }> | null;
  status: ObjectiveStatus;
  progressPercent: number;
}

export type ObjectiveStatus = "not_started" | "on_track" | "at_risk" | "behind" | "achieved";
