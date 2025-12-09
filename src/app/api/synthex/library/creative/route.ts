/**
 * Synthex Creative Library API
 * Phase D18: Multi-Channel Creative Generator
 *
 * GET - Get stats, briefs, assets, templates, A/B tests
 * POST - Create briefs, generate content, create A/B tests
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as creativeService from "@/lib/synthex/creativeService";

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
        const stats = await creativeService.getCreativeStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "briefs": {
        const filters = {
          status: searchParams.get("status") || undefined,
          campaign_id: searchParams.get("campaign_id") || undefined,
          objective: searchParams.get("objective") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const briefs = await creativeService.listBriefs(tenantId, filters);
        return NextResponse.json({ success: true, briefs });
      }

      case "assets": {
        const filters = {
          brief_id: searchParams.get("brief_id") || undefined,
          channel: searchParams.get("channel") || undefined,
          asset_type: searchParams.get("asset_type") || undefined,
          status: searchParams.get("status") || undefined,
          is_variant:
            searchParams.get("is_variant") === "true"
              ? true
              : searchParams.get("is_variant") === "false"
                ? false
                : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const assets = await creativeService.listAssets(tenantId, filters);
        return NextResponse.json({ success: true, assets });
      }

      case "templates": {
        const filters = {
          channel: searchParams.get("channel") || undefined,
          asset_type: searchParams.get("asset_type") || undefined,
          category: searchParams.get("category") || undefined,
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
        const templates = await creativeService.listTemplates(
          tenantId,
          filters
        );
        return NextResponse.json({ success: true, templates });
      }

      case "ab_tests": {
        const filters = {
          status: searchParams.get("status") || undefined,
          channel: searchParams.get("channel") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const tests = await creativeService.listABTests(tenantId, filters);
        return NextResponse.json({ success: true, tests });
      }

      case "channels": {
        const channels = creativeService.getSupportedChannels();
        return NextResponse.json({ success: true, channels });
      }

      case "channel_constraints": {
        const channel = searchParams.get("channel");
        if (!channel) {
          return NextResponse.json(
            { error: "channel is required" },
            { status: 400 }
          );
        }
        const constraints = creativeService.getChannelConstraints(channel);
        return NextResponse.json({ success: true, constraints });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Creative API GET error:", error);
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
      case "create_brief": {
        const brief = await creativeService.createBrief(
          tenantId,
          {
            name: data.name,
            description: data.description,
            campaign_id: data.campaign_id,
            campaign_name: data.campaign_name,
            objective: data.objective,
            target_audience: data.target_audience,
            audience_persona_id: data.audience_persona_id,
            brand_id: data.brand_id,
            tone_profile_id: data.tone_profile_id,
            primary_message: data.primary_message,
            supporting_messages: data.supporting_messages,
            call_to_action: data.call_to_action,
            visual_style: data.visual_style,
            color_scheme: data.color_scheme,
            imagery_direction: data.imagery_direction,
            target_channels: data.target_channels,
            inspiration_urls: data.inspiration_urls,
            competitor_refs: data.competitor_refs,
            reference_assets: data.reference_assets,
            word_limits: data.word_limits,
            required_elements: data.required_elements,
            forbidden_elements: data.forbidden_elements,
            tags: data.tags,
            metadata: data.metadata,
          },
          user.id
        );
        return NextResponse.json({ success: true, brief });
      }

      case "approve_brief": {
        const brief = await creativeService.approveBrief(
          data.brief_id,
          user.id
        );
        return NextResponse.json({ success: true, brief });
      }

      case "create_asset": {
        const asset = await creativeService.createAsset(
          tenantId,
          {
            name: data.name,
            description: data.description,
            brief_id: data.brief_id,
            asset_type: data.asset_type,
            channel: data.channel,
            format: data.format,
            headline: data.headline,
            subheadline: data.subheadline,
            body: data.body,
            call_to_action: data.call_to_action,
            visual_description: data.visual_description,
            hashtags: data.hashtags,
            mentions: data.mentions,
            links: data.links,
            content_blocks: data.content_blocks,
            variables: data.variables,
            tags: data.tags,
            metadata: data.metadata,
          },
          user.id
        );
        return NextResponse.json({ success: true, asset });
      }

      case "create_variant": {
        const asset = await creativeService.createVariant(
          tenantId,
          data.original_asset_id,
          {
            headline: data.headline,
            subheadline: data.subheadline,
            body: data.body,
            call_to_action: data.call_to_action,
            variant_label: data.variant_label,
            variant_changes: data.variant_changes,
          },
          user.id
        );
        return NextResponse.json({ success: true, asset });
      }

      case "review_asset": {
        const asset = await creativeService.reviewAsset(
          data.asset_id,
          data.status,
          user.id
        );
        return NextResponse.json({ success: true, asset });
      }

      case "update_performance": {
        const asset = await creativeService.updateAssetPerformance(
          data.asset_id,
          {
            impressions: data.impressions,
            clicks: data.clicks,
            conversions: data.conversions,
          }
        );
        return NextResponse.json({ success: true, asset });
      }

      case "generate": {
        const result = await creativeService.generateCreative(
          tenantId,
          {
            brief_id: data.brief_id,
            template_id: data.template_id,
            prompt: data.prompt,
            channels: data.channels,
            variants_count: data.variants_count,
            context: data.context,
          },
          user.id
        );
        return NextResponse.json({ success: true, ...result });
      }

      case "regenerate": {
        const asset = await creativeService.regenerateAsset(
          data.asset_id,
          data.instructions,
          user.id
        );
        return NextResponse.json({ success: true, asset });
      }

      case "create_template": {
        const template = await creativeService.createTemplate(
          tenantId,
          {
            name: data.name,
            description: data.description,
            category: data.category,
            channel: data.channel,
            asset_type: data.asset_type,
            format: data.format,
            headline_template: data.headline_template,
            body_template: data.body_template,
            cta_template: data.cta_template,
            variables: data.variables,
            tone: data.tone,
            style: data.style,
            ai_instructions: data.ai_instructions,
            example_outputs: data.example_outputs,
            tags: data.tags,
          },
          user.id
        );
        return NextResponse.json({ success: true, template });
      }

      case "add_feedback": {
        const feedback = await creativeService.addFeedback(
          tenantId,
          data.asset_id,
          {
            rating: data.rating,
            feedback_type: data.feedback_type,
            feedback_text: data.feedback_text,
            issues: data.issues,
            revision_instructions: data.revision_instructions,
          },
          user.id
        );
        return NextResponse.json({ success: true, feedback });
      }

      case "create_ab_test": {
        const test = await creativeService.createABTest(
          tenantId,
          {
            name: data.name,
            description: data.description,
            hypothesis: data.hypothesis,
            control_asset_id: data.control_asset_id,
            variant_asset_ids: data.variant_asset_ids,
            channel: data.channel,
            traffic_split: data.traffic_split,
            primary_metric: data.primary_metric,
            secondary_metrics: data.secondary_metrics,
            audience_filter: data.audience_filter,
            sample_size_target: data.sample_size_target,
            start_date: data.start_date,
            end_date: data.end_date,
            auto_select_winner: data.auto_select_winner,
          },
          user.id
        );
        return NextResponse.json({ success: true, test });
      }

      case "start_ab_test": {
        const test = await creativeService.startABTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      case "pause_ab_test": {
        const test = await creativeService.pauseABTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      case "conclude_ab_test": {
        const test = await creativeService.concludeABTest(data.test_id, {
          winner_asset_id: data.winner_asset_id,
          winning_confidence: data.winning_confidence,
          results_summary: data.results_summary,
        });
        return NextResponse.json({ success: true, test });
      }

      case "cancel_ab_test": {
        const test = await creativeService.cancelABTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Creative API POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
