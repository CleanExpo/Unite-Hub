/**
 * GET /api/calibration/status
 *
 * Returns current calibration status and recent history:
 * - Latest calibration cycle status
 * - System health trend
 * - Recent adjustments applied
 * - Detected patterns
 * - Overall improvement metrics
 *
 * Rate limit: 30 req/min
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { calibrationArchiveBridge } from '@/lib/autonomy';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 30 req/min
    const rateLimitResult = checkRateLimit('calibration-status', {
      requests: 30,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
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

    // Get workspace ID
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId parameter' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // 1. Get latest calibration cycle
    const { data: latestCycle } = await supabase
      .from('autonomy_calibration_cycles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 2. Get system improvement metrics
    const improvement = await calibrationArchiveBridge.calculateSystemImprovement({
      workspaceId,
      lookbackDays: 30,
    });

    // 3. Get recent adjustments
    const { data: recentAdjustments } = await supabase
      .from('autonomy_tuning_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Get detected patterns
    const patterns = await calibrationArchiveBridge.getDetectedPatterns({
      workspaceId,
      minOccurrences: 2,
    });

    // 5. Get calibration history for trend
    const { data: history } = await supabase
      .from('calibration_archives')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('archived_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      latestCycle: latestCycle ? {
        cycleId: latestCycle.id,
        cycleNumber: latestCycle.cycle_number,
        status: latestCycle.status,
        createdAt: latestCycle.created_at,
        requiresApproval: latestCycle.requires_approval,
      } : null,
      systemImprovement: {
        averageImprovement: improvement.totalImprovement.toFixed(1) + '%',
        calibrationsCount: improvement.calibrationsCount,
        averageConfidence: improvement.avgConfidence,
      },
      recentAdjustments: recentAdjustments?.map(r => ({
        tuningId: r.tuning_id,
        confidence: r.confidence_score,
        appliedCount: (r.adjustments_applied as any[])?.length || 0,
        parametersLocked: r.parameters_locked,
        createdAt: r.created_at,
      })) || [],
      detectedPatterns: patterns.map(p => ({
        patternName: p.patternName,
        occurrences: p.occurrences,
        avgConfidence: p.avgConfidence,
        successRate: p.successRate.toFixed(1) + '%',
      })),
      systemHealthTrend: history?.map(h => ({
        cycleNumber: h.cycle_number,
        healthBefore: h.system_health_before,
        healthAfter: h.system_health_after,
        improvement: h.improvement_percentage?.toFixed(1) + '%',
        timestamp: h.archived_at,
      })) || [],
    });
  } catch (error) {
    console.error('Calibration status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calibration status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
