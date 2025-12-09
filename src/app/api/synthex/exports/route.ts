/**
 * Synthex Data Exports API
 * Phase B43: Governance, Audit Logging & Export
 *
 * GET - List data exports
 * POST - Create new data export request
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listDataExports,
  createDataExport,
  DataExport,
} from '@/lib/synthex/auditService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const status = searchParams.get('status') as DataExport['status'] | undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      );
    }

    const exports = await listDataExports(tenantId, { status, limit });

    return NextResponse.json({
      exports,
      count: exports.length,
    });
  } catch (error) {
    console.error('Error in exports GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, export_type, format, filters, date_range_start, date_range_end } = body;

    if (!tenantId || !export_type) {
      return NextResponse.json(
        { error: 'tenantId and export_type are required' },
        { status: 400 }
      );
    }

    const validTypes = [
      'contacts',
      'campaigns',
      'analytics',
      'audit_logs',
      'templates',
      'automations',
      'all_data',
      'gdpr',
    ];

    if (!validTypes.includes(export_type)) {
      return NextResponse.json(
        { error: `export_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const dataExport = await createDataExport(tenantId, user.id, {
      export_type,
      format,
      filters,
      date_range_start,
      date_range_end,
    });

    return NextResponse.json({ export: dataExport }, { status: 201 });
  } catch (error) {
    console.error('Error in exports POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
