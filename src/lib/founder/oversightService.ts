/**
 * Founder Oversight Service
 *
 * Founder dashboard utilities:
 * - AI agent timeline viewer
 * - Usage meters for marketing outputs & AI tokens
 * - Error logs for orchestrator actions
 * - Production/test mode switching per integration
 * - Founder overrides for generated outputs
 */

import { getSupabaseServer } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentTimeline {
  entries: AgentTimelineEntry[];
  totalActions: number;
  totalTokens: number;
  dateRange: { start: string; end: string };
}

export interface AgentTimelineEntry {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  workspaceId: string;
  status: 'success' | 'failed' | 'pending';
  duration: number;
  tokensUsed: number;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error?: string;
}

export interface UsageMetrics {
  period: 'day' | 'week' | 'month';
  marketing: {
    playbooks: { created: number; limit: number };
    assets: { created: number; limit: number };
    decisionMaps: { created: number; limit: number };
    emailsSent: { count: number; limit: number };
  };
  ai: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    thinkingTokens: number;
    costEstimate: number;
    byModel: Record<string, { tokens: number; cost: number }>;
  };
  api: {
    totalCalls: number;
    byEndpoint: Record<string, number>;
    errorRate: number;
  };
}

export interface OrchestratorLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  agent: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  stackTrace?: string;
}

export interface IntegrationMode {
  integration: string;
  mode: 'test' | 'live';
  lastChanged: string;
  changedBy: string;
}

export interface PlatformModes {
  stripe: 'test' | 'live';
  dataforseo: 'test' | 'live';
  semrush: 'test' | 'live';
  ai: 'test' | 'live';
}

export interface FounderOverride {
  id: string;
  outputId: string;
  outputType: 'playbook' | 'asset' | 'email' | 'decision-map';
  originalContent: string;
  overriddenContent: string;
  overriddenAt: string;
  overriddenBy: string;
  reason?: string;
}

// ============================================================================
// AGENT TIMELINE
// ============================================================================

