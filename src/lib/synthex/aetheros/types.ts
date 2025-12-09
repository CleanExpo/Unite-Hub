/**
 * AetherOS Omega Protocol - Type Definitions
 * 
 * Core types for the visual generation system with cost optimization
 */

// ============================================================================
// ENVIRONMENT TELEMETRY (The Heartbeat)
// ============================================================================

export interface EnvironmentTelemetry {
  global_clock: {
    utc_now: string;
    target_region_time: string;
    region: string;
    energy_arbitrage_active: boolean;
  };
  saas_economics: {
    user_tier: string;
    session_budget_cap: string;
    current_spend: string;
    remaining_budget: string;
  };
  zeitgeist_trends_today?: {
    color_of_day: string;
    visual_vibe: string;
    trending_aesthetics: string[];
  };
}

// ============================================================================
// VISUAL CODEX (Semantic Translation)
// ============================================================================

export interface CodexEntry {
  concept: string;
  generic_prompt: string;
  orchestrator_prompt: string;
  category: 'texture' | 'lighting' | 'camera' | 'aesthetic' | 'composition';
  priority: 'high' | 'medium' | 'low';
}

export interface VisualCodex {
  version: string;
  entries: CodexEntry[];
  last_updated: string;
}

// ============================================================================
// TOOL MANIFEST (Function Definitions)
// ============================================================================

export type AetherOSToolName = 
  | 'generate_ultra_visual'
  | 'surgical_touch_edit'
  | 'temporal_bridge_video'
  | 'truth_audit_search';

export interface AetherOSTool {
  name: AetherOSToolName;
  description: string;
  parameters: Record<string, ToolParameter>;
  cost_estimate: number;
  requires_verification: boolean;
}

export interface ToolParameter {
  type: 'string' | 'number' | 'array' | 'enum';
  description: string;
  required: boolean;
  enum_values?: string[];
  default?: string | number | boolean | string[];
}

// ============================================================================
// TIERED GENERATION (Cost Optimization)
// ============================================================================

export type GenerationTier = 'draft' | 'refined' | 'production';

export interface TierConfig {
  tier: GenerationTier;
  model_id: string;
  model_name: string;
  cost_per_image: number;
  max_resolution: string;
  watermarked: boolean;
  quality_score: number; // 0-100
  use_case: string;
}

export interface GenerationRequest {
  tenant_id: string;
  user_id: string;
  tier: GenerationTier;
  prompt_original: string;
  prompt_enhanced?: string;
  style?: string;
  aspect_ratio?: '16:9' | '1:1' | '9:16' | '4:3';
  region_routing?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerationResult {
  id: string;
  request: GenerationRequest;
  tier: GenerationTier;
  model_used: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  output_url?: string;
  preview_url?: string;
  cost: number;
  generation_time_ms: number;
  quality_score?: number;
  error?: string;
  created_at: string;
}

// ============================================================================
// LAYER COMPOSITION (Visual Studio)
// ============================================================================

export type LayerType = 'background' | 'subject' | 'text' | 'effect' | 'overlay' | 'mask';

export interface VisualLayer {
  id: string;
  visual_job_id: string;
  layer_type: LayerType;
  tier: GenerationTier;
  z_index: number;
  preview_url: string;
  production_url?: string;
  cost_to_upgrade?: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  blend_mode?: string;
  metadata: LayerMetadata;
}

export interface LayerMetadata {
  prompt?: string;
  model_used?: string;
  dimensions?: { width: number; height: number };
  created_at: string;
  last_modified: string;
}

export interface ComposedVisual {
  id: string;
  tenant_id: string;
  name: string;
  layers: VisualLayer[];
  canvas_size: { width: number; height: number };
  total_cost: number;
  status: 'draft' | 'approved' | 'production_ready';
  created_at: string;
}

// ============================================================================
// ORCHESTRATOR PROMPT (System Instructions)
// ============================================================================

export interface OrchestratorConfig {
  mode: 'predictive' | 'economic' | 'truthful';
  enable_extended_thinking: boolean;
  thinking_budget_tokens: number;
  enable_caching: boolean;
  enable_region_arbitrage: boolean;
  safety_level: 'strict' | 'moderate' | 'balanced';
}

export interface OrchestratorSession {
  session_id: string;
  tenant_id: string;
  user_id: string;
  config: OrchestratorConfig;
  telemetry: EnvironmentTelemetry;
  start_time: string;
  total_cost: number;
  operations: OrchestratorOperation[];
}

export interface OrchestratorOperation {
  operation_id: string;
  tool_used: AetherOSToolName;
  cost: number;
  success: boolean;
  timestamp: string;
}

// ============================================================================
// TRUTH AUDIT (Fact Verification)
// ============================================================================

export interface TruthAuditRequest {
  query: string;
  context?: string;
  require_sources: boolean;
}

export interface TruthAuditResult {
  query: string;
  verified_facts: VerifiedFact[];
  confidence_score: number; // 0-100
  sources: string[];
  last_updated: string;
}

export interface VerifiedFact {
  statement: string;
  confidence: number;
  source: string;
  date: string;
}

// ============================================================================
// DATABASE RECORDS
// ============================================================================

export interface AetherOSVisualJob {
  id: string;
  tenant_id: string;
  user_id: string;
  tier: GenerationTier;
  model_used: string;
  prompt_original: string;
  prompt_enhanced?: string;
  output_url?: string;
  cost: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
}

export interface AetherOSSession {
  id: string;
  tenant_id: string;
  user_id: string;
  session_start: string;
  session_end?: string;
  telemetry: EnvironmentTelemetry;
  region_routed: string;
  energy_savings_pct?: number;
  total_cost: number;
  operations_count: number;
}

// ============================================================================
// COST TRACKING
// ============================================================================

export interface CostBreakdown {
  draft_costs: number;
  refined_costs: number;
  production_costs: number;
  truth_audit_costs: number;
  total: number;
}

export interface TierLimit {
  tier_name: string;
  draft_generations_limit: number;
  refined_generations_limit: number;
  production_generations_limit: number;
  monthly_budget: number;
}
