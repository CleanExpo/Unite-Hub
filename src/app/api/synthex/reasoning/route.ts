/**
 * Synthex Multi-Model Reasoning API
 *
 * GET - List models, chains, prompts, logs, stats, feedback
 * POST - Run reasoning, create models/chains/prompts, submit feedback
 *
 * Phase: D22 - Multi-Model AI Reasoning Engine
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import * as reasoningService from "@/lib/synthex/multimodelReasoningService";

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
        const stats = await reasoningService.getReasoningStats(tenantId);
        return NextResponse.json({ success: true, stats });
      }

      case "models": {
        const filters: reasoningService.ModelFilters = {
          provider: searchParams.get("provider") as reasoningService.ModelProvider | undefined,
          capability: searchParams.get("capability") || undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_primary:
            searchParams.get("is_primary") === "true"
              ? true
              : searchParams.get("is_primary") === "false"
                ? false
                : undefined,
        };
        const models = await reasoningService.listModels(tenantId, filters);
        return NextResponse.json({ success: true, models });
      }

      case "model": {
        const modelId = searchParams.get("modelId");
        if (!modelId) {
          return NextResponse.json(
            { error: "modelId is required" },
            { status: 400 }
          );
        }
        const model = await reasoningService.getModel(tenantId, modelId);
        return NextResponse.json({ success: true, model });
      }

      case "chains": {
        const filters: reasoningService.ChainFilters = {
          chain_type: searchParams.get("chain_type") as reasoningService.ChainType | undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_template:
            searchParams.get("is_template") === "true"
              ? true
              : searchParams.get("is_template") === "false"
                ? false
                : undefined,
        };
        const chains = await reasoningService.listChains(tenantId, filters);
        return NextResponse.json({ success: true, chains });
      }

      case "chain": {
        const chainId = searchParams.get("chainId");
        if (!chainId) {
          return NextResponse.json(
            { error: "chainId is required" },
            { status: 400 }
          );
        }
        const chain = await reasoningService.getChain(tenantId, chainId);
        return NextResponse.json({ success: true, chain });
      }

      case "prompts": {
        const filters: reasoningService.PromptFilters = {
          category: searchParams.get("category") as reasoningService.PromptCategory | undefined,
          is_active:
            searchParams.get("is_active") === "true"
              ? true
              : searchParams.get("is_active") === "false"
                ? false
                : undefined,
          is_template:
            searchParams.get("is_template") === "true"
              ? true
              : searchParams.get("is_template") === "false"
                ? false
                : undefined,
        };
        const prompts = await reasoningService.listPrompts(tenantId, filters);
        return NextResponse.json({ success: true, prompts });
      }

      case "prompt": {
        const promptId = searchParams.get("promptId");
        if (!promptId) {
          return NextResponse.json(
            { error: "promptId is required" },
            { status: 400 }
          );
        }
        const prompt = await reasoningService.getPrompt(tenantId, promptId);
        return NextResponse.json({ success: true, prompt });
      }

      case "logs": {
        const filters: reasoningService.LogFilters = {
          status: searchParams.get("status") as reasoningService.ReasoningStatus | undefined,
          chain_id: searchParams.get("chain_id") || undefined,
          from_date: searchParams.get("from_date") || undefined,
          to_date: searchParams.get("to_date") || undefined,
          limit: searchParams.get("limit")
            ? parseInt(searchParams.get("limit")!)
            : undefined,
          offset: searchParams.get("offset")
            ? parseInt(searchParams.get("offset")!)
            : undefined,
        };
        const logs = await reasoningService.listLogs(tenantId, filters);
        return NextResponse.json({ success: true, logs });
      }

      case "log": {
        const logId = searchParams.get("logId");
        if (!logId) {
          return NextResponse.json(
            { error: "logId is required" },
            { status: 400 }
          );
        }
        const log = await reasoningService.getLog(tenantId, logId);
        return NextResponse.json({ success: true, log });
      }

      case "feedback": {
        const logId = searchParams.get("logId") || undefined;
        const feedback = await reasoningService.listFeedback(tenantId, logId);
        return NextResponse.json({ success: true, feedback });
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[reasoning GET] Error:", error);
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
      case "run": {
        const result = await reasoningService.runReasoning(tenantId, {
          chain_id: data.chain_id,
          prompt_id: data.prompt_id,
          model_id: data.model_id,
          input_type: data.input_type || "text",
          input_payload: data.input_payload,
          variables: data.variables,
          options: data.options,
          context_data: data.context_data,
          triggered_by: user.id,
          trigger_source: data.trigger_source || "api",
        });
        return NextResponse.json({ success: true, result });
      }

      case "create_model": {
        const model = await reasoningService.createModel(tenantId, {
          model_name: data.model_name,
          model_id: data.model_id,
          provider: data.provider,
          description: data.description,
          capabilities: data.capabilities,
          max_tokens: data.max_tokens,
          supports_streaming: data.supports_streaming,
          supports_tools: data.supports_tools,
          supports_vision: data.supports_vision,
          cost_per_1k_input: data.cost_per_1k_input,
          cost_per_1k_output: data.cost_per_1k_output,
          default_temperature: data.default_temperature,
          default_top_p: data.default_top_p,
          system_prompt_template: data.system_prompt_template,
          is_primary: data.is_primary,
          priority_order: data.priority_order,
        });
        return NextResponse.json({ success: true, model });
      }

      case "update_model": {
        const model = await reasoningService.updateModel(
          data.model_id,
          data.updates
        );
        return NextResponse.json({ success: true, model });
      }

      case "delete_model": {
        await reasoningService.deleteModel(data.model_id);
        return NextResponse.json({ success: true });
      }

      case "create_chain": {
        const chain = await reasoningService.createChain(tenantId, {
          chain_name: data.chain_name,
          description: data.description,
          chain_type: data.chain_type,
          steps: data.steps,
          aggregation_strategy: data.aggregation_strategy,
          fallback_model_id: data.fallback_model_id,
          max_retries: data.max_retries,
          timeout_seconds: data.timeout_seconds,
          min_confidence_threshold: data.min_confidence_threshold,
          require_consensus: data.require_consensus,
          consensus_threshold: data.consensus_threshold,
          is_template: data.is_template,
        });
        return NextResponse.json({ success: true, chain });
      }

      case "update_chain": {
        const chain = await reasoningService.updateChain(
          data.chain_id,
          data.updates
        );
        return NextResponse.json({ success: true, chain });
      }

      case "delete_chain": {
        await reasoningService.deleteChain(data.chain_id);
        return NextResponse.json({ success: true });
      }

      case "create_prompt": {
        const prompt = await reasoningService.createPrompt(tenantId, {
          prompt_name: data.prompt_name,
          description: data.description,
          category: data.category,
          system_prompt: data.system_prompt,
          user_prompt_template: data.user_prompt_template,
          output_schema: data.output_schema,
          required_variables: data.required_variables,
          optional_variables: data.optional_variables,
          variable_defaults: data.variable_defaults,
          recommended_model: data.recommended_model,
          recommended_temperature: data.recommended_temperature,
          max_output_tokens: data.max_output_tokens,
          is_template: data.is_template,
        });
        return NextResponse.json({ success: true, prompt });
      }

      case "submit_feedback": {
        const feedback = await reasoningService.submitFeedback(
          tenantId,
          {
            reasoning_log_id: data.reasoning_log_id,
            rating: data.rating,
            feedback_type: data.feedback_type,
            feedback_text: data.feedback_text,
            corrected_output: data.corrected_output,
          },
          user.id
        );
        return NextResponse.json({ success: true, feedback });
      }

      case "initialize_defaults": {
        await reasoningService.initializeDefaultModels(tenantId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[reasoning POST] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