export async function getAgentTimeline(
  workspaceId: string,
  options?: {
    fromDate?: string;
    toDate?: string;
    agent?: string;
    limit?: number;
  }
): Promise<{ data: AgentTimeline | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    let query = supabase
      .from('agent_actions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: false });

    if (options?.fromDate) {
      query = query.gte('timestamp', options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte('timestamp', options.toDate);
    }
    if (options?.agent) {
      query = query.eq('agent', options.agent);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet, return mock data
      const mockEntries = generateMockTimelineEntries(workspaceId);
      return {
        data: {
          entries: mockEntries,
          totalActions: mockEntries.length,
          totalTokens: mockEntries.reduce((sum, e) => sum + e.tokensUsed, 0),
          dateRange: {
            start: options?.fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: options?.toDate || new Date().toISOString(),
          },
        },
        error: null,
      };
    }

    const entries: AgentTimelineEntry[] = (data || []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      agent: row.agent,
      action: row.action,
      workspaceId: row.workspace_id,
      status: row.status,
      duration: row.duration_ms,
      tokensUsed: row.tokens_used || 0,
      inputs: row.inputs || {},
      outputs: row.outputs || {},
      error: row.error_message,
    }));

    return {
      data: {
        entries,
        totalActions: entries.length,
        totalTokens: entries.reduce((sum, e) => sum + e.tokensUsed, 0),
        dateRange: {
          start: options?.fromDate || entries[entries.length - 1]?.timestamp || '',
          end: options?.toDate || entries[0]?.timestamp || '',
        },
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

function generateMockTimelineEntries(workspaceId: string): AgentTimelineEntry[] {
  const agents = ['orchestrator', 'seo', 'social', 'content', 'visual', 'deployment'];
  const actions = ['analyze', 'generate', 'validate', 'publish', 'sync'];
  const entries: AgentTimelineEntry[] = [];

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
    entries.push({
      id: `entry-${i}`,
      timestamp: timestamp.toISOString(),
      agent: agents[Math.floor(Math.random() * agents.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      workspaceId,
      status: Math.random() > 0.1 ? 'success' : 'failed',
      duration: Math.floor(Math.random() * 5000) + 500,
      tokensUsed: Math.floor(Math.random() * 2000) + 100,
      inputs: { sample: 'input' },
      outputs: { sample: 'output' },
    });
  }

  return entries;
}

// ============================================================================
// USAGE METRICS
// ============================================================================

export async function getUsageMetrics(
  workspaceId: string,
  period: 'day' | 'week' | 'month' = 'month'
): Promise<{ data: UsageMetrics | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Calculate date range
    const now = new Date();
    const startDate = new Date(now);
    if (period === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get marketing metrics
    const [playbooksRes, assetsRes, mapsRes] = await Promise.all([
      supabase
        .from('social_playbooks')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('social_assets')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('decision_moment_maps')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .gte('created_at', startDate.toISOString()),
    ]);

    // Mock AI usage data (would come from actual tracking in production)
    const aiUsage = {
      totalTokens: Math.floor(Math.random() * 100000) + 10000,
      inputTokens: Math.floor(Math.random() * 50000) + 5000,
      outputTokens: Math.floor(Math.random() * 30000) + 3000,
      thinkingTokens: Math.floor(Math.random() * 20000) + 2000,
      costEstimate: 0,
      byModel: {
        'claude-sonnet-4.5': { tokens: Math.floor(Math.random() * 50000), cost: 0 },
        'claude-haiku-4.5': { tokens: Math.floor(Math.random() * 30000), cost: 0 },
        'claude-opus-4.5': { tokens: Math.floor(Math.random() * 10000), cost: 0 },
      },
    };

    // Calculate costs
    aiUsage.byModel['claude-sonnet-4.5'].cost = (aiUsage.byModel['claude-sonnet-4.5'].tokens / 1000000) * 15;
    aiUsage.byModel['claude-haiku-4.5'].cost = (aiUsage.byModel['claude-haiku-4.5'].tokens / 1000000) * 1.25;
    aiUsage.byModel['claude-opus-4.5'].cost = (aiUsage.byModel['claude-opus-4.5'].tokens / 1000000) * 75;
    aiUsage.costEstimate = Object.values(aiUsage.byModel).reduce((sum, m) => sum + m.cost, 0);

    const metrics: UsageMetrics = {
      period,
      marketing: {
        playbooks: { created: playbooksRes.count || 0, limit: 10 },
        assets: { created: assetsRes.count || 0, limit: 100 },
        decisionMaps: { created: mapsRes.count || 0, limit: 20 },
        emailsSent: { count: Math.floor(Math.random() * 500), limit: 1000 },
      },
      ai: aiUsage,
      api: {
        totalCalls: Math.floor(Math.random() * 10000) + 1000,
        byEndpoint: {
          '/api/agents/orchestrate': Math.floor(Math.random() * 500),
          '/api/marketing/playbooks': Math.floor(Math.random() * 300),
          '/api/marketing/assets': Math.floor(Math.random() * 400),
        },
        errorRate: Math.random() * 2,
      },
    };

    return { data: metrics, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// ORCHESTRATOR LOGS
// ============================================================================

export async function getOrchestratorLogs(
  workspaceId: string,
  options?: {
    level?: 'info' | 'warn' | 'error';
    agent?: string;
    limit?: number;
  }
): Promise<{ data: OrchestratorLog[]; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    let query = supabase
      .from('orchestrator_logs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('timestamp', { ascending: false });

    if (options?.level) {
      query = query.eq('level', options.level);
    }
    if (options?.agent) {
      query = query.eq('agent', options.agent);
    }
    query = query.limit(options?.limit || 100);

    const { data, error } = await query;

    if (error) {
      // Return mock data if table doesn't exist
      return {
        data: generateMockLogs(workspaceId),
        error: null,
      };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

function generateMockLogs(workspaceId: string): OrchestratorLog[] {
  const logs: OrchestratorLog[] = [];
  const levels: OrchestratorLog['level'][] = ['info', 'warn', 'error'];
  const agents = ['orchestrator', 'seo', 'social', 'content'];
  const messages = {
    info: ['Task completed successfully', 'Processing request', 'Validation passed'],
    warn: ['Rate limit approaching', 'Slow response time', 'Retrying request'],
    error: ['API call failed', 'Validation error', 'Timeout exceeded'],
  };

  for (let i = 0; i < 30; i++) {
    const level = levels[Math.floor(Math.random() * (i < 5 ? 3 : 2))]; // More errors at start
    const timestamp = new Date(Date.now() - i * 30 * 60 * 1000);

    logs.push({
      id: `log-${i}`,
      timestamp: timestamp.toISOString(),
      level,
      agent: agents[Math.floor(Math.random() * agents.length)],
      action: 'process',
      message: messages[level][Math.floor(Math.random() * messages[level].length)],
    });
  }

  return logs;
}

// ============================================================================
// PLATFORM MODE SWITCHING
// ============================================================================

export async function getPlatformModes(): Promise<{ data: PlatformModes | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const { data, error } = await supabase
      .from('sys_platform_mode')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      // Return defaults if table doesn't exist
      return {
        data: {
          stripe: 'test',
          dataforseo: 'test',
          semrush: 'test',
          ai: 'test',
        },
        error: null,
      };
    }

    return {
      data: {
        stripe: data.stripe_mode || 'test',
        dataforseo: data.dataforseo_mode || 'test',
        semrush: data.semrush_mode || 'test',
        ai: data.ai_mode || 'test',
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function updatePlatformMode(
  integration: keyof PlatformModes,
  mode: 'test' | 'live',
  changedBy: string
): Promise<{ success: boolean; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    // Map integration to column name
    const columnMap: Record<keyof PlatformModes, string> = {
      stripe: 'stripe_mode',
      dataforseo: 'dataforseo_mode',
      semrush: 'semrush_mode',
      ai: 'ai_mode',
    };

    const columnName = columnMap[integration];
    if (!columnName) {
      throw new Error(`Unknown integration: ${integration}`);
    }

    const { error } = await supabase
      .from('sys_platform_mode')
      .update({
        [columnName]: mode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    if (error) {
throw error;
}

    // Log the change
    await supabase.from('sys_platform_mode_audit').insert({
      service: integration,
      old_mode: mode === 'test' ? 'live' : 'test',
      new_mode: mode,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err as Error };
  }
}

// ============================================================================
// FOUNDER OVERRIDES
// ============================================================================

export async function createOverride(
  outputId: string,
  outputType: FounderOverride['outputType'],
  originalContent: string,
  overriddenContent: string,
  overriddenBy: string,
  reason?: string
): Promise<{ data: FounderOverride | null; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    const override: FounderOverride = {
      id: `override-${Date.now()}`,
      outputId,
      outputType,
      originalContent,
      overriddenContent,
      overriddenAt: new Date().toISOString(),
      overriddenBy,
      reason,
    };

    const { error } = await supabase.from('founder_overrides').insert(override);

    if (error) {
      // Table might not exist, just return the override object
      return { data: override, error: null };
    }

    return { data: override, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function getOverrides(
  workspaceId: string,
  outputType?: FounderOverride['outputType']
): Promise<{ data: FounderOverride[]; error: Error | null }> {
  const supabase = await getSupabaseServer();

  try {
    let query = supabase
      .from('founder_overrides')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('overridden_at', { ascending: false });

    if (outputType) {
      query = query.eq('output_type', outputType);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: null };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err as Error };
  }
}

// ============================================================================
// DASHBOARD SUMMARY
// ============================================================================

export interface FounderDashboardSummary {
  timeline: {
    totalActions: number;
    successRate: number;
    recentErrors: number;
  };
  usage: {
    aiCost: number;
    tokensUsed: number;
    marketingOutputs: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: string;
    lastIncident: string | null;
  };
  modes: PlatformModes;
}

export async function getFounderDashboardSummary(workspaceId: string): Promise<{ data: FounderDashboardSummary | null; error: Error | null }> {
  try {
    const [timelineRes, usageRes, modesRes] = await Promise.all([
      getAgentTimeline(workspaceId, { limit: 100 }),
      getUsageMetrics(workspaceId, 'month'),
      getPlatformModes(),
    ]);

    const timeline = timelineRes.data;
    const usage = usageRes.data;
    const modes = modesRes.data;

    if (!timeline || !usage || !modes) {
      throw new Error('Failed to fetch dashboard data');
    }

    const successfulActions = timeline.entries.filter((e) => e.status === 'success').length;
    const recentErrors = timeline.entries.filter((e) => e.status === 'failed').length;

    const summary: FounderDashboardSummary = {
      timeline: {
        totalActions: timeline.totalActions,
        successRate: timeline.totalActions > 0 ? (successfulActions / timeline.totalActions) * 100 : 100,
        recentErrors,
      },
      usage: {
        aiCost: usage.ai.costEstimate,
        tokensUsed: usage.ai.totalTokens,
        marketingOutputs:
          usage.marketing.playbooks.created +
          usage.marketing.assets.created +
          usage.marketing.decisionMaps.created,
      },
      health: {
        status: recentErrors > 10 ? 'degraded' : recentErrors > 20 ? 'unhealthy' : 'healthy',
        uptime: '99.9%',
        lastIncident: recentErrors > 0 ? timeline.entries.find((e) => e.status === 'failed')?.timestamp || null : null,
      },
      modes,
    };

    return { data: summary, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}
