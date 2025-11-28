/**
 * Founder Umbrella Synopsis Service
 *
 * Generates AI-powered business synopses using Claude Opus 4.5.
 * Provides both single-business summaries and portfolio-wide umbrella synopses.
 * Results are stored in founder_os_snapshots table.
 *
 * @module founderOS/founderUmbrellaSynopsisService
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { listBusinesses, type FounderBusiness } from './founderBusinessRegistryService';
import { getSignals, type BusinessSignal } from './founderSignalInferenceService';

// ============================================================================
// Types
// ============================================================================

export type SnapshotType =
  | 'daily_briefing'
  | 'weekly_report'
  | 'monthly_review'
  | 'health_check'
  | 'opportunity_scan'
  | 'risk_assessment'
  | 'custom';

export type SnapshotScope = 'portfolio' | 'business' | 'project' | 'campaign' | 'custom';

export interface Synopsis {
  summary: string;
  key_metrics: {
    health_score: number;
    trend: 'improving' | 'stable' | 'declining';
    metrics: Record<string, number | string>;
  };
  risks: Array<{
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    potential_impact: 'high' | 'medium' | 'low';
    description: string;
    recommended_action: string;
  }>;
  recommendations: Array<{
    id: string;
    priority: number;
    title: string;
    description: string;
    effort: 'quick_win' | 'medium' | 'long_term';
    expected_outcome: string;
  }>;
}

export interface FounderOsSnapshot {
  id: string;
  owner_user_id: string;
  snapshot_type: SnapshotType;
  scope: SnapshotScope;
  scope_id: string | null;
  summary: Synopsis;
  score: number | null;
  created_at: string;
}

export interface SynopsisServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Anthropic Client
// ============================================================================

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateSynopsisId(): string {
  return `syn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function fetchBusinessContext(businessId: string): Promise<{
  business: FounderBusiness | null;
  signals: BusinessSignal[];
}> {
  // Get business details
  const supabase = supabaseAdmin;
  const { data: business } = await supabase
    .from('founder_businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  // Get recent signals
  const signalsResult = await getSignals(businessId);

  return {
    business: business as FounderBusiness | null,
    signals: signalsResult.success ? signalsResult.data || [] : [],
  };
}

async function fetchPortfolioContext(ownerUserId: string): Promise<{
  businesses: FounderBusiness[];
  signalsByBusiness: Map<string, BusinessSignal[]>;
}> {
  const businessesResult = await listBusinesses(ownerUserId);
  const businesses = businessesResult.success ? businessesResult.data || [] : [];

  const signalsByBusiness = new Map<string, BusinessSignal[]>();

  for (const business of businesses) {
    const signalsResult = await getSignals(business.id);
    if (signalsResult.success && signalsResult.data) {
      signalsByBusiness.set(business.id, signalsResult.data);
    }
  }

  return { businesses, signalsByBusiness };
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * Generate a synopsis for a single business using Claude Opus 4.5
 *
 * @param businessId - UUID of the founder business
 * @returns Generated synopsis
 */
