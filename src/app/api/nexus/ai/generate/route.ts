/**
 * POST /api/nexus/ai/generate — AI text generation for BlockEditor slash commands
 *
 * Body: { prompt: string, mode: 'write' | 'summarise' | 'improve', context?: string }
 * Returns: { text: string }
 * Model: claude-haiku-4-5-20251001 (fast + cheap)
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

const SYSTEM_PROMPTS: Record<string, string> = {
  write:
    'You are a concise business writing assistant. Continue writing naturally from the given prompt. Output only the continuation text, no preamble.',
  summarise:
    'You are a concise summarisation assistant. Summarise the given text in 1-3 sentences. Output only the summary, no preamble.',
  improve:
    'You are a writing improvement assistant. Rewrite the given text to be clearer, more professional, and more concise. Output only the improved text, no preamble.',
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

    const body = await req.json();
    const { prompt, mode, context } = body as {
      prompt?: string;
      mode?: string;
      context?: string;
    };

    if (!prompt || !mode || !SYSTEM_PROMPTS[mode]) {
      return NextResponse.json(
        { error: 'Missing prompt or invalid mode. Use: write | summarise | improve' },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    const userContent = context ? `Context:\n${context}\n\nTask:\n${prompt}` : prompt;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPTS[mode],
      messages: [{ role: 'user', content: userContent }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    const text = textBlock ? textBlock.text : '';

    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/nexus/ai/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
