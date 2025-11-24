/**
 * Compliance Incidents API
 * Phase 93: List and manage compliance incidents
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import {
  listIncidents,
  getIncidentSummary,
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

    // Get agency from query params or user's current agency
    const agencyId = req.nextUrl.searchParams.get('agencyId');
    if (!agencyId) {
      return NextResponse.json(
        { error: 'Missing agencyId parameter' },
        { status: 400 }
      );
    }

    // Get filters
    const severity = req.nextUrl.searchParams.get('severity') as any;
    const status = req.nextUrl.searchParams.get('status') as any;
    const platform = req.nextUrl.searchParams.get('platform') || undefined;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
    const includeSummary = req.nextUrl.searchParams.get('includeSummary') === 'true';

    // Get incidents
    const incidents = await listIncidents(agencyId, {
      severity,
      status,
      platform,
      limit,
      offset,
    });

    // Optionally include summary
    let summary = null;
    if (includeSummary) {
      summary = await getIncidentSummary(agencyId);
    }

    return NextResponse.json({
      success: true,
      incidents,
      summary,
      pagination: {
        limit,
        offset,
        count: incidents.length,
      },
    });
  } catch (error) {
    console.error('Failed to get incidents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
