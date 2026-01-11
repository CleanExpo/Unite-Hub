/**
 * Synthex Multi-Model AI Reasoning Service
 *
 * Phase D22: Multi-Model AI Reasoning Engine
 *
 * Orchestrates multiple AI models for complex reasoning tasks with
 * chain-of-thought traces, ensemble voting, and confidence scoring.
 */

import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let clientInitTime = 0;
const CLIENT_TTL_MS = 60000;

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient && Date.now() - clientInitTime < CLIENT_TTL_MS) {
    return anthropicClient;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
return null;
}
  anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  clientInitTime = Date.now();
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export type ModelProvider = "anthropic" | "openai" | "google" | "openrouter" | "local";

export type ChainType = "sequential" | "parallel" | "branching" | "iterative" | "ensemble";

export type AggregationStrategy = "first" | "last" | "merge" | "vote" | "weighted_vote" | "best_confidence";

export type PromptCategory =
  | "analysis"
  | "synthesis"
  | "evaluation"
  | "generation"
  | "classification"
  | "extraction"
  | "summarization"
  | "reasoning";

export type ReasoningStatus = "pending" | "running" | "completed" | "failed" | "timeout" | "cancelled";

export type FeedbackType =
  | "accurate"
  | "inaccurate"
  | "helpful"
  | "unhelpful"
  | "incomplete"
  | "wrong_format"
  | "other";

