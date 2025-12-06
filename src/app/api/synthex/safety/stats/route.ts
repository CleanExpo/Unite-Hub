/**
 * Synthex Safety Stats API
 *
 * GET: Retrieve aggregated safety statistics for a tenant
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/synthex/safety/stats
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get total calls
    const { count: totalCalls } = await supabase
      .from('synthex_ai_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get flagged count
    const { count: flaggedCount } = await supabase
      .from('synthex_ai_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('flagged', true);

    // Get incidents count (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: incidentsCount } = await supabase
      .from('synthex_safety_incidents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', oneWeekAgo.toISOString());

    // Get average risk score
    const { data: riskData } = await supabase
      .from('synthex_ai_audit_log')
      .select('risk_score')
      .eq('tenant_id', tenantId);

    const avgRiskScore = riskData && riskData.length > 0
      ? riskData.reduce((sum, row) => sum + (row.risk_score || 0), 0) / riskData.length
      : 0;

    // Get high risk count (score >= 70)
    const { count: highRiskCount } = await supabase
      .from('synthex_ai_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('risk_score', 70);

    const total = totalCalls || 0;
    const flagged = flaggedCount || 0;
    const flaggedPercentage = total > 0 ? (flagged / total) * 100 : 0;

    return NextResponse.json({
      total_calls: total,
      flagged_count: flagged,
      flagged_percentage: flaggedPercentage,
      incidents_count: incidentsCount || 0,
      avg_risk_score: avgRiskScore,
      high_risk_count: highRiskCount || 0,
    });
  } catch (error) {
    console.error('[safety/stats] GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
