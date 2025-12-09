/**
 * Synthex Funnel Drop-Off Detection API
 *
 * GET - Funnels, events, dropoffs, alerts, metrics, stats
 * POST - Create funnels, track events, analyze dropoffs, manage recovery
 *
 * Phase: D26 - Funnel Drop-Off Detection Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as funnelService from "@/lib/synthex/funnelService";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "stats";

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing required param: tenantId" },
        { status: 400 }
      );
    }

    switch (type) {
      case "stats": {
        const stats = await funnelService.getFunnelStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "funnels": {
        const filters = {
          funnel_type: searchParams.get("funnel_type") as funnelService.FunnelType | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
        };
        const funnels = await funnelService.listFunnels(tenantId, filters);
        return NextResponse.json({ success: true, funnels });
      }

      case "funnel": {
        const funnelId = searchParams.get("funnel_id");
        if (!funnelId) {
          return NextResponse.json(
            { error: "funnel_id is required" },
            { status: 400 }
          );
        }
        const funnel = await funnelService.getFunnel(tenantId, funnelId);
        return NextResponse.json({ success: true, funnel });
      }

      case "events": {
        const filters = {
          funnel_id: searchParams.get("funnel_id") || undefined,
          contact_id: searchParams.get("contact_id") || undefined,
          stage: searchParams.get("stage") || undefined,
          event_type: searchParams.get("event_type") as funnelService.EventType | undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const events = await funnelService.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "dropoffs": {
        const filters = {
          funnel_id: searchParams.get("funnel_id") || undefined,
          status: searchParams.get("status") as funnelService.DropoffStatus | undefined,
          min_rate: searchParams.get("min_rate") ? parseFloat(searchParams.get("min_rate")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const dropoffs = await funnelService.listDropoffs(tenantId, filters);
        return NextResponse.json({ success: true, dropoffs });
      }

      case "dropoff": {
        const dropoffId = searchParams.get("dropoff_id");
        if (!dropoffId) {
          return NextResponse.json(
            { error: "dropoff_id is required" },
            { status: 400 }
          );
        }
        const dropoff = await funnelService.getDropoff(tenantId, dropoffId);
        return NextResponse.json({ success: true, dropoff });
      }

      case "recovery_actions": {
        const filters = {
          dropoff_id: searchParams.get("dropoff_id") || undefined,
          funnel_id: searchParams.get("funnel_id") || undefined,
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const actions = await funnelService.listRecoveryActions(tenantId, filters);
        return NextResponse.json({ success: true, actions });
      }

      case "alerts": {
        const filters = {
          funnel_id: searchParams.get("funnel_id") || undefined,
          status: searchParams.get("status") as funnelService.AlertStatus | undefined,
          severity: searchParams.get("severity") as funnelService.AlertSeverity | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const alerts = await funnelService.listAlerts(tenantId, filters);
        return NextResponse.json({ success: true, alerts });
      }

      case "metrics": {
        const funnelId = searchParams.get("funnel_id");
        if (!funnelId) {
          return NextResponse.json(
            { error: "funnel_id is required" },
            { status: 400 }
          );
        }
        const periodType = searchParams.get("period_type") || "daily";
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 30;
        const metrics = await funnelService.getFunnelMetrics(tenantId, funnelId, periodType, limit);
        return NextResponse.json({ success: true, metrics });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[funnel GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      // =====================================================
      // Funnel Actions
      // =====================================================
      case "create_funnel": {
        if (!data.funnel_name || !data.funnel_type || !data.stages) {
          return NextResponse.json(
            { error: "funnel_name, funnel_type, and stages are required" },
            { status: 400 }
          );
        }
        const funnel = await funnelService.createFunnel(
          tenantId,
          {
            funnel_name: data.funnel_name,
            funnel_description: data.funnel_description,
            funnel_type: data.funnel_type,
            stages: data.stages,
            tracking_window_days: data.tracking_window_days,
            attribution_model: data.attribution_model,
            target_conversion_rate: data.target_conversion_rate,
            target_time_to_convert_hours: data.target_time_to_convert_hours,
            is_primary: data.is_primary,
          },
          user.id
        );
        return NextResponse.json({ success: true, funnel });
      }

      case "update_funnel": {
        if (!data.funnel_id) {
          return NextResponse.json(
            { error: "funnel_id is required" },
            { status: 400 }
          );
        }
        const funnel = await funnelService.updateFunnel(data.funnel_id, data.updates);
        return NextResponse.json({ success: true, funnel });
      }

      case "delete_funnel": {
        if (!data.funnel_id) {
          return NextResponse.json(
            { error: "funnel_id is required" },
            { status: 400 }
          );
        }
        await funnelService.deleteFunnel(data.funnel_id);
        return NextResponse.json({ success: true });
      }

      // =====================================================
      // Event Actions
      // =====================================================
      case "track_event": {
        if (!data.funnel_id || !data.stage) {
          return NextResponse.json(
            { error: "funnel_id and stage are required" },
            { status: 400 }
          );
        }
        const event = await funnelService.trackEvent(tenantId, {
          funnel_id: data.funnel_id,
          contact_id: data.contact_id,
          lead_id: data.lead_id,
          session_id: data.session_id,
          stage: data.stage,
          stage_position: data.stage_position,
          previous_stage: data.previous_stage,
          event_type: data.event_type,
          source: data.source,
          medium: data.medium,
          campaign: data.campaign,
          channel: data.channel,
          page_url: data.page_url,
          referrer_url: data.referrer_url,
          device_type: data.device_type,
          browser: data.browser,
          country: data.country,
          city: data.city,
          meta: data.meta,
        });
        return NextResponse.json({ success: true, event });
      }

      // =====================================================
      // Analysis Actions
      // =====================================================
      case "analyze_dropoffs": {
        if (!data.funnel_id) {
          return NextResponse.json(
            { error: "funnel_id is required" },
            { status: 400 }
          );
        }
        const dropoffs = await funnelService.analyzeDropoffs(tenantId, data.funnel_id);
        return NextResponse.json({ success: true, dropoffs });
      }

      case "update_dropoff_status": {
        if (!data.dropoff_id || !data.status) {
          return NextResponse.json(
            { error: "dropoff_id and status are required" },
            { status: 400 }
          );
        }
        const dropoff = await funnelService.updateDropoffStatus(
          data.dropoff_id,
          data.status,
          data.resolution_notes
        );
        return NextResponse.json({ success: true, dropoff });
      }

      // =====================================================
      // Recovery Actions
      // =====================================================
      case "create_recovery_action": {
        if (!data.action_type) {
          return NextResponse.json(
            { error: "action_type is required" },
            { status: 400 }
          );
        }
        const action = await funnelService.createRecoveryAction(tenantId, {
          dropoff_id: data.dropoff_id,
          funnel_id: data.funnel_id,
          contact_id: data.contact_id,
          action_type: data.action_type,
          action_config: data.action_config,
          action_message: data.action_message,
          delay_hours: data.delay_hours,
        });
        return NextResponse.json({ success: true, action });
      }

      case "update_recovery_status": {
        if (!data.action_id || !data.status) {
          return NextResponse.json(
            { error: "action_id and status are required" },
            { status: 400 }
          );
        }
        const action = await funnelService.updateRecoveryActionStatus(
          data.action_id,
          data.status,
          data.updates
        );
        return NextResponse.json({ success: true, action });
      }

      // =====================================================
      // Alert Actions
      // =====================================================
      case "acknowledge_alert": {
        if (!data.alert_id) {
          return NextResponse.json(
            { error: "alert_id is required" },
            { status: 400 }
          );
        }
        const alert = await funnelService.acknowledgeAlert(data.alert_id, user.id);
        return NextResponse.json({ success: true, alert });
      }

      case "resolve_alert": {
        if (!data.alert_id) {
          return NextResponse.json(
            { error: "alert_id is required" },
            { status: 400 }
          );
        }
        const alert = await funnelService.resolveAlert(
          data.alert_id,
          user.id,
          data.resolution_notes
        );
        return NextResponse.json({ success: true, alert });
      }

      // =====================================================
      // Initialization
      // =====================================================
      case "initialize_defaults": {
        await funnelService.initializeDefaultFunnels(tenantId, user.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[funnel POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
