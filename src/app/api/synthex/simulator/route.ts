/**
 * Synthex AI-Powered Outcome Simulator API
 *
 * GET - Simulations, scenarios, predictions, templates, validations, stats
 * POST - Create/run simulations, scenarios, predictions, templates, validations
 *
 * Phase: D33 - AI-Powered Outcome Simulator
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as simulatorService from "@/lib/synthex/simulatorService";

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
        const stats = await simulatorService.getSimulationStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "simulations": {
        const filters = {
          simulation_type: searchParams.get("simulation_type") as simulatorService.SimulationType | undefined,
          status: searchParams.get("status") as simulatorService.SimulationStatus | undefined,
          target_entity_type: searchParams.get("target_entity_type") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const simulations = await simulatorService.listSimulations(tenantId, filters);
        return NextResponse.json({ success: true, simulations });
      }

      case "simulation": {
        const simulationId = searchParams.get("simulationId");
        if (!simulationId) {
          return NextResponse.json(
            { error: "simulationId is required" },
            { status: 400 }
          );
        }
        const simulation = await simulatorService.getSimulation(simulationId);
        return NextResponse.json({ success: true, simulation });
      }

      case "scenarios": {
        const simulationId = searchParams.get("simulationId");
        if (!simulationId) {
          return NextResponse.json(
            { error: "simulationId is required" },
            { status: 400 }
          );
        }
        const filters = {
          scenario_type: searchParams.get("scenario_type") as simulatorService.ScenarioType | undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const scenarios = await simulatorService.listScenarios(simulationId, filters);
        return NextResponse.json({ success: true, scenarios });
      }

      case "predictions": {
        const simulationId = searchParams.get("simulationId");
        if (!simulationId) {
          return NextResponse.json(
            { error: "simulationId is required" },
            { status: 400 }
          );
        }
        const filters = {
          scenario_id: searchParams.get("scenario_id") || undefined,
          metric_category: searchParams.get("metric_category") || undefined,
          prediction_period: searchParams.get("prediction_period") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const predictions = await simulatorService.listPredictions(simulationId, filters);
        return NextResponse.json({ success: true, predictions });
      }

      case "templates": {
        const filters = {
          template_type: searchParams.get("template_type") as simulatorService.SimulationType | undefined,
          is_public: searchParams.get("is_public") === "true" ? true : searchParams.get("is_public") === "false" ? false : undefined,
          category: searchParams.get("category") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const templates = await simulatorService.listTemplates(tenantId, filters);
        return NextResponse.json({ success: true, templates });
      }

      case "template": {
        const templateId = searchParams.get("templateId");
        if (!templateId) {
          return NextResponse.json(
            { error: "templateId is required" },
            { status: 400 }
          );
        }
        const template = await simulatorService.getTemplate(templateId);
        return NextResponse.json({ success: true, template });
      }

      case "validations": {
        const simulationId = searchParams.get("simulationId");
        if (!simulationId) {
          return NextResponse.json(
            { error: "simulationId is required" },
            { status: 400 }
          );
        }
        const filters = {
          metric_name: searchParams.get("metric_name") || undefined,
          error_category: searchParams.get("error_category") || undefined,
          limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
        };
        const validations = await simulatorService.listValidations(simulationId, filters);
        return NextResponse.json({ success: true, validations });
      }

      case "accuracy": {
        const simulationId = searchParams.get("simulationId");
        if (!simulationId) {
          return NextResponse.json(
            { error: "simulationId is required" },
            { status: 400 }
          );
        }
        const accuracy = await simulatorService.getPredictionAccuracy(simulationId);
        return NextResponse.json({ success: true, accuracy });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[simulator GET] Error:", error);
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
      // Simulation Actions
      // =====================================================
      case "create_simulation": {
        if (!data.simulation_name || !data.simulation_type) {
          return NextResponse.json(
            { error: "simulation_name and simulation_type are required" },
            { status: 400 }
          );
        }
        const simulation = await simulatorService.createSimulation(
          tenantId,
          {
            simulation_name: data.simulation_name,
            simulation_description: data.simulation_description,
            simulation_type: data.simulation_type,
            target_entity_type: data.target_entity_type,
            target_entity_id: data.target_entity_id,
            time_horizon_days: data.time_horizon_days,
            start_date: data.start_date,
            end_date: data.end_date,
            input_parameters: data.input_parameters,
            baseline_metrics: data.baseline_metrics,
            assumptions: data.assumptions,
            constraints: data.constraints,
            monte_carlo_iterations: data.monte_carlo_iterations,
            confidence_level: data.confidence_level,
            model_type: data.model_type,
            tags: data.tags,
          },
          user.id
        );
        return NextResponse.json({ success: true, simulation });
      }

      case "update_simulation": {
        if (!data.simulation_id) {
          return NextResponse.json(
            { error: "simulation_id is required" },
            { status: 400 }
          );
        }
        const simulation = await simulatorService.updateSimulation(data.simulation_id, data.updates);
        return NextResponse.json({ success: true, simulation });
      }

      case "start_simulation": {
        if (!data.simulation_id) {
          return NextResponse.json(
            { error: "simulation_id is required" },
            { status: 400 }
          );
        }
        const started = await simulatorService.startSimulation(data.simulation_id);
        return NextResponse.json({ success: true, started });
      }

      case "cancel_simulation": {
        if (!data.simulation_id) {
          return NextResponse.json(
            { error: "simulation_id is required" },
            { status: 400 }
          );
        }
        const simulation = await simulatorService.cancelSimulation(data.simulation_id);
        return NextResponse.json({ success: true, simulation });
      }

      case "run_simulation": {
        if (!data.simulation_id) {
          return NextResponse.json(
            { error: "simulation_id is required" },
            { status: 400 }
          );
        }
        const result = await simulatorService.runAISimulation(tenantId, data.simulation_id);
        return NextResponse.json({ success: true, ...result });
      }

      // =====================================================
      // Scenario Actions
      // =====================================================
      case "create_scenario": {
        if (!data.simulation_id || !data.scenario_name || !data.scenario_type) {
          return NextResponse.json(
            { error: "simulation_id, scenario_name, and scenario_type are required" },
            { status: 400 }
          );
        }
        const scenario = await simulatorService.createScenario(
          tenantId,
          data.simulation_id,
          {
            scenario_name: data.scenario_name,
            scenario_description: data.scenario_description,
            scenario_type: data.scenario_type,
            parameter_overrides: data.parameter_overrides,
            assumption_overrides: data.assumption_overrides,
            multipliers: data.multipliers,
            probability_weight: data.probability_weight,
            is_primary: data.is_primary,
            display_order: data.display_order,
          }
        );
        return NextResponse.json({ success: true, scenario });
      }

      case "update_scenario": {
        if (!data.scenario_id) {
          return NextResponse.json(
            { error: "scenario_id is required" },
            { status: 400 }
          );
        }
        const scenario = await simulatorService.updateScenario(data.scenario_id, data.updates);
        return NextResponse.json({ success: true, scenario });
      }

      case "generate_scenario": {
        if (!data.simulation_id || !data.scenario_type) {
          return NextResponse.json(
            { error: "simulation_id and scenario_type are required" },
            { status: 400 }
          );
        }
        const result = await simulatorService.generateScenarioAnalysis(
          tenantId,
          data.simulation_id,
          data.scenario_type
        );
        return NextResponse.json({ success: true, ...result });
      }

      // =====================================================
      // Prediction Actions
      // =====================================================
      case "create_prediction": {
        if (!data.simulation_id || !data.metric_name) {
          return NextResponse.json(
            { error: "simulation_id and metric_name are required" },
            { status: 400 }
          );
        }
        const prediction = await simulatorService.createPrediction(
          tenantId,
          data.simulation_id,
          {
            scenario_id: data.scenario_id,
            metric_name: data.metric_name,
            metric_category: data.metric_category,
            predicted_value: data.predicted_value,
            predicted_min: data.predicted_min,
            predicted_max: data.predicted_max,
            predicted_mean: data.predicted_mean,
            predicted_median: data.predicted_median,
            standard_deviation: data.standard_deviation,
            confidence: data.confidence,
            confidence_score: data.confidence_score,
            confidence_reasoning: data.confidence_reasoning,
            prediction_date: data.prediction_date,
            prediction_period: data.prediction_period,
            baseline_value: data.baseline_value,
            distribution_type: data.distribution_type,
            distribution_params: data.distribution_params,
            top_positive_factors: data.top_positive_factors,
            top_negative_factors: data.top_negative_factors,
          }
        );
        return NextResponse.json({ success: true, prediction });
      }

      // =====================================================
      // Template Actions
      // =====================================================
      case "create_template": {
        if (!data.template_name || !data.template_type) {
          return NextResponse.json(
            { error: "template_name and template_type are required" },
            { status: 400 }
          );
        }
        const template = await simulatorService.createTemplate(
          tenantId,
          {
            template_name: data.template_name,
            template_description: data.template_description,
            template_type: data.template_type,
            default_parameters: data.default_parameters,
            default_assumptions: data.default_assumptions,
            default_constraints: data.default_constraints,
            default_scenarios: data.default_scenarios,
            recommended_model: data.recommended_model,
            recommended_iterations: data.recommended_iterations,
            recommended_horizon_days: data.recommended_horizon_days,
            is_public: data.is_public,
            category: data.category,
            industry: data.industry,
            tags: data.tags,
          },
          user.id
        );
        return NextResponse.json({ success: true, template });
      }

      // =====================================================
      // Validation Actions
      // =====================================================
      case "create_validation": {
        if (!data.simulation_id || !data.metric_name || !data.validation_date) {
          return NextResponse.json(
            { error: "simulation_id, metric_name, and validation_date are required" },
            { status: 400 }
          );
        }
        const validation = await simulatorService.createValidation(
          tenantId,
          data.simulation_id,
          {
            prediction_id: data.prediction_id,
            metric_name: data.metric_name,
            predicted_value: data.predicted_value,
            actual_value: data.actual_value,
            validation_date: data.validation_date,
          },
          user.id
        );
        return NextResponse.json({ success: true, validation });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[simulator POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
