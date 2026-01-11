/**
 * Synthex Multi-Channel Conversion Engine API
 *
 * GET - Channels, predictions, strategies, touchpoints, experiments, stats
 * POST - Create/manage channels, predictions, strategies, touchpoints, experiments
 *
 * Phase: D27 - Multi-Channel Conversion Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as conversionService from "@/lib/synthex/conversionService";

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
        const stats = await conversionService.getConversionStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "channels": {
        const filters = {
          channel_type: searchParams.get("channel_type") as conversionService.ChannelType | undefined,
          is_active: searchParams.get("is_active") === "true" ? true : searchParams.get("is_active") === "false" ? false : undefined,
        };
        const channels = await conversionService.listChannels(tenantId, filters);
        return NextResponse.json({ success: true, channels });
      }

      case "predictions": {
        const filters = {
          contact_id: searchParams.get("contact_id") || undefined,
          channel: searchParams.get("channel") || undefined,
          prediction_type: searchParams.get("prediction_type") as conversionService.PredictionType | undefined,
          min_likelihood: searchParams.get("min_likelihood") ? parseFloat(searchParams.get("min_likelihood")!) : undefined,
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const predictions = await conversionService.listPredictions(tenantId, filters);
        return NextResponse.json({ success: true, predictions });
      }

      case "strategies": {
        const filters = {
          status: searchParams.get("status") as conversionService.StrategyStatus | undefined,
          target_segment: searchParams.get("target_segment") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const strategies = await conversionService.listStrategies(tenantId, filters);
        return NextResponse.json({ success: true, strategies });
      }

      case "strategy": {
        const strategyId = searchParams.get("strategy_id");
        if (!strategyId) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.getStrategy(tenantId, strategyId);
        return NextResponse.json({ success: true, strategy });
      }

      case "touchpoints": {
        const filters = {
          strategy_id: searchParams.get("strategy_id") || undefined,
          contact_id: searchParams.get("contact_id") || undefined,
          channel: searchParams.get("channel") || undefined,
          status: searchParams.get("status") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const touchpoints = await conversionService.listTouchpoints(tenantId, filters);
        return NextResponse.json({ success: true, touchpoints });
      }

      case "experiments": {
        const filters = {
          status: searchParams.get("status") as conversionService.ExperimentStatus | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const experiments = await conversionService.listExperiments(tenantId, filters);
        return NextResponse.json({ success: true, experiments });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[conversion GET] Error:", error);
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
      // Channel Actions
      // =====================================================
      case "create_channel": {
        if (!data.channel_name || !data.channel_type) {
          return NextResponse.json(
            { error: "channel_name and channel_type are required" },
            { status: 400 }
          );
        }
        const channel = await conversionService.createChannel(
          tenantId,
          {
            channel_name: data.channel_name,
            channel_type: data.channel_type,
            channel_description: data.channel_description,
            channel_config: data.channel_config,
            is_default: data.is_default,
          },
          user.id
        );
        return NextResponse.json({ success: true, channel });
      }

      case "update_channel": {
        if (!data.channel_id) {
          return NextResponse.json(
            { error: "channel_id is required" },
            { status: 400 }
          );
        }
        const channel = await conversionService.updateChannel(data.channel_id, data.updates);
        return NextResponse.json({ success: true, channel });
      }

      // =====================================================
      // Prediction Actions
      // =====================================================
      case "generate_prediction": {
        if (!data.channel) {
          return NextResponse.json(
            { error: "channel is required" },
            { status: 400 }
          );
        }
        const prediction = await conversionService.generatePrediction(tenantId, {
          contact_id: data.contact_id,
          lead_id: data.lead_id,
          segment: data.segment,
          channel: data.channel,
          prediction_type: data.prediction_type,
          context: data.context,
        });
        return NextResponse.json({ success: true, prediction });
      }

      case "record_outcome": {
        if (!data.prediction_id || !data.outcome) {
          return NextResponse.json(
            { error: "prediction_id and outcome are required" },
            { status: 400 }
          );
        }
        const prediction = await conversionService.recordPredictionOutcome(
          data.prediction_id,
          data.outcome,
          data.accuracy
        );
        return NextResponse.json({ success: true, prediction });
      }

      // =====================================================
      // Strategy Actions
      // =====================================================
      case "generate_strategy": {
        if (!data.strategy_name || !data.channels || data.channels.length === 0) {
          return NextResponse.json(
            { error: "strategy_name and channels are required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.generateStrategy(
          tenantId,
          {
            strategy_name: data.strategy_name,
            strategy_description: data.strategy_description,
            strategy_type: data.strategy_type,
            target_segment: data.target_segment,
            target_criteria: data.target_criteria,
            target_goal: data.target_goal,
            channels: data.channels,
            channel_sequence: data.channel_sequence,
            ai_generated: data.ai_generated,
          },
          user.id
        );
        return NextResponse.json({ success: true, strategy });
      }

      case "approve_strategy": {
        if (!data.strategy_id) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.updateStrategyStatus(data.strategy_id, "approved");
        return NextResponse.json({ success: true, strategy });
      }

      case "activate_strategy": {
        if (!data.strategy_id) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.updateStrategyStatus(data.strategy_id, "active");
        return NextResponse.json({ success: true, strategy });
      }

      case "pause_strategy": {
        if (!data.strategy_id) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.updateStrategyStatus(data.strategy_id, "paused");
        return NextResponse.json({ success: true, strategy });
      }

      case "complete_strategy": {
        if (!data.strategy_id) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.updateStrategyStatus(data.strategy_id, "completed");
        return NextResponse.json({ success: true, strategy });
      }

      case "archive_strategy": {
        if (!data.strategy_id) {
          return NextResponse.json(
            { error: "strategy_id is required" },
            { status: 400 }
          );
        }
        const strategy = await conversionService.updateStrategyStatus(data.strategy_id, "archived");
        return NextResponse.json({ success: true, strategy });
      }

      // =====================================================
      // Touchpoint Actions
      // =====================================================
      case "create_touchpoint": {
        if (!data.channel) {
          return NextResponse.json(
            { error: "channel is required" },
            { status: 400 }
          );
        }
        const touchpoint = await conversionService.createTouchpoint(tenantId, {
          strategy_id: data.strategy_id,
          prediction_id: data.prediction_id,
          contact_id: data.contact_id,
          channel: data.channel,
          touchpoint_type: data.touchpoint_type,
          sequence_position: data.sequence_position,
          content_template: data.content_template,
          subject_line: data.subject_line,
          message_preview: data.message_preview,
          scheduled_at: data.scheduled_at,
          delay_from_previous_hours: data.delay_from_previous_hours,
          trigger_condition: data.trigger_condition,
        });
        return NextResponse.json({ success: true, touchpoint });
      }

      case "update_touchpoint_status": {
        if (!data.touchpoint_id || !data.status) {
          return NextResponse.json(
            { error: "touchpoint_id and status are required" },
            { status: 400 }
          );
        }
        const touchpoint = await conversionService.updateTouchpointStatus(
          data.touchpoint_id,
          data.status,
          data.updates
        );
        return NextResponse.json({ success: true, touchpoint });
      }

      // =====================================================
      // Experiment Actions
      // =====================================================
      case "create_experiment": {
        if (!data.experiment_name || !data.variants || data.variants.length < 2) {
          return NextResponse.json(
            { error: "experiment_name and at least 2 variants are required" },
            { status: 400 }
          );
        }
        const experiment = await conversionService.createExperiment(
          tenantId,
          {
            experiment_name: data.experiment_name,
            experiment_description: data.experiment_description,
            hypothesis: data.hypothesis,
            variants: data.variants,
            control_variant_id: data.control_variant_id,
            target_segment: data.target_segment,
            traffic_allocation: data.traffic_allocation,
            primary_metric: data.primary_metric,
            secondary_metrics: data.secondary_metrics,
            min_sample_size: data.min_sample_size,
            statistical_significance: data.statistical_significance,
          },
          user.id
        );
        return NextResponse.json({ success: true, experiment });
      }

      case "start_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json(
            { error: "experiment_id is required" },
            { status: 400 }
          );
        }
        const experiment = await conversionService.updateExperimentStatus(data.experiment_id, "running");
        return NextResponse.json({ success: true, experiment });
      }

      case "pause_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json(
            { error: "experiment_id is required" },
            { status: 400 }
          );
        }
        const experiment = await conversionService.updateExperimentStatus(data.experiment_id, "paused");
        return NextResponse.json({ success: true, experiment });
      }

      case "complete_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json(
            { error: "experiment_id is required" },
            { status: 400 }
          );
        }
        const experiment = await conversionService.updateExperimentStatus(data.experiment_id, "completed");
        return NextResponse.json({ success: true, experiment });
      }

      case "cancel_experiment": {
        if (!data.experiment_id) {
          return NextResponse.json(
            { error: "experiment_id is required" },
            { status: 400 }
          );
        }
        const experiment = await conversionService.updateExperimentStatus(data.experiment_id, "cancelled");
        return NextResponse.json({ success: true, experiment });
      }

      // =====================================================
      // Initialization
      // =====================================================
      case "initialize_defaults": {
        await conversionService.initializeDefaultChannels(tenantId, user.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[conversion POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
