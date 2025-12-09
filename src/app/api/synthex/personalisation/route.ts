/**
 * Synthex Adaptive Personalisation API
 *
 * GET - Profiles, events, recommendations, rules, experiments, personas, stats
 * POST - Track events, compute profiles, create rules/experiments/personas
 *
 * Phase: D24 - Adaptive Personalisation Engine (Real-Time)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as personalisationService from "@/lib/synthex/personalisationService";

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
        const stats = await personalisationService.getPersonalisationStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "profile": {
        const contactId = searchParams.get("contact_id");
        if (!contactId) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const profile = await personalisationService.getProfile(tenantId, contactId);
        return NextResponse.json({ success: true, profile });
      }

      case "events": {
        const filters: personalisationService.EventFilters = {
          contact_id: searchParams.get("contact_id") || undefined,
          event_type: searchParams.get("event_type") as personalisationService.EventType | undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          is_processed:
            searchParams.get("is_processed") === "true"
              ? true
              : searchParams.get("is_processed") === "false"
                ? false
                : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const events = await personalisationService.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "recommendations": {
        const filters: personalisationService.RecommendationFilters = {
          contact_id: searchParams.get("contact_id") || undefined,
          recommendation_type: searchParams.get("recommendation_type") as personalisationService.RecommendationType | undefined,
          status: searchParams.get("status") as personalisationService.PersonalisationRecommendation["status"] | undefined,
          min_relevance: searchParams.get("min_relevance")
            ? parseFloat(searchParams.get("min_relevance")!)
            : undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
        };
        const recommendations = await personalisationService.listRecommendations(
          tenantId,
          filters
        );
        return NextResponse.json({ success: true, recommendations });
      }

      case "rules": {
        const ruleType = searchParams.get("rule_type") as personalisationService.RuleType | undefined;
        const rules = await personalisationService.listRules(tenantId, ruleType);
        return NextResponse.json({ success: true, rules });
      }

      case "experiments": {
        const status = searchParams.get("status") as personalisationService.ExperimentStatus | undefined;
        const experiments = await personalisationService.listExperiments(
          tenantId,
          status
        );
        return NextResponse.json({ success: true, experiments });
      }

      case "personas": {
        const personas = await personalisationService.listPersonas(tenantId);
        return NextResponse.json({ success: true, personas });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[personalisation GET] Error:", error);
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
      case "track_event": {
        if (!data.contact_id || !data.event_type) {
          return NextResponse.json(
            { error: "contact_id and event_type are required" },
            { status: 400 }
          );
        }
        const event = await personalisationService.trackEvent(tenantId, {
          contact_id: data.contact_id,
          event_type: data.event_type,
          event_category: data.event_category,
          event_action: data.event_action,
          event_label: data.event_label,
          event_value: data.event_value,
          page_url: data.page_url,
          referrer_url: data.referrer_url,
          content_id: data.content_id,
          content_type: data.content_type,
          campaign_id: data.campaign_id,
          source: data.source,
          medium: data.medium,
          payload: data.payload,
          session_id: data.session_id,
          device_type: data.device_type,
          browser: data.browser,
          platform: data.platform,
          country: data.country,
          city: data.city,
          occurred_at: data.occurred_at,
        });
        return NextResponse.json({ success: true, event });
      }

      case "compute_profile": {
        if (!data.contact_id) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const profile = await personalisationService.computeProfile(
          tenantId,
          data.contact_id
        );
        return NextResponse.json({ success: true, profile });
      }

      case "update_profile": {
        if (!data.contact_id) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const profile = await personalisationService.updateProfile(
          tenantId,
          data.contact_id,
          data.updates
        );
        return NextResponse.json({ success: true, profile });
      }

      case "generate_recommendations": {
        if (!data.contact_id) {
          return NextResponse.json(
            { error: "contact_id is required" },
            { status: 400 }
          );
        }
        const recommendations = await personalisationService.generateRecommendations(
          tenantId,
          data.contact_id,
          data.types
        );
        return NextResponse.json({ success: true, recommendations });
      }

      case "update_recommendation_status": {
        if (!data.recommendation_id || !data.status) {
          return NextResponse.json(
            { error: "recommendation_id and status are required" },
            { status: 400 }
          );
        }
        const recommendation = await personalisationService.updateRecommendationStatus(
          data.recommendation_id,
          data.status
        );
        return NextResponse.json({ success: true, recommendation });
      }

      case "create_rule": {
        if (!data.rule_name || !data.rule_type || !data.conditions || !data.actions) {
          return NextResponse.json(
            { error: "rule_name, rule_type, conditions, and actions are required" },
            { status: 400 }
          );
        }
        const rule = await personalisationService.createRule(tenantId, {
          rule_name: data.rule_name,
          description: data.description,
          rule_type: data.rule_type,
          conditions: data.conditions,
          condition_logic: data.condition_logic,
          actions: data.actions,
          priority: data.priority,
          is_exclusive: data.is_exclusive,
          exclusion_rules: data.exclusion_rules,
          start_date: data.start_date,
          end_date: data.end_date,
        });
        return NextResponse.json({ success: true, rule });
      }

      case "create_experiment": {
        if (!data.experiment_name || !data.variants || !data.primary_goal) {
          return NextResponse.json(
            { error: "experiment_name, variants, and primary_goal are required" },
            { status: 400 }
          );
        }
        const experiment = await personalisationService.createExperiment(tenantId, {
          experiment_name: data.experiment_name,
          description: data.description,
          hypothesis: data.hypothesis,
          variants: data.variants,
          control_variant_id: data.control_variant_id,
          targeting_rules: data.targeting_rules,
          traffic_allocation: data.traffic_allocation,
          primary_goal: data.primary_goal,
          secondary_goals: data.secondary_goals,
        });
        return NextResponse.json({ success: true, experiment });
      }

      case "update_experiment_status": {
        if (!data.experiment_id || !data.status) {
          return NextResponse.json(
            { error: "experiment_id and status are required" },
            { status: 400 }
          );
        }
        const experiment = await personalisationService.updateExperimentStatus(
          data.experiment_id,
          data.status
        );
        return NextResponse.json({ success: true, experiment });
      }

      case "create_persona": {
        if (!data.persona_name) {
          return NextResponse.json(
            { error: "persona_name is required" },
            { status: 400 }
          );
        }
        const persona = await personalisationService.createPersona(tenantId, {
          persona_name: data.persona_name,
          description: data.description,
          avatar_url: data.avatar_url,
          age_range: data.age_range,
          gender: data.gender,
          location_type: data.location_type,
          income_level: data.income_level,
          education_level: data.education_level,
          job_role: data.job_role,
          industry: data.industry,
          traits: data.traits,
          preferred_content_types: data.preferred_content_types,
          preferred_content_length: data.preferred_content_length,
          preferred_tone: data.preferred_tone,
          preferred_channels: data.preferred_channels,
          goals: data.goals,
          pain_points: data.pain_points,
          objections: data.objections,
          matching_rules: data.matching_rules,
          min_match_score: data.min_match_score,
        });
        return NextResponse.json({ success: true, persona });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[personalisation POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
