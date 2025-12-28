/**
 * Escalation Manager
 * Handles escalation creation, routing, approvals, and auto-resolution
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface EscalationData {
  workspace_id: string;
  agent_name: string;
  execution_id?: string;
  escalation_type: 'rule_violation' | 'health_degraded' | 'cost_exceeded' | 'anomaly_detected' | 'low_confidence' | 'manual';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description?: string;
  context?: Record<string, any>;
  requires_approval?: boolean;
}

export interface Escalation {
  id: string;
  workspace_id: string;
  agent_name: string;
  execution_id?: string;
  escalation_type: string;
  severity: string;
  title: string;
  description?: string;
  context?: Record<string, any>;
  requires_approval: boolean;
  approval_status: string;
  approved_by?: string;
  approval_reason?: string;
  approved_at?: string;
  action_taken?: string;
  auto_resolved: boolean;
  resolution_details?: Record<string, any>;
  escalated_to?: string;
  escalation_chain?: string[];
  current_approver_index: number;
  escalated_at: string;
  resolved_at?: string;
}

export class EscalationManager {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for EscalationManager');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Create a new escalation
   */
  async createEscalation(data: EscalationData): Promise<Escalation> {
    try {
      // Get escalation config for workspace
      const config = await this.getEscalationConfig(data.workspace_id);

      // Determine if approval required
      const requiresApproval = data.requires_approval !== undefined
        ? data.requires_approval
        : this.shouldRequireApproval(data.severity, data.escalation_type, config);

      // Get approver from escalation chain
      const approver = requiresApproval
        ? await this.getApproverForSeverity(data.workspace_id, data.severity)
        : null;

      // Get full escalation chain
      const chain = config?.escalation_chains?.[data.severity] || [];

      const { data: escalation, error } = await this.supabase
        .from('agent_escalations')
        .insert({
          workspace_id: data.workspace_id,
          agent_name: data.agent_name,
          execution_id: data.execution_id,
          escalation_type: data.escalation_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          context: data.context,
          requires_approval: requiresApproval,
          escalated_to: approver,
          escalation_chain: chain,
          current_approver_index: 0,
          escalated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
throw error;
}

      // Send notification if configured
      if (config?.notify_immediately && approver) {
        await this.notifyApprover(escalation, approver);
      }

      return escalation as Escalation;
    } catch (err) {
      console.error('Failed to create escalation:', err);
      throw err;
    }
  }

  /**
   * Determine if escalation requires approval
   */
  private shouldRequireApproval(
    severity: string,
    type: string,
    config: any
  ): boolean {
    // Critical always requires approval
    if (severity === 'critical') {
return true;
}

    // Cost exceeded always requires approval
    if (type === 'cost_exceeded') {
return true;
}

    // Health degraded requires approval
    if (type === 'health_degraded') {
return true;
}

    // Low severity can auto-approve based on config
    if (severity === 'info' && config?.auto_approve_low_severity) {
      return false;
    }

    // Default: require approval
    return true;
  }

  /**
   * Get escalation config for workspace
   */
  private async getEscalationConfig(workspaceId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('escalation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Failed to get escalation config:', err);
      return null;
    }
  }

  /**
   * Get approver from escalation chain for severity level
   */
  private async getApproverForSeverity(
    workspaceId: string,
    severity: string
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_approver_for_severity', {
          p_workspace_id: workspaceId,
          p_severity: severity
        });

      if (error) {
        console.error('Failed to get approver:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error getting approver:', err);
      return null;
    }
  }

  /**
   * Send notification to approver
   */
  private async notifyApprover(escalation: any, approverId: string): Promise<void> {
    try {
      // TODO: Implement actual notification (email, Slack, etc.)
      console.log(`📧 Notification sent to ${approverId} for escalation ${escalation.id}`);
      // For now, just log. Can be enhanced with SendGrid, Slack webhooks, etc.
    } catch (err) {
      console.error('Failed to notify approver:', err);
    }
  }

  /**
   * Approve an escalation
   */
  async approveEscalation(
    escalationId: string,
    userId: string,
    reason: string
  ): Promise<Escalation> {
    try {
      const { data, error } = await this.supabase
        .from('agent_escalations')
        .update({
          approval_status: 'approved',
          approved_by: userId,
          approval_reason: reason,
          approved_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          action_taken: 'allowed'
        })
        .eq('id', escalationId)
        .select()
        .single();

      if (error) {
throw error;
}

      return data as Escalation;
    } catch (err) {
      console.error('Failed to approve escalation:', err);
      throw err;
    }
  }

  /**
   * Reject an escalation
   */
  async rejectEscalation(
    escalationId: string,
    userId: string,
    reason: string
  ): Promise<Escalation> {
    try {
      const { data, error } = await this.supabase
        .from('agent_escalations')
        .update({
          approval_status: 'rejected',
          approved_by: userId,
          approval_reason: reason,
          approved_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          action_taken: 'blocked'
        })
        .eq('id', escalationId)
        .select()
        .single();

      if (error) {
throw error;
}

      return data as Escalation;
    } catch (err) {
      console.error('Failed to reject escalation:', err);
      throw err;
    }
  }

  /**
   * Auto-resolve stale escalations
   * Call periodically to clean up old escalations
   */
  async autoResolveStaleEscalations(hoursThreshold: number = 24): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('auto_resolve_stale_escalations', {
          p_hours_threshold: hoursThreshold
        });

      if (error) {
throw error;
}

      return data || 0;
    } catch (err) {
      console.error('Failed to auto-resolve escalations:', err);
      return 0;
    }
  }

  /**
   * Escalate up the chain (timeout on current approver)
   */
  async escalateUpChain(escalationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('escalate_up_chain', {
          p_escalation_id: escalationId
        });

      if (error) {
throw error;
}

      return data || false;
    } catch (err) {
      console.error('Failed to escalate up chain:', err);
      return false;
    }
  }

  /**
   * Get pending escalations for a workspace
   */
  async getPendingEscalations(
    workspaceId: string,
    severity?: string
  ): Promise<Escalation[]> {
    try {
      let query = this.supabase
        .from('agent_escalations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('approval_status', 'pending')
        .order('escalated_at', { ascending: true });

      if (severity) {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;

      if (error) {
throw error;
}

      return (data || []) as Escalation[];
    } catch (err) {
      console.error('Failed to get pending escalations:', err);
      throw err;
    }
  }

  /**
   * Get escalation queue for a user
   */
  async getEscalationQueueForUser(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_escalation_queue_for_user', {
          p_user_id: userId
        });

      if (error) {
throw error;
}

      return data || [];
    } catch (err) {
      console.error('Failed to get user escalation queue:', err);
      throw err;
    }
  }

  /**
   * Get escalation statistics for a workspace
   */
  async getEscalationStats(
    workspaceId: string,
    hoursAgo: number = 24
  ): Promise<{
    total_escalations: number;
    pending_count: number;
    approved_count: number;
    rejected_count: number;
    auto_resolved_count: number;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    avg_resolution_time_hours: number;
  }> {
    try {
      const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('agent_escalations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('escalated_at', since);

      if (error) {
throw error;
}

      if (!data || data.length === 0) {
        return {
          total_escalations: 0,
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          auto_resolved_count: 0,
          by_severity: {},
          by_type: {},
          avg_resolution_time_hours: 0
        };
      }

      const bySeverity: Record<string, number> = {};
      const byType: Record<string, number> = {};
      const resolutionTimes: number[] = [];

      data.forEach(e => {
        bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
        byType[e.escalation_type] = (byType[e.escalation_type] || 0) + 1;

        if (e.resolved_at) {
          const escalatedAt = new Date(e.escalated_at).getTime();
          const resolvedAt = new Date(e.resolved_at).getTime();
          const hours = (resolvedAt - escalatedAt) / (1000 * 60 * 60);
          resolutionTimes.push(hours);
        }
      });

      const avgResolutionTime = resolutionTimes.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
        : 0;

      return {
        total_escalations: data.length,
        pending_count: data.filter(e => e.approval_status === 'pending').length,
        approved_count: data.filter(e => e.approval_status === 'approved').length,
        rejected_count: data.filter(e => e.approval_status === 'rejected').length,
        auto_resolved_count: data.filter(e => e.auto_resolved === true).length,
        by_severity: bySeverity,
        by_type: byType,
        avg_resolution_time_hours: Math.round(avgResolutionTime * 100) / 100
      };
    } catch (err) {
      console.error('Failed to get escalation stats:', err);
      throw err;
    }
  }

  /**
   * Run periodic escalation maintenance
   * - Auto-resolve stale escalations
   * - Escalate up chain for timeouts
   * Should be called periodically (every hour)
   */
  async runMaintenance(): Promise<{
    auto_resolved: number;
    escalated_up: number;
  }> {
    try {
      console.log('🔧 Running escalation maintenance...');

      // Auto-resolve stale escalations (24 hours)
      const autoResolved = await this.autoResolveStaleEscalations(24);
      console.log(`✅ Auto-resolved ${autoResolved} stale escalations`);

      // Get escalations pending > 4 hours
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      const { data: staleEscalations, error } = await this.supabase
        .from('agent_escalations')
        .select('id, workspace_id, severity')
        .eq('approval_status', 'pending')
        .lt('escalated_at', fourHoursAgo);

      if (error) {
throw error;
}

      // Escalate up chain
      let escalatedUp = 0;
      for (const escalation of staleEscalations || []) {
        const success = await this.escalateUpChain(escalation.id);
        if (success) {
escalatedUp++;
}
      }

      console.log(`✅ Escalated ${escalatedUp} up the chain`);

      return {
        auto_resolved: autoResolved,
        escalated_up: escalatedUp
      };
    } catch (err) {
      console.error('Escalation maintenance failed:', err);
      return {
        auto_resolved: 0,
        escalated_up: 0
      };
    }
  }
}

