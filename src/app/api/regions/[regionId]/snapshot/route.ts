/**
 * Region Snapshot API
 * Phase 92: Get and save region scaling snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  getRegionScalingSummary,
  generateRegionSnapshot,
  saveRegionSnapshot,
  getRegionHealthTrend,
} from '@/lib/globalScaling';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { regionId } = await params;

    // Get query params
    const includeHistory = req.nextUrl.searchParams.get('includeHistory') === 'true';
    const periods = parseInt(req.nextUrl.searchParams.get('periods') || '24');

    // Get current summary
    const summary = await getRegionScalingSummary(regionId);

    if (!summary) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    // Get detailed snapshot
    const snapshot = await generateRegionSnapshot(regionId);

    // Optionally include history
    let history = null;
    if (includeHistory) {
      history = await getRegionHealthTrend(regionId, periods);
    }

    return NextResponse.json({
      success: true,
      summary,
      snapshot,
      history,
    });
  } catch (error) {
    console.error('Failed to get region snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ regionId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { regionId } = await params;
    const body = await req.json();
    const periodType = body.periodType || 'hourly';

    // Save snapshot
    await saveRegionSnapshot(regionId, periodType);

    return NextResponse.json({
      success: true,
      message: 'Snapshot saved',
      periodType,
    });
  } catch (error) {
    console.error('Failed to save region snapshot:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
