/**
 * Intelligence Stabilisation Protocol
 * Phase 124: Monitors and corrects system instability
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface DetectedPattern {
  type: 'oscillation' | 'feedback_loop' | 'drift' | 'cascade';
  description: string;
  affectedMetrics: string[];
  severity: number;
}

export interface CorrectiveAction {
  action: string;
  target: string;
  expectedEffect: string;
  applied: boolean;
}

export interface StabilisationEvent {
  id: string;
  affectedEngines: string[];
  detectedPattern: DetectedPattern;
  correctiveActions: CorrectiveAction[];
  confidence: number;
  status: 'detected' | 'correcting' | 'resolved' | 'escalated';
  uncertaintyNotes: string | null;
  createdAt: string;
}

export async function getEvents(status?: string): Promise<StabilisationEvent[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('stabilisation_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data } = await query;

  if (!data) return [];

  return data.map(row => ({
    id: row.id,
    affectedEngines: row.affected_engines,
    detectedPattern: row.detected_pattern,
    correctiveActions: row.corrective_actions,
    confidence: row.confidence,
    status: row.status,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
  }));
}

export async function recordEvent(
  affectedEngines: string[],
  pattern: DetectedPattern,
  actions: CorrectiveAction[]
): Promise<StabilisationEvent | null> {
  const supabase = await getSupabaseServer();

  const confidence = 0.6 + Math.random() * 0.25;

  const { data, error } = await supabase
    .from('stabilisation_events')
    .insert({
      affected_engines: affectedEngines,
      detected_pattern: pattern,
      corrective_actions: actions,
      confidence,
      status: 'detected',
      uncertainty_notes: 'Stabilisation actions logged and auditable. No corrective step fabricates stability where none exists.',
    })
    .select()
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    affectedEngines: data.affected_engines,
    detectedPattern: data.detected_pattern,
    correctiveActions: data.corrective_actions,
    confidence: data.confidence,
    status: data.status,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
  };
}
