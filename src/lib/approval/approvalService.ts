/**
 * Approval Service
 *
 * Manages client approval requests and history tracking.
 * Part of the Client-In-The-Loop governance system.
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  ApprovalRequest,
  ApprovalHistoryEvent,
  ApprovalCreateInput,
  ApprovalUpdateInput,
  ApprovalListFilters,
  ApprovalStatus,
  ApprovalStats,
} from './approvalTypes';

class ApprovalService {
  /**
   * Create a new approval request
   */
  async create(input: ApprovalCreateInput): Promise<ApprovalRequest> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_approval_requests')
      .insert({
        business_id: input.business_id,
        client_id: input.client_id || null,
        created_by: input.created_by || null,
        title: input.title,
        description: input.description,
        data: input.data,
        source: input.source,
        strategy_options: input.strategy_options || null,
        status: 'pending_review',
      })
      .select('*')
      .single();

    if (error) {
      console.error('[ApprovalService] Create error:', error);
      throw error;
    }

    // Log creation event
    await this.logEvent(data.id, 'created', {
      source: input.source,
      preferred_mode: input.preferred_explanation_mode,
    });

    return data as ApprovalRequest;
  }

  /**
   * Update approval status
   */
  async updateStatus(
    id: string,
    update: ApprovalUpdateInput
  ): Promise<ApprovalRequest> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = {
      status: update.status,
      reviewer_notes: update.reviewer_notes ?? null,
      updated_at: new Date().toISOString(),
    };

    // Set timestamp based on status
    if (update.status === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (update.status === 'rejected') {
      updateData.rejected_at = new Date().toISOString();
    } else if (update.status === 'needs_changes') {
      updateData.requested_changes_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('client_approval_requests')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[ApprovalService] Update error:', error);
      throw error;
    }

    // Log status change
    await this.logEvent(id, `status_changed_to_${update.status}`, {
      reviewer_notes: update.reviewer_notes,
    });

    return data as ApprovalRequest;
  }

  /**
   * Get a single approval by ID
   */
  async getById(id: string): Promise<ApprovalRequest | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_approval_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
return null;
} // Not found
      throw error;
    }

    return data as ApprovalRequest;
  }

  /**
   * List approvals with filters
   */
  async list(filters: ApprovalListFilters = {}): Promise<ApprovalRequest[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('client_approval_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.business_id) {
      query = query.eq('business_id', filters.business_id);
    }

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ApprovalService] List error:', error);
      throw error;
    }

    return (data || []) as ApprovalRequest[];
  }

  /**
   * List pending approvals for a business
   */
  async listPending(business_id: string): Promise<ApprovalRequest[]> {
    return this.list({
      business_id,
      status: 'pending_review',
    });
  }

  /**
   * Get approval history for a request
   */
  async getHistory(approval_id: string): Promise<ApprovalHistoryEvent[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_approval_history')
      .select('*')
      .eq('approval_id', approval_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ApprovalService] History error:', error);
      throw error;
    }

    return (data || []) as ApprovalHistoryEvent[];
  }

  /**
   * Log an event to approval history
   */
  async logEvent(
    approval_id: string,
    event: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from('client_approval_history').insert({
      approval_id,
      event,
      metadata: metadata || null,
    });

    if (error) {
      console.error('[ApprovalService] Log event error:', error);
      // Don't throw - logging is non-critical
    }
  }

  /**
   * Get approval statistics for a business
   */
  async getStats(business_id: string): Promise<ApprovalStats> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_approval_requests')
      .select('status, source')
      .eq('business_id', business_id);

    if (error) {
      console.error('[ApprovalService] Stats error:', error);
      throw error;
    }

    const stats: ApprovalStats = {
      total: data?.length || 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      needsChanges: 0,
      bySource: {},
    };

    for (const row of data || []) {
      // Count by status
      switch (row.status) {
        case 'pending_review':
          stats.pending++;
          break;
        case 'approved':
          stats.approved++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
        case 'needs_changes':
          stats.needsChanges++;
          break;
      }

      // Count by source
      stats.bySource[row.source] = (stats.bySource[row.source] || 0) + 1;
    }

    return stats;
  }

  /**
   * Approve a request
   */
  async approve(id: string, notes?: string): Promise<ApprovalRequest> {
    return this.updateStatus(id, { status: 'approved', reviewer_notes: notes });
  }

  /**
   * Reject a request
   */
  async reject(id: string, notes?: string): Promise<ApprovalRequest> {
    return this.updateStatus(id, { status: 'rejected', reviewer_notes: notes });
  }

  /**
   * Request changes on a request
   */
  async requestChanges(id: string, notes: string): Promise<ApprovalRequest> {
    return this.updateStatus(id, { status: 'needs_changes', reviewer_notes: notes });
  }
}

// Singleton instance
let _instance: ApprovalService | null = null;

export function getApprovalService(): ApprovalService {
  if (!_instance) {
    _instance = new ApprovalService();
  }
  return _instance;
}

export const approvalService = new Proxy({} as ApprovalService, {
  get(_target, prop) {
    const instance = getApprovalService();
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { ApprovalService };
export default approvalService;
