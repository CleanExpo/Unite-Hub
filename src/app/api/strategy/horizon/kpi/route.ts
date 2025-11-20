/**
 * GET/POST /api/strategy/horizon/kpi
 * Get KPI trends or create KPI snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseBrowser, getSupabaseServer } from '@/lib/supabase';
import { kpiTrackingService, KPIDomain } from '@/lib/strategy/kpiTrackingService';

const createSnapshotSchema = z.object({
  organization_id: z.string().uuid(),
  snapshot_type: z.enum(['BASELINE', 'CURRENT', 'PROJECTED', 'TARGET', 'MILESTONE']),
  domain: z.enum(['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO', 'EMAIL', 'SOCIAL', 'OVERALL']),
  metric_name: z.string(),
  metric_value: z.number(),
  metric_unit: z.string().optional(),
  baseline_value: z.number().optional(),
  target_value: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  data_quality: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  horizon_plan_id: z.string().uuid().optional(),
  horizon_step_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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

    const organizationId = req.nextUrl.searchParams.get('organization_id');
    const domain = req.nextUrl.searchParams.get('domain') as KPIDomain | null;
    const action = req.nextUrl.searchParams.get('action') || 'trends';

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let result: unknown;

    switch (action) {
      case 'trends':
        result = await kpiTrackingService.getKPITrends(organizationId, domain || undefined);
        break;
      case 'current':
        result = await kpiTrackingService.getCurrentKPIs(organizationId, domain || undefined);
        break;
      case 'summary':
        if (!domain) {
          return NextResponse.json(
            { error: 'domain is required for summary action' },
            { status: 400 }
          );
        }
        result = await kpiTrackingService.getDomainSummary(organizationId, domain);
        break;
      case 'projections':
        if (!domain) {
          return NextResponse.json(
            { error: 'domain is required for projections action' },
            { status: 400 }
          );
        }
        const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
        result = await kpiTrackingService.projectKPIs(organizationId, domain, days);
        break;
      case 'definitions':
        result = kpiTrackingService.getKPIDefinitions(domain || undefined);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
    });
  } catch (error) {
    console.error('KPI GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get KPI data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
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
    const validation = createSnapshotSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const supabase = await getSupabaseServer();
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', validation.data.organization_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const snapshot = await kpiTrackingService.createSnapshot(validation.data);

    return NextResponse.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('KPI POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create KPI snapshot' },
      { status: 500 }
    );
  }
}
