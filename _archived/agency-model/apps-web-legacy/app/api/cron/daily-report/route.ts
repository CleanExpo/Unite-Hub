import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Daily Agent Report Cron Job
 *
 * Runs daily at 9:00 AM (0 9 * * *)
 * Fetches yesterday's agent activity summary from the backend
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch report from FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/agents/performance/trends?days=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Backend report fetch failed', errorData);
      return NextResponse.json({ error: 'Backend report failed' }, { status: 500 });
    }

    const trends = await response.json();

    const report = {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      trends,
    };

    logger.info('Daily report generated', { report });

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Daily report cron error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
