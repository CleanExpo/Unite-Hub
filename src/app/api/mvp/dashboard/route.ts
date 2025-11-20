/**
 * MVP Dashboard API
 * Phase 15 Week 3-4
 *
 * GET - Fetch dashboard data
 * POST - Update widget order/preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { mvpDashboardService } from '@/lib/services/MvpDashboardService';
import { supabaseBrowser } from '@/lib/supabase';

// ============================================================================
// GET - Fetch dashboard data
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // Fetch dashboard data
    const dashboardData = await mvpDashboardService.getDashboardData(userId, workspaceId);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('GET /api/mvp/dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update preferences or handle actions
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await req.json();
    const { action, workspaceId, ...params } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'update_preferences':
        result = await mvpDashboardService.updateUserPreferences(userId, workspaceId, {
          widget_order: params.widgetOrder,
          hidden_widgets: params.hiddenWidgets,
          widget_sizes: params.widgetSizes,
          widget_configs: params.widgetConfigs,
          theme: params.theme,
          sidebar_collapsed: params.sidebarCollapsed,
        });
        return NextResponse.json({
          success: true,
          message: 'Preferences updated',
          preferences: result,
        });

      case 'mark_notification_read':
        if (!params.notificationId) {
          return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }
        await mvpDashboardService.markNotificationRead(userId, params.notificationId);
        return NextResponse.json({
          success: true,
          message: 'Notification marked as read',
        });

      case 'dismiss_notification':
        if (!params.notificationId) {
          return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
        }
        await mvpDashboardService.dismissNotification(userId, params.notificationId);
        return NextResponse.json({
          success: true,
          message: 'Notification dismissed',
        });

      case 'create_notification':
        result = await mvpDashboardService.createNotification(userId, workspaceId, {
          type: params.type || 'info',
          title: params.title,
          message: params.message,
          source: params.source || 'user',
          actionUrl: params.actionUrl,
          actionLabel: params.actionLabel,
          priority: params.priority,
          expiresAt: params.expiresAt,
          metadata: params.metadata,
        });
        return NextResponse.json({
          success: true,
          message: 'Notification created',
          notification: result,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: update_preferences, mark_notification_read, dismiss_notification, create_notification` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('POST /api/mvp/dashboard error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
