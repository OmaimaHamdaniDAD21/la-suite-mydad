export type DataSourceType = "API" | "FILE_UPLOAD" | "WEBHOOK" | "DATABASE" | "MANUAL";
export type SyncStatus = "IDLE" | "RUNNING" | "SUCCESS" | "FAILED";
export type SyncFrequency = "REALTIME" | "HOURLY" | "DAILY" | "WEEKLY" | "MANUAL";

export interface DataSource {
  id: string;
  organizationId: string;
  name: string;
  type: DataSourceType;
  category: string;
  connectionConfig: Record<string, unknown>;
  fieldMapping: Record<string, unknown>;
  syncFrequency: SyncFrequency;
  lastSyncAt: string | null;
  lastSyncStatus: SyncStatus;
  isActive: boolean;
}

export interface SyncJob {
  id: string;
  dataSourceId: string;
  status: SyncStatus;
  recordsTotal: number | null;
  recordsSuccess: number | null;
  recordsFailed: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface NormalizedData {
  id: string;
  organizationId: string;
  category: string;
  metricKey: string;
  numericValue: number | null;
  textValue: string | null;
  periodStart: string;
  periodEnd: string;
  source: string;
  confidence: number | null;
}

export interface ManualDataEntry {
  metricKey: string;
  numericValue?: number;
  textValue?: string;
  periodStart: string;
  periodEnd: string;
  category: string;
}

export interface DataSourceRequest {
  name: string;
  type: DataSourceType;
  category: string;
  connectionConfig: Record<string, unknown>;
  fieldMapping: Record<string, unknown>;
  syncFrequency: SyncFrequency;
}
