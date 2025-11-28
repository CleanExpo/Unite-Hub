/**
 * AI Consultation Types
 *
 * Type definitions for the AI Consultation Engine with explanation modes.
 */

import type { ExplanationMode } from '@/lib/strategy/strategyGenerator';

export type ConsultationStatus = 'active' | 'closed';

export type MessageRole = 'client' | 'assistant' | 'system';

export interface AIConsultation {
  id: string;
  business_id: string;
  client_id: string | null;
  created_by: string | null;
  context: Record<string, unknown> | null;
  explanation_mode: ExplanationMode;
  title: string | null;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
}

export interface AIConsultationMessage {
  id: string;
  consultation_id: string;
  role: MessageRole;
  content: string;
  explanation_mode: ExplanationMode;
  created_at: string;
}

export interface AIConsultationInsight {
  id: string;
  consultation_id: string;
  insight_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ConsultationCreateInput {
  business_id: string;
  client_id?: string | null;
  created_by?: string | null;
  context?: Record<string, unknown> | null;
  explanation_mode?: ExplanationMode;
  title?: string | null;
}

export interface ConsultationMessageInput {
  consultation_id: string;
  role: MessageRole;
  content: string;
  explanation_mode: ExplanationMode;
}

export interface ConsultationListFilters {
  business_id?: string;
  client_id?: string;
  created_by?: string;
  status?: ConsultationStatus;
  limit?: number;
  offset?: number;
}

// Re-export ExplanationMode for convenience
export type { ExplanationMode };
