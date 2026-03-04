/**
 * Cross-Commander opportunity detection
 *
 * Runs after all daily commander briefs to find opportunities that span
 * multiple commanders (Revenue, Growth, Authority). Detects convergence,
 * conflicts, and amplification patterns across the army_opportunities table.
 *
 * UNI-1449: Cross-Commander opportunity detection
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrossCommanderSignal {
  type: 'convergence' | 'conflict' | 'amplification';
  commanders: string[];
  signal: string;
  recommendedAction: string;
  priority: 'urgent' | 'high' | 'medium';
}

interface RawOpportunity {
  id: string;
  source_agent: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Commander-to-skill-prefix map
// ---------------------------------------------------------------------------

const COMMANDER_PREFIXES: Record<string, string> = {
  revenue:   'rev-',
  growth:    'growth-',
  authority: 'auth-',
};

function classifyCommander(sourceAgent: string): string | null {
  for (const [commander, prefix] of Object.entries(COMMANDER_PREFIXES)) {
    if (sourceAgent.startsWith(prefix) || sourceAgent === `commander-${commander}`) {
      return commander;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Detection rules
// ---------------------------------------------------------------------------

/**
 * Convergence: Revenue finds a lead AND Growth has content targeting that
 * lead's industry → combine for a targeted outreach sequence.
 */
function detectConvergence(opps: RawOpportunity[]): CrossCommanderSignal[] {
  const signals: CrossCommanderSignal[] = [];

  const revLeads = opps.filter(
    (o) => classifyCommander(o.source_agent) === 'revenue' && o.type === 'lead',
  );
  const growthContent = opps.filter(
    (o) => classifyCommander(o.source_agent) === 'growth' && o.type === 'content',
  );

  if (revLeads.length > 0 && growthContent.length > 0) {
    signals.push({
      type: 'convergence',
      commanders: ['revenue', 'growth'],
      signal: `Revenue identified ${revLeads.length} lead(s) while Growth has ${growthContent.length} content piece(s) ready — deploy targeted content sequence`,
      recommendedAction:
        'Assign Growth content to Revenue lead outreach sequences; brief Commander Revenue to incorporate content links in follow-up emails',
      priority: 'high',
    });
  }

  // Convergence: Authority has GEO/PR win AND Growth can amplify via social
  const authWins = opps.filter(
    (o) =>
      classifyCommander(o.source_agent) === 'authority' &&
      (o.source_agent === 'auth-geo-monitor' || o.source_agent === 'auth-pr-monitor'),
  );
  const growthSocial = opps.filter(
    (o) =>
      classifyCommander(o.source_agent) === 'growth' &&
      o.source_agent === 'growth-social-post',
  );

  if (authWins.length > 0 && growthSocial.length > 0) {
    signals.push({
      type: 'convergence',
      commanders: ['authority', 'growth'],
      signal: `Authority flagged ${authWins.length} GEO/PR win(s) — Growth social queue can amplify visibility`,
      recommendedAction:
        'Instruct Growth Social Poster to draft amplification posts referencing the Authority wins; cross-post to all business LinkedIn accounts',
      priority: 'high',
    });
  }

  return signals;
}

/**
 * Amplification: Multiple commanders see the same signal independently →
 * elevate priority and coordinate response.
 */
function detectAmplification(opps: RawOpportunity[]): CrossCommanderSignal[] {
  const signals: CrossCommanderSignal[] = [];

  // Group opportunities by a normalised title keyword to find overlaps
  const titleKeywords: Record<string, string[]> = {};

  for (const opp of opps) {
    const commander = classifyCommander(opp.source_agent);
    if (!commander) continue;

    // Extract first 3 significant words as a rough deduplication key
    const key = opp.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(' ')
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join('-');

    if (!key) continue;
    if (!titleKeywords[key]) titleKeywords[key] = [];
    if (!titleKeywords[key].includes(commander)) {
      titleKeywords[key].push(commander);
    }
  }

  for (const [key, commanders] of Object.entries(titleKeywords)) {
    if (commanders.length >= 2) {
      signals.push({
        type: 'amplification',
        commanders,
        signal: `Multiple commanders (${commanders.join(', ')}) independently flagged opportunities related to "${key}"`,
        recommendedAction:
          'Escalate to founder briefing as a cross-functional priority; coordinate a unified response across all relevant commanders',
        priority: commanders.length >= 3 ? 'urgent' : 'high',
      });
    }
  }

  return signals;
}

/**
 * Conflict: Revenue is pursuing a prospect while Authority flags a negative
 * review from the same brand → pause outreach and resolve reputation first.
 */
function detectConflicts(opps: RawOpportunity[]): CrossCommanderSignal[] {
  const signals: CrossCommanderSignal[] = [];

  const negativeReviews = opps.filter(
    (o) =>
      classifyCommander(o.source_agent) === 'authority' &&
      o.source_agent === 'auth-review-monitor' &&
      o.priority === 'urgent',
  );
  const activeLeads = opps.filter(
    (o) =>
      classifyCommander(o.source_agent) === 'revenue' &&
      (o.source_agent === 'rev-lead-hunter' || o.source_agent === 'rev-upsell'),
  );

  if (negativeReviews.length > 0 && activeLeads.length > 0) {
    signals.push({
      type: 'conflict',
      commanders: ['authority', 'revenue'],
      signal: `Authority flagged ${negativeReviews.length} urgent negative review(s) while Revenue has ${activeLeads.length} active lead(s) — reputation risk to outreach`,
      recommendedAction:
        'Pause Revenue outreach sequences; brief Commander Authority to resolve negative reviews before any sales contact proceeds',
      priority: 'urgent',
    });
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Analyses recent opportunities from all commanders (last 24 hours) to find
 * patterns that span multiple commanders.
 *
 * @param supabase  Supabase admin client
 * @param workspaceId  Optional workspace filter; pass undefined to scan all
 */
export async function detectCrossCommanderSignals(
  supabase: SupabaseClient,
  workspaceId?: string,
): Promise<CrossCommanderSignal[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('army_opportunities')
    .select('id, source_agent, type, title, description, priority, metadata, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[cross-commander] Failed to fetch opportunities:', error.message);
    return [];
  }

  const opps = (data ?? []) as RawOpportunity[];

  const signals: CrossCommanderSignal[] = [
    ...detectConvergence(opps),
    ...detectAmplification(opps),
    ...detectConflicts(opps),
  ];

  return signals;
}

/**
 * Persists detected signals back to army_opportunities as high-priority
 * cross-commander items so they appear in the founder dashboard.
 */
export async function persistSignals(
  supabase: SupabaseClient,
  signals: CrossCommanderSignal[],
  workspaceId?: string,
): Promise<void> {
  if (signals.length === 0) return;

  const rows = signals.map((s) => ({
    workspace_id:  workspaceId ?? null,
    source_agent:  'cross-commander-detector',
    type:          s.type,
    title:         s.signal.slice(0, 200),
    description:   s.recommendedAction,
    priority:      s.priority,
    status:        'new',
    revenue_potential: null,
    metadata: {
      commanders: s.commanders,
      signalType: s.type,
    },
  }));

  const { error } = await supabase.from('army_opportunities').insert(rows);

  if (error) {
    console.error('[cross-commander] Failed to persist signals:', error.message);
  }
}
