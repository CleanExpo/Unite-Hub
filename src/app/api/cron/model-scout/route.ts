// src/app/api/cron/model-scout/route.ts
// Model scout cron job

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
    const result = await runTask('model-scout');
    return NextResponse.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Cron] model-scout failed:', error);
    return NextResponse.json({ error: 'Task failed', details: String(error) }, { status: 500 });
  }
}
