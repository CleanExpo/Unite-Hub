/**
 * Synthex Revenue Routing API
 * Phase D20: Multi-Channel Revenue Routing
 *
 * GET - Get revenue events, stats, channels, paths, forecasts, alerts
 * POST - Record events, create rules, generate forecasts, manage alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as revenueService from "@/lib/synthex/revenueRoutingService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const type = searchParams.get("type") || "stats";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (type) {
      case "stats": {
        const stats = await revenueService.getRevenueStats(tenantId, {
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          channel: searchParams.get("channel") || undefined,
        });
        return NextResponse.json({ success: true, stats });
      }

      case "events": {
        const filters = {
          event_type: searchParams.get("event_type") as revenueService.EventType | undefined,
          channel: searchParams.get("channel") || undefined,
          source: searchParams.get("source") || undefined,
          customer_id: searchParams.get("customer_id") || undefined,
          lead_id: searchParams.get("lead_id") || undefined,
          min_amount: searchParams.get("min_amount")
            ? parseFloat(searchParams.get("min_amount")!)
            : undefined,
          max_amount: searchParams.get("max_amount")
            ? parseFloat(searchParams.get("max_amount")!)
            : undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const events = await revenueService.listRevenueEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "event": {
        const eventId = searchParams.get("eventId");
        if (!eventId) {
          return NextResponse.json(
            { error: "eventId is required" },
            { status: 400 }
          );
        }
        const event = await revenueService.getRevenueEventById(tenantId, eventId);
        return NextResponse.json({ success: true, event });
      }

      case "rules": {
        const filters = {
          action: searchParams.get("action") as revenueService.RoutingAction | undefined,
          channel: searchParams.get("channel") || undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_automated:
            searchParams.get("is_automated") === "true"
              ? true
              : searchParams.get("is_automated") === "false"
                ? false
                : undefined,
        };
        const rules = await revenueService.listRoutingRules(tenantId, filters);
        return NextResponse.json({ success: true, rules });
      }

      case "channels": {
        const filters = {
          channel: searchParams.get("channel") || undefined,
          source: searchParams.get("source") || undefined,
          period_type: searchParams.get("period_type") as
            | "daily"
            | "weekly"
            | "monthly"
            | undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const channels = await revenueService.getChannelPerformance(tenantId, filters);
        return NextResponse.json({ success: true, channels });
      }

      case "paths": {
        const filters = {
          first_touch_channel: searchParams.get("first_touch_channel") || undefined,
          last_touch_channel: searchParams.get("last_touch_channel") || undefined,
          min_occurrences: searchParams.get("min_occurrences")
            ? parseInt(searchParams.get("min_occurrences")!)
            : undefined,
          period_type: searchParams.get("period_type") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const paths = await revenueService.getAttributionPaths(tenantId, filters);
        return NextResponse.json({ success: true, paths });
      }

      case "forecasts": {
        const filters = {
          channel: searchParams.get("channel") || undefined,
          forecast_type: searchParams.get("forecast_type") as
            | "daily"
            | "weekly"
            | "monthly"
            | "quarterly"
            | undefined,
          from_date: searchParams.get("from_date") || undefined,
          include_actuals: searchParams.get("include_actuals") === "true",
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const forecasts = await revenueService.getForecasts(tenantId, filters);
        return NextResponse.json({ success: true, forecasts });
      }

      case "alerts": {
        const filters = {
          status: searchParams.get("status") as revenueService.AlertStatus | undefined,
          severity: searchParams.get("severity") as revenueService.AlertSeverity | undefined,
          alert_type: searchParams.get("alert_type") as revenueService.AlertType | undefined,
          channel: searchParams.get("channel") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const alerts = await revenueService.listRevenueAlerts(tenantId, filters);
        return NextResponse.json({ success: true, alerts });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Revenue API GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, action, ...data } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "record_event": {
        const event = await revenueService.recordRevenueEvent(tenantId, {
          event_type: data.event_type,
          amount: data.amount,
          channel: data.channel,
          external_id: data.external_id,
          currency: data.currency,
          source: data.source,
          medium: data.medium,
          campaign_id: data.campaign_id,
          campaign_name: data.campaign_name,
          lead_id: data.lead_id,
          contact_id: data.contact_id,
          customer_id: data.customer_id,
          is_new_customer: data.is_new_customer,
          product_id: data.product_id,
          product_name: data.product_name,
          product_category: data.product_category,
          quantity: data.quantity,
          unit_price: data.unit_price,
          attribution_model: data.attribution_model,
          touchpoints: data.touchpoints,
          cost_of_goods: data.cost_of_goods,
          acquisition_cost: data.acquisition_cost,
          first_touch_at: data.first_touch_at,
          tags: data.tags,
          meta: data.meta,
        });
        return NextResponse.json({ success: true, event });
      }

      case "create_rule": {
        const rule = await revenueService.createRoutingRule(
          tenantId,
          {
            rule_name: data.rule_name,
            description: data.description,
            source_channels: data.source_channels,
            target_channel: data.target_channel,
            action: data.rule_action,
            conditions: data.conditions,
            min_revenue: data.min_revenue,
            min_events: data.min_events,
            priority: data.priority,
            boost_factor: data.boost_factor,
            allocation_percent: data.allocation_percent,
            active_days: data.active_days,
            active_hours: data.active_hours,
            effective_from: data.effective_from,
            effective_until: data.effective_until,
            is_automated: data.is_automated,
          },
          user.id
        );
        return NextResponse.json({ success: true, rule });
      }

      case "update_rule": {
        const rule = await revenueService.updateRoutingRule(
          data.rule_id,
          data.updates
        );
        return NextResponse.json({ success: true, rule });
      }

      case "delete_rule": {
        await revenueService.deleteRoutingRule(data.rule_id);
        return NextResponse.json({ success: true });
      }

      case "calculate_channel_performance": {
        const performance = await revenueService.calculateChannelPerformance(
          tenantId,
          data.channel,
          data.period_type,
          new Date(data.period_start),
          new Date(data.period_end)
        );
        return NextResponse.json({ success: true, performance });
      }

      case "analyze_path": {
        const analysis = await revenueService.analyzeAttributionPath(
          tenantId,
          data.path_sequence
        );
        return NextResponse.json({ success: true, ...analysis });
      }

      case "generate_forecast": {
        const forecast = await revenueService.generateRevenueForecast(tenantId, {
          channel: data.channel,
          forecast_type: data.forecast_type,
          horizon_days: data.horizon_days,
        });
        return NextResponse.json({ success: true, forecast });
      }

      case "create_alert": {
        const alert = await revenueService.createRevenueAlert(tenantId, {
          alert_type: data.alert_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          channel: data.channel,
          revenue_event_id: data.revenue_event_id,
          metric_name: data.metric_name,
          metric_value: data.metric_value,
          threshold_value: data.threshold_value,
          change_percent: data.change_percent,
          meta: data.meta,
        });
        return NextResponse.json({ success: true, alert });
      }

      case "acknowledge_alert": {
        const alert = await revenueService.acknowledgeRevenueAlert(
          data.alert_id,
          user.id
        );
        return NextResponse.json({ success: true, alert });
      }

      case "resolve_alert": {
        const alert = await revenueService.resolveRevenueAlert(
          data.alert_id,
          user.id,
          data.resolution_notes
        );
        return NextResponse.json({ success: true, alert });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Revenue API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
