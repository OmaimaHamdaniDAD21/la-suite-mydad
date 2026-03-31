export interface Webhook {
  id: string;
  organizationId: string;
  direction: "inbound" | "outbound";
  inboundUrl: string | null;
  outboundUrl: string | null;
  outboundEvents: string[] | null;
  isActive: boolean;
  lastTriggeredAt: string | null;
}

export interface ConnectorDefinition {
  code: string;
  name: string;
  description: string;
  category: string;
  configSchema: Record<string, unknown>;
  fieldMappingSchema: Record<string, unknown>;
}

export interface CreateWebhookRequest {
  direction: "inbound" | "outbound";
  outboundUrl?: string;
  outboundEvents?: string[];
  outboundHeaders?: Record<string, string>;
}
