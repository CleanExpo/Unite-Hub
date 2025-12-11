/**
 * API Route: GET /api/founder/ops/brand-workload
 * Returns workload summaries for all brands
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import { brandRegistry } from '@/lib/brands/brandRegistry';

const logger = createApiLogger({ route: '/api/founder/ops/brand-workload' });

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all brands
    const brands = await brandRegistry.getAllBrands();
    const workloads = [];

    for (const brand of brands) {
      // Get metrics for each brand
      const { data: metricsData, error: metricsError } = await supabase.rpc(
        'get_brand_task_metrics',
        {
          p_workspace_id: workspaceId,
          p_brand_slug: brand.slug,
        }
      );

      if (metricsError) {
        logger.error('Failed to fetch brand metrics', { brand: brand.slug, error: metricsError });
        continue;
      }

      const metrics = metricsData || {};
      const totalTasks = metrics.total_tasks || 0;
      const capacity = Math.min(100, (totalTasks / 100) * 100);

      workloads.push({
        brand_slug: brand.slug,
        brand_name: brand.slug,
        domain: brand.domain,
        current_workload: totalTasks,
        capacity_percentage: Math.round(capacity),
        is_overloaded: capacity > 80,
        recommended_capacity: 100,
        metrics: {
          total_tasks: totalTasks,
          by_status: metrics.by_status || {},
          by_priority: metrics.by_priority || {},
          total_duration_minutes: 0,
          pending_approvals: metrics.pending_approvals || 0,
          next_deadline: metrics.next_deadline,
        },
      });
    }

    return NextResponse.json({ success: true, workloads });
  } catch (error) {
    logger.error('Failed to fetch brand workload', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
