// src/app/api/cron/content-queue/route.ts
// Content queue processor cron job

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { runTask } = await import('@/lib/cron/scheduled-tasks');
    const result = await runTask('content-queue-processor');
    return NextResponse.json(result);
  } catch (error) {
     
    console.error('[Cron] content-queue failed:', error);
    return NextResponse.json({ error: 'Task failed', details: String(error) }, { status: 500 });
  }
}