export interface ReasoningModel {
  id: string;
  tenant_id: string;
  model_name: string;
  model_id: string;
  provider: ModelProvider;
  description?: string;
  capabilities: string[];
  max_tokens: number;
  supports_streaming: boolean;
  supports_tools: boolean;
  supports_vision: boolean;
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  avg_latency_ms?: number;
  reliability_score: number;
  default_temperature: number;
  default_top_p: number;
  system_prompt_template?: string;
  is_active: boolean;
  is_primary: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChainStep {
  model_id: string;
  role: string;
  prompt_template: string;
  output_key: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ReasoningChain {
  id: string;
  tenant_id: string;
  chain_name: string;
  description?: string;
  chain_type: ChainType;
  steps: ChainStep[];
  aggregation_strategy: AggregationStrategy;
  fallback_model_id?: string;
  max_retries: number;
  timeout_seconds: number;
  min_confidence_threshold: number;
  require_consensus: boolean;
  consensus_threshold: number;
  use_count: number;
  avg_execution_time_ms?: number;
  success_rate: number;
  is_active: boolean;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelExecution {
  model: string;
  step: number;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number;
}

export interface ReasoningStep {
  step: number;
  thought: string;
  intermediate_output: unknown;
}

export interface ReasoningLog {
  id: string;
  tenant_id: string;
  chain_id?: string;
  input_type: string;
  input_payload: Record<string, unknown>;
  models_used: string[];
  model_sequence?: ModelExecution[];
  final_output?: unknown;
  output_type?: string;
  reasoning_trace?: ReasoningStep[];
  chain_of_thought?: string;
  confidence: number;
  consensus_score?: number;
  quality_score?: number;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost: number;
  execution_time_ms?: number;
  status: ReasoningStatus;
  error_message?: string;
  error_code?: string;
  triggered_by?: string;
  trigger_source?: string;
  context_data: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface ReasoningPrompt {
  id: string;
  tenant_id: string;
  prompt_name: string;
  description?: string;
  category: PromptCategory;
  system_prompt?: string;
  user_prompt_template: string;
  output_schema?: Record<string, unknown>;
  required_variables: string[];
  optional_variables: string[];
  variable_defaults: Record<string, unknown>;
  recommended_model?: string;
  recommended_temperature?: number;
  max_output_tokens?: number;
  use_count: number;
  avg_quality_score?: number;
  is_active: boolean;
  is_template: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ReasoningCache {
  id: string;
  tenant_id: string;
  input_hash: string;
  chain_id?: string;
  model_id?: string;
  cached_output: unknown;
  confidence: number;
  hit_count: number;
  last_hit_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ReasoningFeedback {
  id: string;
  tenant_id: string;
  reasoning_log_id: string;
  rating?: number;
  feedback_type?: FeedbackType;
  feedback_text?: string;
  corrected_output?: unknown;
  provided_by?: string;
  created_at: string;
}

// =====================================================
// Input Types
// =====================================================

export interface CreateModelInput {
  model_name: string;
  model_id: string;
  provider: ModelProvider;
  description?: string;
  capabilities?: string[];
  max_tokens?: number;
  supports_streaming?: boolean;
  supports_tools?: boolean;
  supports_vision?: boolean;
  cost_per_1k_input?: number;
  cost_per_1k_output?: number;
  default_temperature?: number;
  default_top_p?: number;
  system_prompt_template?: string;
  is_primary?: boolean;
  priority_order?: number;
}

export interface CreateChainInput {
  chain_name: string;
  description?: string;
  chain_type: ChainType;
  steps: ChainStep[];
  aggregation_strategy?: AggregationStrategy;
  fallback_model_id?: string;
  max_retries?: number;
  timeout_seconds?: number;
  min_confidence_threshold?: number;
  require_consensus?: boolean;
  consensus_threshold?: number;
  is_template?: boolean;
}

export interface CreatePromptInput {
  prompt_name: string;
  description?: string;
  category: PromptCategory;
  system_prompt?: string;
  user_prompt_template: string;
  output_schema?: Record<string, unknown>;
  required_variables?: string[];
  optional_variables?: string[];
  variable_defaults?: Record<string, unknown>;
  recommended_model?: string;
  recommended_temperature?: number;
  max_output_tokens?: number;
  is_template?: boolean;
}

export interface RunReasoningInput {
  chain_id?: string;
  prompt_id?: string;
  model_id?: string;
  input_type: "text" | "structured" | "multimodal";
  input_payload: Record<string, unknown>;
  variables?: Record<string, unknown>;
  options?: {
    temperature?: number;
    max_tokens?: number;
    use_cache?: boolean;
    cache_ttl_hours?: number;
    stream?: boolean;
  };
  context_data?: Record<string, unknown>;
  triggered_by?: string;
  trigger_source?: string;
}

export interface FeedbackInput {
  reasoning_log_id: string;
  rating?: number;
  feedback_type?: FeedbackType;
  feedback_text?: string;
  corrected_output?: unknown;
}

// =====================================================
// Filter Types
// =====================================================

export interface ModelFilters {
  provider?: ModelProvider;
  capability?: string;
  is_active?: boolean;
  is_primary?: boolean;
}

export interface ChainFilters {
  chain_type?: ChainType;
  is_active?: boolean;
  is_template?: boolean;
}

export interface LogFilters {
  status?: ReasoningStatus;
  chain_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface PromptFilters {
  category?: PromptCategory;
  is_active?: boolean;
  is_template?: boolean;
}

// =====================================================
// Result Types
// =====================================================

export interface ReasoningResult {
  log_id: string;
  output: unknown;
  output_type: string;
  confidence: number;
  reasoning_trace?: ReasoningStep[];
  chain_of_thought?: string;
  models_used: string[];
  execution_time_ms: number;
  total_cost: number;
  cached: boolean;
}

export interface ReasoningStats {
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  avg_confidence: number;
  avg_execution_time_ms: number;
  total_cost: number;
  models_count: number;
  chains_count: number;
  prompts_count: number;
  cache_hit_rate: number;
}

// =====================================================
// Model Management
// =====================================================

export async function createModel(
  tenantId: string,
  input: CreateModelInput
): Promise<ReasoningModel> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_models")
    .insert({
      tenant_id: tenantId,
      model_name: input.model_name,
      model_id: input.model_id,
      provider: input.provider,
      description: input.description,
      capabilities: input.capabilities || [],
      max_tokens: input.max_tokens || 4096,
      supports_streaming: input.supports_streaming ?? true,
      supports_tools: input.supports_tools ?? true,
      supports_vision: input.supports_vision ?? false,
      cost_per_1k_input: input.cost_per_1k_input || 0,
      cost_per_1k_output: input.cost_per_1k_output || 0,
      default_temperature: input.default_temperature || 0.7,
      default_top_p: input.default_top_p || 1.0,
      system_prompt_template: input.system_prompt_template,
      is_primary: input.is_primary ?? false,
      priority_order: input.priority_order || 100,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create model: ${error.message}`);
}
  return data;
}

export async function listModels(
  tenantId: string,
  filters?: ModelFilters
): Promise<ReasoningModel[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reasoning_models")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("priority_order", { ascending: true });

  if (filters?.provider) {
    query = query.eq("provider", filters.provider);
  }
  if (filters?.capability) {
    query = query.contains("capabilities", [filters.capability]);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_primary !== undefined) {
    query = query.eq("is_primary", filters.is_primary);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list models: ${error.message}`);
}
  return data || [];
}

export async function getModel(
  tenantId: string,
  modelId: string
): Promise<ReasoningModel | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_models")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", modelId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get model: ${error.message}`);
  }
  return data;
}

export async function updateModel(
  modelId: string,
  updates: Partial<ReasoningModel>
): Promise<ReasoningModel> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_models")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", modelId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update model: ${error.message}`);
}
  return data;
}

export async function deleteModel(modelId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_reasoning_models")
    .delete()
    .eq("id", modelId);

  if (error) {
throw new Error(`Failed to delete model: ${error.message}`);
}
}

// =====================================================
// Chain Management
// =====================================================

export async function createChain(
  tenantId: string,
  input: CreateChainInput
): Promise<ReasoningChain> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_chains")
    .insert({
      tenant_id: tenantId,
      chain_name: input.chain_name,
      description: input.description,
      chain_type: input.chain_type,
      steps: input.steps,
      aggregation_strategy: input.aggregation_strategy || "last",
      fallback_model_id: input.fallback_model_id,
      max_retries: input.max_retries || 2,
      timeout_seconds: input.timeout_seconds || 120,
      min_confidence_threshold: input.min_confidence_threshold || 0.5,
      require_consensus: input.require_consensus ?? false,
      consensus_threshold: input.consensus_threshold || 0.7,
      is_template: input.is_template ?? false,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create chain: ${error.message}`);
}
  return data;
}

export async function listChains(
  tenantId: string,
  filters?: ChainFilters
): Promise<ReasoningChain[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reasoning_chains")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.chain_type) {
    query = query.eq("chain_type", filters.chain_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_template !== undefined) {
    query = query.eq("is_template", filters.is_template);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list chains: ${error.message}`);
}
  return data || [];
}

export async function getChain(
  tenantId: string,
  chainId: string
): Promise<ReasoningChain | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_chains")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", chainId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get chain: ${error.message}`);
  }
  return data;
}

export async function updateChain(
  chainId: string,
  updates: Partial<ReasoningChain>
): Promise<ReasoningChain> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_chains")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chainId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update chain: ${error.message}`);
}
  return data;
}

