/**
 * Synthex Reputation Library API
 * Phase D17: Reputation Intelligence Engine
 *
 * GET - Get stats, reviews, sources, alerts, etc.
 * POST - Import reviews, generate responses, create alerts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as reputationService from "@/lib/synthex/reputationLibraryService";

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
        const stats = await reputationService.getReputationStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "sources": {
        const filters = {
          source_type: searchParams.get("source_type") || undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_connected:
            searchParams.get("is_connected") === "true"
              ? true
              : searchParams.get("is_connected") === "false"
                ? false
                : undefined,
        };
        const sources = await reputationService.listSources(tenantId, filters);
        return NextResponse.json({ success: true, sources });
      }

      case "reviews": {
        const filters = {
          source_id: searchParams.get("source_id") || undefined,
          source_type: searchParams.get("source_type") || undefined,
          sentiment: searchParams.get("sentiment") || undefined,
          status: searchParams.get("status") || undefined,
          priority: searchParams.get("priority") || undefined,
          requires_attention:
            searchParams.get("requires_attention") === "true"
              ? true
              : searchParams.get("requires_attention") === "false"
                ? false
                : undefined,
          min_rating: searchParams.get("min_rating")
            ? parseFloat(searchParams.get("min_rating")!)
            : undefined,
          max_rating: searchParams.get("max_rating")
            ? parseFloat(searchParams.get("max_rating")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const reviews = await reputationService.listReviews(tenantId, filters);
        return NextResponse.json({ success: true, reviews });
      }

      case "templates": {
        const filters = {
          tone: searchParams.get("tone") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const templates = await reputationService.listResponseTemplates(
          tenantId,
          filters
        );
        return NextResponse.json({ success: true, templates });
      }

      case "metrics": {
        const filters = {
          period_type: searchParams.get("period_type") || undefined,
          source_id: searchParams.get("source_id") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const metrics = await reputationService.getMetrics(tenantId, filters);
        return NextResponse.json({ success: true, metrics });
      }

      case "alerts": {
        const filters = {
          status: searchParams.get("status") || undefined,
          severity: searchParams.get("severity") || undefined,
          alert_type: searchParams.get("alert_type") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const alerts = await reputationService.listAlerts(tenantId, filters);
        return NextResponse.json({ success: true, alerts });
      }

      case "competitors": {
        const filters = {
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
        const competitors = await reputationService.listCompetitors(
          tenantId,
          filters
        );
        return NextResponse.json({ success: true, competitors });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Reputation API GET error:", error);
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
      case "create_source": {
        const source = await reputationService.createSource(tenantId, {
          name: data.name,
          source_type: data.source_type,
          source_url: data.source_url,
          business_id: data.business_id,
          sync_frequency: data.sync_frequency,
          auto_respond: data.auto_respond,
          notification_enabled: data.notification_enabled,
          metadata: data.metadata,
        });
        return NextResponse.json({ success: true, source });
      }

      case "import_review": {
        const review = await reputationService.importReview(tenantId, {
          source_id: data.source_id,
          external_id: data.external_id,
          source_type: data.source_type,
          source_url: data.source_url,
          reviewer_name: data.reviewer_name,
          reviewer_avatar: data.reviewer_avatar,
          reviewer_profile_url: data.reviewer_profile_url,
          is_verified_purchase: data.is_verified_purchase,
          rating: data.rating,
          rating_max: data.rating_max,
          recommend: data.recommend,
          title: data.title,
          review_text: data.review_text,
          language: data.language,
          review_date: data.review_date,
          tags: data.tags,
          metadata: data.metadata,
        });
        return NextResponse.json({ success: true, review });
      }

      case "analyze_review": {
        const review = await reputationService.analyzeReview(data.review_id);
        return NextResponse.json({ success: true, review });
      }

      case "respond_to_review": {
        const review = await reputationService.respondToReview(
          data.review_id,
          data.response_text,
          user.id
        );
        return NextResponse.json({ success: true, review });
      }

      case "generate_response": {
        const response = await reputationService.generateResponse(
          data.review_id,
          {
            tone: data.tone,
            template_id: data.template_id,
            additional_context: data.additional_context,
          }
        );
        return NextResponse.json({ success: true, response });
      }

      case "create_template": {
        const template = await reputationService.createResponseTemplate(
          tenantId,
          {
            template_name: data.template_name,
            response_text: data.response_text,
            tone: data.tone,
            tags: data.tags,
          },
          user.id
        );
        return NextResponse.json({ success: true, template });
      }

      case "approve_response": {
        const response = await reputationService.approveResponse(
          data.response_id,
          user.id
        );
        return NextResponse.json({ success: true, response });
      }

      case "publish_response": {
        const result = await reputationService.publishResponse(
          data.response_id
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "aggregate_metrics": {
        const metrics = await reputationService.aggregateMetrics(
          tenantId,
          data.period_type || "daily"
        );
        return NextResponse.json({ success: true, metrics });
      }

      case "create_alert": {
        const alert = await reputationService.createAlert(tenantId, {
          alert_type: data.alert_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          review_id: data.review_id,
          source_id: data.source_id,
          metric_name: data.metric_name,
          metric_value: data.metric_value,
          threshold_value: data.threshold_value,
        });
        return NextResponse.json({ success: true, alert });
      }

      case "acknowledge_alert": {
        const alert = await reputationService.acknowledgeAlert(
          data.alert_id,
          user.id
        );
        return NextResponse.json({ success: true, alert });
      }

      case "resolve_alert": {
        const alert = await reputationService.resolveAlert(
          data.alert_id,
          user.id
        );
        return NextResponse.json({ success: true, alert });
      }

      case "add_competitor": {
        const competitor = await reputationService.addCompetitor(tenantId, {
          name: data.name,
          website: data.website,
          logo_url: data.logo_url,
          google_place_id: data.google_place_id,
          yelp_id: data.yelp_id,
          trustpilot_id: data.trustpilot_id,
          other_sources: data.other_sources,
          notes: data.notes,
        });
        return NextResponse.json({ success: true, competitor });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Reputation API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
