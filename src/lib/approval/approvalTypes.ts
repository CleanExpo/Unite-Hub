/**
 * Approval Types
 *
 * Type definitions for the Client-In-The-Loop Approval Engine.
 */

import type { ExplanationMode, StrategyChoices } from '@/lib/strategy/strategyGenerator';

export type ApprovalStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'needs_changes';

export type ApprovalSource =
  | 'seo_audit'
  | 'content_optimization'
  | 'schema_generation'
  | 'ctr_test'
  | 'competitor_analysis'
  | 'boost_bump'
  | 'ads_optimization'
  | 'email_campaign'
  | 'ai_phill'
  | 'orchestrator'
  | 'manual';

export interface ApprovalRequest {
  id: string;
  business_id: string;
  client_id: string | null;
  created_by: string | null;
  title: string;
  description: string;
  data: Record<string, unknown>;
  source: ApprovalSource | string;
  strategy_options?: StrategyChoices | null;
  status: ApprovalStatus;
  reviewer_notes?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  requested_changes_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalHistoryEvent {
  id: string;
  approval_id: string;
  event: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ApprovalCreateInput {
  business_id: string;
  client_id?: string | null;
  created_by?: string | null;
  title: string;
  description: string;
  data: Record<string, unknown>;
  source: ApprovalSource | string;
  strategy_options?: StrategyChoices | null;
  preferred_explanation_mode?: ExplanationMode;
}

export interface ApprovalUpdateInput {
  status: ApprovalStatus;
  reviewer_notes?: string;
}

export interface ApprovalListFilters {
  business_id?: string;
  client_id?: string;
  status?: ApprovalStatus | ApprovalStatus[];
  source?: ApprovalSource | string;
  limit?: number;
  offset?: number;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsChanges: number;
  bySource: Record<string, number>;
}
