/**
 * Scaling Mode History API
 * Phase 86: List scaling history events
 */

import { NextRequest, NextResponse } from 'next/server';
import { listHistory, listHistoryByType } from '@/lib/scalingMode';

export async function GET(req: NextRequest) {
  try {
    const environment = req.nextUrl.searchParams.get('environment') || 'production';
    const eventType = req.nextUrl.searchParams.get('event_type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    let history;

    if (eventType) {
      history = await listHistoryByType(environment, eventType as any, limit);
    } else {
      history = await listHistory(environment, limit);
    }

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('Scaling history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
