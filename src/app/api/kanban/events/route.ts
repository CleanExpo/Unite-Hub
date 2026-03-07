// src/app/api/kanban/events/route.ts
import { NextRequest } from 'next/server';
import { subscribeToEvents } from '@/server/obsidian-sync';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const workspaceId = new URL(req.url).searchParams.get('workspace_id') ?? '';

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: string) => controller.enqueue(enc.encode(`data: ${data}\n\n`));

      send(JSON.stringify({ type: 'connected' }));

      const unsubscribe = subscribeToEvents(workspaceId, send);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
