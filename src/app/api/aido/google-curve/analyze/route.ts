import { NextRequest, NextResponse } from 'next/server';
import { checkTierRateLimit } from '@/lib/rate-limit-tiers';
import { getSerpObservation } from '@/lib/aido/database/serp-observations';
import { createChangeSignal } from '@/lib/aido/database/change-signals';
import { createStrategyRecommendation } from '@/lib/aido/database/strategy-recommendations';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabaseBrowser } = await import('@/lib/supabase');
    const { data, error } = await supabaseBrowser.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // AI rate limiting (Extended Thinking is expensive)
    const rateLimitResult = await checkTierRateLimit(req, data.user.id, 'ai');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error,
          message: 'Google Curve analysis requires Extended Thinking AI. Upgrade to increase quota.'
        },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const body = await req.json();
    const { clientId, keyword, days } = body;

    if (!clientId || !keyword) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, keyword' },
        { status: 400 }
      );
    }

    // Fetch SERP history
    const history = await getSerpObservation(
      workspaceId,
      keyword,
      days || 30
    );

    if (history.length < 2) {
      return NextResponse.json({
        success: true,
        signals: [],
        recommendations: [],
        message: 'Insufficient data for analysis. Need at least 2 observations.'
      });
    }

    // Analyze for changes (this would use Claude Opus 4 Extended Thinking in production)
    // For now, we'll create placeholder signals and recommendations

    const signals = [];
    const recommendations = [];

    // Detect position changes
    const recentPosition = history[0].position;
    const previousPosition = history[1].position;
    const positionChange = previousPosition - recentPosition;

    if (Math.abs(positionChange) >= 5) {
      const signal = await createChangeSignal({
        clientId,
        workspaceId,
        pillarId: 'google_curve',
        signalType: 'ranking_shift',
        severity: Math.abs(positionChange) >= 10 ? 'major' : 'moderate',
        description: `Keyword "${keyword}" ${positionChange > 0 ? 'improved' : 'dropped'} ${Math.abs(positionChange)} positions`,
        rawEvidence: {
          keyword,
          previousPosition,
          currentPosition: recentPosition,
          change: positionChange,
          observations: history.slice(0, 5)
        }
      });

      signals.push(signal);

      // Create recommendation
      const recommendation = await createStrategyRecommendation({
        clientId,
        workspaceId,
        pillarId: 'google_curve',
        title: `Address ranking ${positionChange > 0 ? 'improvement' : 'drop'} for "${keyword}"`,
        description: positionChange > 0
          ? `Keyword improved ${Math.abs(positionChange)} positions. Analyze winning factors and replicate.`
          : `Keyword dropped ${Math.abs(positionChange)} positions. Immediate content refresh required.`,
        priority: Math.abs(positionChange) >= 10 ? 'urgent' : 'high',
        actions: [
          {
            step: 1,
            description: 'Review SERP features and AI answer changes',
            estimatedHours: 1
          },
          {
            step: 2,
            description: positionChange > 0
              ? 'Document winning content patterns'
              : 'Update content with fresh data and examples',
            estimatedHours: positionChange > 0 ? 2 : 4
          },
          {
            step: 3,
            description: 'Monitor for 7 days to confirm trend',
            estimatedHours: 0.5
          }
        ],
        estimatedImpact: Math.abs(positionChange) >= 10 ? 'high' : 'medium'
      });

      recommendations.push(recommendation);
    }

    // Detect AI answer changes
    const recentAIPresence = history.filter(h => h.aiAnswerPresent).length;
    const aiPresenceRate = recentAIPresence / history.length;

    if (aiPresenceRate > 0.7) {
      const signal = await createChangeSignal({
        clientId,
        workspaceId,
        pillarId: 'google_curve',
        signalType: 'ai_answer_format_change',
        severity: 'moderate',
        description: `AI Overviews appearing in ${(aiPresenceRate * 100).toFixed(0)}% of searches for "${keyword}"`,
        rawEvidence: {
          keyword,
          aiPresenceRate,
          observations: history.slice(0, 5)
        }
      });

      signals.push(signal);
    }

    return NextResponse.json({
      success: true,
      signals,
      recommendations,
      analysis: {
        keyword,
        observationCount: history.length,
        daysCovered: days || 30,
        positionChange,
        aiPresenceRate: (aiPresenceRate * 100).toFixed(1) + '%',
        trend: positionChange > 0 ? 'improving' : positionChange < 0 ? 'declining' : 'stable'
      },
      estimatedCost: '$2.00', // Claude Opus 4 Extended Thinking
      message: 'Google Curve analysis complete'
    });

  } catch (error: unknown) {
    console.error('Analyze Google Curve error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
