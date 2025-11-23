/**
 * Archive Query API
 * Phase 78: Query archive entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getClientArchiveTimeline,
  getFounderArchiveOverview,
} from '@/lib/archive/archiveQueryService';
import { ArchiveFilters } from '@/lib/archive/archiveTypes';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
      const { data, error } = await supabaseBrowser.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = data.user.id;
    }

    const body = await req.json();
    const {
      client_id,
      workspace_id,
      from,
      to,
      types,
      sources,
      categories,
      importance_min,
      is_demo,
      limit,
      offset,
      view = 'timeline', // 'timeline' or 'overview'
    } = body;

    // Build filters
    const filters: ArchiveFilters = {
      clientId: client_id,
      workspaceId: workspace_id,
      from,
      to,
      types,
      sources,
      categories,
      importanceMin: importance_min,
      isDemo: is_demo,
      limit: limit || 50,
      offset: offset || 0,
    };

    // Get results based on view type
    if (view === 'overview') {
      const overview = await getFounderArchiveOverview(filters);
      return NextResponse.json({
        success: true,
        view: 'overview',
        data: overview,
      });
    }

    const result = await getClientArchiveTimeline(filters);
    return NextResponse.json({
      success: true,
      view: 'timeline',
      data: result,
    });
  } catch (error) {
    console.error('Archive query error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Info endpoint
  return NextResponse.json({
    endpoint: '/api/archive/query',
    method: 'POST',
    parameters: {
      client_id: 'string (optional)',
      workspace_id: 'string (optional)',
      from: 'ISO date string (optional)',
      to: 'ISO date string (optional)',
      types: 'array of event types (optional)',
      sources: 'array of source engines (optional)',
      categories: 'array of categories (optional)',
      importance_min: 'number 0-100 (optional)',
      is_demo: 'boolean (optional)',
      limit: 'number (default 50)',
      offset: 'number (default 0)',
      view: "'timeline' | 'overview' (default 'timeline')",
    },
    event_types: [
      'weekly_report',
      'monthly_report',
      'ninety_day_report',
      'story',
      'touchpoint',
      'success_event',
      'performance_event',
      'creative_event',
      'vif_event',
      'production_event',
      'director_alert',
      'governance_alert',
    ],
    source_engines: [
      'performance',
      'success',
      'creative_ops',
      'creative_director',
      'vif',
      'production',
      'director',
      'governance',
      'reports',
      'storytelling',
      'touchpoints',
    ],
    categories: ['reports', 'stories', 'events', 'alerts', 'milestones'],
  });
}
