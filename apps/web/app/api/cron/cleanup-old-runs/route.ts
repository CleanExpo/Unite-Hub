import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

/**
 * Cleanup Old Agent Runs Cron Job
 *
 * Runs daily at 2:00 AM (0 2 * * *)
 * Delegates cleanup to the FastAPI backend
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Delegate cleanup to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/agents/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
      body: JSON.stringify({ older_than_days: 30 }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Backend cleanup failed', errorData);
      return NextResponse.json({ error: 'Backend cleanup failed' }, { status: 500 });
    }

    const result = await response.json();

    logger.info('Cleanup cron: Delegated to backend', { result });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cleanup cron error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
