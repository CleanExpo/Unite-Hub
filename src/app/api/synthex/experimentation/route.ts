/**
 * Synthex Experimentation API
 *
 * GET - Experiments, variants, assignments, events, results, feature flags, stats
 * POST - Create experiments, variants, assign users, track events, feature flags, AI actions
 *
 * Phase: D36 - Autonomous Experimentation Framework (AXF v1)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as experimentationService from "@/lib/synthex/experimentationService";

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
        const stats = await experimentationService.getExperimentationStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "experiments": {
        const filters = {
          status: searchParams.get("status") as experimentationService.ExperimentStatus | undefined,
          experiment_type: searchParams.get("experiment_type") as experimentationService.ExperimentType | undefined,
          search: searchParams.get("search") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const experiments = await experimentationService.listExperiments(tenantId, filters);
        return NextResponse.json({ success: true, experiments });
      }

      case "experiment": {
        const experimentId = searchParams.get("experimentId");
        if (!experimentId) {
          return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
        }
        const experiment = await experimentationService.getExperiment(experimentId);
        return NextResponse.json({ success: true, experiment });
      }

      case "variants": {
        const experimentId = searchParams.get("experimentId");
        if (!experimentId) {
          return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
        }
        const filters = {
          variant_type: searchParams.get("variant_type") as experimentationService.VariantType | undefined,
        };
        const variants = await experimentationService.listVariants(experimentId, filters);
        return NextResponse.json({ success: true, variants });
      }

      case "variant": {
        const variantId = searchParams.get("variantId");
        if (!variantId) {
          return NextResponse.json({ error: "variantId is required" }, { status: 400 });
        }
        const variant = await experimentationService.getVariant(variantId);
        return NextResponse.json({ success: true, variant });
      }

      case "assignments": {
        const filters = {
          experiment_id: searchParams.get("experiment_id") || undefined,
          variant_id: searchParams.get("variant_id") || undefined,
          has_converted: searchParams.get("has_converted") === "true" ? true : searchParams.get("has_converted") === "false" ? false : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const assignments = await experimentationService.listAssignments(tenantId, filters);
        return NextResponse.json({ success: true, assignments });
      }

      case "assignment": {
        const assignmentId = searchParams.get("assignmentId");
        if (!assignmentId) {
          return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
        }
        const assignment = await experimentationService.getAssignment(assignmentId);
        return NextResponse.json({ success: true, assignment });
      }

      case "events": {
        const filters = {
          experiment_id: searchParams.get("experiment_id") || undefined,
          variant_id: searchParams.get("variant_id") || undefined,
          event_type: searchParams.get("event_type") || undefined,
          start_date: searchParams.get("start_date") || undefined,
          end_date: searchParams.get("end_date") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const events = await experimentationService.listEvents(tenantId, filters);
        return NextResponse.json({ success: true, events });
      }

      case "results": {
        const experimentId = searchParams.get("experimentId");
        if (!experimentId) {
          return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
        }
        const results = await experimentationService.getExperimentResults(experimentId);
        return NextResponse.json({ success: true, results });
      }

      case "results_history": {
        const experimentId = searchParams.get("experimentId");
        if (!experimentId) {
          return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
        }
        const filters = {
          snapshot_type: searchParams.get("snapshot_type") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const results = await experimentationService.listResults(experimentId, filters);
        return NextResponse.json({ success: true, results });
      }

      case "calculate_stats": {
        const experimentId = searchParams.get("experimentId");
        if (!experimentId) {
          return NextResponse.json({ error: "experimentId is required" }, { status: 400 });
        }
        const stats = await experimentationService.calculateStats(experimentId);
        return NextResponse.json({ success: true, stats });
      }

      case "feature_flags": {
        const filters = {
          is_enabled: searchParams.get("is_enabled") === "true" ? true : searchParams.get("is_enabled") === "false" ? false : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const flags = await experimentationService.listFeatureFlags(tenantId, filters);
        return NextResponse.json({ success: true, flags });
      }

      case "feature_flag": {
        const flagId = searchParams.get("flagId");
        const flagKey = searchParams.get("flagKey");
        if (flagId) {
          const flag = await experimentationService.getFeatureFlag(flagId);
          return NextResponse.json({ success: true, flag });
        } else if (flagKey) {
          const flag = await experimentationService.getFeatureFlagByKey(tenantId, flagKey);
          return NextResponse.json({ success: true, flag });
        } else {
          return NextResponse.json({ error: "flagId or flagKey is required" }, { status: 400 });
        }
      }

      case "templates": {
        const filters = {
          experiment_type: searchParams.get("experiment_type") as experimentationService.ExperimentType | undefined,
          is_public: searchParams.get("is_public") === "true" ? true : undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const templates = await experimentationService.listTemplates(tenantId, filters);
        return NextResponse.json({ success: true, templates });
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[experimentation GET] Error:", error);
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
      // Experiment Actions
      // =====================================================
      case "create_experiment": {
        if (!data.experiment_name || !data.primary_metric) {
          return NextResponse.json(
            { error: "experiment_name and primary_metric are required" },
            { status: 400 }
          );
        }
        const experiment = await experimentationService.createExperiment(
          tenantId,
          {
            experiment_name: data.experiment_name,
            experiment_description: data.experiment_description,
            experiment_type: data.experiment_type,
            hypothesis: data.hypothesis,
            scheduled_start: data.scheduled_start,
            scheduled_end: data.scheduled_end,
            traffic_percentage: data.traffic_percentage,
            targeting_rules: data.targeting_rules,
            audience_segments: data.audience_segments,
            exclusion_segments: data.exclusion_segments,
            primary_metric: data.primary_metric,
            secondary_metrics: data.secondary_metrics,
            minimum_detectable_effect: data.minimum_detectable_effect,
            confidence_level: data.confidence_level,
            target_sample_size: data.target_sample_size,
            test_type: data.test_type,
            ai_auto_optimize: data.ai_auto_optimize,
            ai_early_stopping: data.ai_early_stopping,
            tags: data.tags,
            metadata: data.metadata,
          },
          user.id
        );
        return NextResponse.json({ success: true, experiment });
      }

      case "update_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const experiment = await experimentationService.updateExperiment(
          data.experiment_id,
          data.updates
        );
        return NextResponse.json({ success: true, experiment });
      }

      case "start_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const experiment = await experimentationService.startExperiment(data.experiment_id);
        return NextResponse.json({ success: true, experiment });
      }

      case "pause_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const experiment = await experimentationService.pauseExperiment(data.experiment_id);
        return NextResponse.json({ success: true, experiment });
      }

      case "stop_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const experiment = await experimentationService.stopExperiment(
          data.experiment_id,
          data.reason
        );
        return NextResponse.json({ success: true, experiment });
      }

      case "complete_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const experiment = await experimentationService.completeExperiment(data.experiment_id);
        return NextResponse.json({ success: true, experiment });
      }

      // =====================================================
      // Variant Actions
      // =====================================================
      case "create_variant": {
        if (!data.experiment_id || !data.variant_name || !data.variant_key) {
          return NextResponse.json(
            { error: "experiment_id, variant_name, and variant_key are required" },
            { status: 400 }
          );
        }
        const variant = await experimentationService.createVariant(
          tenantId,
          data.experiment_id,
          {
            variant_name: data.variant_name,
            variant_description: data.variant_description,
            variant_type: data.variant_type,
            variant_key: data.variant_key,
            traffic_weight: data.traffic_weight,
            changes: data.changes,
            feature_flags: data.feature_flags,
            content_overrides: data.content_overrides,
            display_order: data.display_order,
          }
        );
        return NextResponse.json({ success: true, variant });
      }

      case "update_variant": {
        if (!data.variant_id) {
          return NextResponse.json({ error: "variant_id is required" }, { status: 400 });
        }
        const variant = await experimentationService.updateVariant(data.variant_id, data.updates);
        return NextResponse.json({ success: true, variant });
      }

      // =====================================================
      // Assignment Actions
      // =====================================================
      case "assign": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const assignmentId = await experimentationService.assignToExperiment(
          tenantId,
          data.experiment_id,
          {
            profile_id: data.profile_id,
            anonymous_id: data.anonymous_id,
            session_id: data.session_id,
          }
        );
        return NextResponse.json({ success: true, assignment_id: assignmentId });
      }

      case "convert": {
        if (!data.assignment_id) {
          return NextResponse.json({ error: "assignment_id is required" }, { status: 400 });
        }
        const converted = await experimentationService.recordConversion(
          data.assignment_id,
          data.conversion_value || 0
        );
        return NextResponse.json({ success: true, converted });
      }

      // =====================================================
      // Event Actions
      // =====================================================
      case "track_event": {
        if (!data.experiment_id || !data.variant_id || !data.event_type) {
          return NextResponse.json(
            { error: "experiment_id, variant_id, and event_type are required" },
            { status: 400 }
          );
        }
        const event = await experimentationService.trackEvent(tenantId, {
          experiment_id: data.experiment_id,
          variant_id: data.variant_id,
          assignment_id: data.assignment_id,
          event_type: data.event_type,
          event_name: data.event_name,
          event_value: data.event_value,
          event_properties: data.event_properties,
          page_url: data.page_url,
          element_id: data.element_id,
          session_id: data.session_id,
        });
        return NextResponse.json({ success: true, event });
      }

      // =====================================================
      // Feature Flag Actions
      // =====================================================
      case "create_feature_flag": {
        if (!data.flag_key || !data.flag_name) {
          return NextResponse.json(
            { error: "flag_key and flag_name are required" },
            { status: 400 }
          );
        }
        const flag = await experimentationService.createFeatureFlag(
          tenantId,
          {
            flag_key: data.flag_key,
            flag_name: data.flag_name,
            flag_description: data.flag_description,
            is_enabled: data.is_enabled,
            rollout_percentage: data.rollout_percentage,
            targeting_rules: data.targeting_rules,
            user_segments: data.user_segments,
            default_value: data.default_value,
            variant_values: data.variant_values,
            experiment_id: data.experiment_id,
          },
          user.id
        );
        return NextResponse.json({ success: true, flag });
      }

      case "update_feature_flag": {
        if (!data.flag_id) {
          return NextResponse.json({ error: "flag_id is required" }, { status: 400 });
        }
        const flag = await experimentationService.updateFeatureFlag(data.flag_id, data.updates);
        return NextResponse.json({ success: true, flag });
      }

      case "toggle_feature_flag": {
        if (!data.flag_id || data.enabled === undefined) {
          return NextResponse.json(
            { error: "flag_id and enabled are required" },
            { status: 400 }
          );
        }
        const flag = await experimentationService.toggleFeatureFlag(data.flag_id, data.enabled);
        return NextResponse.json({ success: true, flag });
      }

      // =====================================================
      // AI Actions
      // =====================================================
      case "ai_analyze": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const analysis = await experimentationService.aiAnalyzeExperiment(
          tenantId,
          data.experiment_id
        );
        return NextResponse.json({ success: true, analysis });
      }

      case "ai_optimize_traffic": {
        if (!data.experiment_id) {
          return NextResponse.json({ error: "experiment_id is required" }, { status: 400 });
        }
        const optimization = await experimentationService.aiOptimizeTraffic(
          tenantId,
          data.experiment_id
        );
        return NextResponse.json({ success: true, optimization });
      }

      case "ai_generate_hypotheses": {
        const hypotheses = await experimentationService.aiGenerateHypothesis(tenantId, {
          page_type: data.page_type,
          current_metrics: data.current_metrics,
          past_experiments: data.past_experiments,
          goals: data.goals,
        });
        return NextResponse.json({ success: true, ...hypotheses });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[experimentation POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
