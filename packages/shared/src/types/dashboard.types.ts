export interface DashboardConfig {
  id: string;
  userId: string;
  organizationId: string;
  layout: DashboardLayout;
  widgetConfigs: Record<string, WidgetConfig> | null;
  filters: Record<string, unknown> | null;
}

export interface DashboardLayout {
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

export interface WidgetConfig {
  kpiCodes?: string[];
  chartType?: "line" | "bar" | "area" | "pie" | "radar";
  timeRange?: string;
  customTitle?: string;
}

export interface DashboardOverview {
  hosmonyScore: number | null;
  hosmonyLevel: number | null;
  metrics: MetricSummary[];
  alerts: DashboardAlert[];
}

export interface MetricSummary {
  kpiCode: string;
  kpiName: string;
  value: number;
  previousValue: number | null;
  trend: number | null;
  unit: string;
  category: string;
}

export interface DashboardAlert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  message: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}
