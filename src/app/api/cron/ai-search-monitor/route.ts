/**
 * Vercel Cron: AI Search Algorithm Monitor
 * Scheduled to run every 6 hours
 * Detects changes in Google AI Overview, Bing Copilot, Perplexity algorithms
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitorAISearchChanges } from '@/lib/agents/ai-search-monitor';

/**
 * Handler for cron-triggered monitoring
 * Runs every 6 hours: 0 asterisk/6 asterisk asterisk asterisk
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (prevent unauthorized invocations)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.VERCEL_CRON_SECRET || '';

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 Starting AI Search monitor cron job');
    const startTime = Date.now();

    // Run monitoring
    const detectedChanges = await monitorAISearchChanges();

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        message: `AI Search monitoring completed in ${duration}ms`,
        changesDetected: detectedChanges.length,
        changes: detectedChanges.map((c) => ({
          source: c.source,
          description: c.description,
          confidence: c.confidenceScore,
          industries: c.affectedIndustries,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Manual trigger endpoint (for testing)
 * Usage: POST /api/cron/ai-search-monitor?secret=YOUR_CRON_SECRET
 */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.VERCEL_CRON_SECRET || '';

  if (!secret || secret !== cronSecret) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    );
  }

  try {
    console.log('🔄 Manual trigger of AI Search monitor');
    const detectedChanges = await monitorAISearchChanges();

    return NextResponse.json(
      {
        success: true,
        changesDetected: detectedChanges.length,
        changes: detectedChanges,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during manual trigger:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
