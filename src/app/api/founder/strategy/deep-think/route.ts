/**
 * POST /api/founder/strategy/deep-think
 * Uses Claude Opus 4.6 with extended thinking to provide deep strategic analysis.
 * Streams the response back to the client.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a world-class business strategist with deep expertise in multi-business portfolio management, market analysis, and operational excellence. You serve a founder who runs multiple businesses across disaster recovery, technology, compliance, and emerging sectors in Australia.

When thinking through strategic questions:
- Consider cross-business synergies and conflicts
- Analyse market dynamics specific to Australian business context
- Think in terms of first principles and second-order effects
- Provide concrete, actionable recommendations with clear next steps
- Consider financial implications including cash flow, runway, and ROI
- Factor in team capacity and operational constraints
- Identify blind spots and risks the founder may not have considered

Format your response with clear sections using markdown headers. Use bullet points for actionable items. Be direct and avoid filler.`;

const BUSINESS_CONTEXT_MAP: Record<string, string> = {
  DR: 'Disaster Recovery (DRA.com.au) — disaster restoration services, insurance work, water/fire/mould remediation',
  RestoreAssist: 'RestoreAssist — SaaS platform for restoration companies, job management, compliance tracking',
  ATO: 'ATO Compliance — tax compliance advisory, BAS lodgement, bookkeeping services',
  NRPG: 'NRPG (National Restoration Products Group) — procurement and supply chain for restoration industry',
  'Unite-Group': 'Unite-Group — the holding company and CRM/AI platform connecting all businesses',
  CARSI: 'CARSI (Community and Recovery Support Initiative) — community support and recovery programmes',
  All: 'All businesses in the portfolio: DR, RestoreAssist, ATO Compliance, NRPG, Unite-Group, CARSI',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { question, businessContext } = await req.json();

    if (!question || typeof question !== 'string' || question.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a strategic question (at least 5 characters).' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build user message with optional business context
    let userMessage = question.trim();
    if (businessContext && BUSINESS_CONTEXT_MAP[businessContext]) {
      userMessage = `[Business Context: ${BUSINESS_CONTEXT_MAP[businessContext]}]\n\n${userMessage}`;
    }

    // Stream with extended thinking
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      thinking: {
        type: 'enabled',
        budget_tokens: 8000,
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let sentThinkingMarker = false;
          let sentTextMarker = false;

          stream.on('contentBlockStart', (event) => {
            if (event.content_block.type === 'thinking' && !sentThinkingMarker) {
              sentThinkingMarker = true;
              controller.enqueue(encoder.encode('__THINKING_START__\n'));
            } else if (event.content_block.type === 'text' && !sentTextMarker) {
              sentTextMarker = true;
              controller.enqueue(encoder.encode('\n__TEXT_START__\n'));
            }
          });

          stream.on('text', (text) => {
            controller.enqueue(encoder.encode(text));
          });

          await stream.finalMessage();
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/strategy/deep-think]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
