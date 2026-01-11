/**
 * Synthex Cross-Brand Intelligence API
 *
 * GET - Profiles, domains, insights, synergies, campaigns, metrics, stats
 * POST - Create/manage profiles, domains, insights, synergies, campaigns
 *
 * Phase: D28 - Multi-Brand Cross-Domain Intelligence Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as crossBrandService from "@/lib/synthex/crossBrandIntelService";

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
        const stats = await crossBrandService.getCrossBrandStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "profiles": {
        const filters = {
          industry: searchParams.get("industry") || undefined,
          market_segment: searchParams.get("market_segment") as crossBrandService.MarketSegment | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
          is_primary: searchParams.get("is_primary") === "true" ? true : searchParams.get("is_primary") === "false" ? false : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const profiles = await crossBrandService.listCrossBrandProfiles(tenantId, filters);
        return NextResponse.json({ success: true, profiles });
      }

      case "profile": {
        const profileId = searchParams.get("profile_id");
        if (!profileId) {
          return NextResponse.json(
            { error: "profile_id is required" },
            { status: 400 }
          );
        }
        const profile = await crossBrandService.getCrossBrandProfile(tenantId, profileId);
        return NextResponse.json({ success: true, profile });
      }

      case "domains": {
        const crossbrandId = searchParams.get("crossbrand_id") || undefined;
        const domains = await crossBrandService.listCrossBrandDomains(tenantId, crossbrandId);
        return NextResponse.json({ success: true, domains });
      }

      case "insights": {
        const filters = {
          source_crossbrand_id: searchParams.get("source_crossbrand_id") || undefined,
          target_crossbrand_id: searchParams.get("target_crossbrand_id") || undefined,
          insight_type: searchParams.get("insight_type") as crossBrandService.InsightType | undefined,
          insight_category: searchParams.get("insight_category") as crossBrandService.InsightCategory | undefined,
          status: searchParams.get("status") as crossBrandService.InsightStatus | undefined,
          min_score: searchParams.get("min_score") ? parseFloat(searchParams.get("min_score")!) : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const insights = await crossBrandService.listCrossBrandInsights(tenantId, filters);
        return NextResponse.json({ success: true, insights });
      }

      case "synergies": {
        const filters = {
          crossbrand_id: searchParams.get("crossbrand_id") || undefined,
          min_synergy_score: searchParams.get("min_synergy_score") ? parseFloat(searchParams.get("min_synergy_score")!) : undefined,
          relationship_status: searchParams.get("relationship_status") as crossBrandService.RelationshipStatus | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const synergies = await crossBrandService.listSynergies(tenantId, filters);
        return NextResponse.json({ success: true, synergies });
      }

      case "campaigns": {
        const filters = {
          crossbrand_id: searchParams.get("crossbrand_id") || undefined,
          status: searchParams.get("status") as crossBrandService.CampaignStatus | undefined,
          campaign_type: searchParams.get("campaign_type") as crossBrandService.CampaignType | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const campaigns = await crossBrandService.listCrossBrandCampaigns(tenantId, filters);
        return NextResponse.json({ success: true, campaigns });
      }

      case "metrics": {
        const crossbrandId = searchParams.get("crossbrand_id");
        const periodType = (searchParams.get("period_type") || "monthly") as crossBrandService.PeriodType;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 12;

        if (!crossbrandId) {
          return NextResponse.json(
            { error: "crossbrand_id is required for metrics" },
            { status: 400 }
          );
        }

        const metrics = await crossBrandService.getMetricsHistory(tenantId, crossbrandId, periodType, limit);
        return NextResponse.json({ success: true, metrics });
      }

      case "portfolio_health": {
        const portfolioHealth = await crossBrandService.getPortfolioHealth(tenantId);
        return NextResponse.json({ success: true, portfolio_health: portfolioHealth });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[crossbrand-intel GET] Error:", error);
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
      // Profile Actions
      // =====================================================
      case "create_profile": {
        if (!data.brand_name) {
          return NextResponse.json(
            { error: "brand_name is required" },
            { status: 400 }
          );
        }
        const profile = await crossBrandService.createCrossBrandProfile(
          tenantId,
          {
            brand_name: data.brand_name,
            brand_profile_id: data.brand_profile_id,
            brand_slug: data.brand_slug,
            brand_description: data.brand_description,
            industry: data.industry,
            sub_industry: data.sub_industry,
            market_segment: data.market_segment,
            tone: data.tone,
            voice_guidelines: data.voice_guidelines,
            target_demographics: data.target_demographics,
            competitors: data.competitors,
            market_position: data.market_position,
            baseline_metrics: data.baseline_metrics,
            allow_insight_sharing: data.allow_insight_sharing,
            insight_sharing_scope: data.insight_sharing_scope,
            is_primary: data.is_primary,
          },
          user.id
        );
        return NextResponse.json({ success: true, profile });
      }

      case "update_profile": {
        if (!data.profile_id) {
          return NextResponse.json(
            { error: "profile_id is required" },
            { status: 400 }
          );
        }
        const profile = await crossBrandService.updateCrossBrandProfile(data.profile_id, data.updates);
        return NextResponse.json({ success: true, profile });
      }

      // =====================================================
      // Domain Actions
      // =====================================================
      case "add_domain": {
        if (!data.crossbrand_id || !data.domain_name) {
          return NextResponse.json(
            { error: "crossbrand_id and domain_name are required" },
            { status: 400 }
          );
        }
        const domain = await crossBrandService.addCrossBrandDomain(
          tenantId,
          data.crossbrand_id,
          {
            domain_name: data.domain_name,
            domain_type: data.domain_type,
            analytics_provider: data.analytics_provider,
            analytics_config: data.analytics_config,
          }
        );
        return NextResponse.json({ success: true, domain });
      }

      case "verify_domain": {
        if (!data.domain_id || !data.verification_method) {
          return NextResponse.json(
            { error: "domain_id and verification_method are required" },
            { status: 400 }
          );
        }
        const domain = await crossBrandService.verifyDomain(data.domain_id, data.verification_method);
        return NextResponse.json({ success: true, domain });
      }

      // =====================================================
      // Insight Actions
      // =====================================================
      case "generate_insight": {
        if (!data.source_crossbrand_id || !data.insight_type) {
          return NextResponse.json(
            { error: "source_crossbrand_id and insight_type are required" },
            { status: 400 }
          );
        }
        const insight = await crossBrandService.generateCrossBrandInsight(tenantId, {
          source_crossbrand_id: data.source_crossbrand_id,
          target_crossbrand_id: data.target_crossbrand_id,
          insight_type: data.insight_type,
          context: data.context,
        });
        return NextResponse.json({ success: true, insight });
      }

      case "update_insight_status": {
        if (!data.insight_id || !data.status) {
          return NextResponse.json(
            { error: "insight_id and status are required" },
            { status: 400 }
          );
        }
        const insight = await crossBrandService.updateInsightStatus(
          data.insight_id,
          data.status,
          data.outcome
        );
        return NextResponse.json({ success: true, insight });
      }

      // =====================================================
      // Synergy Actions
      // =====================================================
      case "calculate_synergy": {
        if (!data.crossbrand_a_id || !data.crossbrand_b_id) {
          return NextResponse.json(
            { error: "crossbrand_a_id and crossbrand_b_id are required" },
            { status: 400 }
          );
        }
        const synergy = await crossBrandService.calculateSynergy(
          tenantId,
          data.crossbrand_a_id,
          data.crossbrand_b_id
        );
        return NextResponse.json({ success: true, synergy });
      }

      case "update_synergy_status": {
        if (!data.synergy_id || !data.status) {
          return NextResponse.json(
            { error: "synergy_id and status are required" },
            { status: 400 }
          );
        }
        const synergy = await crossBrandService.updateSynergyStatus(data.synergy_id, data.status);
        return NextResponse.json({ success: true, synergy });
      }

      // =====================================================
      // Campaign Actions
      // =====================================================
      case "create_campaign": {
        if (!data.campaign_name || !data.participating_crossbrands || data.participating_crossbrands.length === 0) {
          return NextResponse.json(
            { error: "campaign_name and at least one participating_crossbrands are required" },
            { status: 400 }
          );
        }
        const campaign = await crossBrandService.createCrossBrandCampaign(
          tenantId,
          {
            campaign_name: data.campaign_name,
            campaign_description: data.campaign_description,
            campaign_type: data.campaign_type,
            participating_crossbrands: data.participating_crossbrands,
            lead_crossbrand_id: data.lead_crossbrand_id,
            primary_goal: data.primary_goal,
            target_metrics: data.target_metrics,
            total_budget: data.total_budget,
            budget_allocation: data.budget_allocation,
            channels: data.channels,
            channel_strategy: data.channel_strategy,
            scheduled_start: data.scheduled_start,
            scheduled_end: data.scheduled_end,
          },
          user.id
        );
        return NextResponse.json({ success: true, campaign });
      }

      case "update_campaign_status": {
        if (!data.campaign_id || !data.status) {
          return NextResponse.json(
            { error: "campaign_id and status are required" },
            { status: 400 }
          );
        }
        const campaign = await crossBrandService.updateCampaignStatus(data.campaign_id, data.status);
        return NextResponse.json({ success: true, campaign });
      }

      case "record_campaign_performance": {
        if (!data.campaign_id) {
          return NextResponse.json(
            { error: "campaign_id is required" },
            { status: 400 }
          );
        }
        const campaign = await crossBrandService.recordCampaignPerformance(data.campaign_id, {
          actual_reach: data.actual_reach,
          actual_conversions: data.actual_conversions,
          actual_revenue: data.actual_revenue,
          brand_performance: data.brand_performance,
        });
        return NextResponse.json({ success: true, campaign });
      }

      // =====================================================
      // Metrics Actions
      // =====================================================
      case "record_metrics": {
        if (!data.crossbrand_id || !data.period_type || !data.period_start || !data.period_end) {
          return NextResponse.json(
            { error: "crossbrand_id, period_type, period_start, and period_end are required" },
            { status: 400 }
          );
        }
        const metrics = await crossBrandService.recordMetrics(tenantId, data.crossbrand_id, {
          period_type: data.period_type,
          period_start: data.period_start,
          period_end: data.period_end,
          total_visits: data.total_visits,
          unique_visitors: data.unique_visitors,
          page_views: data.page_views,
          avg_session_duration: data.avg_session_duration,
          bounce_rate: data.bounce_rate,
          total_conversions: data.total_conversions,
          conversion_rate: data.conversion_rate,
          total_revenue: data.total_revenue,
          avg_order_value: data.avg_order_value,
          email_subscribers: data.email_subscribers,
          social_followers: data.social_followers,
          engagement_rate: data.engagement_rate,
          brand_awareness_score: data.brand_awareness_score,
          brand_sentiment_score: data.brand_sentiment_score,
          nps_score: data.nps_score,
          cross_brand_conversions: data.cross_brand_conversions,
          cross_brand_revenue: data.cross_brand_revenue,
          audience_shared_percent: data.audience_shared_percent,
        });
        return NextResponse.json({ success: true, metrics });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[crossbrand-intel POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
