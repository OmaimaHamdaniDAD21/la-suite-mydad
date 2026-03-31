export type AssetStatus = "DRAFT" | "SUBMITTED" | "VALIDATED" | "PUBLISHED" | "SUSPENDED" | "ARCHIVED";

export interface HosmonicAsset {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string;
  impactMetrics: ImpactMetric[];
  hosmonyAlignment: Record<string, unknown> | null;
  requiredLevel: number;
  status: AssetStatus;
  isPublished: boolean;
  visibility: "private" | "network" | "public";
  tags: string[] | null;
  viewCount: number;
  interestCount: number;
  createdAt: string;
}

export interface ImpactMetric {
  metric: string;
  value: number;
  unit: string;
  description: string;
}

export interface CreateAssetRequest {
  name: string;
  description?: string;
  category: string;
  impactMetrics: ImpactMetric[];
  hosmonyAlignment?: Record<string, unknown>;
  tags?: string[];
}
