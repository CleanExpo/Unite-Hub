/**
 * Synthex Attribution Engine v3 API
 *
 * GET - Touchpoints, conversions, paths, credits, LTV, channel performance, stats
 * POST - Create touchpoints, conversions, run attribution, calculate LTV, AI analysis
 *
 * Phase: D35 - Attribution Engine v3 (Cross-Channel + Multi-Touch LTV)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as attributionService from "@/lib/synthex/attributionV3Service";

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

      case "touchpoints": {
        const filters = {
          unified_profile_id: searchParams.get("unified_profile_id") || undefined,
          channel: searchParams.get("channel") || undefined,
          touchpoint_type: searchParams.get("touchpoint_type") as attributionService.TouchpointType | undefined,
          campaign_id: searchParams.get("campaign_id") || undefined,
          start_date: searchParams.get("start_date") || undefined,
          end_date: searchParams.get("end_date") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const touchpoints = await attributionService.listTouchpoints(tenantId, filters);
        return NextResponse.json({ success: true, touchpoints });
      }

      case "touchpoint": {
        const touchpointId = searchParams.get("touchpointId");
        if (!touchpointId) {
          return NextResponse.json({ error: "touchpointId is required" }, { status: 400 });
        }
        const touchpoint = await attributionService.getTouchpoint(touchpointId);
        return NextResponse.json({ success: true, touchpoint });
      }

      case "conversions": {
        const filters = {
          unified_profile_id: searchParams.get("unified_profile_id") || undefined,
          conversion_type: searchParams.get("conversion_type") as attributionService.ConversionType | undefined,
          status: searchParams.get("status") as attributionService.AttributionStatus | undefined,
          start_date: searchParams.get("start_date") || undefined,
          end_date: searchParams.get("end_date") || undefined,
          min_value: searchParams.get("min_value") ? parseFloat(searchParams.get("min_value")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const conversions = await attributionService.listConversions(tenantId, filters);
        return NextResponse.json({ success: true, conversions });
      }

      case "conversion": {
        const conversionId = searchParams.get("conversionId");
        if (!conversionId) {
          return NextResponse.json({ error: "conversionId is required" }, { status: 400 });
        }
        const conversion = await attributionService.getConversion(conversionId);
        return NextResponse.json({ success: true, conversion });
      }

      case "paths": {
        const filters = {
          conversion_id: searchParams.get("conversion_id") || undefined,
          unified_profile_id: searchParams.get("unified_profile_id") || undefined,
          min_path_length: searchParams.get("min_path_length") ? parseInt(searchParams.get("min_path_length")!) : undefined,
          max_path_length: searchParams.get("max_path_length") ? parseInt(searchParams.get("max_path_length")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const paths = await attributionService.listPaths(tenantId, filters);
        return NextResponse.json({ success: true, paths });
      }

      case "path": {
        const pathId = searchParams.get("pathId");
        if (!pathId) {
          return NextResponse.json({ error: "pathId is required" }, { status: 400 });
        }
        const path = await attributionService.getPath(pathId);
        return NextResponse.json({ success: true, path });
      }

      case "credits": {
        const filters = {
          path_id: searchParams.get("path_id") || undefined,
          touchpoint_id: searchParams.get("touchpoint_id") || undefined,
          conversion_id: searchParams.get("conversion_id") || undefined,
          attribution_model: searchParams.get("attribution_model") as attributionService.AttributionModel | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const credits = await attributionService.listCredits(tenantId, filters);
        return NextResponse.json({ success: true, credits });
      }

      case "ltv": {
        const profileId = searchParams.get("profileId");
        if (profileId) {
          const ltv = await attributionService.getLTVByProfile(tenantId, profileId);
          return NextResponse.json({ success: true, ltv });
        }
        const filters = {
          min_ltv: searchParams.get("min_ltv") ? parseFloat(searchParams.get("min_ltv")!) : undefined,
          max_ltv: searchParams.get("max_ltv") ? parseFloat(searchParams.get("max_ltv")!) : undefined,
          acquisition_channel: searchParams.get("acquisition_channel") || undefined,
          cohort_month: searchParams.get("cohort_month") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const ltvs = await attributionService.listLTVs(tenantId, filters);
        return NextResponse.json({ success: true, ltvs });
      }

      case "channel_performance": {
        const filters = {
          period_start: searchParams.get("period_start") || undefined,
          period_end: searchParams.get("period_end") || undefined,
          channel: searchParams.get("channel") || undefined,
          attribution_model: searchParams.get("attribution_model") as attributionService.AttributionModel | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const performance = await attributionService.getChannelPerformance(tenantId, filters);
        return NextResponse.json({ success: true, performance });
      }

      case "path_patterns": {
        const filters = {
          min_occurrences: searchParams.get("min_occurrences") ? parseInt(searchParams.get("min_occurrences")!) : undefined,
          min_conversion_rate: searchParams.get("min_conversion_rate") ? parseFloat(searchParams.get("min_conversion_rate")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const patterns = await attributionService.listPathPatterns(tenantId, filters);
        return NextResponse.json({ success: true, patterns });
      }

      case "models": {
        const filters = {
          model_type: searchParams.get("model_type") as attributionService.AttributionModel | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
        };
        const models = await attributionService.listAttributionModels(tenantId, filters);
        return NextResponse.json({ success: true, models });
      }

      case "reports": {
        const filters = {
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const reports = await attributionService.listReports(tenantId, filters);
        return NextResponse.json({ success: true, reports });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[attribution-v3 GET] Error:", error);
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
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 });
    }

    switch (action) {
      // =====================================================
      // Touchpoint Actions
      // =====================================================
      case "create_touchpoint": {
        if (!data.channel || !data.touchpoint_type) {
          return NextResponse.json(
            { error: "channel and touchpoint_type are required" },
            { status: 400 }
          );
        }
        const touchpoint = await attributionService.createTouchpoint(tenantId, {
          unified_profile_id: data.unified_profile_id,
          identity_node_id: data.identity_node_id,
          anonymous_id: data.anonymous_id,
          touchpoint_type: data.touchpoint_type,
          touchpoint_timestamp: data.touchpoint_timestamp,
          channel: data.channel,
          sub_channel: data.sub_channel,
          campaign_id: data.campaign_id,
          campaign_name: data.campaign_name,
          ad_group_id: data.ad_group_id,
          ad_id: data.ad_id,
          source: data.source,
          medium: data.medium,
          content: data.content,
          term: data.term,
          referrer_url: data.referrer_url,
          landing_page: data.landing_page,
          session_id: data.session_id,
          page_views: data.page_views,
          time_on_site: data.time_on_site,
          engagement_score: data.engagement_score,
          device_type: data.device_type,
          browser: data.browser,
          country: data.country,
          cost: data.cost,
          attributes: data.attributes,
          tags: data.tags,
        });
        return NextResponse.json({ success: true, touchpoint });
      }

      // =====================================================
      // Conversion Actions
      // =====================================================
      case "create_conversion": {
        if (!data.conversion_type) {
          return NextResponse.json(
            { error: "conversion_type is required" },
            { status: 400 }
          );
        }
        const conversion = await attributionService.createConversion(tenantId, {
          unified_profile_id: data.unified_profile_id,
          identity_node_id: data.identity_node_id,
          conversion_type: data.conversion_type,
          conversion_name: data.conversion_name,
          conversion_timestamp: data.conversion_timestamp,
          conversion_value: data.conversion_value,
          conversion_currency: data.conversion_currency,
          quantity: data.quantity,
          opportunity_id: data.opportunity_id,
          deal_id: data.deal_id,
          order_id: data.order_id,
          product_ids: data.product_ids,
          lookback_window_days: data.lookback_window_days,
          metadata: data.metadata,
        });
        return NextResponse.json({ success: true, conversion });
      }

      case "update_conversion_status": {
        if (!data.conversion_id || !data.status) {
          return NextResponse.json(
            { error: "conversion_id and status are required" },
            { status: 400 }
          );
        }
        const conversion = await attributionService.updateConversionStatus(
          data.conversion_id,
          data.status
        );
        return NextResponse.json({ success: true, conversion });
      }

      // =====================================================
      // Attribution Actions
      // =====================================================
      case "attribute_conversion": {
        if (!data.conversion_id) {
          return NextResponse.json(
            { error: "conversion_id is required" },
            { status: 400 }
          );
        }
        const result = await attributionService.attributeConversion(
          tenantId,
          data.conversion_id,
          data.model || 'linear'
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "calculate_credits": {
        if (!data.path_id) {
          return NextResponse.json(
            { error: "path_id is required" },
            { status: 400 }
          );
        }
        const credits = await attributionService.calculateCredits(
          tenantId,
          data.path_id,
          data.model || 'linear'
        );
        return NextResponse.json({ success: true, credits });
      }

      // =====================================================
      // LTV Actions
      // =====================================================
      case "calculate_ltv": {
        if (!data.profile_id) {
          return NextResponse.json(
            { error: "profile_id is required" },
            { status: 400 }
          );
        }
        const ltv = await attributionService.calculateLTV(tenantId, data.profile_id);
        return NextResponse.json({ success: true, ltv });
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
            model_description: data.model_description,
            model_type: data.model_type,
            is_default: data.is_default,
            lookback_window_days: data.lookback_window_days,
            time_decay_half_life_days: data.time_decay_half_life_days,
            position_weights: data.position_weights,
            channel_weights: data.channel_weights,
            custom_rules: data.custom_rules,
          },
          user.id
        );
        return NextResponse.json({ success: true, model });
      }

      // =====================================================
      // Report Actions
      // =====================================================
      case "create_report": {
        if (!data.report_name || !data.period_start || !data.period_end) {
          return NextResponse.json(
            { error: "report_name, period_start, and period_end are required" },
            { status: 400 }
          );
        }
        const report = await attributionService.createReport(
          tenantId,
          {
            report_name: data.report_name,
            report_description: data.report_description,
            period_start: data.period_start,
            period_end: data.period_end,
            attribution_models: data.attribution_models,
            channels: data.channels,
            conversion_types: data.conversion_types,
          },
          user.id
        );
        return NextResponse.json({ success: true, report });
      }

      // =====================================================
      // AI Actions
      // =====================================================
      case "ai_analyze": {
        // Gather data for analysis
        const [paths, conversions, touchpoints, channelPerformance] = await Promise.all([
          attributionService.listPaths(tenantId, { limit: 50 }),
          attributionService.listConversions(tenantId, { limit: 50 }),
          attributionService.listTouchpoints(tenantId, { limit: 100 }),
          attributionService.getChannelPerformance(tenantId, { limit: 20 }),
        ]);

        const analysis = await attributionService.aiAnalyzeAttribution(tenantId, {
          paths,
          conversions,
          touchpoints,
          channelPerformance,
        });
        return NextResponse.json({ success: true, analysis });
      }

      case "ai_predict_ltv": {
        if (!data.purchase_history || !data.acquisition_channel) {
          return NextResponse.json(
            { error: "purchase_history and acquisition_channel are required" },
            { status: 400 }
          );
        }
        const prediction = await attributionService.aiPredictLTV(tenantId, {
          purchase_history: data.purchase_history,
          touchpoint_count: data.touchpoint_count || 0,
          channels_used: data.channels_used || [],
          acquisition_channel: data.acquisition_channel,
          months_active: data.months_active || 1,
        });
        return NextResponse.json({ success: true, prediction });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[attribution-v3 POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
