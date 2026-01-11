/**
 * Ably Real-Time Client
 * Manages WebSocket connections for real-time threat notifications
 *
 * Setup:
 * 1. Add ABLY_API_KEY to .env.local
 * 2. Initialize client on app startup
 * 3. Subscribe to workspace threat channels
 * 4. Broadcast threats via publishThreat()
 */

import Ably from 'ably';
import { getSupabaseServer } from '@/lib/supabase';

// Lazy-load Ably client
let ablyClient: Ably.Realtime | null = null;
let ablyClientTimestamp = 0;
const ABLY_CLIENT_TTL = 60000; // 1 minute

/**
 * Get or create Ably client
 * Singleton pattern with TTL for connection freshness
 */
function getAblyClient(): Ably.Realtime {
  const now = Date.now();
  if (!ablyClient || now - ablyClientTimestamp > ABLY_CLIENT_TTL) {
    if (!process.env.ABLY_API_KEY) {
      throw new Error('ABLY_API_KEY not configured in environment');
    }

    ablyClient = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      // Production settings
      logLevel: process.env.NODE_ENV === 'production' ? 0 : 2, // 0=errors, 2=debug
      autoConnect: true,
      disconnectedRetryTimeout: 15000,
      transports: ['web_socket', 'xhr_streaming', 'xhr_polling'],
    });

    ablyClientTimestamp = now;

    // Handle connection errors
    ablyClient.connection.on('failed', (stateChange) => {
      console.error('[Ably] Connection failed:', stateChange.reason);
    });

    console.log('[Ably] Client initialized');
  }

  return ablyClient;
}

/**
 * Threat channel name for workspace
 * Pattern: threats:workspace-{workspaceId}
 */
export function getThreatChannelName(workspaceId: string): string {
  return `threats:workspace-${workspaceId}`;
}

/**
 * Get Ably authentication token for client-side connection
 * Tokens are workspace-scoped for multi-tenant isolation
 */
export async function generateAblyToken(workspaceId: string): Promise<string> {
  try {
    const ablyAuth = new Ably.Rest({
      key: process.env.ABLY_API_KEY,
    });

    // Request token with specific capabilities
    const tokenRequest = await ablyAuth.auth.createTokenRequest({
      clientId: `workspace-${workspaceId}`,
      capability: {
        // Only allow subscribing to threats channel for this workspace
        [getThreatChannelName(workspaceId)]: ['subscribe'],
      },
      ttl: 60 * 60 * 1000, // 1 hour token TTL
    });

    console.log(`[Ably] Generated token for workspace ${workspaceId}`);
    return JSON.stringify(tokenRequest);
  } catch (error) {
    console.error('[Ably] Failed to generate token:', error);
    throw error;
  }
}

/**
 * Publish threat to workspace channel
 * Broadcasts to all connected clients watching that workspace
 */
export async function publishThreat(
  workspaceId: string,
  threat: {
    id: string;
    type: string;
    severity: string;
    domain: string;
    title: string;
    description: string;
    detectedAt: string;
    impactEstimate: string;
    recommendedAction: string;
    data: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const client = getAblyClient();
    const channelName = getThreatChannelName(workspaceId);
    const channel = client.channels.get(channelName);

    // Message format for real-time broadcast
    const message = {
      type: 'threat_detected',
      threat,
      timestamp: new Date().toISOString(),
      workspaceId,
    };

    await channel.publish('threat', message);
    console.log(`[Ably] Published threat to ${channelName}: ${threat.id}`);
  } catch (error) {
    console.error('[Ably] Failed to publish threat:', error);
    // Don't throw - threat is already stored in database
    // Just log for debugging
  }
}

/**
 * Publish threat alert summary to workspace
 * Used for dashboard summaries (critical/high count)
 */