export async function deleteChain(chainId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_reasoning_chains")
    .delete()
    .eq("id", chainId);

  if (error) {
throw new Error(`Failed to delete chain: ${error.message}`);
}
}

// =====================================================
// Prompt Management
// =====================================================

export async function createPrompt(
  tenantId: string,
  input: CreatePromptInput
): Promise<ReasoningPrompt> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_prompts")
    .insert({
      tenant_id: tenantId,
      prompt_name: input.prompt_name,
      description: input.description,
      category: input.category,
      system_prompt: input.system_prompt,
      user_prompt_template: input.user_prompt_template,
      output_schema: input.output_schema,
      required_variables: input.required_variables || [],
      optional_variables: input.optional_variables || [],
      variable_defaults: input.variable_defaults || {},
      recommended_model: input.recommended_model,
      recommended_temperature: input.recommended_temperature,
      max_output_tokens: input.max_output_tokens,
      is_template: input.is_template ?? false,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create prompt: ${error.message}`);
}
  return data;
}

export async function listPrompts(
  tenantId: string,
  filters?: PromptFilters
): Promise<ReasoningPrompt[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reasoning_prompts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("category", { ascending: true });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_template !== undefined) {
    query = query.eq("is_template", filters.is_template);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list prompts: ${error.message}`);
}
  return data || [];
}

export async function getPrompt(
  tenantId: string,
  promptId: string
): Promise<ReasoningPrompt | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_prompts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", promptId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get prompt: ${error.message}`);
  }
  return data;
}

// =====================================================
// Cache Management
// =====================================================

