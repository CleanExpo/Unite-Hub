// POST /api/founder-os/chat
// Proxies to /api/ai/chat with founder-os context, or Anthropic directly
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, history = [] } = body;

  // Try to proxy to internal /api/ai/chat first
  const internalUrl = new URL('/api/ai/chat', req.nextUrl.origin);
  const res = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...Object.fromEntries(req.headers) },
    body: JSON.stringify({
      message,
      context: 'founder_os',
      systemContext: `You are Bron, the AI command officer for the Phill OS founder mobile command centre. You have full context of Unite-Hub and all 6 businesses (Disaster Recovery, RestoreAssist, ATO, Synthex, CCW-ERP, Unite-Hub). Be concise, direct, and action-oriented. Format responses for mobile. History: ${JSON.stringify(history.slice(-5))}`,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    return NextResponse.json({ response: data.response, timestamp: new Date().toISOString() });
  }

  return NextResponse.json({ response: "Bron is unavailable right now. Check your AI configuration.", timestamp: new Date().toISOString() }, { status: 200 });
}
