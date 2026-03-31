export type StakeholderType = "CLIENT" | "SUPPLIER" | "EMPLOYEE" | "INVESTOR" | "REGULATOR" | "TERRITORY" | "PARTNER" | "COMMUNITY" | "MEDIA" | "NGO" | "OTHER";

export interface Stakeholder {
  id: string;
  organizationId: string;
  name: string;
  type: StakeholderType;
  description: string | null;
  contactInfo: Record<string, string> | null;
  influenceScore: number | null;
  impactScore: number | null;
  proximityScore: number | null;
  dependencyScore: number | null;
  overallScore: number | null;
  attitude: string | null;
  engagementLevel: string | null;
  isActive: boolean;
}

export interface CreateStakeholderRequest {
  name: string;
  type: StakeholderType;
  description?: string;
  contactInfo?: Record<string, string>;
}

export interface ScoreStakeholderRequest {
  influenceScore?: number;
  impactScore?: number;
  proximityScore?: number;
  dependencyScore?: number;
  attitude?: string;
  engagementLevel?: string;
}
