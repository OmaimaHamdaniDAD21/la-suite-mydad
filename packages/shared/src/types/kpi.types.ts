export type DataCategory =
  | "FINANCIAL"
  | "ESG_ENVIRONMENTAL"
  | "ESG_SOCIAL"
  | "ESG_GOVERNANCE"
  | "HR"
  | "OPERATIONAL"
  | "MARKET";

export type KpiPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface KpiConfig {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  category: DataCategory;
  unit: string;
  formula: string | null;
  dataSourceRef: string | null;
  targetMin: number | null;
  targetMax: number | null;
  isActive: boolean;
  sortOrder: number;
  displayConfig: Record<string, unknown> | null;
}

export interface ComputedMetric {
  id: string;
  organizationId: string;
  kpiConfigId: string;
  kpiCode: string;
  kpiName: string;
  value: number;
  previousValue: number | null;
  trend: number | null;
  unit: string;
  periodStart: string;
  periodEnd: string;
  computedAt: string;
}

export interface KpiConfigRequest {
  code: string;
  name: string;
  description?: string;
  category: DataCategory;
  unit: string;
  formula?: string;
  dataSourceRef?: string;
  targetMin?: number;
  targetMax?: number;
  displayConfig?: Record<string, unknown>;
}
