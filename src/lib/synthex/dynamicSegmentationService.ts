/**
 * Synthex Dynamic Segmentation Service
 * Phase D21: Behaviour-Based Dynamic Segmentation
 *
 * AI-powered audience segmentation with real-time
 * membership evaluation based on behavioral criteria.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// =====================================================
// Lazy Anthropic Client with Circuit Breaker
// =====================================================
let anthropicClient: Anthropic | null = null;
let lastFailure: number = 0;
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 60 seconds

function getAnthropicClient(): Anthropic | null {
  if (Date.now() - lastFailure < CIRCUIT_BREAKER_TIMEOUT) {
    return null;
  }
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================
export type SegmentType =
  | "behavioral"
  | "demographic"
  | "transactional"
  | "engagement"
  | "lifecycle"
  | "predictive"
  | "custom";

export type CriteriaLogic = "and" | "or";

export type MembershipStatus = "active" | "pending" | "exited" | "excluded";

export type TrendDirection = "growing" | "stable" | "declining";

export interface SegmentCriterion {
  field: string;
  operator: string;
  value: unknown;
  weight?: number;
  field_source?: string;
}

export interface DynamicSegment {
  id: string;
  tenant_id: string;
  segment_name: string;
  description: string | null;
  segment_type: SegmentType;
  criteria: SegmentCriterion[];
  criteria_logic: CriteriaLogic;
  use_ai_refinement: boolean;
  ai_confidence_threshold: number;
  ai_model: string | null;
  last_ai_refined_at: string | null;
  auto_refresh: boolean;
  refresh_interval_hours: number;
  last_refreshed_at: string | null;
  next_refresh_at: string | null;
  member_count: number;
  potential_value: number;
  avg_engagement_score: number | null;
  is_active: boolean;
  is_archived: boolean;
  color: string | null;
  icon: string | null;
  sort_order: number;
  exclusion_segment_ids: string[];
  inclusion_priority: number;
  actions_on_enter: Array<{ type: string; config: Record<string, unknown> }>;
  actions_on_exit: Array<{ type: string; config: Record<string, unknown> }>;
  notify_on_size_change_percent: number | null;
  tags: string[];
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SegmentMembership {
  id: string;
  tenant_id: string;
  segment_id: string;
  contact_id: string | null;
  lead_id: string | null;
  customer_id: string | null;
  match_score: number;
  matched_criteria: SegmentCriterion[];
  unmatched_criteria: SegmentCriterion[];
  ai_confidence: number | null;
  ai_reasoning: string | null;
  predicted_value: number | null;
  churn_risk: number | null;
  membership_status: MembershipStatus;
  entered_at: string;
  exited_at: string | null;
  exit_reason: string | null;
  activities_since_entry: number;
  revenue_since_entry: number;
  last_activity_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SegmentRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  description: string | null;
  category: string | null;
  field: string;
  field_source: string;
  operator: string;
  value: unknown;
  value_type: string;
  relative_period: string | null;
  relative_field: string | null;
  weight: number;
  is_required: boolean;
  is_template: boolean;
  template_name: string | null;
  is_active: boolean;
  times_used: number;
  avg_match_rate: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SegmentSnapshot {
  id: string;
  tenant_id: string;
  segment_id: string;
  snapshot_at: string;
  snapshot_type: string;
  member_count: number;
  new_members: number;
  exited_members: number;
  net_change: number;
  total_value: number;
  avg_value: number | null;
  median_value: number | null;
  avg_engagement_score: number | null;
  active_rate: number | null;
  demographics: Record<string, unknown>;
  ai_summary: string | null;
  ai_recommendations: string[];
  health_score: number | null;
  change_from_previous_percent: number | null;
  trend_direction: TrendDirection | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface SegmentOverlap {
  id: string;
  tenant_id: string;
  segment_a_id: string;
  segment_b_id: string;
  overlap_count: number;
  segment_a_total: number;
  segment_b_total: number;
  overlap_percent_a: number | null;
  overlap_percent_b: number | null;
  jaccard_index: number | null;
  calculated_at: string;
  should_merge: boolean;
  merge_recommendation: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

// =====================================================
// Segment CRUD Operations
// =====================================================
export async function createSegment(
  tenantId: string,
  data: {
    segment_name: string;
    description?: string;
    segment_type: SegmentType;
    criteria: SegmentCriterion[];
    criteria_logic?: CriteriaLogic;
    use_ai_refinement?: boolean;
    ai_confidence_threshold?: number;
    auto_refresh?: boolean;
    refresh_interval_hours?: number;
    color?: string;
    icon?: string;
    exclusion_segment_ids?: string[];
    actions_on_enter?: DynamicSegment["actions_on_enter"];
    actions_on_exit?: DynamicSegment["actions_on_exit"];
    notify_on_size_change_percent?: number;
    tags?: string[];
    meta?: Record<string, unknown>;
  },
  userId?: string
): Promise<DynamicSegment> {
  const supabase = await createClient();

  const { data: segment, error } = await supabase
    .from("synthex_library_dynamic_segments")
    .insert({
      tenant_id: tenantId,
      segment_name: data.segment_name,
      description: data.description,
      segment_type: data.segment_type,
      criteria: data.criteria,
      criteria_logic: data.criteria_logic || "and",
      use_ai_refinement: data.use_ai_refinement ?? false,
      ai_confidence_threshold: data.ai_confidence_threshold ?? 0.7,
      auto_refresh: data.auto_refresh ?? true,
      refresh_interval_hours: data.refresh_interval_hours ?? 24,
      color: data.color,
      icon: data.icon,
      exclusion_segment_ids: data.exclusion_segment_ids || [],
      actions_on_enter: data.actions_on_enter || [],
      actions_on_exit: data.actions_on_exit || [],
      notify_on_size_change_percent: data.notify_on_size_change_percent,
      tags: data.tags || [],
      meta: data.meta || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create segment: ${error.message}`);
}
  return segment;
}

export async function getSegment(
  tenantId: string,
  segmentId: string
): Promise<DynamicSegment | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_dynamic_segments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", segmentId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to get segment: ${error.message}`);
  }

  return data;
}

export async function listSegments(
  tenantId: string,
  filters?: {
    segment_type?: SegmentType;
    is_active?: boolean;
    is_archived?: boolean;
    has_tag?: string;
    min_members?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<DynamicSegment[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_dynamic_segments")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("member_count", { ascending: false });

  if (filters?.segment_type) {
    query = query.eq("segment_type", filters.segment_type);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }
  if (filters?.is_archived !== undefined) {
    query = query.eq("is_archived", filters.is_archived);
  }
  if (filters?.has_tag) {
    query = query.contains("tags", [filters.has_tag]);
  }
  if (filters?.min_members !== undefined) {
    query = query.gte("member_count", filters.min_members);
  }
  if (filters?.search) {
    query = query.or(
      `segment_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
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
throw new Error(`Failed to list segments: ${error.message}`);
}
  return data || [];
}

export async function updateSegment(
  segmentId: string,
  updates: Partial<Omit<DynamicSegment, "id" | "tenant_id" | "created_at">>
): Promise<DynamicSegment> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_dynamic_segments")
    .update(updates)
    .eq("id", segmentId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update segment: ${error.message}`);
}
  return data;
}

export async function deleteSegment(segmentId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("synthex_library_dynamic_segments")
    .delete()
    .eq("id", segmentId);

  if (error) {
throw new Error(`Failed to delete segment: ${error.message}`);
}
}

export async function archiveSegment(segmentId: string): Promise<DynamicSegment> {
  return updateSegment(segmentId, { is_archived: true, is_active: false });
}

// =====================================================
// Membership Management
// =====================================================
export async function addMember(
  tenantId: string,
  segmentId: string,
  data: {
    contact_id?: string;
    lead_id?: string;
    customer_id?: string;
    match_score?: number;
    matched_criteria?: SegmentCriterion[];
    unmatched_criteria?: SegmentCriterion[];
    ai_confidence?: number;
    ai_reasoning?: string;
    predicted_value?: number;
    meta?: Record<string, unknown>;
  }
): Promise<SegmentMembership> {
  const supabase = await createClient();

  const { data: membership, error } = await supabase
    .from("synthex_library_segment_membership")
    .insert({
      tenant_id: tenantId,
      segment_id: segmentId,
      contact_id: data.contact_id,
      lead_id: data.lead_id,
      customer_id: data.customer_id,
      match_score: data.match_score ?? 1.0,
      matched_criteria: data.matched_criteria || [],
      unmatched_criteria: data.unmatched_criteria || [],
      ai_confidence: data.ai_confidence,
      ai_reasoning: data.ai_reasoning,
      predicted_value: data.predicted_value,
      membership_status: "active",
      meta: data.meta || {},
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to add member: ${error.message}`);
}
  return membership;
}

export async function removeMember(
  segmentId: string,
  options: {
    contact_id?: string;
    lead_id?: string;
    customer_id?: string;
    reason?: string;
  }
): Promise<SegmentMembership> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_segment_membership")
    .update({
      membership_status: "exited",
      exited_at: new Date().toISOString(),
      exit_reason: options.reason,
    })
    .eq("segment_id", segmentId);

  if (options.contact_id) {
    query = query.eq("contact_id", options.contact_id);
  } else if (options.lead_id) {
    query = query.eq("lead_id", options.lead_id);
  } else if (options.customer_id) {
    query = query.eq("customer_id", options.customer_id);
  }

  const { data, error } = await query.select().single();

  if (error) {
throw new Error(`Failed to remove member: ${error.message}`);
}
  return data;
}

export async function listMembers(
  tenantId: string,
  segmentId: string,
  filters?: {
    membership_status?: MembershipStatus;
    min_match_score?: number;
    limit?: number;
    offset?: number;
  }
): Promise<SegmentMembership[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_segment_membership")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("segment_id", segmentId)
    .order("match_score", { ascending: false });

  if (filters?.membership_status) {
    query = query.eq("membership_status", filters.membership_status);
  }
  if (filters?.min_match_score !== undefined) {
    query = query.gte("match_score", filters.min_match_score);
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
throw new Error(`Failed to list members: ${error.message}`);
}
  return data || [];
}

export async function getMemberSegments(
  tenantId: string,
  options: {
    contact_id?: string;
    lead_id?: string;
    customer_id?: string;
  }
): Promise<Array<DynamicSegment & { membership: SegmentMembership }>> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_segment_membership")
    .select(
      `
      *,
      segment:synthex_library_dynamic_segments(*)
    `
    )
    .eq("tenant_id", tenantId)
    .eq("membership_status", "active");

  if (options.contact_id) {
    query = query.eq("contact_id", options.contact_id);
  } else if (options.lead_id) {
    query = query.eq("lead_id", options.lead_id);
  } else if (options.customer_id) {
    query = query.eq("customer_id", options.customer_id);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to get member segments: ${error.message}`);
}

  return (data || []).map((m) => ({
    ...m.segment,
    membership: {
      id: m.id,
      tenant_id: m.tenant_id,
      segment_id: m.segment_id,
      contact_id: m.contact_id,
      lead_id: m.lead_id,
      customer_id: m.customer_id,
      match_score: m.match_score,
      matched_criteria: m.matched_criteria,
      unmatched_criteria: m.unmatched_criteria,
      ai_confidence: m.ai_confidence,
      ai_reasoning: m.ai_reasoning,
      predicted_value: m.predicted_value,
      churn_risk: m.churn_risk,
      membership_status: m.membership_status,
      entered_at: m.entered_at,
      exited_at: m.exited_at,
      exit_reason: m.exit_reason,
      activities_since_entry: m.activities_since_entry,
      revenue_since_entry: m.revenue_since_entry,
      last_activity_at: m.last_activity_at,
      meta: m.meta,
      created_at: m.created_at,
      updated_at: m.updated_at,
    },
  }));
}

// =====================================================
// Segment Evaluation
// =====================================================
export async function evaluateEntity(
  tenantId: string,
  segmentId: string,
  entity: Record<string, unknown>
): Promise<{
  matches: boolean;
  score: number;
  matched_criteria: SegmentCriterion[];
  unmatched_criteria: SegmentCriterion[];
}> {
  const segment = await getSegment(tenantId, segmentId);
  if (!segment) {
throw new Error("Segment not found");
}

  const matchedCriteria: SegmentCriterion[] = [];
  const unmatchedCriteria: SegmentCriterion[] = [];

  for (const criterion of segment.criteria) {
    const value = entity[criterion.field];
    const matches = evaluateCriterion(criterion, value);

    if (matches) {
      matchedCriteria.push(criterion);
    } else {
      unmatchedCriteria.push(criterion);
    }
  }

  const totalWeight = segment.criteria.reduce(
    (sum, c) => sum + (c.weight || 1),
    0
  );
  const matchedWeight = matchedCriteria.reduce(
    (sum, c) => sum + (c.weight || 1),
    0
  );
  const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

  // Determine if entity matches based on logic
  let matches: boolean;
  if (segment.criteria_logic === "or") {
    matches = matchedCriteria.length > 0;
  } else {
    // "and" logic - all criteria must match
    matches = unmatchedCriteria.length === 0;
  }

  return { matches, score, matched_criteria: matchedCriteria, unmatched_criteria: unmatchedCriteria };
}

function evaluateCriterion(
  criterion: SegmentCriterion,
  value: unknown
): boolean {
  const criterionValue = criterion.value;

  switch (criterion.operator) {
    case "eq":
    case "equals":
      return value === criterionValue;
    case "neq":
    case "not_equals":
      return value !== criterionValue;
    case "gt":
    case "greater_than":
      return typeof value === "number" && value > (criterionValue as number);
    case "gte":
    case "greater_than_or_equal":
      return typeof value === "number" && value >= (criterionValue as number);
    case "lt":
    case "less_than":
      return typeof value === "number" && value < (criterionValue as number);
    case "lte":
    case "less_than_or_equal":
      return typeof value === "number" && value <= (criterionValue as number);
    case "contains":
      return (
        typeof value === "string" &&
        value.toLowerCase().includes((criterionValue as string).toLowerCase())
      );
    case "not_contains":
      return (
        typeof value === "string" &&
        !value.toLowerCase().includes((criterionValue as string).toLowerCase())
      );
    case "in":
      return Array.isArray(criterionValue) && criterionValue.includes(value);
    case "not_in":
      return Array.isArray(criterionValue) && !criterionValue.includes(value);
    case "between":
      if (
        typeof value === "number" &&
        Array.isArray(criterionValue) &&
        criterionValue.length === 2
      ) {
        return value >= criterionValue[0] && value <= criterionValue[1];
      }
      return false;
    case "is_null":
      return value === null || value === undefined;
    case "is_not_null":
      return value !== null && value !== undefined;
    case "starts_with":
      return (
        typeof value === "string" &&
        value.toLowerCase().startsWith((criterionValue as string).toLowerCase())
      );
    case "ends_with":
      return (
        typeof value === "string" &&
        value.toLowerCase().endsWith((criterionValue as string).toLowerCase())
      );
    case "regex":
      try {
        const regex = new RegExp(criterionValue as string);
        return typeof value === "string" && regex.test(value);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

export async function refreshSegment(
  tenantId: string,
  segmentId: string
): Promise<{
  added: number;
  removed: number;
  total: number;
}> {
  const supabase = await createClient();
  const segment = await getSegment(tenantId, segmentId);
  if (!segment) {
throw new Error("Segment not found");
}

  // Get all contacts/leads based on segment type
  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("workspace_id", tenantId);

  let added = 0;
  let removed = 0;

  for (const contact of contacts || []) {
    const result = await evaluateEntity(tenantId, segmentId, contact);

    // Check current membership
    const { data: existingMembership } = await supabase
      .from("synthex_library_segment_membership")
      .select("*")
      .eq("segment_id", segmentId)
      .eq("contact_id", contact.id)
      .single();

    if (result.matches && !existingMembership) {
      // Add to segment
      await addMember(tenantId, segmentId, {
        contact_id: contact.id,
        match_score: result.score,
        matched_criteria: result.matched_criteria,
        unmatched_criteria: result.unmatched_criteria,
      });
      added++;
    } else if (!result.matches && existingMembership?.membership_status === "active") {
      // Remove from segment
      await removeMember(segmentId, {
        contact_id: contact.id,
        reason: "No longer matches criteria",
      });
      removed++;
    }
  }

  // Update segment refresh timestamp
  await updateSegment(segmentId, {
    last_refreshed_at: new Date().toISOString(),
  });

  const { data: updatedSegment } = await supabase
    .from("synthex_library_dynamic_segments")
    .select("member_count")
    .eq("id", segmentId)
    .single();

  return {
    added,
    removed,
    total: updatedSegment?.member_count || 0,
  };
}

// =====================================================
// Segment Rules
// =====================================================
export async function listRules(
  tenantId: string,
  filters?: {
    category?: string;
    is_template?: boolean;
    is_active?: boolean;
  }
): Promise<SegmentRule[]> {
  const supabase = await createClient();

  let query = supabase
    .from("synthex_library_segment_rules")
    .select("*")
    .or(`tenant_id.eq.${tenantId},tenant_id.eq.00000000-0000-0000-0000-000000000000`)
    .order("rule_name");

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.is_template !== undefined) {
    query = query.eq("is_template", filters.is_template);
  }
  if (filters?.is_active !== undefined) {
    query = query.eq("is_active", filters.is_active);
  }

  const { data, error } = await query;

  if (error) {
throw new Error(`Failed to list rules: ${error.message}`);
}
  return data || [];
}

export async function createRule(
  tenantId: string,
  data: {
    rule_name: string;
    description?: string;
    category?: string;
    field: string;
    field_source?: string;
    operator: string;
    value: unknown;
    value_type?: string;
    relative_period?: string;
    weight?: number;
    is_required?: boolean;
    is_template?: boolean;
    template_name?: string;
  }
): Promise<SegmentRule> {
  const supabase = await createClient();

  const { data: rule, error } = await supabase
    .from("synthex_library_segment_rules")
    .insert({
      tenant_id: tenantId,
      rule_name: data.rule_name,
      description: data.description,
      category: data.category,
      field: data.field,
      field_source: data.field_source || "contact",
      operator: data.operator,
      value: data.value,
      value_type: data.value_type || "static",
      relative_period: data.relative_period,
      weight: data.weight ?? 1.0,
      is_required: data.is_required ?? false,
      is_template: data.is_template ?? false,
      template_name: data.template_name,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create rule: ${error.message}`);
}
  return rule;
}

// =====================================================
// Segment Snapshots
// =====================================================
export async function createSnapshot(
  tenantId: string,
  segmentId: string,
  snapshotType: string = "manual"
): Promise<SegmentSnapshot> {
  const supabase = await createClient();

  // Get current segment data
  const segment = await getSegment(tenantId, segmentId);
  if (!segment) {
throw new Error("Segment not found");
}

  // Get members
  const members = await listMembers(tenantId, segmentId, {
    membership_status: "active",
  });

  // Calculate metrics
  const totalValue = members.reduce(
    (sum, m) => sum + (m.predicted_value || 0),
    0
  );
  const avgValue = members.length > 0 ? totalValue / members.length : null;

  const engagementScores = members
    .map((m) => m.match_score)
    .filter((s) => s !== null);
  const avgEngagement =
    engagementScores.length > 0
      ? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
      : null;

  // Get previous snapshot for comparison
  const { data: prevSnapshot } = await supabase
    .from("synthex_library_segment_snapshots")
    .select("*")
    .eq("segment_id", segmentId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .single();

  const newMembers = prevSnapshot
    ? members.filter(
        (m) => new Date(m.entered_at) > new Date(prevSnapshot.snapshot_at)
      ).length
    : members.length;

  const changePercent = prevSnapshot?.member_count
    ? ((members.length - prevSnapshot.member_count) / prevSnapshot.member_count) * 100
    : null;

  let trendDirection: TrendDirection = "stable";
  if (changePercent !== null) {
    if (changePercent > 5) {
trendDirection = "growing";
} else if (changePercent < -5) {
trendDirection = "declining";
}
  }

  // Generate AI insights
  let aiSummary: string | null = null;
  let aiRecommendations: string[] = [];
  const client = getAnthropicClient();

  if (client && members.length > 0) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Analyze this segment and provide insights:

Segment: ${segment.segment_name}
Type: ${segment.segment_type}
Members: ${members.length}
Avg Match Score: ${avgEngagement?.toFixed(2) || "N/A"}
Total Value: $${totalValue.toFixed(2)}
Trend: ${trendDirection} (${changePercent?.toFixed(1) || "N/A"}% change)

Criteria: ${JSON.stringify(segment.criteria)}

Provide:
1. A brief summary (1-2 sentences)
2. 2-3 actionable recommendations

Format as JSON: { "summary": "...", "recommendations": ["...", "..."] }`,
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        aiSummary = parsed.summary;
        aiRecommendations = parsed.recommendations || [];
      }
    } catch (error) {
      lastFailure = Date.now();
      console.error("AI snapshot analysis failed:", error);
    }
  }

  const { data: snapshot, error } = await supabase
    .from("synthex_library_segment_snapshots")
    .insert({
      tenant_id: tenantId,
      segment_id: segmentId,
      snapshot_type: snapshotType,
      member_count: members.length,
      new_members: newMembers,
      exited_members: 0, // Would need to track this separately
      net_change: prevSnapshot ? members.length - prevSnapshot.member_count : members.length,
      total_value: totalValue,
      avg_value: avgValue,
      avg_engagement_score: avgEngagement,
      ai_summary: aiSummary,
      ai_recommendations: aiRecommendations,
      change_from_previous_percent: changePercent,
      trend_direction: trendDirection,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to create snapshot: ${error.message}`);
}
  return snapshot;
}

export async function getSnapshots(
  tenantId: string,
  segmentId: string,
  limit: number = 10
): Promise<SegmentSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("synthex_library_segment_snapshots")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("segment_id", segmentId)
    .order("snapshot_at", { ascending: false })
    .limit(limit);

  if (error) {
throw new Error(`Failed to get snapshots: ${error.message}`);
}
  return data || [];
}

// =====================================================
// Segment Overlap Analysis
// =====================================================
export async function calculateOverlap(
  tenantId: string,
  segmentAId: string,
  segmentBId: string
): Promise<SegmentOverlap> {
  const supabase = await createClient();

  // Get members of both segments
  const [membersA, membersB] = await Promise.all([
    listMembers(tenantId, segmentAId, { membership_status: "active" }),
    listMembers(tenantId, segmentBId, { membership_status: "active" }),
  ]);

  const contactIdsA = new Set(membersA.map((m) => m.contact_id).filter(Boolean));
  const contactIdsB = new Set(membersB.map((m) => m.contact_id).filter(Boolean));

  // Calculate overlap
  const overlapIds = [...contactIdsA].filter((id) => contactIdsB.has(id));
  const overlapCount = overlapIds.length;

  const overlapPercentA = contactIdsA.size > 0 ? overlapCount / contactIdsA.size : 0;
  const overlapPercentB = contactIdsB.size > 0 ? overlapCount / contactIdsB.size : 0;

  // Jaccard index: intersection / union
  const unionSize = new Set([...contactIdsA, ...contactIdsB]).size;
  const jaccardIndex = unionSize > 0 ? overlapCount / unionSize : 0;

  // Determine merge recommendation
  const shouldMerge = jaccardIndex > 0.7;
  let mergeRecommendation: string | null = null;
  if (shouldMerge) {
    mergeRecommendation = "High overlap detected. Consider merging these segments.";
  } else if (jaccardIndex > 0.3) {
    mergeRecommendation = "Significant overlap. Review segment criteria for potential consolidation.";
  }

  const { data: overlap, error } = await supabase
    .from("synthex_library_segment_overlaps")
    .insert({
      tenant_id: tenantId,
      segment_a_id: segmentAId,
      segment_b_id: segmentBId,
      overlap_count: overlapCount,
      segment_a_total: contactIdsA.size,
      segment_b_total: contactIdsB.size,
      overlap_percent_a: overlapPercentA,
      overlap_percent_b: overlapPercentB,
      jaccard_index: jaccardIndex,
      should_merge: shouldMerge,
      merge_recommendation: mergeRecommendation,
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to calculate overlap: ${error.message}`);
}
  return overlap;
}

// =====================================================
// Segment Statistics
// =====================================================
export async function getSegmentStats(
  tenantId: string
): Promise<{
  total_segments: number;
  active_segments: number;
  total_members: number;
  segments_by_type: Record<string, number>;
  largest_segments: Array<{ id: string; name: string; members: number }>;
  avg_segment_size: number;
  segments_needing_refresh: number;
}> {
  const supabase = await createClient();

  const { data: segments, error } = await supabase
    .from("synthex_library_dynamic_segments")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_archived", false);

  if (error) {
throw new Error(`Failed to get segment stats: ${error.message}`);
}

  const segmentList = segments || [];

  const totalSegments = segmentList.length;
  const activeSegments = segmentList.filter((s) => s.is_active).length;
  const totalMembers = segmentList.reduce((sum, s) => sum + (s.member_count || 0), 0);

  const segmentsByType: Record<string, number> = {};
  segmentList.forEach((s) => {
    segmentsByType[s.segment_type] = (segmentsByType[s.segment_type] || 0) + 1;
  });

  const largestSegments = segmentList
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.segment_name,
      members: s.member_count || 0,
    }));

  const avgSegmentSize = totalSegments > 0 ? totalMembers / totalSegments : 0;

  const now = new Date();
  const segmentsNeedingRefresh = segmentList.filter(
    (s) =>
      s.auto_refresh &&
      s.next_refresh_at &&
      new Date(s.next_refresh_at) < now
  ).length;

  return {
    total_segments: totalSegments,
    active_segments: activeSegments,
    total_members: totalMembers,
    segments_by_type: segmentsByType,
    largest_segments: largestSegments,
    avg_segment_size: avgSegmentSize,
    segments_needing_refresh: segmentsNeedingRefresh,
  };
}
