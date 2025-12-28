/**
 * Agent Health Monitor
 * Analyzes metrics and updates agent health status
 * Runs periodically (every 5 minutes) to detect degradation
 *
 * Part of Project Vend Phase 2 - Agent Optimization Framework
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMetricsCollector } from './metricsCollector';

export interface AgentHealth {
  agent_name: string;
  workspace_id: string;
  status: 'healthy' | 'degraded' | 'critical' | 'disabled';
  success_rate_24h: number;
  avg_execution_time_24h: number;
  error_rate_24h: number;
  cost_24h_usd: number;
  consecutive_failures: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_error: string | null;
  total_executions_24h: number;
  total_cost_30d_usd: number;
}

export class HealthMonitor {
  private supabase: SupabaseClient;
  private metricsCollector = getMetricsCollector();

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials for HealthMonitor');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Calculate agent health status based on metrics
   */
  calculateHealthStatus(
    successRate: number,
    errorRate: number,
    consecutiveFailures: number
  ): 'healthy' | 'degraded' | 'critical' {
    // Critical: success rate < 70% OR error rate > 30% OR 5+ consecutive failures
    if (successRate < 70 || errorRate > 30 || consecutiveFailures >= 5) {
      return 'critical';
    }

    // Degraded: success rate < 85% OR error rate > 15% OR 3+ consecutive failures
    if (successRate < 85 || errorRate > 15 || consecutiveFailures >= 3) {
      return 'degraded';
    }

    // Healthy: everything nominal
    return 'healthy';
  }

  /**
   * Update health status for a specific agent
   */
  async updateAgentHealth(
    agentName: string,
    workspaceId: string
  ): Promise<AgentHealth> {
    try {
      // Get 24-hour metrics
      const metrics24h = await this.metricsCollector.getAgentMetrics(
        agentName,
        workspaceId,
        24
      );

      // Get 30-day cost
      const metrics30d = await this.metricsCollector.getAgentMetrics(
        agentName,
        workspaceId,
        24 * 30
      );

      // Get last success/failure timestamps
      const { data: lastExecution, error: execError } = await this.supabase
        .from('agent_execution_metrics')
        .select('success, executed_at, error_type')
        .eq('agent_name', agentName)
        .eq('workspace_id', workspaceId)
        .order('executed_at', { ascending: false })
        .limit(10);

      if (execError) {
throw execError;
}

      // Calculate consecutive failures
      let consecutiveFailures = 0;
      let lastSuccessAt: string | null = null;
      let lastFailureAt: string | null = null;
      let lastError: string | null = null;

      if (lastExecution && lastExecution.length > 0) {
        // Count consecutive failures from most recent
        for (const exec of lastExecution) {
          if (exec.success) {
            if (!lastSuccessAt) {
lastSuccessAt = exec.executed_at;
}
            break;
          } else {
            consecutiveFailures++;
            if (!lastFailureAt) {
              lastFailureAt = exec.executed_at;
              lastError = exec.error_type;
            }
          }
        }

        // Find last success if we haven't yet
        if (!lastSuccessAt) {
          const successExec = lastExecution.find(e => e.success);
          if (successExec) {
lastSuccessAt = successExec.executed_at;
}
        }
      }

      // Calculate health status
      const status = this.calculateHealthStatus(
        metrics24h.success_rate,
        metrics24h.error_rate,
        consecutiveFailures
      );

      // Upsert health status
      const healthData: AgentHealth = {
        agent_name: agentName,
        workspace_id: workspaceId,
        status,
        success_rate_24h: Math.round(metrics24h.success_rate * 100) / 100,
        avg_execution_time_24h: Math.round(metrics24h.avg_execution_time_ms),
        error_rate_24h: Math.round(metrics24h.error_rate * 100) / 100,
        cost_24h_usd: Math.round(metrics24h.total_cost_usd * 100) / 100,
        consecutive_failures: consecutiveFailures,
        last_success_at: lastSuccessAt,
        last_failure_at: lastFailureAt,
        last_error: lastError,
        total_executions_24h: metrics24h.total_executions,
        total_cost_30d_usd: Math.round(metrics30d.total_cost_usd * 100) / 100
      };

      const { error: upsertError } = await this.supabase
        .from('agent_health_status')
        .upsert(
          {
            ...healthData,
            last_health_check_at: new Date().toISOString()
          },
          {
            onConflict: 'workspace_id,agent_name'
          }
        );

      if (upsertError) {
throw upsertError;
}

      return healthData;
    } catch (err) {
      console.error(`Failed to update health for ${agentName}:`, err);
      throw err;
    }
  }

  /**
   * Update health for all agents in a workspace
   */
  async updateAllAgentsHealth(workspaceId: string): Promise<AgentHealth[]> {
    try {
      // Get unique agent names from recent executions
      const { data: agents, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('agent_name')
        .eq('workspace_id', workspaceId)
        .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
throw error;
}

      // Get unique agent names
      const uniqueAgents = [...new Set(agents?.map(a => a.agent_name) || [])];

      // Update health for each agent
      const healthUpdates = await Promise.all(
        uniqueAgents.map(agentName => this.updateAgentHealth(agentName, workspaceId))
      );

      return healthUpdates;
    } catch (err) {
      console.error(`Failed to update all agents health for workspace ${workspaceId}:`, err);
      throw err;
    }
  }

  /**
   * Get health dashboard data for a workspace
   */
  async getHealthDashboard(workspaceId: string): Promise<{
    agents: AgentHealth[];
    summary: {
      total_agents: number;
      healthy_count: number;
      degraded_count: number;
      critical_count: number;
      disabled_count: number;
      total_cost_24h_usd: number;
      total_executions_24h: number;
      overall_success_rate: number;
    };
  }> {
    try {
      // Get all agent health records
      const { data: agents, error } = await this.supabase
        .from('agent_health_status')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('status', { ascending: false });

      if (error) {
throw error;
}

      if (!agents || agents.length === 0) {
        return {
          agents: [],
          summary: {
            total_agents: 0,
            healthy_count: 0,
            degraded_count: 0,
            critical_count: 0,
            disabled_count: 0,
            total_cost_24h_usd: 0,
            total_executions_24h: 0,
            overall_success_rate: 0
          }
        };
      }

      // Calculate summary
      const summary = {
        total_agents: agents.length,
        healthy_count: agents.filter(a => a.status === 'healthy').length,
        degraded_count: agents.filter(a => a.status === 'degraded').length,
        critical_count: agents.filter(a => a.status === 'critical').length,
        disabled_count: agents.filter(a => a.status === 'disabled').length,
        total_cost_24h_usd: agents.reduce((sum, a) => sum + Number(a.cost_24h_usd || 0), 0),
        total_executions_24h: agents.reduce((sum, a) => sum + (a.total_executions_24h || 0), 0),
        overall_success_rate:
          agents.reduce((sum, a) => sum + (a.success_rate_24h || 0), 0) / agents.length
      };

      return { agents, summary };
    } catch (err) {
      console.error('Failed to get health dashboard:', err);
      throw err;
    }
  }

  /**
   * Detect degraded agents and trigger escalation
   */
  async detectDegradation(workspaceId: string): Promise<Array<{
    agent_name: string;
    status: string;
    reason: string;
  }>> {
    try {
      const { data: degradedAgents, error } = await this.supabase
        .from('agent_health_status')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['degraded', 'critical']);

      if (error) {
throw error;
}

      return (degradedAgents || []).map(agent => ({
        agent_name: agent.agent_name,
        status: agent.status,
        reason: this.getDegradationReason(agent)
      }));
    } catch (err) {
      console.error('Failed to detect degradation:', err);
      throw err;
    }
  }

  /**
   * Get human-readable degradation reason
   */
  private getDegradationReason(agent: any): string {
    const reasons: string[] = [];

    if (agent.success_rate_24h < 70) {
      reasons.push(`Success rate critically low (${agent.success_rate_24h.toFixed(1)}%)`);
    } else if (agent.success_rate_24h < 85) {
      reasons.push(`Success rate below threshold (${agent.success_rate_24h.toFixed(1)}%)`);
    }

    if (agent.error_rate_24h > 30) {
      reasons.push(`Error rate critically high (${agent.error_rate_24h.toFixed(1)}%)`);
    } else if (agent.error_rate_24h > 15) {
      reasons.push(`Error rate elevated (${agent.error_rate_24h.toFixed(1)}%)`);
    }

    if (agent.consecutive_failures >= 5) {
      reasons.push(`${agent.consecutive_failures} consecutive failures`);
    } else if (agent.consecutive_failures >= 3) {
      reasons.push(`${agent.consecutive_failures} consecutive failures`);
    }

    if (agent.last_error) {
      reasons.push(`Last error: ${agent.last_error}`);
    }

    return reasons.join('; ');
  }

  /**
   * Run health monitoring for all workspaces
   * Should be called periodically (every 5 minutes)
   */
  async runHealthCheck(): Promise<void> {
    try {
      console.log('🏥 Starting health check...');

      // Get all workspaces with recent agent activity
      const { data: workspaces, error } = await this.supabase
        .from('agent_execution_metrics')
        .select('workspace_id')
        .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
throw error;
}

      // Get unique workspace IDs
      const uniqueWorkspaces = [...new Set(workspaces?.map(w => w.workspace_id) || [])];

      console.log(`Found ${uniqueWorkspaces.length} workspaces with recent activity`);

      // Update health for each workspace
      for (const workspaceId of uniqueWorkspaces) {
        try {
          await this.updateAllAgentsHealth(workspaceId);
          console.log(`✅ Updated health for workspace: ${workspaceId}`);
        } catch (err) {
          console.error(`Failed to update health for workspace ${workspaceId}:`, err);
        }
      }

      console.log('✅ Health check complete');
    } catch (err) {
      console.error('Health check failed:', err);
    }
  }
}

// Singleton instance
let instance: HealthMonitor | null = null;

export function getHealthMonitor(): HealthMonitor {
  if (!instance) {
    instance = new HealthMonitor();
  }
  return instance;
}

/**
 * Start periodic health monitoring
 * Runs every 5 minutes
 */
export function startHealthMonitoring(intervalMinutes: number = 5): NodeJS.Timeout {
  const monitor = getHealthMonitor();
  const intervalMs = intervalMinutes * 60 * 1000;

  // Run immediately
  monitor.runHealthCheck();

  // Then run periodically
  return setInterval(() => {
    monitor.runHealthCheck();
  }, intervalMs);
}
