/**
 * Synthex Lead Routing Service
 *
 * Handles predictive lead routing recommendations using AI.
 * Recommends optimal owners based on lead characteristics,
 * owner preferences, and historical performance.
 *
 * Phase: B16 - Predictive Lead Routing Engine
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// =============================================================================
// Types
// =============================================================================

export interface RoutableLead {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  company: string | null;
  jobTitle: string | null;
  industry: string | null;
  leadScore: number | null;
  churnRisk: number | null;
  ltvEstimate: number | null;
  currentStage: string | null;
  currentOwner: string | null;
  tags: string[];
  lastActivityAt: string | null;
  createdAt: string;
}

export interface OwnerPreferences {
  id: string;
  tenantId: string;
  ownerId: string;
  ownerName: string | null;
  maxLeadsPerDay: number;
  maxActiveLeads: number;
  currentActiveLeads: number;
  preferredIndustries: string[];
  preferredStages: string[];
  preferredChannels: string[];
  preferredLeadScoreMin: number;
  preferredLeadScoreMax: number;
  isActive: boolean;
  avgResponseTimeHours: number | null;
  conversionRate: number | null;
  leadsAssigned30d: number;
  leadsConverted30d: number;
}

export interface RoutingRecommendation {
  recommendedOwner: string;
  ownerName: string | null;
  priorityScore: number;
  recommendedChannel: string;
  confidence: number;
  reason: string;
  factors: string[];
  alternativeOwners?: Array<{
    ownerId: string;
    ownerName: string | null;
    score: number;
    reason: string;
  }>;
}

export interface RoutingDecision {
  leadId: string;
  recommendedOwner: string;
  priorityScore: number;
  recommendedChannel: string;
  confidence: number;
  reason: string;
  factors: string[];
}

export interface RoutingLogEntry {
  id: string;
  tenantId: string;
  leadId: string;
  recommendedOwner: string | null;
  previousOwner: string | null;
  priorityScore: number;
  recommendedChannel: string | null;
  reason: string | null;
  confidence: number | null;
  factors: string[];
  leadScoreAtTime: number | null;
  churnRiskAtTime: number | null;
  journeyStageAtTime: string | null;
  decisionStatus: string;
  actualOwner: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface RoutingFilters {
  status?: string;
  ownerId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface LeadFilters {
  stage?: string;
  minScore?: number;
  maxScore?: number;
  unassigned?: boolean;
  limit?: number;
  offset?: number;
}

interface ServiceResult<T> {
  data: T | null;
  error: Error | null;
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =============================================================================
// Get Routable Leads
// =============================================================================

export async function getRoutableLeads(
  tenantId: string,
  filters?: LeadFilters
): Promise<ServiceResult<RoutableLead[]>> {
  try {
    // Query contacts with their lead models
    let query = supabaseAdmin
      .from('synthex_audience_contacts')
      .select(`
        id,
        tenant_id,
        email,
        first_name,
        last_name,
        company,
        job_title,
        industry,
        tags,
        status,
        owner,
        last_activity_at,
        created_at
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.unassigned) {
      query = query.is('owner', null);
    }
    if (filters?.stage) {
      query = query.eq('status', filters.stage);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data: contacts, error: contactsError } = await query;

    if (contactsError) {
throw contactsError;
}

    if (!contacts || contacts.length === 0) {
      return { data: [], error: null };
    }

    // Get lead models for these contacts
    const contactIds = contacts.map((c) => c.id);
    const { data: leadModels } = await supabaseAdmin
      .from('synthex_lead_models')
      .select('contact_id, lead_score, churn_risk, ltv_estimate, current_stage')
      .in('contact_id', contactIds);

    const modelMap = new Map(leadModels?.map((m) => [m.contact_id, m]) || []);

    // Map to routable leads
    const leads: RoutableLead[] = contacts.map((c) => {
      const model = modelMap.get(c.id);
      return {
        id: c.id,
        tenantId: c.tenant_id,
        email: c.email,
        name: [c.first_name, c.last_name].filter(Boolean).join(' ') || null,
        company: c.company,
        jobTitle: c.job_title,
        industry: c.industry,
        leadScore: model?.lead_score || null,
        churnRisk: model?.churn_risk || null,
        ltvEstimate: model?.ltv_estimate || null,
        currentStage: model?.current_stage || c.status,
        currentOwner: c.owner,
        tags: c.tags || [],
        lastActivityAt: c.last_activity_at,
        createdAt: c.created_at,
      };
    });

    // Apply score filters if specified
    let filtered = leads;
    if (filters?.minScore !== undefined) {
      filtered = filtered.filter((l) => (l.leadScore || 0) >= filters.minScore!);
    }
    if (filters?.maxScore !== undefined) {
      filtered = filtered.filter((l) => (l.leadScore || 100) <= filters.maxScore!);
    }

    return { data: filtered, error: null };
  } catch (error) {
    console.error('[leadRoutingService.getRoutableLeads] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Get Owner Preferences
// =============================================================================

export async function getOwnerPreferences(
  tenantId: string
): Promise<ServiceResult<OwnerPreferences[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_lead_owner_preferences')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('owner_name', { ascending: true });

    if (error) {
throw error;
}

    const preferences: OwnerPreferences[] = (data || []).map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      maxLeadsPerDay: row.max_leads_per_day,
      maxActiveLeads: row.max_active_leads,
      currentActiveLeads: row.current_active_leads,
      preferredIndustries: row.preferred_industries || [],
      preferredStages: row.preferred_stages || [],
      preferredChannels: row.preferred_channels || [],
      preferredLeadScoreMin: row.preferred_lead_score_min,
      preferredLeadScoreMax: row.preferred_lead_score_max,
      isActive: row.is_active,
      avgResponseTimeHours: row.avg_response_time_hours,
      conversionRate: row.conversion_rate,
      leadsAssigned30d: row.leads_assigned_30d,
      leadsConverted30d: row.leads_converted_30d,
    }));

    return { data: preferences, error: null };
  } catch (error) {
    console.error('[leadRoutingService.getOwnerPreferences] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Get Routing Recommendation (AI-Powered)
// =============================================================================

export async function getRoutingRecommendation(
  tenantId: string,
  lead: RoutableLead
): Promise<ServiceResult<RoutingRecommendation>> {
  try {
    // Get available owners
    const ownersResult = await getOwnerPreferences(tenantId);
    if (ownersResult.error) {
throw ownersResult.error;
}

    const owners = ownersResult.data || [];

    // If no owners configured, return a default recommendation
    if (owners.length === 0) {
      return {
        data: {
          recommendedOwner: 'unassigned',
          ownerName: null,
          priorityScore: 50,
          recommendedChannel: 'email',
          confidence: 0.3,
          reason: 'No owner preferences configured. Lead remains unassigned.',
          factors: ['no_owners_configured'],
        },
        error: null,
      };
    }

    // Build context for AI
    const leadContext = `
Lead Information:
- Email: ${lead.email}
- Name: ${lead.name || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Job Title: ${lead.jobTitle || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Lead Score: ${lead.leadScore || 'Not scored'}
- Churn Risk: ${lead.churnRisk ? `${(lead.churnRisk * 100).toFixed(1)}%` : 'Unknown'}
- LTV Estimate: ${lead.ltvEstimate ? `$${lead.ltvEstimate.toLocaleString()}` : 'Unknown'}
- Current Stage: ${lead.currentStage || 'Unknown'}
- Tags: ${lead.tags.length > 0 ? lead.tags.join(', ') : 'None'}
- Last Activity: ${lead.lastActivityAt || 'Never'}
    `.trim();

    const ownersContext = owners
      .map(
        (o) => `
Owner: ${o.ownerName || o.ownerId}
- ID: ${o.ownerId}
- Capacity: ${o.currentActiveLeads}/${o.maxActiveLeads} active leads
- Daily Limit: ${o.maxLeadsPerDay}/day
- Preferred Industries: ${o.preferredIndustries.join(', ') || 'Any'}
- Preferred Stages: ${o.preferredStages.join(', ') || 'Any'}
- Preferred Channels: ${o.preferredChannels.join(', ') || 'Any'}
- Score Range: ${o.preferredLeadScoreMin}-${o.preferredLeadScoreMax}
- Avg Response Time: ${o.avgResponseTimeHours ? `${o.avgResponseTimeHours}h` : 'Unknown'}
- Conversion Rate: ${o.conversionRate ? `${(o.conversionRate * 100).toFixed(1)}%` : 'Unknown'}
- 30-day Stats: ${o.leadsAssigned30d} assigned, ${o.leadsConverted30d} converted
        `.trim()
      )
      .join('\n\n');

    const prompt = `You are a lead routing optimization expert. Based on the lead information and available owners, recommend the best owner assignment.

${leadContext}

Available Owners:
${ownersContext}

Analyze the lead and recommend the best owner based on:
1. Industry/expertise match
2. Current capacity and workload
3. Historical performance (conversion rate)
4. Lead score alignment with preferences
5. Response time expectations

Respond in JSON format:
{
  "recommended_owner_id": "owner_id",
  "priority_score": 0-100,
  "recommended_channel": "email|phone|sms|meeting",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation (1-2 sentences)",
  "factors": ["factor1", "factor2", "factor3"]
}`;

    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse AI response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI recommendation');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const recommendedOwner = owners.find((o) => o.ownerId === parsed.recommended_owner_id);

    return {
      data: {
        recommendedOwner: parsed.recommended_owner_id,
        ownerName: recommendedOwner?.ownerName || null,
        priorityScore: Math.min(100, Math.max(0, parsed.priority_score || 50)),
        recommendedChannel: parsed.recommended_channel || 'email',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        reason: parsed.reason || 'AI recommendation',
        factors: parsed.factors || [],
      },
      error: null,
    };
  } catch (error) {
    console.error('[leadRoutingService.getRoutingRecommendation] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Apply Routing Decision
// =============================================================================

export async function applyRoutingDecision(
  tenantId: string,
  leadId: string,
  decision: RoutingDecision,
  decidedBy?: string
): Promise<ServiceResult<RoutingLogEntry>> {
  try {
    // Get current lead info
    const { data: lead } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('owner, status')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .single();

    // Get lead model for context
    const { data: leadModel } = await supabaseAdmin
      .from('synthex_lead_models')
      .select('lead_score, churn_risk, current_stage')
      .eq('contact_id', leadId)
      .single();

    // Insert routing log entry
    const logPayload = {
      tenant_id: tenantId,
      lead_id: leadId,
      recommended_owner: decision.recommendedOwner,
      previous_owner: lead?.owner || null,
      priority_score: decision.priorityScore,
      recommended_channel: decision.recommendedChannel,
      reason: decision.reason,
      confidence: decision.confidence,
      factors: decision.factors,
      lead_score_at_time: leadModel?.lead_score || null,
      churn_risk_at_time: leadModel?.churn_risk || null,
      journey_stage_at_time: leadModel?.current_stage || lead?.status || null,
      decision_status: 'accepted',
      actual_owner: decision.recommendedOwner,
      decided_by: decidedBy || null,
      decided_at: new Date().toISOString(),
    };

    const { data: logEntry, error: logError } = await supabaseAdmin
      .from('synthex_lead_routing_log')
      .insert(logPayload)
      .select()
      .single();

    if (logError) {
throw logError;
}

    // Update the lead's owner
    const { error: updateError } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .update({ owner: decision.recommendedOwner })
      .eq('id', leadId)
      .eq('tenant_id', tenantId);

    if (updateError) {
throw updateError;
}

    // Update owner's active lead count
    await supabaseAdmin.rpc('increment_owner_lead_count', {
      p_tenant_id: tenantId,
      p_owner_id: decision.recommendedOwner,
    }).catch(() => {
      // RPC might not exist, ignore
    });

    return {
      data: mapLogEntryFromDb(logEntry),
      error: null,
    };
  } catch (error) {
    console.error('[leadRoutingService.applyRoutingDecision] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// List Routing Log
// =============================================================================

export async function listRoutingLog(
  tenantId: string,
  filters?: RoutingFilters
): Promise<ServiceResult<RoutingLogEntry[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_lead_routing_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('decision_status', filters.status);
    }
    if (filters?.ownerId) {
      query = query.or(`recommended_owner.eq.${filters.ownerId},actual_owner.eq.${filters.ownerId}`);
    }
    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }
    if (filters?.to) {
      query = query.lte('created_at', filters.to + 'T23:59:59Z');
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
throw error;
}

    const entries = (data || []).map(mapLogEntryFromDb);
    return { data: entries, error: null };
  } catch (error) {
    console.error('[leadRoutingService.listRoutingLog] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Upsert Owner Preferences
// =============================================================================

export async function upsertOwnerPreferences(
  tenantId: string,
  ownerId: string,
  preferences: Partial<Omit<OwnerPreferences, 'id' | 'tenantId' | 'ownerId'>>
): Promise<ServiceResult<OwnerPreferences>> {
  try {
    const payload = {
      tenant_id: tenantId,
      owner_id: ownerId,
      owner_name: preferences.ownerName,
      max_leads_per_day: preferences.maxLeadsPerDay,
      max_active_leads: preferences.maxActiveLeads,
      preferred_industries: preferences.preferredIndustries,
      preferred_stages: preferences.preferredStages,
      preferred_channels: preferences.preferredChannels,
      preferred_lead_score_min: preferences.preferredLeadScoreMin,
      preferred_lead_score_max: preferences.preferredLeadScoreMax,
      is_active: preferences.isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from('synthex_lead_owner_preferences')
      .upsert(payload, { onConflict: 'tenant_id,owner_id' })
      .select()
      .single();

    if (error) {
throw error;
}

    return {
      data: {
        id: data.id,
        tenantId: data.tenant_id,
        ownerId: data.owner_id,
        ownerName: data.owner_name,
        maxLeadsPerDay: data.max_leads_per_day,
        maxActiveLeads: data.max_active_leads,
        currentActiveLeads: data.current_active_leads,
        preferredIndustries: data.preferred_industries || [],
        preferredStages: data.preferred_stages || [],
        preferredChannels: data.preferred_channels || [],
        preferredLeadScoreMin: data.preferred_lead_score_min,
        preferredLeadScoreMax: data.preferred_lead_score_max,
        isActive: data.is_active,
        avgResponseTimeHours: data.avg_response_time_hours,
        conversionRate: data.conversion_rate,
        leadsAssigned30d: data.leads_assigned_30d,
        leadsConverted30d: data.leads_converted_30d,
      },
      error: null,
    };
  } catch (error) {
    console.error('[leadRoutingService.upsertOwnerPreferences] Error:', error);
    return { data: null, error: error as Error };
  }
}

// =============================================================================
// Helpers
// =============================================================================

function mapLogEntryFromDb(row: Record<string, unknown>): RoutingLogEntry {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    leadId: row.lead_id as string,
    recommendedOwner: row.recommended_owner as string | null,
    previousOwner: row.previous_owner as string | null,
    priorityScore: Number(row.priority_score),
    recommendedChannel: row.recommended_channel as string | null,
    reason: row.reason as string | null,
    confidence: row.confidence as number | null,
    factors: (row.factors as string[]) || [],
    leadScoreAtTime: row.lead_score_at_time as number | null,
    churnRiskAtTime: row.churn_risk_at_time as number | null,
    journeyStageAtTime: row.journey_stage_at_time as string | null,
    decisionStatus: row.decision_status as string,
    actualOwner: row.actual_owner as string | null,
    decidedBy: row.decided_by as string | null,
    decidedAt: row.decided_at as string | null,
    createdAt: row.created_at as string,
  };
}
