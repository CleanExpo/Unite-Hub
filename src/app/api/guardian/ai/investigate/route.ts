import { NextResponse } from 'next/server';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { runInvestigationQuestion } from '@/lib/guardian/ai/investigationConsole';
import { createClient } from '@/lib/supabase/server';

/**
 * Guardian AI Investigation API (H08)
 * POST /api/guardian/ai/investigate
 *
 * Natural-language query interface for Guardian data.
 * Access: guardian_analyst and guardian_admin
 *
 * Graceful degradation: Returns 503 if AI disabled
 */

const ALLOWED = ['guardian_analyst', 'guardian_admin'];

export async function POST(req: Request) {
  try {
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ALLOWED as unknown as string[]);
    const { tenantId } = await getGuardianTenantContext();

    // Check if ANTHROPIC_API_KEY configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error: 'Guardian investigation console is not configured for this environment.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    const sessionId = body.sessionId || crypto.randomUUID();

    // Validate question
    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: 'question must be 500 characters or less' },
        { status: 400 }
      );
    }

    // Load previous context (last 5 turns in session)
    const supabase = await createClient();
    const { data: previousTurns } = await supabase
      .from('guardian_ai_investigations')
      .select('sequence_index, question, answer_markdown, answer_summary, answer_type')
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId)
      .order('sequence_index', { ascending: true })
      .limit(5);

    const previousContext = previousTurns?.map((t: any) => ({
      sequenceIndex: t.sequence_index,
      question: t.question,
      answerMarkdown: t.answer_markdown,
      answerSummary: t.answer_summary,
      answerType: t.answer_type,
    }));

    // Get next sequence index
    const sequenceIndex = (previousContext?.length ?? 0) + 1;

    // Run investigation
    const answer = await runInvestigationQuestion({
      tenantId,
      sessionId,
      question,
      previousContext,
      createdBy: userId,
    });

    // Store in database
    await supabase.from('guardian_ai_investigations').insert({
      tenant_id: tenantId,
      session_id: sessionId,
      sequence_index: sequenceIndex,
      question,
      answer_markdown: answer.answerMarkdown.slice(0, 5000), // Limit size
      answer_summary: answer.answerSummary?.slice(0, 500),
      answer_type: answer.answerType,
      model: 'claude-sonnet-4-5-20250929',
      key_entities: answer.keyEntities,
      key_time_window: answer.keyTimeWindow,
      created_by: userId,
    });

    console.log('[Guardian H08] Investigation turn stored:', {
      tenantId,
      sessionId,
      sequenceIndex,
    });

    return NextResponse.json({
      sessionId,
      turn: {
        sequenceIndex,
        question,
        answerMarkdown: answer.answerMarkdown,
        answerSummary: answer.answerSummary,
        answerType: answer.answerType,
        keyEntities: answer.keyEntities,
        keyTimeWindow: answer.keyTimeWindow,
      },
      meta: {
        model: 'claude-sonnet-4-5-20250929',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = String(error);

    if (message.includes('FEATURE_DISABLED')) {
      return NextResponse.json(
        {
          error: 'Investigation console is disabled for this tenant.',
          code: 'FEATURE_DISABLED',
        },
        { status: 403 }
      );
    }

    if (message.includes('QUOTA_EXCEEDED')) {
      return NextResponse.json(
        { error: 'Daily AI quota exceeded.', code: 'QUOTA_EXCEEDED' },
        { status: 429 }
      );
    }

    console.error('[Guardian H08] Investigation API failed:', error);
    return NextResponse.json(
      {
        error: 'Unable to process investigation question.',
        details: message.slice(0, 200),
      },
      { status: 500 }
    );
  }
}
