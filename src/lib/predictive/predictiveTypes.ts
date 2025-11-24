/**
 * Predictive Opportunity Engine Types
 * Phase 95: Truth-layer compliant forecasting
 */

export type WindowType = '7_day' | '14_day' | '30_day';

export type OpportunityCategory =
  | 'creative'
  | 'posting'
  | 'campaign'
  | 'brand'
  | 'engagement'
  | 'audience'
  | 'timing';

export type OpportunityStatus = 'active' | 'expired' | 'dismissed' | 'acted_upon';

export interface OpportunityWindow {
  id: string;
  tenantId: string | null;
  regionId: string | null;
  clientId: string | null;
  windowType: WindowType;
  opportunityCategory: OpportunityCategory;
  title: string;
  description: string;
  confidence: number;
  supportingNodes: string[];
  uncertaintyNotes: string;
  expiresAt: string | null;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunitySignal {
  id: string;
  opportunityId: string;
  signalType: string;
  signalValue: number;
  signalLabel: string | null;
  sourceNodeId: string | null;
  weight: number;
  createdAt: string;
}

export interface CollectedSignal {
  type: string;
  value: number;
  label?: string;
  sourceNodeId?: string;
  weight?: number;
}

export interface SignalCollection {
  signals: CollectedSignal[];
  dataCompleteness: number;
  sourceEngines: string[];
}

export interface OpportunityScore {
  category: OpportunityCategory;
  rawScore: number;
  confidence: number;
  signals: CollectedSignal[];
}

export interface OpportunityContext {
  tenantId?: string;
  regionId?: string;
  clientId?: string;
  windowType: WindowType;
}

export interface GeneratedWindow {
  windowType: WindowType;
  opportunityCategory: OpportunityCategory;
  title: string;
  description: string;
  confidence: number;
  supportingNodes: string[];
  uncertaintyNotes: string;
  signals: CollectedSignal[];
}

export interface OpportunitySummary {
  windowType: WindowType;
  category: OpportunityCategory;
  totalCount: number;
  avgConfidence: number;
  highConfidenceCount: number;
}

export interface FounderOpportunityReport {
  generatedAt: string;
  totalOpportunities: number;
  byWindow: {
    '7_day': number;
    '14_day': number;
    '30_day': number;
  };
  byCategory: Record<OpportunityCategory, number>;
  topOpportunities: OpportunityWindow[];
  momentumInsights: string[];
  uncertaintyDisclaimer: string;
}
