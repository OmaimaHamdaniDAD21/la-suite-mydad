export type OpportunityType = "PUBLIC_FUNDING" | "TAX_CREDIT" | "SUBSIDY" | "TENDER" | "NEW_MARKET" | "PARTNERSHIP" | "GRANT" | "LOAN" | "CERTIFICATION_VALUE";
export type OpportunityStatus = "DETECTED" | "ELIGIBLE" | "IN_APPLICATION" | "SUBMITTED" | "AWARDED" | "REJECTED" | "EXPIRED";

export interface Opportunity {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: OpportunityType;
  status: OpportunityStatus;
  source: string | null;
  sourceUrl: string | null;
  detectedBy: string;
  eligibilityScore: number | null;
  eligibilityCriteria: EligibilityCriterion[] | null;
  estimatedValue: number | null;
  currency: string;
  requiredLevel: number | null;
  applicationDeadline: string | null;
  aiAnalysis: string | null;
  aiMatchScore: number | null;
  createdAt: string;
}

export interface EligibilityCriterion {
  criterion: string;
  met: boolean;
  details: string;
}

export interface ValueTracker {
  id: string;
  organizationId: string;
  category: string;
  description: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  opportunityId: string | null;
  verified: boolean;
}

export interface ValueSummary {
  totalValue: number;
  byCategory: Record<string, number>;
  byPeriod: { period: string; amount: number }[];
  roi: number | null;
}
