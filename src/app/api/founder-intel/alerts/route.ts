/**
 * Founder Intel Alerts API
 * Phase 80: List alerts with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { listAlerts } from '@/lib/founderIntel/founderIntelAlertService';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.split(',') as any[];
    const severity = searchParams.get('severity')?.split(',') as any[];
    const source_engine = searchParams.get('source_engine')?.split(',') as any[];
    const client_id = searchParams.get('client_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const alerts = await listAlerts({
      status,
      severity,
      source_engine,
      client_id,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error('Alerts list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
