/**
 * Shared types for AGI Governance System
 */

export interface AgentDecision {
  id: string;
  createdAt: string;
  agentId: string;
  agentType: 'email' | 'content' | 'research' | 'scheduling' | 'analysis' | 'coordination';
  actionType: string;
  modelId: string;
  requiredCapability: string;
  estimatedCost: number;
  frequency: number;
  scope: 'limited' | 'moderate' | 'broad';
  escalationLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

export interface GovernorOverride {
  id: string;
  timestamp: string;
  founderUserId: string;
  reason: string;
  originalDecision: AgentDecision;
  overriddenDecision: AgentDecision;
  riskAcknowledged: boolean;
}

export interface ModelCapability {
  id: string;
  model: string;
  capability: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  costPerToken: number;
  latencyMs: number;
  availabilityScore: number; // 0-1
  lastTestedAt: string;
  supportsBatching: boolean;
  supportsCaching: boolean;
  supportsStreaming: boolean;
}

export interface ModelRoutingDecision {
  id: string;
  timestamp: string;
  requestId: string;
  selectedModel: string;
  alternatives: string[];
  routingReason: string;
  estimatedLatency: number;
  estimatedCost: number;
  confidenceScore: number;
}

export interface ModelReward {
  id: string;
  timestamp: string;
  modelId: string;
  taskType: string;
  qualityScore: number; // 0-100
  costScore: number; // 0-100 (100 = cheapest)
  latencyScore: number; // 0-100 (100 = fastest)
  overallScore: number; // weighted average
  metadata?: Record<string, any>;
}

export interface RiskBoundary {
  id: string;
  name: string;
  description: string;
  dimension: 'cost' | 'latency' | 'accuracy' | 'scope' | 'frequency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  threshold: number;
  unit: string;
  founderApprovalRequired: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, any>;
  expectedOutcome: Record<string, any>;
  confidence: number;
  probability: number;
  timestamp: string;
}

export interface SimulationResult {
  scenarioId: string;
  timestamp: string;
  agentBehavior: Record<string, any>;
  modelSelection: Record<string, number>; // model -> selection count
  resourceUtilization: {
    totalCost: number;
    totalLatency: number;
    successRate: number;
  };
  riskAssessment: {
    criticalRisks: string[];
    warningsDetected: string[];
    overallRiskScore: number;
  };
}
