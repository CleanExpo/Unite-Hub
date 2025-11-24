/**
 * Compliance Policies API
 * Phase 93: List active policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import {
  getActivePolicies,
  getPolicyCoverage,
} from '@/lib/compliance';

export async function GET(req: NextRequest) {
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

    // Get filters
    const regionSlug = req.nextUrl.searchParams.get('regionSlug');
    const platform = req.nextUrl.searchParams.get('platform');
    const includeCoverage = req.nextUrl.searchParams.get('includeCoverage') === 'true';

    // If region and platform specified, get specific policies
    let policies = null;
    if (regionSlug && platform) {
      policies = await getActivePolicies(regionSlug, platform);
    }

    // Optionally include coverage stats
    let coverage = null;
    if (includeCoverage) {
      coverage = await getPolicyCoverage();
    }

    return NextResponse.json({
      success: true,
      policies,
      coverage,
    });
  } catch (error) {
    console.error('Failed to get policies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