export async function publishThreatSummary(
  workspaceId: string,
  summary: {
    domain: string;
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    mostRecent: string | null;
  }
): Promise<void> {
  try {
    const client = getAblyClient();
    const channelName = getThreatChannelName(workspaceId);
    const channel = client.channels.get(channelName);

    const message = {
      type: 'threat_summary',
      summary,
      timestamp: new Date().toISOString(),
    };

    await channel.publish('summary', message);
    console.log(`[Ably] Published threat summary to ${channelName}`);
  } catch (error) {
    console.error('[Ably] Failed to publish summary:', error);
  }
}

/**
 * Broadcast monitoring status update
 * Used to notify of check completion and next scheduled time
 */
export async function publishMonitoringStatus(
  workspaceId: string,
  status: {
    domain: string;
    checkCompletedAt: string;
    nextCheckAt: string;
    threatsDetected: number;
  }
): Promise<void> {
  try {
    const client = getAblyClient();
    const channelName = getThreatChannelName(workspaceId);
    const channel = client.channels.get(channelName);

    const message = {
      type: 'monitoring_status',
      status,
      timestamp: new Date().toISOString(),
    };

    await channel.publish('status', message);
    console.log(`[Ably] Published monitoring status to ${channelName}`);
  } catch (error) {
    console.error('[Ably] Failed to publish monitoring status:', error);
  }
}

/**
 * Get presence info for workspace threats channel
 * Returns connected clients (useful for presence awareness)
 */
export async function getChannelPresence(workspaceId: string): Promise<
  Array<{
    clientId: string;
    action: string;
    data?: Record<string, unknown>;
  }>
> {
  try {
    const client = getAblyClient();
    const channelName = getThreatChannelName(workspaceId);
    const channel = client.channels.get(channelName);

    const members = await channel.presence.get();
    console.log(`[Ably] ${members.length} clients connected to ${channelName}`);

    return members.map((m) => ({
      clientId: m.clientId,
      action: m.action,
      data: m.data,
    }));
  } catch (error) {
    console.error('[Ably] Failed to get presence:', error);
    return [];
  }
}

/**
 * Health check for Ably connection
 */
export async function checkAblyHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'suspended' | 'failed';
  uptime: number;
  connectedChannels: number;
}> {
  try {
    const client = getAblyClient();

    return {
      status: client.connection.state as
        | 'connected'
        | 'disconnected'
        | 'suspended'
        | 'failed',
      uptime: Date.now() - (ablyClientTimestamp || 0),
      connectedChannels: client.channels.all().length,
    };
  } catch (error) {
    console.error('[Ably] Health check failed:', error);
    return {
      status: 'failed',
      uptime: 0,
      connectedChannels: 0,
    };
  }
}

/**
 * Close Ably connection (on app shutdown)
 */
export async function closeAblyConnection(): Promise<void> {
  if (ablyClient) {
    try {
      await ablyClient.close();
      ablyClient = null;
      console.log('[Ably] Connection closed');
    } catch (error) {
      console.error('[Ably] Error closing connection:', error);
    }
  }
}

/**
 * Subscribe to threat history for workspace
 * Used for historical replay (e.g., when dashboard reconnects)
 */
export async function getThreatHistory(
  workspaceId: string,
  limit: number = 20
): Promise<
  Array<{
    type: string;
    threat?: Record<string, unknown>;
    summary?: Record<string, unknown>;
    timestamp: string;
  }>
> {
  try {
    const supabase = getSupabaseServer();

    const { data: threats, error } = await supabase
      .from('seo_threats')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Ably] Failed to fetch history:', error);
      return [];
    }

    return (threats || []).map((threat) => ({
      type: 'threat_detected',
      threat: {
        id: threat.id,
        type: threat.threat_type,
        severity: threat.severity,
        domain: threat.domain,
        title: threat.title,
        description: threat.description,
        detectedAt: threat.detected_at,
        impactEstimate: threat.impact_estimate,
        recommendedAction: threat.recommended_action,
        data: threat.threat_data || {},
      },
      timestamp: threat.detected_at,
    }));
  } catch (error) {
    console.error('[Ably] Failed to get threat history:', error);
    return [];
  }
}
