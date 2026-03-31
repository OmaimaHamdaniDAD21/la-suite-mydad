export type InitiativeType = "CHALLENGE" | "IDEA_BOX" | "EVENT" | "SURVEY" | "TRAINING" | "COMMITTEE";
export type InitiativeStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Initiative {
  id: string;
  organizationId: string;
  type: InitiativeType;
  status: InitiativeStatus;
  title: string;
  description: string | null;
  objectives: InitiativeObjective[] | null;
  startDate: string | null;
  endDate: string | null;
  participantCount: number;
  completionRate: number | null;
  createdAt: string;
}

export interface InitiativeObjective {
  description: string;
  metric: string;
  target: number;
}

export interface Participation {
  id: string;
  initiativeId: string;
  userId: string;
  status: string;
  contribution: Record<string, unknown> | null;
  score: number | null;
  completedAt: string | null;
}

export interface CreateInitiativeRequest {
  type: InitiativeType;
  title: string;
  description?: string;
  objectives?: InitiativeObjective[];
  startDate?: string;
  endDate?: string;
  targetRoles?: string[];
}
