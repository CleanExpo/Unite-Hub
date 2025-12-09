// src/app/api/cron/status/route.ts
// Get cron job status

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { SCHEDULED_TASKS } = await import('@/lib/cron/scheduled-tasks');

    return NextResponse.json({
      success: true,
      tasks: SCHEDULED_TASKS.map((task) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        schedule: task.schedule,
        enabled: task.enabled,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      })),
      timezone: 'Australia/Brisbane',
    });
  } catch (error) {
     
    console.error('[API] Cron status error:', error);
    return NextResponse.json(
      { error: 'Failed to get status', details: String(error) },
      { status: 500 }
    );
  }
}
