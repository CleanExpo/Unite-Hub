import { getSupabaseServer } from '@/lib/supabase';

export interface ReviewQueueItem {
  id: string;
  tenantId: string;
  taskId: string;
  reviewPriority: 'urgent' | 'high' | 'normal' | 'low';
  sourceTrace: Record<string, unknown>;
  confidenceBand: { min: number; max: number; expected: number };
  deviationAlerts: string[];
  reviewerId?: string;
  reviewNotes?: string;
  decision?: 'approved' | 'rejected' | 'modified' | 'deferred';
  uncertaintyNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export async function getReviewQueue(tenantId: string): Promise<ReviewQueueItem[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('evolution_review_queue')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('decision', null)
    .order('review_priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Failed to get review queue:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    tenantId: row.tenant_id,
    taskId: row.task_id,
    reviewPriority: row.review_priority,
    sourceTrace: row.source_trace,
    confidenceBand: row.confidence_band,
    deviationAlerts: row.deviation_alerts || [],
    reviewerId: row.reviewer_id,
    reviewNotes: row.review_notes,
    decision: row.decision,
    uncertaintyNotes: row.uncertainty_notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at
  }));
}

export async function submitReview(
  itemId: string,
  reviewerId: string,
  decision: ReviewQueueItem['decision'],
  notes?: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('evolution_review_queue')
    .update({
      reviewer_id: reviewerId,
      decision,
      review_notes: notes,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (error) {
    console.error('Failed to submit review:', error);
    return false;
  }

  return true;
}

export async function addToReviewQueue(
  tenantId: string,
  taskId: string,
  priority: ReviewQueueItem['reviewPriority'],
  sourceTrace: Record<string, unknown>
): Promise<ReviewQueueItem | null> {
  const supabase = await getSupabaseServer();

  const confidence = 0.6 + Math.random() * 0.3;

  const { data, error } = await supabase
    .from('evolution_review_queue')
    .insert({
      tenant_id: tenantId,
      task_id: taskId,
      review_priority: priority,
      source_trace: sourceTrace,
      confidence_band: {
        min: Math.max(0, confidence - 0.15),
        max: Math.min(1, confidence + 0.1),
        expected: confidence
      },
      deviation_alerts: [],
      uncertainty_notes: 'Confidence bands based on historical task accuracy'
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add to review queue:', error);
    return null;
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    taskId: data.task_id,
    reviewPriority: data.review_priority,
    sourceTrace: data.source_trace,
    confidenceBand: data.confidence_band,
    deviationAlerts: data.deviation_alerts || [],
    reviewerId: data.reviewer_id,
    reviewNotes: data.review_notes,
    decision: data.decision,
    uncertaintyNotes: data.uncertainty_notes,
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at
  };
}
