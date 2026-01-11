/**
 * Guardian Z10: Meta Governance Advice API
 * GET: Generate AI-powered governance advice for Z-series rollout (flag-gated, optional)
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  generateMetaGovernanceAdvice,
  getFallbackMetaGovernanceAdvice,
  type GuardianMetaGovernanceContext,
} from '@/lib/guardian/meta/metaGovernanceAiHelper';
import { loadMetaGovernancePrefsForTenant } from '@/lib/guardian/meta/metaGovernanceService';
import { computeMetaStackReadiness } from '@/lib/guardian/meta/metaStackReadinessService';

/**
 * GET /api/guardian/meta/governance/advice?workspaceId=...
 * Generate governance advice (flag-gated, returns fallback if AI disabled)
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) return errorResponse('workspaceId required', 400);

  await validateUserAndWorkspace(req, workspaceId);

  // Load governance preferences and readiness
  const prefs = await loadMetaGovernancePrefsForTenant(workspaceId);
  const readiness = await computeMetaStackReadiness(workspaceId);

  // Check if AI is allowed (master policy gate)
  if (prefs.aiUsagePolicy === 'off') {
    return successResponse({
      advice: {
        headline: 'AI Governance Advisor is disabled',
        recommendations: [
          'Enable AI usage in governance preferences to receive AI-powered advice',
          'Set ai_usage_policy to "limited" or "advisory" to unlock governance recommendations',
        ],
        cautions: [
          'AI advisor provides advisory guidance only, not automatic configuration',
        ],
      },
      source: 'fallback',
    });
  }

  // Build governance context for AI
  const ctx: GuardianMetaGovernanceContext = {
    riskPosture: prefs.riskPosture,
    aiUsagePolicy: prefs.aiUsagePolicy,
    externalSharingPolicy: prefs.externalSharingPolicy,
    readiness,
    metaUsageSummary: {
      metaPagesVisitedLast30d: 0, // TODO: Track via analytics
      execReportsCreatedLast90d: 0, // TODO: Load from guardian_executive_reports
      adoptionScoreCore: undefined, // TODO: Load from adoption scores
    },
    timeframeLabel: 'Last 30 days',
  };

  try {
    // Generate AI advice
    const advice = await generateMetaGovernanceAdvice(ctx);
    return successResponse({
      advice,
      source: 'ai',
    });
  } catch (error) {
    console.error('Failed to generate AI advice, returning fallback:', error);

    // Return fallback advice on error
    const fallback = getFallbackMetaGovernanceAdvice(prefs.riskPosture);
    return successResponse({
      advice: fallback,
      source: 'fallback',
      error: 'AI advice generation failed, returning fallback recommendations',
    });
  }
});