function calculateHash(
  input: Record<string, unknown>,
  chainId?: string,
  modelId?: string
): string {
  const content = JSON.stringify(input) + (chainId || "") + (modelId || "");
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function checkCache(
  tenantId: string,
  inputHash: string
): Promise<ReasoningCache | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_cache")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("input_hash", inputHash)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Cache check error:", error);
    return null;
  }

  if (data) {
    // Update hit count
    await supabase
      .from("synthex_library_reasoning_cache")
      .update({
        hit_count: data.hit_count + 1,
        last_hit_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }

  return data;
}

async function saveCache(
  tenantId: string,
  inputHash: string,
  output: unknown,
  confidence: number,
  chainId?: string,
  modelId?: string,
  ttlHours: number = 24
): Promise<void> {
  const supabase = await createClient();

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);

  await supabase.from("synthex_library_reasoning_cache").upsert(
    {
      tenant_id: tenantId,
      input_hash: inputHash,
      chain_id: chainId,
      model_id: modelId,
      cached_output: output,
      confidence,
      expires_at: expiresAt.toISOString(),
    },
    {
      onConflict: "tenant_id,input_hash,chain_id",
    }
  );
}

// =====================================================
// Reasoning Execution
// =====================================================

export async function runReasoning(
  tenantId: string,
  input: RunReasoningInput
): Promise<ReasoningResult> {
  const supabase = await createClient();
  const startTime = Date.now();

  // Check cache if enabled
  const useCache = input.options?.use_cache ?? true;
  const inputHash = calculateHash(input.input_payload, input.chain_id, input.model_id);

  if (useCache) {
    const cached = await checkCache(tenantId, inputHash);
    if (cached) {
      return {
        log_id: "",
        output: cached.cached_output,
        output_type: "cached",
        confidence: cached.confidence,
        models_used: [],
        execution_time_ms: Date.now() - startTime,
        total_cost: 0,
        cached: true,
      };
    }
  }

  // Create log entry
  const { data: log, error: logError } = await supabase
    .from("synthex_library_reasoning_logs")
    .insert({
      tenant_id: tenantId,
      chain_id: input.chain_id,
      input_type: input.input_type,
      input_payload: input.input_payload,
      models_used: [],
      status: "running",
      triggered_by: input.triggered_by,
      trigger_source: input.trigger_source || "api",
      context_data: input.context_data || {},
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError) {
throw new Error(`Failed to create log: ${logError.message}`);
}

  try {
    let result: {
      output: unknown;
      outputType: string;
      confidence: number;
      reasoningTrace: ReasoningStep[];
      chainOfThought: string;
      modelsUsed: string[];
      modelSequence: ModelExecution[];
      tokensIn: number;
      tokensOut: number;
      cost: number;
    };

    if (input.chain_id) {
      result = await executeChain(tenantId, input.chain_id, input);
    } else if (input.prompt_id) {
      result = await executePrompt(tenantId, input.prompt_id, input);
    } else {
      result = await executeDirect(tenantId, input);
    }

    const executionTime = Date.now() - startTime;

    // Update log with results
    await supabase
      .from("synthex_library_reasoning_logs")
      .update({
        final_output: result.output,
        output_type: result.outputType,
        models_used: result.modelsUsed,
        model_sequence: result.modelSequence,
        reasoning_trace: result.reasoningTrace,
        chain_of_thought: result.chainOfThought,
        confidence: result.confidence,
        total_tokens_in: result.tokensIn,
        total_tokens_out: result.tokensOut,
        total_cost: result.cost,
        execution_time_ms: executionTime,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", log.id);

    // Save to cache
    if (useCache && result.confidence >= 0.5) {
      await saveCache(
        tenantId,
        inputHash,
        result.output,
        result.confidence,
        input.chain_id,
        input.model_id,
        input.options?.cache_ttl_hours || 24
      );
    }

    return {
      log_id: log.id,
      output: result.output,
      output_type: result.outputType,
      confidence: result.confidence,
      reasoning_trace: result.reasoningTrace,
      chain_of_thought: result.chainOfThought,
      models_used: result.modelsUsed,
      execution_time_ms: executionTime,
      total_cost: result.cost,
      cached: false,
    };
  } catch (error) {
    // Update log with error
    await supabase
      .from("synthex_library_reasoning_logs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", log.id);

    throw error;
  }
}

async function executeChain(
  tenantId: string,
  chainId: string,
  input: RunReasoningInput
): Promise<{
  output: unknown;
  outputType: string;
  confidence: number;
  reasoningTrace: ReasoningStep[];
  chainOfThought: string;
  modelsUsed: string[];
  modelSequence: ModelExecution[];
  tokensIn: number;
  tokensOut: number;
  cost: number;
}> {
  const chain = await getChain(tenantId, chainId);
  if (!chain) {
throw new Error("Chain not found");
}

  const reasoningTrace: ReasoningStep[] = [];
  const modelSequence: ModelExecution[] = [];
  const modelsUsed: string[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCost = 0;
  const outputs: Record<string, unknown> = { input: input.input_payload };

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];
    const stepStart = Date.now();

    // Interpolate template with previous outputs
    const prompt = interpolateTemplate(step.prompt_template, outputs);

    const client = getAnthropicClient();
    if (!client) {
throw new Error("AI client not available");
}

    const response = await client.messages.create({
      model: step.model_id || "claude-sonnet-4-5-20250514",
      max_tokens: step.max_tokens || 2048,
      temperature: step.temperature || 0.7,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    const output = textContent ? textContent.text : "";

    // Parse structured output if needed
    let parsedOutput: unknown = output;
    try {
      parsedOutput = JSON.parse(output);
    } catch {
      // Keep as string if not valid JSON
    }

    outputs[step.output_key] = parsedOutput;

    const latency = Date.now() - stepStart;
    const tokensIn = response.usage?.input_tokens || 0;
    const tokensOut = response.usage?.output_tokens || 0;

    modelSequence.push({
      model: step.model_id || "claude-sonnet-4-5-20250514",
      step: i,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      latency_ms: latency,
    });

    if (!modelsUsed.includes(step.model_id || "claude-sonnet-4-5-20250514")) {
      modelsUsed.push(step.model_id || "claude-sonnet-4-5-20250514");
    }

    reasoningTrace.push({
      step: i,
      thought: `Step ${i + 1}: ${step.role}`,
      intermediate_output: parsedOutput,
    });

    totalTokensIn += tokensIn;
    totalTokensOut += tokensOut;
    // Estimate cost (Claude Sonnet pricing)
    totalCost += (tokensIn * 0.003 + tokensOut * 0.015) / 1000;
  }

  // Get final output based on aggregation strategy
  const lastStep = chain.steps[chain.steps.length - 1];
  const finalOutput = outputs[lastStep.output_key];

  return {
    output: finalOutput,
    outputType: typeof finalOutput === "object" ? "structured" : "text",
    confidence: 0.85, // Would be calculated based on model outputs
    reasoningTrace,
    chainOfThought: reasoningTrace.map((r) => r.thought).join(" -> "),
    modelsUsed,
    modelSequence,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    cost: totalCost,
  };
}

async function executePrompt(
  tenantId: string,
  promptId: string,
  input: RunReasoningInput
): Promise<{
  output: unknown;
  outputType: string;
  confidence: number;
  reasoningTrace: ReasoningStep[];
  chainOfThought: string;
  modelsUsed: string[];
  modelSequence: ModelExecution[];
  tokensIn: number;
  tokensOut: number;
  cost: number;
}> {
  const prompt = await getPrompt(tenantId, promptId);
  if (!prompt) {
throw new Error("Prompt not found");
}

  // Merge variables
  const variables = {
    ...prompt.variable_defaults,
    ...input.input_payload,
    ...input.variables,
  };

  // Validate required variables
  for (const reqVar of prompt.required_variables) {
    if (!(reqVar in variables)) {
      throw new Error(`Missing required variable: ${reqVar}`);
    }
  }

  const userPrompt = interpolateTemplate(prompt.user_prompt_template, variables);

  const client = getAnthropicClient();
  if (!client) {
throw new Error("AI client not available");
}

  const startTime = Date.now();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];

  const response = await client.messages.create({
    model: prompt.recommended_model || input.model_id || "claude-sonnet-4-5-20250514",
    max_tokens: prompt.max_output_tokens || input.options?.max_tokens || 2048,
    temperature: prompt.recommended_temperature || input.options?.temperature || 0.7,
    system: prompt.system_prompt,
    messages,
  });

  const latency = Date.now() - startTime;
  const textContent = response.content.find((c) => c.type === "text");
  const output = textContent ? textContent.text : "";

  let parsedOutput: unknown = output;
  try {
    parsedOutput = JSON.parse(output);
  } catch {
    // Keep as string
  }

  const tokensIn = response.usage?.input_tokens || 0;
  const tokensOut = response.usage?.output_tokens || 0;
  const modelUsed = prompt.recommended_model || input.model_id || "claude-sonnet-4-5-20250514";

  // Update prompt usage
  const supabase = await createClient();
  await supabase
    .from("synthex_library_reasoning_prompts")
    .update({ use_count: prompt.use_count + 1 })
    .eq("id", promptId);

  return {
    output: parsedOutput,
    outputType: typeof parsedOutput === "object" ? "structured" : "text",
    confidence: 0.85,
    reasoningTrace: [
      {
        step: 0,
        thought: `Executed prompt: ${prompt.prompt_name}`,
        intermediate_output: parsedOutput,
      },
    ],
    chainOfThought: `Used prompt template "${prompt.prompt_name}" (${prompt.category})`,
    modelsUsed: [modelUsed],
    modelSequence: [
      {
        model: modelUsed,
        step: 0,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latency,
      },
    ],
    tokensIn,
    tokensOut,
    cost: (tokensIn * 0.003 + tokensOut * 0.015) / 1000,
  };
}

async function executeDirect(
  tenantId: string,
  input: RunReasoningInput
): Promise<{
  output: unknown;
  outputType: string;
  confidence: number;
  reasoningTrace: ReasoningStep[];
  chainOfThought: string;
  modelsUsed: string[];
  modelSequence: ModelExecution[];
  tokensIn: number;
  tokensOut: number;
  cost: number;
}> {
  const client = getAnthropicClient();
  if (!client) {
throw new Error("AI client not available");
}

  const userContent =
    typeof input.input_payload.prompt === "string"
      ? input.input_payload.prompt
      : JSON.stringify(input.input_payload);

  const startTime = Date.now();
  const modelId = input.model_id || "claude-sonnet-4-5-20250514";

  const response = await client.messages.create({
    model: modelId,
    max_tokens: input.options?.max_tokens || 2048,
    temperature: input.options?.temperature || 0.7,
    messages: [{ role: "user", content: userContent }],
  });

  const latency = Date.now() - startTime;
  const textContent = response.content.find((c) => c.type === "text");
  const output = textContent ? textContent.text : "";

  let parsedOutput: unknown = output;
  try {
    parsedOutput = JSON.parse(output);
  } catch {
    // Keep as string
  }

  const tokensIn = response.usage?.input_tokens || 0;
  const tokensOut = response.usage?.output_tokens || 0;

  return {
    output: parsedOutput,
    outputType: typeof parsedOutput === "object" ? "structured" : "text",
    confidence: 0.8,
    reasoningTrace: [
      {
        step: 0,
        thought: "Direct model execution",
        intermediate_output: parsedOutput,
      },
    ],
    chainOfThought: `Direct execution with ${modelId}`,
    modelsUsed: [modelId],
    modelSequence: [
      {
        model: modelId,
        step: 0,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latency,
      },
    ],
    tokensIn,
    tokensOut,
    cost: (tokensIn * 0.003 + tokensOut * 0.015) / 1000,
  };
}

function interpolateTemplate(
  template: string,
  variables: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined) {
return match;
}
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });
}

