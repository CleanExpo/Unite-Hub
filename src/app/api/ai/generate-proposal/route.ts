/**
 * AI Generate Proposal API Route - Phase 2
 * POST /api/ai/generate-proposal
 * Generates project proposal from idea interpretation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth } from '@/lib/middleware/auth';
import { runAI } from '@/lib/ai/orchestrator';
import { aiAgentRateLimit } from '@/lib/rate-limit';

export const POST = withStaffAuth(async (req) => {
  try {
    // Rate limit AI operations
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}
    const body = await req.json();
    const { ideaId, interpretation } = body;

    if (!ideaId || !interpretation) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, interpretation' },
        { status: 400 }
      );
    }

    const result = await runAI('proposal_generated', {
      ideaId,
      interpretation,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal: result.result,
      provider: result.provider,
    });
  } catch (error) {
    console.error('AI generate proposal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
