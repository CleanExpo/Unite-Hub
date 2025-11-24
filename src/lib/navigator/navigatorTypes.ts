/**
 * AI Navigator Types
 * Phase 96: Founder Executive Copilot
 */

export type InsightCategory =
  | 'opportunity'
  | 'warning'
  | 'performance'
  | 'compliance'
  | 'creative'
  | 'scaling'
  | 'market'
  | 'strategic';

export type ConfidenceBand = 'high' | 'medium' | 'low' | 'exploratory';

export interface NavigatorSnapshot {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  summary: NavigatorSummary;
  confidence: number;
  priorityMap: PriorityMap;
  actionSuggestions: ActionSuggestion[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NavigatorSummary {
  overallHealth: 'excellent' | 'good' | 'attention' | 'critical';
  keyMetrics: {
    opportunities: number;
    warnings: number;
    performance: number;
    compliance: number;
  };
  topPriority: string;
  quickWins: string[];
  watchItems: string[];
}

export interface PriorityMap {
  immediate: string[];
  shortTerm: string[];
  mediumTerm: string[];
  monitoring: string[];
}

export interface ActionSuggestion {
  action: string;
  rationale: string;
  priority: number;
  confidence: number;
  category: InsightCategory;
}

export interface NavigatorInsight {
  id: string;
  snapshotId: string;
  category: InsightCategory;
  title: string;
  detail: InsightDetail;
  confidenceBand: ConfidenceBand;
  uncertaintyNotes: string | null;
  priority: number;
  sourceSignals: string[];
  createdAt: string;
}

export interface InsightDetail {
  description: string;
  dataPoints: Array<{
    metric: string;
    value: number | string;
    trend?: 'up' | 'down' | 'stable';
  }>;
  suggestedActions?: string[];
  relatedInsights?: string[];
}

export interface CollectedInput {
  source: string;
  data: Record<string, unknown>;
  confidence: number;
  timestamp: string;
}

export interface NavigatorContext {
  tenantId?: string;
  regionId?: string;
  includeMarket?: boolean;
  includeCreative?: boolean;
}
