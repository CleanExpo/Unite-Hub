/**
 * Posting Attempts API
 * Phase 85: List and manage posting attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRecentAttempts,
  getScheduleAttempts,
  getPostingEngineOverview,
  getSchedulerStats,
} from '@/lib/postingEngine';

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const scheduleId = req.nextUrl.searchParams.get('scheduleId');
    const type = req.nextUrl.searchParams.get('type');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    // Get overview
    if (type === 'overview') {
      const overview = await getPostingEngineOverview(workspaceId);
      return NextResponse.json({ data: overview });
    }

    // Get stats
    if (type === 'stats') {
      const stats = await getSchedulerStats(workspaceId, days);
      return NextResponse.json({ data: stats });
    }

    // Get attempts for specific schedule
    if (scheduleId) {
      const attempts = await getScheduleAttempts(scheduleId);
      return NextResponse.json({ data: attempts });
    }

    // Get recent attempts
    const attempts = await getRecentAttempts(workspaceId, limit);
    return NextResponse.json({ data: attempts });
  } catch (error) {
    console.error('Posting attempts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posting attempts' },
      { status: 500 }
    );
  }
}
