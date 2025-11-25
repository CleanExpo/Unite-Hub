/**
 * GET /api/safety/status
 * Retrieve current safety status, events, and predictions
 *
 * Query params:
 * - workspaceId (required): Workspace to get safety status for
 * - lookbackMinutes (optional): How far back to fetch events (default: 60)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { predictiveSafetyEngine, cascadeFailureModel } from '@/lib/safety';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(`safety:status:${clientId}`, { requests: 30, window: 60 });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.resetInSeconds },
        { status: 429 }
      );
    }

    // Authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    // Get parameters
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const lookbackMinutes = parseInt(req.nextUrl.searchParams.get('lookbackMinutes') || '60', 10);

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Verify workspace access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, org_id')
      .eq('id', workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: orgAccess } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .single();

    if (!orgAccess || orgAccess.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch current safety status
    const lookbackDate = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();

    const [
      { data: recentEvents },
      { data: predictions },
      { data: ledgerEntries },
    ] = await Promise.all([
      supabase
        .from('safety_events')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('safety_predictions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('safety_ledger')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('created_at', lookbackDate)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    // Get cascade analysis
    const cascadeAnalysis = await cascadeFailureModel.analyzeCascadeRisks({
      workspaceId,
      lookbackMinutes,
    });

    // Determine overall safety status
    const criticalEvents = (recentEvents || []).filter(e => e.severity >= 4).length;
    const highRiskPredictions = (predictions || []).filter(p => p.probability >= 80).length;
    const overallRiskLevel = cascadeAnalysis.cascadeRiskScore;

    let statusLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green';
    if (overallRiskLevel >= 80 || criticalEvents > 0) {
      statusLevel = 'red';
    } else if (overallRiskLevel >= 60 || highRiskPredictions > 0) {
      statusLevel = 'orange';
    } else if (overallRiskLevel >= 40) {
      statusLevel = 'yellow';
    }

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        workspace: {
          id: workspaceId,
          orgId: workspace.org_id,
        },
        status: {
          level: statusLevel,
          overallRiskScore: Math.round(overallRiskLevel),
          cascadeRiskScore: Math.round(cascadeAnalysis.cascadeRiskScore),
          deadlockRiskScore: Math.round(cascadeAnalysis.deadlockRiskScore),
          memoryCorruptionScore: Math.round(cascadeAnalysis.memoryCorruptionScore),
          orchestrationComplexityScore: Math.round(cascadeAnalysis.orchestrationComplexityScore),
        },
        events: {
          total: (recentEvents || []).length,
          critical: criticalEvents,
          recent: (recentEvents || []).slice(0, 10).map(e => ({
            id: e.id,
            type: e.event_type,
            severity: e.severity,
            riskLevel: e.risk_level,
            source: e.source,
            createdAt: e.created_at,
          })),
        },
        predictions: {
          total: (predictions || []).length,
          highRisk: highRiskPredictions,
          recent: (predictions || []).slice(0, 5).map(p => ({
            id: p.id,
            type: p.prediction_type,
            probability: p.probability,
            confidence: p.confidence,
            affectedAgents: p.affected_agents,
            recommendedAction: p.recommended_action,
            priority: p.action_priority,
            createdAt: p.created_at,
          })),
        },
        cascade: {
          vulnerableAgents: cascadeAnalysis.vulnerableAgents.slice(0, 5),
          deadlockedAgents: cascadeAnalysis.deadlockedAgents,
          activeFailureChains: cascadeAnalysis.activeFailureChains,
          primaryRiskFactor: cascadeAnalysis.primaryRiskFactor,
          cascadeFactors: cascadeAnalysis.cascadeFactors.slice(0, 3),
        },
        ledger: {
          total: (ledgerEntries || []).length,
          recent: (ledgerEntries || []).slice(0, 5).map(l => ({
            id: l.id,
            action: l.action,
            riskBefore: l.risk_before,
            riskAfter: l.risk_after,
            riskReduction: l.risk_before - l.risk_after,
            reason: l.metadata?.reason || '',
            createdAt: l.created_at,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting safety status:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to get safety status', details: message },
      { status: 500 }
    );
  }
}
