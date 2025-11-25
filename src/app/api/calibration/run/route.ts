/**
 * POST /api/calibration/run
 *
 * Initiates a new autonomy calibration cycle:
 * - Analyzes system metrics
 * - Proposes parameter adjustments
 * - Tuning model applies changes
 * - Threshold adjustments for risk detection
 * - Archives results to memory
 *
 * Rate limit: 10 req/min (calibration is resource-intensive)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';
import { alignmentCalibrationEngine, autonomyTuningModel, thresholdAdjustmentModel, calibrationArchiveBridge } from '@/lib/autonomy';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 req/min
    const rateLimitResult = checkRateLimit({
      identifier: 'calibration-run',
      limit: 10,
      window: 60,
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': rateLimitResult.retryAfter.toString() } }
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

    // 1. Run calibration analysis
    const calibrationCycle = await alignmentCalibrationEngine.analyzeAndPropose({
      workspaceId,
      lookbackHours: 24, // Analyze last 24 hours
    });

    // 2. Get current parameters for tuning model
    const { data: currentParameters } = await supabase
      .from('autonomy_calibration_parameters')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('applied_at', { ascending: false })
      .limit(1);

    // Prepare default parameters if none exist
    const params = currentParameters?.[0] || {
      agent_weights: {
        orchestrator: 0.6,
        reasoning_engine: 0.5,
        autonomy_engine: 0.7,
        desktop_agent: 0.4,
      },
      risk_weights: {
        cascade_risk: 0.7,
        deadlock_risk: 0.6,
        memory_corruption: 0.8,
      },
      uncertainty_scaling: 1.0,
      reasoning_depth_allocation: {
        complex_analysis: 10000,
        medium_analysis: 5000,
        simple_tasks: 2000,
      },
      orchestration_schedule: {
        orchestrator_frequency: 50,
        parallel_agents: 3,
      },
    };

    // 3. Apply tuning model
    const tuningResult = await autonomyTuningModel.applyCalibrationProposal({
      workspaceId,
      cycleId: calibrationCycle.cycleId,
      proposals: calibrationCycle.proposedChanges,
      metrics: {
        falsePositiveRate: calibrationCycle.findings.falsePositiveRate,
        falseNegativeRate: calibrationCycle.findings.falseNegativeRate,
        cascadeRiskDetected: false,
        deadlockRiskDetected: false,
        memoryCorruptionRisk: false,
        predictionAccuracy: calibrationCycle.findings.predictionAccuracy,
        enforcementEffectiveness: 0,
      },
      currentParameters: params,
    });

    // 4. Propose threshold adjustments
    const thresholdProposals = await thresholdAdjustmentModel.proposeAdjustments({
      workspaceId,
      cycleId: calibrationCycle.cycleId,
      currentThresholds: {
        risk_threshold_critical: 80,
        risk_threshold_high: 65,
        uncertainty_threshold: 75,
        cascade_risk_threshold: 75,
        deadlock_risk_threshold: 70,
        memory_corruption_threshold: 85,
      },
      metrics: {
        falsePositiveRate: calibrationCycle.findings.falsePositiveRate,
        falseNegativeRate: calibrationCycle.findings.falseNegativeRate,
        cascadeRiskDetected: false,
        deadlockRiskDetected: false,
        memoryCorruptionRisk: false,
        predictionAccuracy: calibrationCycle.findings.predictionAccuracy,
        enforcementEffectiveness: 0,
      },
    });

    // 5. Archive results
    await calibrationArchiveBridge.archiveCalibrationCycle({
      workspaceId,
      cycleId: calibrationCycle.cycleId,
      cycleNumber: calibrationCycle.cycleNumber,
      metricsAnalyzed: {
        false_positives: 0,
        false_negatives: 0,
        prediction_accuracy: calibrationCycle.findings.predictionAccuracy,
        system_health_score: calibrationCycle.findings.systemHealthScore,
      },
      proposedChanges: calibrationCycle.proposedChanges,
      appliedChanges: tuningResult.adjustmentsApplied,
      overallConfidence: tuningResult.overallConfidenceScore,
      systemHealthBefore: 70, // Placeholder
      systemHealthAfter: calibrationCycle.findings.systemHealthScore,
      findings: calibrationCycle.recommendedActions.join('\n'),
      recommendations: calibrationCycle.recommendedActions,
    });

    return NextResponse.json({
      success: true,
      calibrationCycle: {
        cycleId: calibrationCycle.cycleId,
        cycleNumber: calibrationCycle.cycleNumber,
        status: calibrationCycle.status,
        proposedChanges: calibrationCycle.proposedChanges.length,
        appliedChanges: tuningResult.adjustmentsApplied.length,
        thresholdProposals: thresholdProposals.length,
      },
      tuning: {
        adjustmentsApplied: tuningResult.adjustmentsApplied.length,
        overallConfidence: tuningResult.overallConfidenceScore,
        parametersLocked: tuningResult.parametersLocked,
      },
      findings: {
        falsePositiveRate: calibrationCycle.findings.falsePositiveRate,
        falseNegativeRate: calibrationCycle.findings.falseNegativeRate,
        predictionAccuracy: calibrationCycle.findings.predictionAccuracy.toFixed(1) + '%',
        systemHealthScore: calibrationCycle.findings.systemHealthScore,
      },
    });
  } catch (error) {
    console.error('Calibration run error:', error);
    return NextResponse.json(
      { error: 'Failed to run calibration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