// Singleton instance
let instance: EscalationManager | null = null;

export function getEscalationManager(): EscalationManager {
  if (!instance) {
    instance = new EscalationManager();
  }
  return instance;
}

/**
 * Start periodic escalation maintenance
 * Runs every hour
 */
export function startEscalationMaintenance(intervalMinutes: number = 60): NodeJS.Timeout {
  const manager = getEscalationManager();

  // Run immediately
  manager.runMaintenance();

  // Then run periodically
  return setInterval(() => {
    manager.runMaintenance();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Agent SDK Hook: Create escalation on stop
 * Usage in Agent SDK options:
 *
 * hooks: {
 *   Stop: [createEscalationHook(workspaceId, agentName)]
 * }
 */
export function createEscalationHook(workspaceId: string, agentName: string) {
  const manager = getEscalationManager();

  return async (input: any, context: any) => {
    try {
      // Check if escalation needed based on context
      if (context?.should_escalate) {
        await manager.createEscalation({
          workspace_id: workspaceId,
          agent_name: agentName,
          execution_id: context.execution_id,
          escalation_type: context.escalation_type || 'manual',
          severity: context.severity || 'warning',
          title: context.escalation_title || 'Agent execution stopped',
          description: context.escalation_description,
          context: context.escalation_context,
          requires_approval: true
        });
      }
    } catch (err) {
      console.error('EscalationHook error:', err);
    }

    return {};
  };
}
