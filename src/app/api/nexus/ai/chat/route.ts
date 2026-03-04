/**
 * POST /api/nexus/ai/chat — Bron AI chat with streaming
 *
 * Body: { messages: [{role, content}], pageContext?: string }
 * Returns: streaming text/event-stream
 * Model: claude-sonnet-4-6
 */
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

const BRON_SYSTEM = `You are Bron, the Unite-Group AI assistant. You help with business strategy, writing, and data analysis.

Guidelines:
- Be concise and direct
- Use Australian English (colour, behaviour, optimise)
- When given page context, reference it naturally
- Format responses with markdown when helpful
- Focus on actionable insights`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorised' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { messages, pageContext } = body as {
      messages?: ChatMessage[];
      pageContext?: string;
    };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = pageContext
      ? `${BRON_SYSTEM}\n\nCurrent page context:\n${pageContext}`
      : BRON_SYSTEM;

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error('[Bron stream error]', err);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/nexus/ai/chat]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
