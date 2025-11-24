/**
 * Performance Reality External Signals API
 * Phase 81: GET list, POST create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getExternalSignals,
  createExternalSignal,
  seedHolidaysForRegion,
} from '@/lib/performanceReality';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Parse query params
    const startDate = req.nextUrl.searchParams.get('start_date');
    const endDate = req.nextUrl.searchParams.get('end_date');
    const region = req.nextUrl.searchParams.get('region') || undefined;

    // Default to last 30 days
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const signals = await getExternalSignals(start, end, region);

    return NextResponse.json({
      success: true,
      data: signals,
    });
  } catch (error) {
    console.error('Error in GET /api/performance-reality/external-signals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    // Check if this is a seed request
    if (body.action === 'seed_holidays') {
      const { year, region } = body;
      if (!year || !region) {
        return NextResponse.json(
          { error: 'year and region required for seeding' },
          { status: 400 }
        );
      }

      const count = await seedHolidaysForRegion(year, region);
      return NextResponse.json({
        success: true,
        message: `Seeded ${count} holidays for ${region} ${year}`,
      });
    }

    // Regular signal creation
    const { signal_type, name, description, start_date, end_date, region, impact_hint, source, metadata } = body;

    if (!signal_type || !name || !start_date || !end_date || !impact_hint) {
      return NextResponse.json(
        { error: 'signal_type, name, start_date, end_date, and impact_hint are required' },
        { status: 400 }
      );
    }

    const signal = await createExternalSignal({
      signal_type,
      name,
      description: description || '',
      start_date,
      end_date,
      region: region || null,
      impact_hint,
      source: source || 'manual',
      metadata: metadata || {},
    });

    if (!signal) {
      return NextResponse.json(
        { error: 'Failed to create signal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signal,
    });
  } catch (error) {
    console.error('Error in POST /api/performance-reality/external-signals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
