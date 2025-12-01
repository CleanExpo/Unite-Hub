/**
 * GET /api/optimizer/profile
 *
 * Returns the current execution adaptation profile:
 * - Recommended parallelism level
 * - Reasoning token allocation strategy
 * - Context size recommendations
 * - Agent selection guidance
 * - Ordering optimizations
 *
 * Rate limit: 30 req/min (read-only, cached queries)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 30 req/min
    const rateLimitResult = checkRateLimit('optimizer-profile', {
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

    // 1. Get latest adaptation profile
    const { data: latestProfile } = await supabase
      .from('execution_adaptation_profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 2. Get profile history (last 10)
    const { data: profileHistory } = await supabase
      .from('execution_adaptation_profiles')
      .select('profile_id, profile_name, adaptation_score, resource_cost_estimate, resource_duration_estimate, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 3. Calculate trends
    let trendingParallelismReduction = 0;
    let trendingReasoningReduction = 0;
    let trendingContextReduction = 0;
    let avgAdaptationScore = 0;

    if (profileHistory && profileHistory.length > 0) {
      avgAdaptationScore = profileHistory.reduce((sum, p) => sum + (p.adaptation_score || 0), 0) / profileHistory.length;
    }

    // 4. Get optimization correlation (how profile choices correlate with success)
    const { data: recentResults } = await supabase
      .from('execution_optimizer_results')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    let profileEffectiveness = 0;
    if (recentResults && recentResults.length > 0) {
      const successCount = recentResults.filter(r => r.workflow_success).length;
      profileEffectiveness = (successCount / recentResults.length) * 100;
    }

    // Default profile if none exists
    const currentProfile = latestProfile?.[0] || {
      profile_id: 'default',
      profile_name: 'Balanced',
      adaptation_score: 50,
      resource_cost_estimate: 0.05,
      resource_duration_estimate: 3000,
      parallelism_reduction: 0,
      reasoning_token_reduction: 0,
      context_size_reduction: 0,
      agent_switch_recommendations: [],
      ordering_optimizations: [],
      explainability_notes: 'System initializing - no historical data available',
      created_at: new Date().toISOString(),
    };

    // 5. Construct response with recommendations
    const profileName = currentProfile.profile_name || 'Unknown';
    const recommendedProfile = {
      conservative: {
        label: 'Conservative',
        description: 'Prioritizes stability and safety',
        parallelismReduction: -20,
        reasoningTokenReduction: -10,
        contextSizeReduction: -15,
        bestFor: 'High-risk operations, critical workflows',
      },
      balanced: {
        label: 'Balanced',
        description: 'Balanced approach for typical workloads',
        parallelismReduction: 0,
        reasoningTokenReduction: 0,
        contextSizeReduction: 0,
        bestFor: 'General-purpose workflows',
      },
      aggressive: {
        label: 'Aggressive',
        description: 'Optimizes for speed and throughput',
        parallelismReduction: 20,
        reasoningTokenReduction: 15,
        contextSizeReduction: 10,
        bestFor: 'High-volume operations with healthy system',
      },
    };

    return NextResponse.json({
      success: true,
      currentProfile: {
        profileId: currentProfile.profile_id,
        profileName: currentProfile.profile_name,
        adaptationScore: currentProfile.adaptation_score,
        resourceCostEstimate: parseFloat((currentProfile.resource_cost_estimate || 0).toFixed(4)),
        resourceDurationEstimate: Math.round(currentProfile.resource_duration_estimate || 0),
        adaptations: {
          parallelismReduction: currentProfile.parallelism_reduction || 0,
          reasoningTokenReduction: currentProfile.reasoning_token_reduction || 0,
          contextSizeReduction: currentProfile.context_size_reduction || 0,
          agentSwitchRecommendations: currentProfile.agent_switch_recommendations || [],
          orderingOptimizations: currentProfile.ordering_optimizations || [],
        },
        explainabilityNotes: currentProfile.explainability_notes || '',
        createdAt: currentProfile.created_at,
      },
      metrics: {
        avgAdaptationScore: parseFloat(avgAdaptationScore.toFixed(1)),
        profileEffectiveness: parseFloat(profileEffectiveness.toFixed(1)),
      },
      recommendations: recommendedProfile,
      history: (profileHistory || []).map(p => ({
        profileId: p.profile_id,
        profileName: p.profile_name,
        adaptationScore: p.adaptation_score,
        resourceCostEstimate: parseFloat((p.resource_cost_estimate || 0).toFixed(4)),
        resourceDurationEstimate: Math.round(p.resource_duration_estimate || 0),
        createdAt: p.created_at,
      })),
      systemRecommendation: {
        recommended: profileName === 'Conservative' ? 'balanced' : profileName === 'Balanced' ? 'aggressive' : 'balanced',
        reason: profileEffectiveness >= 85
          ? 'Current profile is highly effective - consider slight aggression'
          : profileEffectiveness >= 70
          ? 'Current profile is working well - maintain current settings'
          : 'Success rate is concerning - shift towards conservative approach',
        confidence: parseFloat(avgAdaptationScore.toFixed(1)),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Optimizer profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimizer profile', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
