/**
 * Synthex Behavior Trends API
 * Phase D16: Behavioral Analytics & Trend Detection
 *
 * GET - Get behavior stats or list items by type
 * POST - Track events or analyze trends
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as behaviorService from "@/lib/synthex/behaviorTrendService";

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
        const stats = await behaviorService.getBehaviorStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "events": {
        const filters = {
          event_type: searchParams.get("event_type") || undefined,
          channel: searchParams.get("channel") || undefined,
          contact_id: searchParams.get("contact_id") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const events = await behaviorService.getEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "sessions": {
        const filters = {
          contact_id: searchParams.get("contact_id") || undefined,
          min_engagement: searchParams.get("min_engagement")
            ? parseFloat(searchParams.get("min_engagement")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const sessions = await behaviorService.getSessions(tenantId, filters);
        return NextResponse.json({ success: true, sessions });
      }

      case "trends": {
        const filters = {
          trend_type: searchParams.get("trend_type") || undefined,
          status: searchParams.get("status") || undefined,
          severity: searchParams.get("severity") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const trends = await behaviorService.getTrends(tenantId, filters);
        return NextResponse.json({ success: true, trends });
      }

      case "patterns": {
        const filters = {
          pattern_type: searchParams.get("pattern_type") || undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const patterns = await behaviorService.getPatterns(tenantId, filters);
        return NextResponse.json({ success: true, patterns });
      }

      case "predictions": {
        const filters = {
          prediction_type: searchParams.get("prediction_type") || undefined,
          contact_id: searchParams.get("contact_id") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const predictions = await behaviorService.getPredictions(
          tenantId,
          filters
        );
        return NextResponse.json({ success: true, predictions });
      }

      case "alerts": {
        const filters = {
          alert_type: searchParams.get("alert_type") || undefined,
          status: searchParams.get("status") || undefined,
          severity: searchParams.get("severity") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const alerts = await behaviorService.getAlerts(tenantId, filters);
        return NextResponse.json({ success: true, alerts });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Behavior API GET error:", error);
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
      case "track_event": {
        const event = await behaviorService.trackEvent(tenantId, {
          event_type: data.event_type,
          event_category: data.event_category,
          event_action: data.event_action,
          event_label: data.event_label,
          contact_id: data.contact_id,
          session_id: data.session_id,
          channel: data.channel,
          source: data.source,
          page_url: data.page_url,
          event_value: data.event_value,
          revenue: data.revenue,
          device_type: data.device_type,
          geo_country: data.geo_country,
          properties: data.properties,
        });
        return NextResponse.json({ success: true, event });
      }

      case "track_batch": {
        const events = await behaviorService.trackBatchEvents(
          tenantId,
          data.events
        );
        return NextResponse.json({ success: true, events });
      }

      case "analyze_trends": {
        const trends = await behaviorService.analyzeTrends(tenantId, {
          period_type: data.period_type || "daily",
          metrics: data.metrics,
          channels: data.channels,
        });
        return NextResponse.json({ success: true, trends });
      }

      case "detect_patterns": {
        const patterns = await behaviorService.detectPatterns(tenantId, {
          pattern_types: data.pattern_types,
          min_occurrences: data.min_occurrences,
        });
        return NextResponse.json({ success: true, patterns });
      }

      case "generate_prediction": {
        const prediction = await behaviorService.generatePrediction(tenantId, {
          prediction_type: data.prediction_type,
          contact_id: data.contact_id,
          segment_id: data.segment_id,
          horizon: data.horizon,
        });
        return NextResponse.json({ success: true, prediction });
      }

      case "create_alert": {
        const alert = await behaviorService.createAlert(tenantId, {
          alert_type: data.alert_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          metric_name: data.metric_name,
          metric_value: data.metric_value,
          threshold_value: data.threshold_value,
          trend_id: data.trend_id,
          pattern_id: data.pattern_id,
          prediction_id: data.prediction_id,
        });
        return NextResponse.json({ success: true, alert });
      }

      case "acknowledge_alert": {
        const alert = await behaviorService.acknowledgeAlert(
          data.alert_id,
          user.id
        );
        return NextResponse.json({ success: true, alert });
      }

      case "resolve_alert": {
        const alert = await behaviorService.resolveAlert(
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
    console.error("Behavior API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
