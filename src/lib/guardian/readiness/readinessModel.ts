export type GuardianCapabilityStatus =
  | "not_configured"
  | "partial"
  | "ready"
  | "advanced"
  | "mature";

export interface GuardianCapabilitySnapshot {
  capabilityKey: string;
  score: number;
  status: GuardianCapabilityStatus;
  details?: Record<string, unknown> | null;
}

export interface GuardianReadinessSnapshot {
  id?: string;
  tenantId: string;
  computedAt: Date;
  overallScore: number;
  overallStatus: "baseline" | "operational" | "mature" | "network_intelligent";
  capabilities: GuardianCapabilitySnapshot[];
  metadata?: Record<string, unknown> | null;
}

