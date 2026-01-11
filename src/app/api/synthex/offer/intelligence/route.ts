/**
 * Synthex Adaptive Offer Intelligence API
 *
 * GET - Insights, tests, templates, rules, redemptions, stats
 * POST - Generate insights, create/manage tests, templates, rules, redemptions
 *
 * Phase: D25 - Adaptive Offer Intelligence Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as offerService from "@/lib/synthex/offerService";

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
        const stats = await offerService.getOfferStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "insights": {
        const filters: offerService.OfferFilters = {
          status: searchParams.get("status") as offerService.OfferStatus | undefined,
          offer_type: searchParams.get("offer_type") as offerService.OfferType | undefined,
          audience_segment: searchParams.get("audience_segment") || undefined,
          min_confidence: searchParams.get("min_confidence")
            ? parseFloat(searchParams.get("min_confidence")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const insights = await offerService.listOfferInsights(tenantId, filters);
        return NextResponse.json({ success: true, insights });
      }

      case "insight": {
        const insightId = searchParams.get("insight_id");
        if (!insightId) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.getOfferInsight(tenantId, insightId);
        return NextResponse.json({ success: true, insight });
      }

      case "tests": {
        const filters: offerService.TestFilters = {
          status: searchParams.get("status") as offerService.TestStatus | undefined,
          audience_segment: searchParams.get("audience_segment") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const tests = await offerService.listOfferTests(tenantId, filters);
        return NextResponse.json({ success: true, tests });
      }

      case "test": {
        const testId = searchParams.get("test_id");
        if (!testId) {
          return NextResponse.json(
            { error: "test_id is required" },
            { status: 400 }
          );
        }
        const test = await offerService.getOfferTest(tenantId, testId);
        return NextResponse.json({ success: true, test });
      }

      case "templates": {
        const offerType = searchParams.get("offer_type") as offerService.OfferType | undefined;
        const templates = await offerService.listOfferTemplates(tenantId, offerType);
        return NextResponse.json({ success: true, templates });
      }

      case "rules": {
        const ruleType = searchParams.get("rule_type") || undefined;
        const rules = await offerService.listOfferRules(tenantId, ruleType);
        return NextResponse.json({ success: true, rules });
      }

      case "redemptions": {
        const filters = {
          offer_insight_id: searchParams.get("offer_insight_id") || undefined,
          offer_test_id: searchParams.get("offer_test_id") || undefined,
          contact_id: searchParams.get("contact_id") || undefined,
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const redemptions = await offerService.listRedemptions(tenantId, filters);
        return NextResponse.json({ success: true, redemptions });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[offer/intelligence GET] Error:", error);
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
      // Insight Actions
      // =====================================================
      case "generate_insight": {
        if (!data.audience_segment) {
          return NextResponse.json(
            { error: "audience_segment is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.generateOfferInsight(
          tenantId,
          {
            audience_segment: data.audience_segment,
            segment_criteria: data.segment_criteria,
            offer_types: data.offer_types,
            budget_constraints: data.budget_constraints,
            goals: data.goals,
            context: data.context,
          },
          user.id
        );
        return NextResponse.json({ success: true, insight });
      }

      case "update_insight": {
        if (!data.insight_id) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.updateOfferInsight(
          data.insight_id,
          data.updates
        );
        return NextResponse.json({ success: true, insight });
      }

      case "approve_insight": {
        if (!data.insight_id) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.approveOfferInsight(
          data.insight_id,
          user.id
        );
        return NextResponse.json({ success: true, insight });
      }

      case "activate_insight": {
        if (!data.insight_id) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.activateOfferInsight(
          data.insight_id,
          data.expires_at
        );
        return NextResponse.json({ success: true, insight });
      }

      case "pause_insight": {
        if (!data.insight_id) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.pauseOfferInsight(data.insight_id);
        return NextResponse.json({ success: true, insight });
      }

      case "archive_insight": {
        if (!data.insight_id) {
          return NextResponse.json(
            { error: "insight_id is required" },
            { status: 400 }
          );
        }
        const insight = await offerService.archiveOfferInsight(data.insight_id);
        return NextResponse.json({ success: true, insight });
      }

      // =====================================================
      // Test Actions
      // =====================================================
      case "create_test": {
        if (!data.test_name || !data.variant_a || !data.variant_b) {
          return NextResponse.json(
            { error: "test_name, variant_a, and variant_b are required" },
            { status: 400 }
          );
        }
        const test = await offerService.createOfferTest(
          tenantId,
          {
            test_name: data.test_name,
            test_description: data.test_description,
            hypothesis: data.hypothesis,
            variant_a: data.variant_a,
            variant_b: data.variant_b,
            variant_c: data.variant_c,
            variant_d: data.variant_d,
            audience_segment: data.audience_segment,
            traffic_allocation: data.traffic_allocation,
            min_sample_size: data.min_sample_size,
            statistical_significance: data.statistical_significance,
            test_duration_days: data.test_duration_days,
            primary_metric: data.primary_metric,
            secondary_metrics: data.secondary_metrics,
            auto_deploy_winner: data.auto_deploy_winner,
          },
          user.id
        );
        return NextResponse.json({ success: true, test });
      }

      case "start_test": {
        if (!data.test_id) {
          return NextResponse.json(
            { error: "test_id is required" },
            { status: 400 }
          );
        }
        const test = await offerService.startOfferTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      case "pause_test": {
        if (!data.test_id) {
          return NextResponse.json(
            { error: "test_id is required" },
            { status: 400 }
          );
        }
        const test = await offerService.pauseOfferTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      case "complete_test": {
        if (!data.test_id || !data.result) {
          return NextResponse.json(
            { error: "test_id and result are required" },
            { status: 400 }
          );
        }
        const test = await offerService.completeOfferTest(
          data.test_id,
          data.result
        );
        return NextResponse.json({ success: true, test });
      }

      case "cancel_test": {
        if (!data.test_id) {
          return NextResponse.json(
            { error: "test_id is required" },
            { status: 400 }
          );
        }
        const test = await offerService.cancelOfferTest(data.test_id);
        return NextResponse.json({ success: true, test });
      }

      // =====================================================
      // Template Actions
      // =====================================================
      case "create_template": {
        if (!data.template_name || !data.offer_type || !data.template_config) {
          return NextResponse.json(
            { error: "template_name, offer_type, and template_config are required" },
            { status: 400 }
          );
        }
        const template = await offerService.createOfferTemplate(
          tenantId,
          {
            template_name: data.template_name,
            template_description: data.template_description,
            offer_type: data.offer_type,
            template_config: data.template_config,
            default_segment: data.default_segment,
            default_criteria: data.default_criteria,
          },
          user.id
        );
        return NextResponse.json({ success: true, template });
      }

      case "update_template": {
        if (!data.template_id) {
          return NextResponse.json(
            { error: "template_id is required" },
            { status: 400 }
          );
        }
        const template = await offerService.updateOfferTemplate(
          data.template_id,
          data.updates
        );
        return NextResponse.json({ success: true, template });
      }

      case "delete_template": {
        if (!data.template_id) {
          return NextResponse.json(
            { error: "template_id is required" },
            { status: 400 }
          );
        }
        await offerService.deleteOfferTemplate(data.template_id);
        return NextResponse.json({ success: true });
      }

      // =====================================================
      // Rule Actions
      // =====================================================
      case "create_rule": {
        if (!data.rule_name || !data.rule_type || !data.conditions || !data.actions) {
          return NextResponse.json(
            { error: "rule_name, rule_type, conditions, and actions are required" },
            { status: 400 }
          );
        }
        const rule = await offerService.createOfferRule(
          tenantId,
          {
            rule_name: data.rule_name,
            rule_description: data.rule_description,
            rule_type: data.rule_type,
            conditions: data.conditions,
            condition_logic: data.condition_logic,
            actions: data.actions,
            offer_template_id: data.offer_template_id,
            priority: data.priority,
            max_triggers_per_contact: data.max_triggers_per_contact,
            cooldown_days: data.cooldown_days,
          },
          user.id
        );
        return NextResponse.json({ success: true, rule });
      }

      case "update_rule": {
        if (!data.rule_id) {
          return NextResponse.json(
            { error: "rule_id is required" },
            { status: 400 }
          );
        }
        const rule = await offerService.updateOfferRule(data.rule_id, data.updates);
        return NextResponse.json({ success: true, rule });
      }

      case "delete_rule": {
        if (!data.rule_id) {
          return NextResponse.json(
            { error: "rule_id is required" },
            { status: 400 }
          );
        }
        await offerService.deleteOfferRule(data.rule_id);
        return NextResponse.json({ success: true });
      }

      // =====================================================
      // Redemption Actions
      // =====================================================
      case "record_redemption": {
        const redemption = await offerService.recordRedemption(tenantId, {
          offer_insight_id: data.offer_insight_id,
          offer_test_id: data.offer_test_id,
          variant_id: data.variant_id,
          contact_id: data.contact_id,
          lead_id: data.lead_id,
          redemption_code: data.redemption_code,
          redemption_channel: data.redemption_channel,
          redemption_value: data.redemption_value,
          order_value: data.order_value,
          discount_applied: data.discount_applied,
          attribution_source: data.attribution_source,
          attribution_medium: data.attribution_medium,
          attribution_campaign: data.attribution_campaign,
          touchpoint_path: data.touchpoint_path,
        });
        return NextResponse.json({ success: true, redemption });
      }

      case "complete_redemption": {
        if (!data.redemption_id) {
          return NextResponse.json(
            { error: "redemption_id is required" },
            { status: 400 }
          );
        }
        const redemption = await offerService.completeRedemption(
          data.redemption_id,
          data.order_value
        );
        return NextResponse.json({ success: true, redemption });
      }

      // =====================================================
      // Initialization
      // =====================================================
      case "initialize_defaults": {
        await offerService.initializeDefaultTemplates(tenantId, user.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[offer/intelligence POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