export async function generateBusinessSynopsis(
  businessId: string
): Promise<SynopsisServiceResult<Synopsis>> {
  try {
    const anthropic = getAnthropicClient();
    const { business, signals } = await fetchBusinessContext(businessId);

    if (!business) {
      return {
        success: false,
        error: 'Business not found',
      };
    }

    // Build context for Claude
    const signalSummary = signals.slice(0, 50).map((s) => ({
      family: s.signal_family,
      key: s.signal_key,
      value: s.value_numeric ?? s.value_text,
      source: s.source,
      observed_at: s.observed_at,
    }));

    const systemPrompt = `You are AI Phill, a strategic business advisor operating in HUMAN_GOVERNED mode.
Your role is to analyze business data and provide actionable insights.
All recommendations are advisory-only and require human review before action.

Analyze the business and its signals to generate a comprehensive synopsis.
Be direct, specific, and prioritize actionable insights.`;

    const userPrompt = `Analyze this business and generate a strategic synopsis:

BUSINESS:
- Name: ${business.display_name}
- Code: ${business.code}
- Industry: ${business.industry || 'Not specified'}
- Region: ${business.region || 'Not specified'}
- Domain: ${business.primary_domain || 'Not specified'}
- Status: ${business.status}

RECENT SIGNALS:
${JSON.stringify(signalSummary, null, 2)}

Generate a JSON response with this exact structure:
{
  "summary": "2-3 paragraph executive summary of business health and trajectory",
  "key_metrics": {
    "health_score": <0-100>,
    "trend": "<improving|stable|declining>",
    "metrics": {<key metric name>: <value>}
  },
  "risks": [
    {
      "id": "<unique_id>",
      "title": "<risk title>",
      "severity": "<critical|high|medium|low>",
      "description": "<detailed description>",
      "mitigation": "<recommended mitigation>"
    }
  ],
  "opportunities": [
    {
      "id": "<unique_id>",
      "title": "<opportunity title>",
      "potential_impact": "<high|medium|low>",
      "description": "<detailed description>",
      "recommended_action": "<specific action to take>"
    }
  ],
  "recommendations": [
    {
      "id": "<unique_id>",
      "priority": <1-5>,
      "title": "<recommendation title>",
      "description": "<detailed recommendation>",
      "effort": "<quick_win|medium|long_term>",
      "expected_outcome": "<what success looks like>"
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8192,
      thinking: {
        type: 'enabled',
        budget_tokens: 5000,
      },
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content from response
    let synopsisText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        synopsisText = block.text;
        break;
      }
    }

    // Parse the JSON response
    const synopsis = JSON.parse(synopsisText) as Synopsis;

    // Store the snapshot
    const supabase = supabaseAdmin;
    await supabase.from('founder_os_snapshots').insert({
      owner_user_id: business.owner_user_id,
      snapshot_type: 'health_check' as SnapshotType,
      scope: 'business' as SnapshotScope,
      scope_id: businessId,
      summary: synopsis,
      score: synopsis.key_metrics.health_score,
    });

    return {
      success: true,
      data: synopsis,
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Generate business synopsis error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating synopsis',
    };
  }
}

/**
 * Generate a portfolio-wide umbrella synopsis for all businesses owned by a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @returns Generated umbrella synopsis
 */
export async function generateUmbrellaSynopsis(
  ownerUserId: string
): Promise<SynopsisServiceResult<Synopsis>> {
  try {
    const anthropic = getAnthropicClient();
    const { businesses, signalsByBusiness } = await fetchPortfolioContext(ownerUserId);

    if (businesses.length === 0) {
      return {
        success: false,
        error: 'No businesses found for this owner',
      };
    }

    // Build portfolio summary
    const portfolioSummary = businesses.map((b) => {
      const signals = signalsByBusiness.get(b.id) || [];
      const recentSignals = signals.slice(0, 10).map((s) => ({
        family: s.signal_family,
        key: s.signal_key,
        value: s.value_numeric ?? s.value_text,
      }));

      return {
        id: b.id,
        name: b.display_name,
        code: b.code,
        industry: b.industry,
        status: b.status,
        signals: recentSignals,
      };
    });

    const systemPrompt = `You are AI Phill, a strategic portfolio advisor operating in HUMAN_GOVERNED mode.
Your role is to analyze a founder's entire business portfolio and provide unified strategic insights.
All recommendations are advisory-only and require human review before action.

Focus on:
- Cross-business synergies and conflicts
- Portfolio-level risk diversification
- Resource allocation optimization
- Strategic alignment across ventures`;

    const userPrompt = `Analyze this founder's business portfolio and generate an umbrella synopsis:

PORTFOLIO (${businesses.length} businesses):
${JSON.stringify(portfolioSummary, null, 2)}

Generate a JSON response with this exact structure:
{
  "summary": "3-4 paragraph executive summary of portfolio health, synergies, and strategic position",
  "key_metrics": {
    "health_score": <0-100>,
    "trend": "<improving|stable|declining>",
    "metrics": {
      "portfolio_size": ${businesses.length},
      "healthy_businesses": <count>,
      "at_risk_businesses": <count>,
      <other aggregate metrics>
    }
  },
  "risks": [
    {
      "id": "<unique_id>",
      "title": "<portfolio-level risk>",
      "severity": "<critical|high|medium|low>",
      "description": "<how this affects the portfolio>",
      "mitigation": "<portfolio-level mitigation>"
    }
  ],
  "opportunities": [
    {
      "id": "<unique_id>",
      "title": "<portfolio-level opportunity>",
      "potential_impact": "<high|medium|low>",
      "description": "<synergies or growth areas>",
      "recommended_action": "<specific portfolio action>"
    }
  ],
  "recommendations": [
    {
      "id": "<unique_id>",
      "priority": <1-5>,
      "title": "<strategic recommendation>",
      "description": "<detailed recommendation>",
      "effort": "<quick_win|medium|long_term>",
      "expected_outcome": "<portfolio-level impact>"
    }
  ]
}

Respond ONLY with valid JSON, no additional text.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 8192,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract text content from response
    let synopsisText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        synopsisText = block.text;
        break;
      }
    }

    // Parse the JSON response
    const synopsis = JSON.parse(synopsisText) as Synopsis;

    // Store the snapshot
    const supabase = supabaseAdmin;
    await supabase.from('founder_os_snapshots').insert({
      owner_user_id: ownerUserId,
      snapshot_type: 'health_check' as SnapshotType,
      scope: 'portfolio' as SnapshotScope,
      scope_id: null,
      summary: synopsis,
      score: synopsis.key_metrics.health_score,
    });

    return {
      success: true,
      data: synopsis,
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Generate umbrella synopsis error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error generating umbrella synopsis',
    };
  }
}

