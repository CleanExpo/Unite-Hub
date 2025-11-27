/**
 * API Route: /api/convex/framework-alerts
 *
 * Handles alert rule management for framework monitoring:
 * - GET: Retrieve alert rules with filtering
 * - POST: Create new alert rules
 * - PUT: Update alert rules
 * - DELETE: Remove alert rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

interface AlertRule {
  id: string;
  framework_id: string;
  workspace_id: string;
  alert_type: 'threshold' | 'anomaly' | 'performance' | 'milestone';
  metric_name: string;
  condition: 'above' | 'below' | 'equals' | 'changes_by';
  threshold_value?: number;
  change_percentage?: number;
  notification_channels: ('email' | 'in-app' | 'slack')[];
  enabled: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export async function GET(req: NextRequest) {
  try {
    const frameworkId = req.nextUrl.searchParams.get('frameworkId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const enabled = req.nextUrl.searchParams.get('enabled');
    const type = req.nextUrl.searchParams.get('type');

    if (!frameworkId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing frameworkId or workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check framework access
    const { data: framework, error: fwError } = await supabase
      .from('convex_custom_frameworks')
      .select('id')
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId)
      .single();

    if (fwError || !framework) {
      return NextResponse.json(
        { error: 'Framework not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('convex_framework_alert_rules')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (enabled !== null && enabled !== undefined) {
      query = query.eq('enabled', enabled === 'true');
    }

    if (type) {
      query = query.eq('alert_type', type);
    }

    const { data: alertRules, error } = await query;

    if (error) {
      logger.error('[ALERTS] GET error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve alert rules' },
        { status: 500 }
      );
    }

    // Get alert statistics
    const { data: stats } = await supabase.rpc('get_alert_stats', {
      p_framework_id: frameworkId,
      p_workspace_id: workspaceId,
    });

    // Map to AlertRule interface
    const rules: AlertRule[] = (alertRules || []).map((rule: any) => ({
      id: rule.id,
      framework_id: rule.framework_id,
      workspace_id: rule.workspace_id,
      alert_type: rule.alert_type,
      metric_name: rule.metric_name,
      condition: rule.condition,
      threshold_value: rule.threshold_value,
      change_percentage: rule.change_percentage,
      notification_channels: rule.notification_channels,
      enabled: rule.enabled,
      description: rule.description,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
      created_by: rule.created_by,
    }));

    return NextResponse.json({
      rules,
      summary: {
        total: stats?.[0]?.total_rules || 0,
        active: stats?.[0]?.active_rules || 0,
        recentTriggers: stats?.[0]?.recent_triggers || 0,
        unacknowledgedTriggers: stats?.[0]?.unacknowledged_triggers || 0,
        resolvedTriggers: stats?.[0]?.resolved_triggers || 0,
      },
    });
  } catch (error) {
    logger.error('[ALERTS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      frameworkId,
      workspaceId,
      action,
      alertType,
      metricName,
      condition,
      thresholdValue,
      changePercentage,
      notificationChannels = ['email'],
      description,
    } = body;

    if (!frameworkId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing frameworkId or workspaceId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check framework exists
    const { data: framework, error: fwError } = await supabase
      .from('convex_custom_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId)
      .single();

    if (fwError || !framework) {
      return NextResponse.json(
        { error: 'Framework not found' },
        { status: 404 }
      );
    }

    if (action === 'create') {
      if (!alertType || !metricName || !condition) {
        return NextResponse.json(
          { error: 'Missing required fields: alertType, metricName, condition' },
          { status: 400 }
        );
      }

      // Create new alert rule
      const { data: alertRule, error: insertError } = await supabase
        .from('convex_framework_alert_rules')
        .insert({
          framework_id: frameworkId,
          workspace_id: workspaceId,
          alert_type: alertType,
          metric_name: metricName,
          condition,
          threshold_value: thresholdValue,
          change_percentage: changePercentage,
          notification_channels: notificationChannels,
          enabled: true,
          description,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('[ALERTS] Create error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create alert rule' },
          { status: 500 }
        );
      }

      logger.info(`[ALERTS] Created alert rule: ${alertRule.id}`);

      return NextResponse.json(
        {
          rule: alertRule,
          message: 'Alert rule created successfully',
        },
        { status: 201 }
      );
    } else if (action === 'toggle') {
      const { ruleId, enabled } = body;

      if (!ruleId || enabled === undefined) {
        return NextResponse.json(
          { error: 'Missing ruleId or enabled status' },
          { status: 400 }
        );
      }

      const { data: updatedRule, error: updateError } = await supabase
        .from('convex_framework_alert_rules')
        .update({ enabled })
        .eq('id', ruleId)
        .eq('framework_id', frameworkId)
        .eq('workspace_id', workspaceId)
        .select()
        .single();

      if (updateError) {
        logger.error('[ALERTS] Toggle error:', updateError);
        return NextResponse.json(
          { error: 'Failed to toggle alert rule' },
          { status: 500 }
        );
      }

      logger.info(`[ALERTS] Toggled alert rule: ${ruleId} to ${enabled}`);

      return NextResponse.json({
        rule: updatedRule,
        message: 'Alert rule updated successfully',
      });
    } else if (action === 'delete') {
      const { ruleId } = body;

      if (!ruleId) {
        return NextResponse.json(
          { error: 'Missing ruleId' },
          { status: 400 }
        );
      }

      const { error: deleteError } = await supabase
        .from('convex_framework_alert_rules')
        .delete()
        .eq('id', ruleId)
        .eq('framework_id', frameworkId)
        .eq('workspace_id', workspaceId);

      if (deleteError) {
        logger.error('[ALERTS] Delete error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete alert rule' },
          { status: 500 }
        );
      }

      logger.info(`[ALERTS] Deleted alert rule: ${ruleId}`);

      return NextResponse.json({
        message: 'Alert rule deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[ALERTS] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
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
      frameworkId,
      workspaceId,
      ruleId,
      alertType,
      metricName,
      condition,
      thresholdValue,
      changePercentage,
      notificationChannels,
      description,
    } = body;

    if (!frameworkId || !workspaceId || !ruleId) {
      return NextResponse.json(
        { error: 'Missing frameworkId, workspaceId, or ruleId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Update alert rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('convex_framework_alert_rules')
      .update({
        alert_type: alertType,
        metric_name: metricName,
        condition,
        threshold_value: thresholdValue,
        change_percentage: changePercentage,
        notification_channels: notificationChannels,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .eq('framework_id', frameworkId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (updateError) {
      logger.error('[ALERTS] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update alert rule' },
        { status: 500 }
      );
    }

    logger.info(`[ALERTS] Updated alert rule: ${ruleId}`);

    return NextResponse.json({
      rule: updatedRule,
      message: 'Alert rule updated successfully',
    });
  } catch (error) {
    logger.error('[ALERTS] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
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
    const { frameworkId, workspaceId, ruleId } = body;

    if (!frameworkId || !workspaceId || !ruleId) {
      return NextResponse.json(
        { error: 'Missing frameworkId, workspaceId, or ruleId' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    // Check workspace access
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (orgError || !orgData || !['owner', 'editor'].includes(orgData.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete alert rule
    const { error: deleteError } = await supabase
      .from('convex_framework_alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('framework_id', frameworkId)
      .eq('workspace_id', workspaceId);

    if (deleteError) {
      logger.error('[ALERTS] Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete alert rule' },
        { status: 500 }
      );
    }

    logger.info(`[ALERTS] Deleted alert rule: ${ruleId}`);

    return NextResponse.json({
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    logger.error('[ALERTS] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
