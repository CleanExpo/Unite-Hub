/**
 * AI Interpret Idea API Route - Phase 2
 * POST /api/ai/interpret-idea
 * Uses AI orchestrator to interpret client idea submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClientAuth } from '@/lib/middleware/auth';
import { runAI } from '@/lib/ai/orchestrator';
import { aiAgentRateLimit } from '@/lib/rate-limit';

export const POST = withClientAuth(async (req) => {
  try {
    // Rate limit AI operations
    const rateLimitResult = await aiAgentRateLimit(req);
    if (rateLimitResult) {
return rateLimitResult;
}
    const body = await req.json();
    const { ideaId, content } = body;

    if (!ideaId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, content' },
        { status: 400 }
      );
    }

    // Call AI orchestrator
    const result = await runAI('idea_submitted', {
      ideaId,
      content,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interpretation: result.result,
      provider: result.provider,
    });
  } catch (error) {
    console.error('AI interpret idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
