import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as dashboardService from '@/lib/erp/dashboardService';

/**
 * GET /api/erp/dashboard
 * Get comprehensive dashboard data
 *
 * Query params:
 * - workspace_id (required)
 * - section (optional): 'metrics' | 'alerts' | 'orders' | 'activity' | 'all'
 */
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

    const workspaceId = request.nextUrl.searchParams.get('workspace_id');
    const section = request.nextUrl.searchParams.get('section') || 'all';

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 });
    }

    // Route to specific section or get all data
    switch (section) {
      case 'metrics':
        const metrics = await dashboardService.getDashboardMetrics(workspaceId);
        return NextResponse.json({ metrics });

      case 'alerts':
        const lowStockAlerts = await dashboardService.getLowStockAlerts(workspaceId);
        return NextResponse.json({ low_stock_alerts: lowStockAlerts });

      case 'orders':
        const pendingOrders = await dashboardService.getPendingOrders(workspaceId);
        return NextResponse.json({ pending_orders: pendingOrders });

      case 'activity':
        const recentActivity = await dashboardService.getRecentActivity(workspaceId);
        return NextResponse.json({ recent_activity: recentActivity });

      case 'all':
      default:
        const dashboardData = await dashboardService.getDashboardData(workspaceId);
        return NextResponse.json(dashboardData);
    }
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
