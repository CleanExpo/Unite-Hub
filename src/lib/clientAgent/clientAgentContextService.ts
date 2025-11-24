/**
 * Client Agent Context Service
 * Phase 83: Aggregates context for agent decision-making
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ContextSnapshot,
  ClientProfile,
  RecentInteraction,
  PerformanceMetrics,
  EarlyWarningInfo,
} from './clientAgentTypes';

/**
 * Build complete context snapshot for a client
 */
export async function buildClientContext(
  clientId: string,
  workspaceId: string
): Promise<ContextSnapshot> {
  const [clientProfile, recentInteractions, performanceMetrics, earlyWarnings] =
    await Promise.all([
      getClientProfile(clientId, workspaceId),
      getRecentInteractions(clientId, workspaceId),
      getPerformanceMetrics(clientId, workspaceId),
      getClientEarlyWarnings(clientId, workspaceId),
    ]);

  return {
    client_profile: clientProfile || undefined,
    recent_interactions: recentInteractions,
    performance_metrics: performanceMetrics || undefined,
    early_warnings: earlyWarnings,
  };
}

/**
 * Get client profile from contacts table
 */
async function getClientProfile(
  clientId: string,
  workspaceId: string
): Promise<ClientProfile | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, email, company, status, ai_score, tags')
    .eq('id', clientId)
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    console.error('Failed to get client profile:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name || 'Unknown',
    email: data.email,
    company: data.company,
    status: data.status || 'lead',
    ai_score: data.ai_score || 50,
    tags: data.tags || [],
  };
}

/**
 * Get recent interactions for context
 */
async function getRecentInteractions(
  clientId: string,
  workspaceId: string
): Promise<RecentInteraction[]> {
  const supabase = await getSupabaseServer();
  const interactions: RecentInteraction[] = [];

  // Get recent emails
  const { data: emails } = await supabase
    .from('emails')
    .select('id, subject, sent_at, direction')
    .eq('contact_id', clientId)
    .eq('workspace_id', workspaceId)
    .order('sent_at', { ascending: false })
    .limit(5);

  if (emails) {
    for (const email of emails) {
      interactions.push({
        type: email.direction === 'inbound' ? 'email_received' : 'email_sent',
        date: email.sent_at,
        summary: email.subject || 'No subject',
      });
    }
  }

  // Get recent notes (if table exists)
  try {
    const { data: notes } = await supabase
      .from('contact_notes')
      .select('id, content, created_at')
      .eq('contact_id', clientId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (notes) {
      for (const note of notes) {
        interactions.push({
          type: 'note',
          date: note.created_at,
          summary: note.content?.substring(0, 100) || 'Note added',
        });
      }
    }
  } catch {
    // Table might not exist
  }

  // Sort by date descending
  interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return interactions.slice(0, 10);
}

/**
 * Get performance metrics for client
 */
async function getPerformanceMetrics(
  clientId: string,
  workspaceId: string
): Promise<PerformanceMetrics | null> {
  const supabase = await getSupabaseServer();

  // Get email stats
  const { data: emails } = await supabase
    .from('emails')
    .select('id')
    .eq('contact_id', clientId)
    .eq('workspace_id', workspaceId)
    .eq('direction', 'outbound');

  const totalSent = emails?.length || 0;
  if (totalSent === 0) {
    return null;
  }

  // Get opens
  const { count: opensCount } = await supabase
    .from('email_opens')
    .select('id', { count: 'exact' })
    .in('email_id', emails?.map(e => e.id) || []);

  // Get clicks
  const { count: clicksCount } = await supabase
    .from('email_clicks')
    .select('id', { count: 'exact' })
    .in('email_id', emails?.map(e => e.id) || []);

  const openRate = totalSent > 0 ? (opensCount || 0) / totalSent : 0;
  const clickRate = totalSent > 0 ? (clicksCount || 0) / totalSent : 0;

  return {
    open_rate: openRate,
    click_rate: clickRate,
    response_rate: 0, // Would need more complex calculation
    sentiment_trend: 'stable',
  };
}

/**
 * Get early warnings for client
 */
async function getClientEarlyWarnings(
  clientId: string,
  workspaceId: string
): Promise<EarlyWarningInfo[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .select('id, warning_type, severity, message')
    .eq('client_id', clientId)
    .eq('workspace_id', workspaceId)
    .in('status', ['open', 'acknowledged'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data) {
    return [];
  }

  return data.map(w => ({
    id: w.id,
    warning_type: w.warning_type,
    severity: w.severity,
    message: w.message,
  }));
}

/**
 * Build workspace-level context (no specific client)
 */
export async function buildWorkspaceContext(
  workspaceId: string
): Promise<ContextSnapshot> {
  const earlyWarnings = await getWorkspaceEarlyWarnings(workspaceId);

  return {
    early_warnings: earlyWarnings,
  };
}

/**
 * Get workspace-level early warnings
 */
async function getWorkspaceEarlyWarnings(
  workspaceId: string
): Promise<EarlyWarningInfo[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('early_warning_events')
    .select('id, warning_type, severity, message')
    .eq('workspace_id', workspaceId)
    .is('client_id', null)
    .in('status', ['open', 'acknowledged'])
    .order('severity', { ascending: false })
    .limit(10);

  if (error || !data) {
    return [];
  }

  return data.map(w => ({
    id: w.id,
    warning_type: w.warning_type,
    severity: w.severity,
    message: w.message,
  }));
}

/**
 * Get context summary for display
 */
export function summarizeContext(context: ContextSnapshot): string {
  const parts: string[] = [];

  if (context.client_profile) {
    parts.push(`Client: ${context.client_profile.name} (Score: ${context.client_profile.ai_score})`);
  }

  if (context.recent_interactions?.length) {
    parts.push(`Recent interactions: ${context.recent_interactions.length}`);
  }

  if (context.performance_metrics) {
    const pm = context.performance_metrics;
    if (pm.open_rate !== undefined) {
      parts.push(`Open rate: ${Math.round(pm.open_rate * 100)}%`);
    }
  }

  if (context.early_warnings?.length) {
    const highSeverity = context.early_warnings.filter(w => w.severity === 'high').length;
    parts.push(`Warnings: ${context.early_warnings.length} (${highSeverity} high)`);
  }

  return parts.join(' | ') || 'No context available';
}
