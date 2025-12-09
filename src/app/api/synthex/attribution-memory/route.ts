/**
 * Synthex Attribution Memory Engine v2 API
 *
 * GET - Contacts, events, journeys, models, channel performance, insights, stats
 * POST - Record events, create journeys, analyze journeys, generate insights
 *
 * Phase: D29 - Attribution Memory Engine v2
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as attributionService from "@/lib/synthex/attributionMemoryService";

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
        const stats = await attributionService.getAttributionStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "contacts": {
        const filters = {
          persona_type: searchParams.get("persona_type") as attributionService.PersonaType | undefined,
          min_touchpoints: searchParams.get("min_touchpoints") ? parseInt(searchParams.get("min_touchpoints")!) : undefined,
          min_conversions: searchParams.get("min_conversions") ? parseInt(searchParams.get("min_conversions")!) : undefined,
          has_recent_activity: searchParams.get("has_recent_activity") === "true",
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const contacts = await attributionService.listAttributionContacts(tenantId, filters);
        return NextResponse.json({ success: true, contacts });
      }

      case "events": {
        const filters = {
          attribution_contact_id: searchParams.get("attribution_contact_id") || undefined,
          channel: searchParams.get("channel") as attributionService.ChannelType | undefined,
          event_type: searchParams.get("event_type") as attributionService.EventType | undefined,
          campaign_id: searchParams.get("campaign_id") || undefined,
          is_conversion_event: searchParams.get("is_conversion_event") === "true" ? true : searchParams.get("is_conversion_event") === "false" ? false : undefined,
          start_date: searchParams.get("start_date") || undefined,
          end_date: searchParams.get("end_date") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const events = await attributionService.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "journeys": {
        const filters = {
          attribution_contact_id: searchParams.get("attribution_contact_id") || undefined,
          journey_type: searchParams.get("journey_type") as attributionService.JourneyType | undefined,
          journey_status: searchParams.get("journey_status") as attributionService.JourneyStatus | undefined,
          min_touchpoints: searchParams.get("min_touchpoints") ? parseInt(searchParams.get("min_touchpoints")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const journeys = await attributionService.listJourneys(tenantId, filters);
        return NextResponse.json({ success: true, journeys });
      }

      case "models": {
        const models = await attributionService.listAttributionModels(tenantId);
        return NextResponse.json({ success: true, models });
      }

      case "channel_performance": {
        const filters = {
          channel: searchParams.get("channel") as attributionService.ChannelType | undefined,
          period_type: searchParams.get("period_type") || undefined,
          start_date: searchParams.get("start_date") || undefined,
          end_date: searchParams.get("end_date") || undefined,
        };
        const performance = await attributionService.getChannelPerformance(tenantId, filters);
        return NextResponse.json({ success: true, performance });
      }

      case "insights": {
        const filters = {
          insight_type: searchParams.get("insight_type") as attributionService.InsightType | undefined,
          status: searchParams.get("status") as attributionService.InsightStatus | undefined,
          target_channel: searchParams.get("target_channel") || undefined,
          min_score: searchParams.get("min_score") ? parseFloat(searchParams.get("min_score")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const insights = await attributionService.listAttributionInsights(tenantId, filters);
        return NextResponse.json({ success: true, insights });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[attribution-memory GET] Error:", error);
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
      // Event Actions
      // =====================================================
      case "record_event": {
        if (!data.contact_id || !data.event_type || !data.channel) {
          return NextResponse.json(
            { error: "contact_id, event_type, and channel are required" },
            { status: 400 }
          );
        }
        const event = await attributionService.recordEvent(tenantId, data.contact_id, {
          event_type: data.event_type,
          channel: data.channel,
          event_category: data.event_category,
          sub_channel: data.sub_channel,
          campaign_id: data.campaign_id,
          campaign_name: data.campaign_name,
          source: data.source,
          medium: data.medium,
          content: data.content,
          term: data.term,
          landing_page: data.landing_page,
          referrer: data.referrer,
          is_conversion_event: data.is_conversion_event,
          conversion_id: data.conversion_id,
          conversion_value: data.conversion_value,
          session_id: data.session_id,
          device_type: data.device_type,
          browser: data.browser,
          os: data.os,
          geo_country: data.geo_country,
          geo_region: data.geo_region,
          geo_city: data.geo_city,
          raw_data: data.raw_data,
        });
        return NextResponse.json({ success: true, event });
      }

      // =====================================================
      // Journey Actions
      // =====================================================
      case "create_journey": {
        if (!data.attribution_contact_id) {
          return NextResponse.json(
            { error: "attribution_contact_id is required" },
            { status: 400 }
          );
        }
        const journey = await attributionService.createJourney(
          tenantId,
          data.attribution_contact_id,
          {
            journey_type: data.journey_type,
            started_at: data.started_at,
          }
        );
        return NextResponse.json({ success: true, journey });
      }

      case "complete_journey": {
        if (!data.journey_id) {
          return NextResponse.json(
            { error: "journey_id is required" },
            { status: 400 }
          );
        }
        const journey = await attributionService.completeJourney(data.journey_id, {
          conversion_type: data.conversion_type,
          conversion_value: data.conversion_value,
          conversion_id: data.conversion_id,
        });
        return NextResponse.json({ success: true, journey });
      }

      case "analyze_journey": {
        if (!data.journey_id) {
          return NextResponse.json(
            { error: "journey_id is required" },
            { status: 400 }
          );
        }
        const journey = await attributionService.analyzeJourney(tenantId, data.journey_id);
        return NextResponse.json({ success: true, journey });
      }

      // =====================================================
      // Model Actions
      // =====================================================
      case "create_model": {
        if (!data.model_name || !data.model_type) {
          return NextResponse.json(
            { error: "model_name and model_type are required" },
            { status: 400 }
          );
        }
        const model = await attributionService.createAttributionModel(
          tenantId,
          {
            model_name: data.model_name,
            model_type: data.model_type,
            model_description: data.model_description,
            config: data.config,
            is_default: data.is_default,
          },
          user.id
        );
        return NextResponse.json({ success: true, model });
      }

      // =====================================================
      // Insight Actions
      // =====================================================
      case "generate_insight": {
        if (!data.insight_type) {
          return NextResponse.json(
            { error: "insight_type is required" },
            { status: 400 }
          );
        }
        const insight = await attributionService.generateAttributionInsight(tenantId, {
          insight_type: data.insight_type,
          target_channel: data.target_channel,
          target_segment: data.target_segment,
          context: data.context,
        });
        return NextResponse.json({ success: true, insight });
      }

      // =====================================================
      // Contact Actions
      // =====================================================
      case "get_or_create_contact": {
        if (!data.contact_id) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const contact = await attributionService.getOrCreateAttributionContact(
          tenantId,
          data.contact_id
        );
        return NextResponse.json({ success: true, contact });
      }

      case "update_contact": {
        if (!data.attribution_contact_id) {
          return NextResponse.json(
            { error: "attribution_contact_id is required" },
            { status: 400 }
          );
        }
        const contact = await attributionService.updateAttributionContact(
          data.attribution_contact_id,
          data.updates
        );
        return NextResponse.json({ success: true, contact });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[attribution-memory POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
