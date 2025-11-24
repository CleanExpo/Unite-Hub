/**
 * Opportunity Window Service
 * Phase 95: Generate, save, and retrieve opportunity windows
 */

import { getSupabaseServer } from '@/lib/supabase';
import { collectForTenant, collectForRegion, collectForClient } from './opportunitySignalCollector';
import { computeScores, normalizeConfidence, computeUncertaintyNotes } from './opportunityScoringService';
import type {
  OpportunityWindow,
  OpportunityContext,
  GeneratedWindow,
  WindowType,
  OpportunityCategory,
} from './predictiveTypes';

/**
 * Generate opportunity windows for a context
 */
export async function generateWindow(context: OpportunityContext): Promise<GeneratedWindow[]> {
  // Collect signals based on context
  let signalCollection;
  if (context.clientId) {
    signalCollection = await collectForClient(context.clientId);
  } else if (context.regionId) {
    signalCollection = await collectForRegion(context.regionId);
  } else if (context.tenantId) {
    signalCollection = await collectForTenant(context.tenantId);
  } else {
    throw new Error('Context must include tenantId, regionId, or clientId');
  }

  // Compute scores
  const scores = computeScores(signalCollection.signals);

  // Generate windows for qualifying scores
  const windows: GeneratedWindow[] = [];

  for (const score of scores) {
    const confidence = normalizeConfidence(score.rawScore, signalCollection.dataCompleteness);

    // Skip low confidence opportunities
    if (confidence < 0.3) continue;

    const uncertaintyNotes = computeUncertaintyNotes(
      score.signals,
      signalCollection.dataCompleteness,
      score.category
    );

    const { title, description } = generateTitleAndDescription(
      score.category,
      context.windowType,
      confidence,
      score.signals.length
    );

    const supportingNodes = score.signals
      .filter(s => s.sourceNodeId)
      .map(s => s.sourceNodeId as string);

    windows.push({
      windowType: context.windowType,
      opportunityCategory: score.category,
      title,
      description,
      confidence,
      supportingNodes,
      uncertaintyNotes,
      signals: score.signals,
    });
  }

  // Sort by confidence
  windows.sort((a, b) => b.confidence - a.confidence);

  return windows;
}

/**
 * Save opportunity window to database
 */
export async function saveWindow(
  window: GeneratedWindow,
  context: OpportunityContext
): Promise<OpportunityWindow> {
  const supabase = await getSupabaseServer();

  // Calculate expiration
  const daysMap: Record<WindowType, number> = {
    '7_day': 7,
    '14_day': 14,
    '30_day': 30,
  };
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysMap[window.windowType]);

  // Insert window
  const { data: savedWindow, error: windowError } = await supabase
    .from('opportunity_windows')
    .insert({
      tenant_id: context.tenantId || null,
      region_id: context.regionId || null,
      client_id: context.clientId || null,
      window_type: window.windowType,
      opportunity_category: window.opportunityCategory,
      title: window.title,
      description: window.description,
      confidence: window.confidence,
      supporting_nodes: window.supportingNodes,
      uncertainty_notes: window.uncertaintyNotes,
      expires_at: expiresAt.toISOString(),
      status: 'active',
    })
    .select()
    .single();

  if (windowError) {
    throw new Error(`Failed to save window: ${windowError.message}`);
  }

  // Insert signals
  const signalInserts = window.signals.map(signal => ({
    opportunity_id: savedWindow.id,
    signal_type: signal.type,
    signal_value: signal.value,
    signal_label: signal.label || null,
    source_node_id: signal.sourceNodeId || null,
    weight: signal.weight || 1.0,
  }));

  if (signalInserts.length > 0) {
    const { error: signalError } = await supabase
      .from('opportunity_signals')
      .insert(signalInserts);

    if (signalError) {
      console.error('Failed to save signals:', signalError);
    }
  }

  return transformWindow(savedWindow);
}

/**
 * List windows for tenant
 */
