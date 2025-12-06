/**
 * POST /api/synthex/lead/run
 *
 * Run full lead intelligence analysis for a contact.
 * Calculates lead score, predicts churn, estimates LTV, and generates journey map.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   contactId: string (required)
 *   engagementScore?: number (optional - fetched from score table if not provided)
 * }
 *
 * Phase: B12 - Lead Scoring + Churn AI + LTV + Journey Mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  calculateLeadScore,
  getLeadGrade,
  predictChurn,
  predictLTV,
  generateJourneyMap,
  upsertLeadModel,
  AudienceEvent,
} from '@/lib/synthex/leadEngineService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, contactId, engagementScore: providedEngagement } = body;

    if (!tenantId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, contactId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get contact data
    const { data: contact } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Contact does not belong to tenant' }, { status: 403 });
    }

    // Get score data
    const { data: scoreData } = await supabaseAdmin
      .from('synthex_audience_scores')
      .select('*')
      .eq('contact_id', contactId)
      .single();

    // Get events
    const { data: eventsData } = await supabaseAdmin
      .from('synthex_audience_events')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true })
      .limit(100);

    const events: AudienceEvent[] = (eventsData || []).map((e) => ({
      type: e.event_type,
      source: e.event_source,
      timestamp: e.created_at,
      data: e.event_data,
    }));

    // Build activity vector from events
    const activityVector: Record<string, number> = {};
    for (const event of events) {
      activityVector[event.type] = (activityVector[event.type] || 0) + 1;
    }

    // Get engagement score
    const engagementScore = providedEngagement ?? scoreData?.engagement_score ?? 0;

    // Calculate lead score
    const leadScore = calculateLeadScore(activityVector, engagementScore);
    const leadGrade = getLeadGrade(leadScore);

    // Build contact profile for AI predictions
    const contactProfile = {
      engagementScore,
      leadScore,
      totalEvents: events.length,
      positiveSignals: scoreData?.positive_signals || 0,
      negativeSignals: scoreData?.negative_signals || 0,
      conversions: activityVector['conversion'] || 0,
      persona: scoreData?.persona || null,
      daysSinceLastActivity: scoreData?.last_event_at
        ? Math.floor((Date.now() - new Date(scoreData.last_event_at).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      tenure: contact.created_at
        ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    };

    // Run AI predictions in parallel
    const [churnResult, ltvResult, journeyResult] = await Promise.all([
      predictChurn(contactProfile),
      predictLTV(contactProfile),
      events.length > 0 ? generateJourneyMap(events) : Promise.resolve({ data: null, error: null }),
    ]);

    // Determine current stage from journey
    let currentStage = null;
    if (journeyResult.data?.stages?.length) {
      const lastStage = journeyResult.data.stages[journeyResult.data.stages.length - 1];
      currentStage = lastStage.name;
    }

    // Upsert lead model
    const payload = {
      lead_score: leadScore,
      lead_grade: leadGrade,
      churn_risk: churnResult.data?.churn_risk ?? 0,
      churn_factors: churnResult.data?.factors ?? [],
      ltv_estimate: ltvResult.data?.ltv ?? 0,
      ltv_confidence: ltvResult.data?.confidence ?? null,
      journey: journeyResult.data ?? null,
      current_stage: currentStage,
    };

    const result = await upsertLeadModel(tenantId, contactId, payload);

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      status: 'ok',
      leadModel: result.data,
      analysis: {
        leadScore,
        leadGrade,
        churnRisk: churnResult.data?.churn_risk,
        churnFactors: churnResult.data?.factors,
        ltvEstimate: ltvResult.data?.ltv,
        ltvConfidence: ltvResult.data?.confidence,
        journey: journeyResult.data,
        currentStage,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[lead/run POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