/**
 * Get recent snapshots for a founder
 *
 * @param ownerUserId - UUID of the founder user
 * @param scope - Optional scope filter
 * @param snapshotType - Optional type filter
 * @param limit - Number of snapshots to return (default: 10)
 * @returns List of snapshots
 */
export async function getSnapshots(
  ownerUserId: string,
  scope?: SnapshotScope,
  snapshotType?: SnapshotType,
  limit = 10
): Promise<SynopsisServiceResult<FounderOsSnapshot[]>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_os_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scope) {
      query = query.eq('scope', scope);
    }
    if (snapshotType) {
      query = query.eq('snapshot_type', snapshotType);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      console.error('[UmbrellaSynopsis] Get snapshots error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: (snapshots || []) as FounderOsSnapshot[],
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Get snapshots exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching snapshots',
    };
  }
}

/**
 * Get a single snapshot by ID
 *
 * @param snapshotId - UUID of the snapshot
 * @returns Snapshot data
 */
export async function getSnapshot(
  snapshotId: string
): Promise<SynopsisServiceResult<FounderOsSnapshot>> {
  try {
    const supabase = supabaseAdmin;

    const { data: snapshot, error } = await supabase
      .from('founder_os_snapshots')
      .select('*')
      .eq('id', snapshotId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Snapshot not found',
        };
      }
      console.error('[UmbrellaSynopsis] Get snapshot error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: snapshot as FounderOsSnapshot,
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Get snapshot exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching snapshot',
    };
  }
}

/**
 * Get latest snapshot for a specific scope
 *
 * @param ownerUserId - UUID of the founder user
 * @param scope - Snapshot scope
 * @param scopeId - Optional scope ID (for business-level)
 * @returns Latest snapshot or null
 */
export async function getLatestSnapshot(
  ownerUserId: string,
  scope: SnapshotScope,
  scopeId?: string
): Promise<SynopsisServiceResult<FounderOsSnapshot | null>> {
  try {
    const supabase = supabaseAdmin;

    let query = supabase
      .from('founder_os_snapshots')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .eq('scope', scope)
      .order('created_at', { ascending: false })
      .limit(1);

    if (scopeId) {
      query = query.eq('scope_id', scopeId);
    }

    const { data: snapshots, error } = await query;

    if (error) {
      console.error('[UmbrellaSynopsis] Get latest snapshot error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: snapshots && snapshots.length > 0 ? (snapshots[0] as FounderOsSnapshot) : null,
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Get latest snapshot exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error fetching latest snapshot',
    };
  }
}

/**
 * Create a custom snapshot with manually provided synopsis
 *
 * @param ownerUserId - UUID of the founder user
 * @param snapshotType - Type of snapshot
 * @param scope - Snapshot scope
 * @param synopsis - Synopsis data
 * @param scopeId - Optional scope ID
 * @returns Created snapshot
 */
export async function createSnapshot(
  ownerUserId: string,
  snapshotType: SnapshotType,
  scope: SnapshotScope,
  synopsis: Synopsis,
  scopeId?: string
): Promise<SynopsisServiceResult<FounderOsSnapshot>> {
  try {
    const supabase = supabaseAdmin;

    const { data: snapshot, error } = await supabase
      .from('founder_os_snapshots')
      .insert({
        owner_user_id: ownerUserId,
        snapshot_type: snapshotType,
        scope: scope,
        scope_id: scopeId || null,
        summary: synopsis,
        score: synopsis.key_metrics.health_score,
      })
      .select()
      .single();

    if (error) {
      console.error('[UmbrellaSynopsis] Create snapshot error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: snapshot as FounderOsSnapshot,
    };
  } catch (err) {
    console.error('[UmbrellaSynopsis] Create snapshot exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error creating snapshot',
    };
  }
}