export async function listWindowsForTenant(
  tenantId: string,
  options: {
    windowType?: WindowType;
    category?: OpportunityCategory;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<OpportunityWindow[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('opportunity_windows')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('confidence', { ascending: false })
    .order('created_at', { ascending: false });

  if (options.windowType) {
    query = query.eq('window_type', options.windowType);
  }
  if (options.category) {
    query = query.eq('opportunity_category', options.category);
  }
  if (options.status) {
    query = query.eq('status', options.status);
  } else {
    query = query.eq('status', 'active');
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list windows: ${error.message}`);
  }

  return (data || []).map(transformWindow);
}

/**
 * List windows for region
 */
export async function listWindowsForRegion(
  regionId: string,
  options: { limit?: number } = {}
): Promise<OpportunityWindow[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('opportunity_windows')
    .select('*')
    .eq('region_id', regionId)
    .eq('status', 'active')
    .order('confidence', { ascending: false })
    .limit(options.limit || 20);

  if (error) {
    throw new Error(`Failed to list windows: ${error.message}`);
  }

  return (data || []).map(transformWindow);
}

/**
 * Get window by ID with signals
 */
export async function getWindowWithSignals(windowId: string): Promise<{
  window: OpportunityWindow;
  signals: Array<{
    id: string;
    signalType: string;
    signalValue: number;
    signalLabel: string | null;
    sourceNodeId: string | null;
    weight: number;
  }>;
} | null> {
  const supabase = await getSupabaseServer();

  const { data: window, error: windowError } = await supabase
    .from('opportunity_windows')
    .select('*')
    .eq('id', windowId)
    .single();

  if (windowError || !window) {
    return null;
  }

  const { data: signals } = await supabase
    .from('opportunity_signals')
    .select('*')
    .eq('opportunity_id', windowId)
    .order('weight', { ascending: false });

  return {
    window: transformWindow(window),
    signals: (signals || []).map(s => ({
      id: s.id,
      signalType: s.signal_type,
      signalValue: s.signal_value,
      signalLabel: s.signal_label,
      sourceNodeId: s.source_node_id,
      weight: s.weight,
    })),
  };
}

/**
 * Update window status
 */
export async function updateWindowStatus(
  windowId: string,
  status: 'dismissed' | 'acted_upon'
): Promise<void> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('opportunity_windows')
    .update({ status })
    .eq('id', windowId);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }
}

// Helper functions

function transformWindow(row: Record<string, unknown>): OpportunityWindow {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string | null,
    regionId: row.region_id as string | null,
    clientId: row.client_id as string | null,
    windowType: row.window_type as WindowType,
    opportunityCategory: row.opportunity_category as OpportunityCategory,
    title: row.title as string,
    description: row.description as string,
    confidence: row.confidence as number,
    supportingNodes: row.supporting_nodes as string[],
    uncertaintyNotes: row.uncertainty_notes as string,
    expiresAt: row.expires_at as string | null,
    status: row.status as 'active' | 'expired' | 'dismissed' | 'acted_upon',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function generateTitleAndDescription(
  category: OpportunityCategory,
  windowType: WindowType,
  confidence: number,
  signalCount: number
): { title: string; description: string } {
  const windowDays = windowType.replace('_day', '');
  const confidenceLabel = confidence >= 0.7 ? 'High' : confidence >= 0.5 ? 'Moderate' : 'Exploratory';

  const titles: Record<OpportunityCategory, string> = {
    creative: `${confidenceLabel} Creative Opportunity`,
    posting: `${confidenceLabel} Posting Window`,
    campaign: `${confidenceLabel} Campaign Opportunity`,
    brand: `${confidenceLabel} Brand Positioning Window`,
    engagement: `${confidenceLabel} Engagement Opportunity`,
    audience: `${confidenceLabel} Audience Growth Window`,
    timing: `${confidenceLabel} Timing Optimization`,
  };

  const descriptions: Record<OpportunityCategory, string> = {
    creative: `Signals suggest creative content may perform well in the next ${windowDays} days. Based on ${signalCount} supporting signals.`,
    posting: `Posting conditions appear favorable for the next ${windowDays} days. Consider increasing activity.`,
    campaign: `Campaign launch conditions look promising for ${windowDays}-day window. Review signals before proceeding.`,
    brand: `Brand positioning opportunity detected for next ${windowDays} days. Market conditions may be favorable.`,
    engagement: `Engagement opportunity window of ${windowDays} days detected. Audience signals trending positive.`,
    audience: `Audience growth potential identified for ${windowDays}-day period. Growth indicators are positive.`,
    timing: `Optimal timing window detected for next ${windowDays} days. System load and budget conditions favorable.`,
  };

  return {
    title: titles[category],
    description: descriptions[category],
  };
}
