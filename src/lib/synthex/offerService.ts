/**
 * Synthex Adaptive Offer Intelligence Service
 *
 * Phase D25: AI-powered offer optimization with audience segmentation,
 * A/B testing, and dynamic recommendations.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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

export type OfferType =
  | "discount"
  | "bundle"
  | "trial"
  | "upgrade"
  | "loyalty"
  | "referral"
  | "flash_sale"
  | "seasonal";

export type OfferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "active"
  | "paused"
  | "completed"
  | "archived";

export type TestStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export interface OfferInsight {
  id: string;
  tenant_id: string;
  audience_segment: string;
  segment_size: number;
  segment_criteria: Record<string, unknown>;
  offer_type: OfferType;
  offer_name: string | null;
  offer_description: string | null;
  offer_value: number | null;
  offer_currency: string;
  offer_config: Record<string, unknown>;
  confidence: number;
  reasoning: Record<string, unknown>;
  recommendation: string | null;
  priority: number;
  predicted_conversion_rate: number | null;
  predicted_revenue_impact: number | null;
  predicted_roi: number | null;
  status: OfferStatus;
  approved_by: string | null;
  approved_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  actual_impressions: number;
  actual_clicks: number;
  actual_conversions: number;
  actual_revenue: number;
  actual_roi: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferTest {
  id: string;
  tenant_id: string;
  test_name: string;
  test_description: string | null;
  hypothesis: string | null;
  variant_a: VariantConfig;
  variant_b: VariantConfig;
  variant_c: VariantConfig | null;
  variant_d: VariantConfig | null;
  audience_segment: string | null;
  traffic_allocation: number;
  min_sample_size: number;
  statistical_significance: number;
  test_duration_days: number;
  primary_metric: string;
  secondary_metrics: string[];
  result: TestResult;
  winner_variant: string | null;
  statistical_significance_achieved: boolean;
  status: TestStatus;
  started_at: string | null;
  ended_at: string | null;
  auto_deploy_winner: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VariantConfig {
  name: string;
  offer_id?: string;
  traffic_allocation: number;
  offer_config: Record<string, unknown>;
}

export interface TestResult {
  winner?: string;
  variant_a?: VariantMetrics;
  variant_b?: VariantMetrics;
  variant_c?: VariantMetrics;
  variant_d?: VariantMetrics;
  significance?: number;
  lift?: number;
  recommendation?: string;
  total_samples?: number;
}

export interface VariantMetrics {
  impressions: number;
  conversions: number;
  revenue: number;
  rate: number;
}

export interface OfferRedemption {
  id: string;
  tenant_id: string;
  offer_insight_id: string | null;
  offer_test_id: string | null;
  variant_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  redemption_code: string | null;
  redemption_channel: string | null;
  redemption_value: number | null;
  order_value: number | null;
  discount_applied: number | null;
  attribution_source: string | null;
  attribution_medium: string | null;
  attribution_campaign: string | null;
  touchpoint_path: unknown[];
  status: string;
  completed_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface OfferTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  template_description: string | null;
  offer_type: OfferType;
  template_config: Record<string, unknown>;
  default_segment: string | null;
  default_criteria: Record<string, unknown>;
  avg_conversion_rate: number | null;
  avg_revenue_per_redemption: number | null;
  usage_count: number;
  is_active: boolean;
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  rule_description: string | null;
  rule_type: string;
  conditions: RuleCondition[];
  condition_logic: string;
  actions: RuleAction[];
  offer_template_id: string | null;
  priority: number;
  max_triggers_per_contact: number | null;
  cooldown_days: number;
  is_active: boolean;
  triggered_count: number;
  last_triggered_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: unknown;
}

export interface RuleAction {
  type: string;
  offer_template_id?: string;
  channel?: string;
  [key: string]: unknown;
}

export interface GenerateOfferInput {
  audience_segment: string;
  segment_criteria?: Record<string, unknown>;
  offer_types?: OfferType[];
  budget_constraints?: {
    max_discount_percent?: number;
    max_total_budget?: number;
  };
  goals?: string[];
  context?: Record<string, unknown>;
}

export interface CreateTestInput {
  test_name: string;
  test_description?: string;
  hypothesis?: string;
  variant_a: VariantConfig;
  variant_b: VariantConfig;
  variant_c?: VariantConfig;
  variant_d?: VariantConfig;
  audience_segment?: string;
  traffic_allocation?: number;
  min_sample_size?: number;
  statistical_significance?: number;
  test_duration_days?: number;
  primary_metric?: string;
  secondary_metrics?: string[];
  auto_deploy_winner?: boolean;
}

export interface CreateTemplateInput {
  template_name: string;
  template_description?: string;
  offer_type: OfferType;
  template_config: Record<string, unknown>;
  default_segment?: string;
  default_criteria?: Record<string, unknown>;
}

export interface CreateRuleInput {
  rule_name: string;
  rule_description?: string;
  rule_type: string;
  conditions: RuleCondition[];
  condition_logic?: string;
  actions: RuleAction[];
  offer_template_id?: string;
  priority?: number;
  max_triggers_per_contact?: number;
  cooldown_days?: number;
}

export interface RecordRedemptionInput {
  offer_insight_id?: string;
  offer_test_id?: string;
  variant_id?: string;
  contact_id?: string;
  lead_id?: string;
  redemption_code?: string;
  redemption_channel?: string;
  redemption_value?: number;
  order_value?: number;
  discount_applied?: number;
  attribution_source?: string;
  attribution_medium?: string;
  attribution_campaign?: string;
  touchpoint_path?: unknown[];
}

export interface OfferFilters {
  status?: OfferStatus;
  offer_type?: OfferType;
  audience_segment?: string;
  min_confidence?: number;
  limit?: number;
  offset?: number;
}

export interface TestFilters {
  status?: TestStatus;
  audience_segment?: string;
  limit?: number;
  offset?: number;
}

export interface OfferStats {
  total_offers: number;
  active_offers: number;
  total_tests: number;
  running_tests: number;
  total_redemptions: number;
  total_revenue: number;
  avg_conversion_rate: number;
  avg_roi: number;
  top_segments: { segment: string; offers: number; revenue: number }[];
  top_offer_types: { type: string; count: number; conversion_rate: number }[];
}

// =====================================================
// Offer Insight Functions
// =====================================================

export async function generateOfferInsight(
  tenantId: string,
  input: GenerateOfferInput,
  userId?: string
): Promise<OfferInsight> {
  const supabase = await createClient();
  const client = getAnthropicClient();

  let recommendation = "";
  let reasoning: Record<string, unknown> = {};
  let confidence = 0.7;
  let offerConfig: Record<string, unknown> = {};
  let predictedConversionRate = 0.1;
  let predictedRevenue = 0;
  let offerType: OfferType = input.offer_types?.[0] || "discount";

  if (client) {
    try {
      const prompt = `You are an offer optimization AI. Analyze the audience segment and generate the best offer recommendation.

Audience Segment: ${input.audience_segment}
Segment Criteria: ${JSON.stringify(input.segment_criteria || {})}
Preferred Offer Types: ${JSON.stringify(input.offer_types || ["discount", "bundle", "trial"])}
Budget Constraints: ${JSON.stringify(input.budget_constraints || {})}
Goals: ${JSON.stringify(input.goals || ["increase_conversion", "maximize_revenue"])}
Additional Context: ${JSON.stringify(input.context || {})}

Respond with JSON only:
{
  "offer_type": "discount|bundle|trial|upgrade|loyalty|referral|flash_sale|seasonal",
  "offer_name": "string",
  "offer_description": "string",
  "offer_value": number,
  "offer_config": {
    "discount_percent": number,
    "min_purchase": number,
    "valid_days": number,
    "conditions": []
  },
  "confidence": 0.0-1.0,
  "reasoning": {
    "factors": ["string"],
    "expected_response_rate": 0.0-1.0,
    "risk_level": "low|medium|high",
    "alternative_offers": []
  },
  "recommendation": "string",
  "predicted_conversion_rate": 0.0-1.0,
  "predicted_revenue_impact": number
}`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        try {
          const parsed = JSON.parse(content.text);
          offerType = parsed.offer_type || offerType;
          offerConfig = parsed.offer_config || {};
          confidence = parsed.confidence || 0.7;
          reasoning = parsed.reasoning || {};
          recommendation = parsed.recommendation || "";
          predictedConversionRate = parsed.predicted_conversion_rate || 0.1;
          predictedRevenue = parsed.predicted_revenue_impact || 0;
        } catch {
          recommendation = content.text;
        }
      }
    } catch (error) {
      console.error("[offerService] AI generation failed:", error);
    }
  } else {
    // Fallback without AI
    recommendation = `Recommended ${offerType} offer for ${input.audience_segment} segment`;
    reasoning = {
      factors: ["segment_match", "historical_performance"],
      risk_level: "medium",
    };
  }

  const { data, error } = await supabase
    .from("synthex_library_offer_insights")
    .insert({
      tenant_id: tenantId,
      audience_segment: input.audience_segment,
      segment_criteria: input.segment_criteria || {},
      offer_type: offerType,
      offer_name: `${offerType} for ${input.audience_segment}`,
      offer_config: offerConfig,
      confidence,
      reasoning,
      recommendation,
      predicted_conversion_rate: predictedConversionRate,
      predicted_revenue_impact: predictedRevenue,
      status: "draft",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create offer insight: ${error.message}`);
}
  return data;
}

export async function getOfferInsight(
  tenantId: string,
  insightId: string
): Promise<OfferInsight | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_insights")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", insightId)
    .single();

  if (error) {
return null;
}
  return data;
}

export async function listOfferInsights(
  tenantId: string,
  filters?: OfferFilters
): Promise<OfferInsight[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_offer_insights")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.offer_type) {
    query = query.eq("offer_type", filters.offer_type);
  }
  if (filters?.audience_segment) {
    query = query.eq("audience_segment", filters.audience_segment);
  }
  if (filters?.min_confidence) {
    query = query.gte("confidence", filters.min_confidence);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list offer insights: ${error.message}`);
}
  return data || [];
}

export async function updateOfferInsight(
  insightId: string,
  updates: Partial<OfferInsight>
): Promise<OfferInsight> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_insights")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update offer insight: ${error.message}`);
}
  return data;
}

export async function approveOfferInsight(
  insightId: string,
  userId: string
): Promise<OfferInsight> {
  return updateOfferInsight(insightId, {
    status: "approved",
    approved_by: userId,
    approved_at: new Date().toISOString(),
  });
}

export async function activateOfferInsight(
  insightId: string,
  expiresAt?: string
): Promise<OfferInsight> {
  return updateOfferInsight(insightId, {
    status: "active",
    activated_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
}

export async function pauseOfferInsight(insightId: string): Promise<OfferInsight> {
  return updateOfferInsight(insightId, { status: "paused" });
}

export async function archiveOfferInsight(insightId: string): Promise<OfferInsight> {
  return updateOfferInsight(insightId, { status: "archived" });
}

// =====================================================
// A/B Test Functions
// =====================================================

export async function createOfferTest(
  tenantId: string,
  input: CreateTestInput,
  userId?: string
): Promise<OfferTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .insert({
      tenant_id: tenantId,
      test_name: input.test_name,
      test_description: input.test_description,
      hypothesis: input.hypothesis,
      variant_a: input.variant_a,
      variant_b: input.variant_b,
      variant_c: input.variant_c,
      variant_d: input.variant_d,
      audience_segment: input.audience_segment,
      traffic_allocation: input.traffic_allocation || 100,
      min_sample_size: input.min_sample_size || 100,
      statistical_significance: input.statistical_significance || 0.95,
      test_duration_days: input.test_duration_days || 14,
      primary_metric: input.primary_metric || "conversion_rate",
      secondary_metrics: input.secondary_metrics || [],
      auto_deploy_winner: input.auto_deploy_winner || false,
      status: "pending",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create offer test: ${error.message}`);
}
  return data;
}

export async function getOfferTest(
  tenantId: string,
  testId: string
): Promise<OfferTest | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", testId)
    .single();

  if (error) {
return null;
}
  return data;
}

export async function listOfferTests(
  tenantId: string,
  filters?: TestFilters
): Promise<OfferTest[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_offer_tests")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.audience_segment) {
    query = query.eq("audience_segment", filters.audience_segment);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list offer tests: ${error.message}`);
}
  return data || [];
}

export async function startOfferTest(testId: string): Promise<OfferTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to start test: ${error.message}`);
}
  return data;
}

export async function pauseOfferTest(testId: string): Promise<OfferTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .update({
      status: "paused",
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to pause test: ${error.message}`);
}
  return data;
}

export async function completeOfferTest(
  testId: string,
  result: TestResult
): Promise<OfferTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .update({
      status: "completed",
      result,
      winner_variant: result.winner,
      statistical_significance_achieved:
        (result.significance || 0) >= 0.95,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to complete test: ${error.message}`);
}
  return data;
}

export async function cancelOfferTest(testId: string): Promise<OfferTest> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_tests")
    .update({
      status: "cancelled",
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", testId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to cancel test: ${error.message}`);
}
  return data;
}

// =====================================================
// Template Functions
// =====================================================

export async function createOfferTemplate(
  tenantId: string,
  input: CreateTemplateInput,
  userId?: string
): Promise<OfferTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_templates")
    .insert({
      tenant_id: tenantId,
      template_name: input.template_name,
      template_description: input.template_description,
      offer_type: input.offer_type,
      template_config: input.template_config,
      default_segment: input.default_segment,
      default_criteria: input.default_criteria || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create template: ${error.message}`);
}
  return data;
}

export async function listOfferTemplates(
  tenantId: string,
  offerType?: OfferType
): Promise<OfferTemplate[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_offer_templates")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  if (offerType) {
    query = query.eq("offer_type", offerType);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list templates: ${error.message}`);
}
  return data || [];
}

export async function updateOfferTemplate(
  templateId: string,
  updates: Partial<OfferTemplate>
): Promise<OfferTemplate> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_templates")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", templateId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update template: ${error.message}`);
}
  return data;
}

export async function deleteOfferTemplate(templateId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_offer_templates")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", templateId);

  if (error) {
throw new Error(`Failed to delete template: ${error.message}`);
}
}

// =====================================================
// Rule Functions
// =====================================================

export async function createOfferRule(
  tenantId: string,
  input: CreateRuleInput,
  userId?: string
): Promise<OfferRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_rules")
    .insert({
      tenant_id: tenantId,
      rule_name: input.rule_name,
      rule_description: input.rule_description,
      rule_type: input.rule_type,
      conditions: input.conditions,
      condition_logic: input.condition_logic || "AND",
      actions: input.actions,
      offer_template_id: input.offer_template_id,
      priority: input.priority || 50,
      max_triggers_per_contact: input.max_triggers_per_contact,
      cooldown_days: input.cooldown_days || 7,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create rule: ${error.message}`);
}
  return data;
}

export async function listOfferRules(
  tenantId: string,
  ruleType?: string
): Promise<OfferRule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_offer_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (ruleType) {
    query = query.eq("rule_type", ruleType);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list rules: ${error.message}`);
}
  return data || [];
}

export async function updateOfferRule(
  ruleId: string,
  updates: Partial<OfferRule>
): Promise<OfferRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_rules")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", ruleId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update rule: ${error.message}`);
}
  return data;
}

export async function deleteOfferRule(ruleId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_offer_rules")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", ruleId);

  if (error) {
throw new Error(`Failed to delete rule: ${error.message}`);
}
}

// =====================================================
// Redemption Functions
// =====================================================

export async function recordRedemption(
  tenantId: string,
  input: RecordRedemptionInput
): Promise<OfferRedemption> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_offer_redemptions")
    .insert({
      tenant_id: tenantId,
      offer_insight_id: input.offer_insight_id,
      offer_test_id: input.offer_test_id,
      variant_id: input.variant_id,
      contact_id: input.contact_id,
      lead_id: input.lead_id,
      redemption_code: input.redemption_code,
      redemption_channel: input.redemption_channel,
      redemption_value: input.redemption_value,
      order_value: input.order_value,
      discount_applied: input.discount_applied,
      attribution_source: input.attribution_source,
      attribution_medium: input.attribution_medium,
      attribution_campaign: input.attribution_campaign,
      touchpoint_path: input.touchpoint_path || [],
      status: "redeemed",
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to record redemption: ${error.message}`);
}
  return data;
}

export async function completeRedemption(
  redemptionId: string,
  orderValue?: number
): Promise<OfferRedemption> {
  const supabase = await createClient();

  const updates: Partial<OfferRedemption> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  };

  if (orderValue !== undefined) {
    updates.order_value = orderValue;
  }

  const { data, error } = await supabase
    .from("synthex_library_offer_redemptions")
    .update(updates)
    .eq("id", redemptionId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to complete redemption: ${error.message}`);
}
  return data;
}

export async function listRedemptions(
  tenantId: string,
  filters?: {
    offer_insight_id?: string;
    offer_test_id?: string;
    contact_id?: string;
    status?: string;
    limit?: number;
  }
): Promise<OfferRedemption[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_offer_redemptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.offer_insight_id) {
    query = query.eq("offer_insight_id", filters.offer_insight_id);
  }
  if (filters?.offer_test_id) {
    query = query.eq("offer_test_id", filters.offer_test_id);
  }
  if (filters?.contact_id) {
    query = query.eq("contact_id", filters.contact_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list redemptions: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Statistics Functions
// =====================================================

export async function getOfferStats(tenantId: string): Promise<OfferStats> {
  const supabase = await createClient();

  // Get offer counts
  const { data: offers } = await supabase
    .from("synthex_library_offer_insights")
    .select("id, status, offer_type, audience_segment, actual_conversions, actual_revenue, actual_impressions")
    .eq("tenant_id", tenantId);

  // Get test counts
  const { data: tests } = await supabase
    .from("synthex_library_offer_tests")
    .select("id, status")
    .eq("tenant_id", tenantId);

  // Get redemption counts
  const { data: redemptions } = await supabase
    .from("synthex_library_offer_redemptions")
    .select("id, order_value")
    .eq("tenant_id", tenantId)
    .eq("status", "completed");

  const totalOffers = offers?.length || 0;
  const activeOffers = offers?.filter((o) => o.status === "active").length || 0;
  const totalTests = tests?.length || 0;
  const runningTests = tests?.filter((t) => t.status === "running").length || 0;
  const totalRedemptions = redemptions?.length || 0;
  const totalRevenue = redemptions?.reduce((sum, r) => sum + (r.order_value || 0), 0) || 0;

  // Calculate average conversion rate
  const offersWithImpressions = offers?.filter((o) => o.actual_impressions > 0) || [];
  const avgConversionRate =
    offersWithImpressions.length > 0
      ? offersWithImpressions.reduce(
          (sum, o) => sum + (o.actual_conversions / o.actual_impressions),
          0
        ) / offersWithImpressions.length
      : 0;

  // Calculate segment stats
  const segmentMap = new Map<string, { offers: number; revenue: number }>();
  offers?.forEach((o) => {
    const current = segmentMap.get(o.audience_segment) || { offers: 0, revenue: 0 };
    segmentMap.set(o.audience_segment, {
      offers: current.offers + 1,
      revenue: current.revenue + (o.actual_revenue || 0),
    });
  });
  const topSegments = Array.from(segmentMap.entries())
    .map(([segment, data]) => ({ segment, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate offer type stats
  const typeMap = new Map<string, { count: number; conversions: number; impressions: number }>();
  offers?.forEach((o) => {
    const current = typeMap.get(o.offer_type) || { count: 0, conversions: 0, impressions: 0 };
    typeMap.set(o.offer_type, {
      count: current.count + 1,
      conversions: current.conversions + (o.actual_conversions || 0),
      impressions: current.impressions + (o.actual_impressions || 0),
    });
  });
  const topOfferTypes = Array.from(typeMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      conversion_rate: data.impressions > 0 ? data.conversions / data.impressions : 0,
    }))
    .sort((a, b) => b.conversion_rate - a.conversion_rate)
    .slice(0, 5);

  return {
    total_offers: totalOffers,
    active_offers: activeOffers,
    total_tests: totalTests,
    running_tests: runningTests,
    total_redemptions: totalRedemptions,
    total_revenue: totalRevenue,
    avg_conversion_rate: avgConversionRate,
    avg_roi: 0, // Would need to calculate from actual data
    top_segments: topSegments,
    top_offer_types: topOfferTypes,
  };
}

// =====================================================
// Initialization
// =====================================================

export async function initializeDefaultTemplates(
  tenantId: string,
  userId?: string
): Promise<void> {
  const supabase = await createClient();

  const defaultTemplates = [
    {
      template_name: "Welcome Discount",
      template_description: "First-time customer discount offer",
      offer_type: "discount",
      template_config: {
        default_discount: 15,
        default_duration: 7,
        messaging: {
          headline: "Welcome! Here's {discount}% off your first order",
          body: "Use code WELCOME{discount} at checkout",
        },
        channels: ["email"],
      },
    },
    {
      template_name: "Win-Back Offer",
      template_description: "Re-engage dormant customers",
      offer_type: "discount",
      template_config: {
        default_discount: 20,
        default_duration: 14,
        messaging: {
          headline: "We miss you! Come back for {discount}% off",
          body: "It's been a while. Here's a special offer just for you.",
        },
        channels: ["email", "sms"],
      },
    },
    {
      template_name: "Loyalty Reward",
      template_description: "Reward repeat customers",
      offer_type: "loyalty",
      template_config: {
        points_multiplier: 2,
        default_duration: 30,
        messaging: {
          headline: "Double points this month!",
          body: "Earn 2x points on every purchase",
        },
        channels: ["email"],
      },
    },
    {
      template_name: "Free Trial Upgrade",
      template_description: "Convert free users to paid",
      offer_type: "trial",
      template_config: {
        trial_days: 14,
        messaging: {
          headline: "Try Premium free for {days} days",
          body: "Unlock all features with no commitment",
        },
        channels: ["email", "in_app"],
      },
    },
    {
      template_name: "Referral Bonus",
      template_description: "Incentivize customer referrals",
      offer_type: "referral",
      template_config: {
        referrer_reward: 20,
        referee_reward: 15,
        messaging: {
          headline: "Give ${referee_reward}, Get ${referrer_reward}",
          body: "Share with friends and both of you save",
        },
        channels: ["email"],
      },
    },
  ];

  for (const template of defaultTemplates) {
    const { data: existing } = await supabase
      .from("synthex_library_offer_templates")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("template_name", template.template_name)
      .single();

    if (!existing) {
      await supabase.from("synthex_library_offer_templates").insert({
        tenant_id: tenantId,
        ...template,
        is_system: true,
        created_by: userId,
      });
    }
  }
}