// =====================================================
// Log Management
// =====================================================

export async function listLogs(
  tenantId: string,
  filters?: LogFilters
): Promise<ReasoningLog[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reasoning_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.chain_id) {
    query = query.eq("chain_id", filters.chain_id);
  }
  if (filters?.from_date) {
    query = query.gte("created_at", filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte("created_at", filters.to_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 50) - 1
    );
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list logs: ${error.message}`);
}
  return data || [];
}

export async function getLog(
  tenantId: string,
  logId: string
): Promise<ReasoningLog | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_logs")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", logId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get log: ${error.message}`);
  }
  return data;
}

// =====================================================
// Feedback Management
// =====================================================

export async function submitFeedback(
  tenantId: string,
  input: FeedbackInput,
  providedBy?: string
): Promise<ReasoningFeedback> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_reasoning_feedback")
    .insert({
      tenant_id: tenantId,
      reasoning_log_id: input.reasoning_log_id,
      rating: input.rating,
      feedback_type: input.feedback_type,
      feedback_text: input.feedback_text,
      corrected_output: input.corrected_output,
      provided_by: providedBy,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to submit feedback: ${error.message}`);
}
  return data;
}

export async function listFeedback(
  tenantId: string,
  logId?: string
): Promise<ReasoningFeedback[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_reasoning_feedback")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (logId) {
    query = query.eq("reasoning_log_id", logId);
  }

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to list feedback: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Statistics
// =====================================================

export async function getReasoningStats(tenantId: string): Promise<ReasoningStats> {
  const supabase = await createClient();

  // Get log stats
  const { data: logs } = await supabase
    .from("synthex_library_reasoning_logs")
    .select("status, confidence, execution_time_ms, total_cost")
    .eq("tenant_id", tenantId);

  // Get counts
  const { count: modelsCount } = await supabase
    .from("synthex_library_reasoning_models")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { count: chainsCount } = await supabase
    .from("synthex_library_reasoning_chains")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  const { count: promptsCount } = await supabase
    .from("synthex_library_reasoning_prompts")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get cache stats
  const { data: cacheData } = await supabase
    .from("synthex_library_reasoning_cache")
    .select("hit_count")
    .eq("tenant_id", tenantId);

  const totalHits = cacheData?.reduce((sum, c) => sum + (c.hit_count || 0), 0) || 0;
  const cacheEntries = cacheData?.length || 0;
  const cacheHitRate = cacheEntries > 0 ? totalHits / (totalHits + (logs?.length || 0)) : 0;

  const completedLogs = logs?.filter((l) => l.status === "completed") || [];
  const failedLogs = logs?.filter((l) => l.status === "failed") || [];

  return {
    total_executions: logs?.length || 0,
    successful_executions: completedLogs.length,
    failed_executions: failedLogs.length,
    avg_confidence:
      completedLogs.length > 0
        ? completedLogs.reduce((sum, l) => sum + (l.confidence || 0), 0) / completedLogs.length
        : 0,
    avg_execution_time_ms:
      completedLogs.length > 0
        ? completedLogs.reduce((sum, l) => sum + (l.execution_time_ms || 0), 0) / completedLogs.length
        : 0,
    total_cost: logs?.reduce((sum, l) => sum + (l.total_cost || 0), 0) || 0,
    models_count: modelsCount || 0,
    chains_count: chainsCount || 0,
    prompts_count: promptsCount || 0,
    cache_hit_rate: cacheHitRate,
  };
}

// =====================================================
// Default Model Initialization
// =====================================================

export async function initializeDefaultModels(tenantId: string): Promise<void> {
  const supabase = await createClient();

  // Check if models exist
  const { count } = await supabase
    .from("synthex_library_reasoning_models")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if (count && count > 0) {
return;
}

  // Insert default models
  const defaultModels: CreateModelInput[] = [
    {
      model_name: "Claude Sonnet 4.5",
      model_id: "claude-sonnet-4-5-20250514",
      provider: "anthropic",
      description: "Balanced performance and cost for most reasoning tasks",
      capabilities: ["reasoning", "analysis", "coding", "creative"],
      max_tokens: 8192,
      supports_streaming: true,
      supports_tools: true,
      supports_vision: true,
      cost_per_1k_input: 0.003,
      cost_per_1k_output: 0.015,
      default_temperature: 0.7,
      is_primary: true,
      priority_order: 1,
    },
    {
      model_name: "Claude Haiku 4.5",
      model_id: "claude-haiku-4-5-20250514",
      provider: "anthropic",
      description: "Fast and cost-effective for simple tasks",
      capabilities: ["reasoning", "classification", "extraction"],
      max_tokens: 4096,
      supports_streaming: true,
      supports_tools: true,
      supports_vision: false,
      cost_per_1k_input: 0.00025,
      cost_per_1k_output: 0.00125,
      default_temperature: 0.5,
      is_primary: false,
      priority_order: 2,
    },
    {
      model_name: "Claude Opus 4.5",
      model_id: "claude-opus-4-5-20250514",
      provider: "anthropic",
      description: "Highest capability for complex reasoning",
      capabilities: ["reasoning", "analysis", "coding", "creative", "research"],
      max_tokens: 16384,
      supports_streaming: true,
      supports_tools: true,
      supports_vision: true,
      cost_per_1k_input: 0.015,
      cost_per_1k_output: 0.075,
      default_temperature: 0.7,
      is_primary: false,
      priority_order: 3,
    },
  ];

  for (const model of defaultModels) {
    await createModel(tenantId, model);
  }
}
