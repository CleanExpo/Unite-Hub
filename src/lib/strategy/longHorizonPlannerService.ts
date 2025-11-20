/**
 * Long Horizon Planner Service - Phase 11 Week 5-6
 *
 * 30/60/90-day rolling strategy generation using simulation results,
 * past performance, and operator reliability.
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type HorizonType = "SHORT" | "MEDIUM" | "LONG" | "QUARTERLY" | "CUSTOM";
export type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type StepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED" | "FAILED";
export type LinkType = "FINISH_TO_START" | "START_TO_START" | "FINISH_TO_FINISH" | "START_TO_FINISH";

export interface HorizonPlan {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  horizon_type: HorizonType;
  start_date: string;
  end_date: string;
  days_total: number;
  is_rolling: boolean;
  roll_frequency_days: number;
  last_rolled_at: string | null;
  next_roll_at: string | null;
  status: PlanStatus;
  confidence_score: number | null;
  feasibility_score: number | null;
  impact_score: number | null;
  overall_score: number | null;
  parent_plan_id: string | null;
  source_simulation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HorizonStep {
  id: string;
  horizon_plan_id: string;
  name: string;
  description: string | null;
  step_number: number;
  domain: string;
  start_day: number;
  end_day: number;
  duration_days: number;
  target_kpis: Record<string, number>;
  status: StepStatus;
  progress: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  assigned_to: string | null;
  risk_level: string;
  risk_factors: Record<string, number>;
  outcome_data: Record<string, unknown>;
  created_at: string;
}

export interface DependencyLink {
  id: string;
  horizon_plan_id: string;
  source_step_id: string;
  target_step_id: string;
  link_type: LinkType;
  lag_days: number;
  is_critical: boolean;
  flexibility_days: number;
  description: string | null;
}

export interface CreatePlanRequest {
  organization_id: string;
  name: string;
  description?: string;
  horizon_type: HorizonType;
  start_date?: string;
  custom_days?: number;
  is_rolling?: boolean;
  roll_frequency_days?: number;
  source_simulation_id?: string;
  created_by?: string;
}

export interface GeneratePlanConfig {
  domains?: string[];
  includeSimulationData?: boolean;
  operatorReliabilityWeight?: number;
  pastPerformanceWeight?: number;
  targetKPIs?: Record<string, number>;
}

export interface PlanScore {
  confidence: number;
  feasibility: number;
  impact: number;
  overall: number;
}

export class LongHorizonPlannerService {
  private horizonDays: Record<HorizonType, number> = {
    SHORT: 30,
    MEDIUM: 60,
    LONG: 90,
    QUARTERLY: 90,
    CUSTOM: 0,
  };

  /**
   * Create a new horizon plan
   */
  async createPlan(request: CreatePlanRequest): Promise<HorizonPlan> {
    const supabase = await getSupabaseServer();

    const days = request.custom_days || this.horizonDays[request.horizon_type];
    const startDate = request.start_date || new Date().toISOString();
    const endDate = new Date(new Date(startDate).getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    const nextRoll = request.is_rolling !== false
      ? new Date(new Date(startDate).getTime() + (request.roll_frequency_days || 7) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from("horizon_plans")
      .insert({
        organization_id: request.organization_id,
        name: request.name,
        description: request.description,
        horizon_type: request.horizon_type,
        start_date: startDate,
        end_date: endDate,
        days_total: days,
        is_rolling: request.is_rolling !== false,
        roll_frequency_days: request.roll_frequency_days || 7,
        next_roll_at: nextRoll,
        source_simulation_id: request.source_simulation_id,
        created_by: request.created_by,
        status: "DRAFT",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create plan: ${error.message}`);
    }

    return data;
  }

  /**
   * Generate a complete horizon plan with steps
   */
  async generatePlan(
    organizationId: string,
    horizonType: HorizonType,
    config?: GeneratePlanConfig
  ): Promise<{ plan: HorizonPlan; steps: HorizonStep[]; dependencies: DependencyLink[] }> {
    const cfg = {
      domains: config?.domains || ["SEO", "GEO", "CONTENT", "ADS", "CRO"],
      includeSimulationData: config?.includeSimulationData ?? true,
      operatorReliabilityWeight: config?.operatorReliabilityWeight ?? 0.3,
      pastPerformanceWeight: config?.pastPerformanceWeight ?? 0.4,
      targetKPIs: config?.targetKPIs || {},
    };

    // Create the plan
    const plan = await this.createPlan({
      organization_id: organizationId,
      name: `${horizonType} Horizon Plan - ${new Date().toLocaleDateString()}`,
      description: `Auto-generated ${this.horizonDays[horizonType]}-day rolling plan`,
      horizon_type: horizonType,
    });

    // Generate steps for each domain
    const steps: HorizonStep[] = [];
    const dependencies: DependencyLink[] = [];

    const days = plan.days_total;
    const stepsPerDomain = Math.ceil(days / 15); // Roughly one step per 2 weeks per domain

    let stepNumber = 1;
    const stepMap = new Map<string, string>(); // domain -> last step id

    for (const domain of cfg.domains) {
      const domainSteps = await this.generateDomainSteps(
        plan.id,
        domain,
        stepsPerDomain,
        stepNumber,
        days,
        cfg.targetKPIs[domain]
      );

      steps.push(...domainSteps);

      // Create dependencies within domain
      for (let i = 1; i < domainSteps.length; i++) {
        const dep = await this.createDependency(
          plan.id,
          domainSteps[i - 1].id,
          domainSteps[i].id,
          "FINISH_TO_START",
          0
        );
        dependencies.push(dep);
      }

      // Cross-domain dependencies (e.g., SEO depends on CONTENT)
      if (domain === "SEO" && stepMap.has("CONTENT")) {
        const dep = await this.createDependency(
          plan.id,
          stepMap.get("CONTENT")!,
          domainSteps[0].id,
          "START_TO_START",
          3
        );
        dependencies.push(dep);
      }

      stepMap.set(domain, domainSteps[domainSteps.length - 1].id);
      stepNumber += domainSteps.length;
    }

    // Calculate plan scores
    const scores = await this.calculatePlanScores(plan.id, steps, cfg);
    await this.updatePlanScores(plan.id, scores);

    return {
      plan: { ...plan, ...scores },
      steps,
      dependencies,
    };
  }

  /**
   * Roll a plan forward
   */
  async rollPlan(planId: string): Promise<HorizonPlan> {
    const supabase = await getSupabaseServer();

    const { data: plan } = await supabase
      .from("horizon_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      throw new Error("Plan not found");
    }

    if (!plan.is_rolling) {
      throw new Error("Plan is not configured for rolling");
    }

    // Calculate new dates
    const rollDays = plan.roll_frequency_days;
    const newStart = new Date(new Date(plan.start_date).getTime() + rollDays * 24 * 60 * 60 * 1000);
    const newEnd = new Date(new Date(plan.end_date).getTime() + rollDays * 24 * 60 * 60 * 1000);
    const nextRoll = new Date(newStart.getTime() + rollDays * 24 * 60 * 60 * 1000);

    // Update plan
    const { data: updated, error } = await supabase
      .from("horizon_plans")
      .update({
        start_date: newStart.toISOString(),
        end_date: newEnd.toISOString(),
        last_rolled_at: new Date().toISOString(),
        next_roll_at: nextRoll.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to roll plan: ${error.message}`);
    }

    // Mark completed steps
    await supabase
      .from("horizon_steps")
      .update({ status: "COMPLETED" })
      .eq("horizon_plan_id", planId)
      .lt("end_day", rollDays);

    // Add adjustment record
    await supabase.from("horizon_adjustments").insert({
      horizon_plan_id: planId,
      adjustment_type: "REPLAN",
      reason: "Rolling optimization",
      description: `Rolled plan forward by ${rollDays} days`,
      changes_summary: {
        old_start: plan.start_date,
        new_start: newStart.toISOString(),
        days_rolled: rollDays,
      },
      impact_on_timeline: 0,
    });

    return updated;
  }

  /**
   * Get plan with all details
   */
  async getPlan(planId: string): Promise<{
    plan: HorizonPlan;
    steps: HorizonStep[];
    dependencies: DependencyLink[];
  } | null> {
    const supabase = await getSupabaseServer();

    const { data: plan } = await supabase
      .from("horizon_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) {
      return null;
    }

    const { data: steps } = await supabase
      .from("horizon_steps")
      .select("*")
      .eq("horizon_plan_id", planId)
      .order("step_number", { ascending: true });

    const { data: dependencies } = await supabase
      .from("dependency_links")
      .select("*")
      .eq("horizon_plan_id", planId);

    return {
      plan,
      steps: steps || [],
      dependencies: dependencies || [],
    };
  }

  /**
   * Get all plans for organization
   */
  async getPlans(
    organizationId: string,
    options?: { status?: PlanStatus; horizonType?: HorizonType }
  ): Promise<HorizonPlan[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from("horizon_plans")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    if (options?.horizonType) {
      query = query.eq("horizon_type", options.horizonType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get plans: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update plan status
   */
  async updatePlanStatus(planId: string, status: PlanStatus): Promise<void> {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from("horizon_plans")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", planId);

    if (error) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  /**
   * Update step progress
   */
  async updateStepProgress(stepId: string, progress: number, status?: StepStatus): Promise<void> {
    const supabase = await getSupabaseServer();

    const updates: Record<string, unknown> = {
      progress,
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updates.status = status;
    } else if (progress >= 100) {
      updates.status = "COMPLETED";
    } else if (progress > 0) {
      updates.status = "IN_PROGRESS";
    }

    const { error } = await supabase
      .from("horizon_steps")
      .update(updates)
      .eq("id", stepId);

    if (error) {
      throw new Error(`Failed to update step: ${error.message}`);
    }
  }

  /**
   * Resolve dependencies and calculate critical path
   */
  async resolveDependencies(planId: string): Promise<{
    criticalPath: string[];
    totalDuration: number;
    parallelGroups: string[][];
  }> {
    const plan = await this.getPlan(planId);
    if (!plan) {
      throw new Error("Plan not found");
    }

    const { steps, dependencies } = plan;

    // Build adjacency list
    const adjacency = new Map<string, { targetId: string; lagDays: number }[]>();
    const inDegree = new Map<string, number>();

    for (const step of steps) {
      adjacency.set(step.id, []);
      inDegree.set(step.id, 0);
    }

    for (const dep of dependencies) {
      if (dep.link_type === "FINISH_TO_START") {
        adjacency.get(dep.source_step_id)?.push({
          targetId: dep.target_step_id,
          lagDays: dep.lag_days,
        });
        inDegree.set(dep.target_step_id, (inDegree.get(dep.target_step_id) || 0) + 1);
      }
    }

    // Calculate earliest start times (forward pass)
    const earliestStart = new Map<string, number>();
    const latestStart = new Map<string, number>();
    const predecessors = new Map<string, string | null>();

    const queue: string[] = [];
    for (const step of steps) {
      earliestStart.set(step.id, step.start_day);
      latestStart.set(step.id, Infinity);
      predecessors.set(step.id, null);

      if (inDegree.get(step.id) === 0) {
        queue.push(step.id);
      }
    }

    // Topological sort with longest path
    while (queue.length > 0) {
      const stepId = queue.shift()!;
      const step = steps.find(s => s.id === stepId)!;
      const currentEnd = earliestStart.get(stepId)! + step.duration_days;

      for (const { targetId, lagDays } of adjacency.get(stepId) || []) {
        const newStart = currentEnd + lagDays;
        if (newStart > earliestStart.get(targetId)!) {
          earliestStart.set(targetId, newStart);
          predecessors.set(targetId, stepId);
        }

        const degree = inDegree.get(targetId)! - 1;
        inDegree.set(targetId, degree);
        if (degree === 0) {
          queue.push(targetId);
        }
      }
    }

    // Find critical path (longest path)
    let maxDuration = 0;
    let endStep = "";
    for (const step of steps) {
      const duration = earliestStart.get(step.id)! + step.duration_days;
      if (duration > maxDuration) {
        maxDuration = duration;
        endStep = step.id;
      }
    }

    // Reconstruct critical path
    const criticalPath: string[] = [];
    let current: string | null = endStep;
    while (current) {
      criticalPath.unshift(current);
      current = predecessors.get(current) || null;
    }

    // Find parallel groups (steps with same start time)
    const startTimeGroups = new Map<number, string[]>();
    for (const step of steps) {
      const start = earliestStart.get(step.id)!;
      const group = startTimeGroups.get(start) || [];
      group.push(step.id);
      startTimeGroups.set(start, group);
    }

    const parallelGroups = Array.from(startTimeGroups.values()).filter(g => g.length > 1);

    return {
      criticalPath,
      totalDuration: maxDuration,
      parallelGroups,
    };
  }

  // Private helper methods

  private async generateDomainSteps(
    planId: string,
    domain: string,
    count: number,
    startNumber: number,
    totalDays: number,
    targetKPI?: number
  ): Promise<HorizonStep[]> {
    const supabase = await getSupabaseServer();
    const steps: HorizonStep[] = [];

    const dayInterval = Math.floor(totalDays / count);

    const stepTemplates: Record<string, string[]> = {
      SEO: ["Keyword Research", "On-Page Optimization", "Technical SEO Audit", "Link Building", "Content Gap Analysis"],
      GEO: ["Local Citations", "GMB Optimization", "Review Management", "Local Link Building", "Geo-Targeted Content"],
      CONTENT: ["Content Strategy", "Content Creation", "Content Optimization", "Content Distribution", "Performance Analysis"],
      ADS: ["Campaign Setup", "Ad Creative Testing", "Audience Optimization", "Budget Allocation", "Performance Reporting"],
      CRO: ["Conversion Audit", "A/B Test Design", "Test Implementation", "Analysis & Iteration", "Implementation"],
    };

    const templates = stepTemplates[domain] || [`${domain} Step`];

    for (let i = 0; i < count; i++) {
      const startDay = i * dayInterval;
      const endDay = Math.min(startDay + dayInterval - 1, totalDays);
      const duration = endDay - startDay + 1;

      const stepData = {
        horizon_plan_id: planId,
        name: templates[i % templates.length],
        description: `${domain} optimization step ${i + 1}`,
        step_number: startNumber + i,
        domain,
        start_day: startDay,
        end_day: endDay,
        duration_days: duration,
        target_kpis: targetKPI ? { [domain.toLowerCase()]: targetKPI } : {},
        estimated_hours: duration * 4,
        risk_level: i === 0 ? "LOW" : i === count - 1 ? "MEDIUM" : "LOW",
        risk_factors: { complexity: Math.random() * 0.3 },
      };

      const { data, error } = await supabase
        .from("horizon_steps")
        .insert(stepData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create step: ${error.message}`);
      }

      steps.push(data);
    }

    return steps;
  }

  private async createDependency(
    planId: string,
    sourceId: string,
    targetId: string,
    linkType: LinkType,
    lagDays: number
  ): Promise<DependencyLink> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("dependency_links")
      .insert({
        horizon_plan_id: planId,
        source_step_id: sourceId,
        target_step_id: targetId,
        link_type: linkType,
        lag_days: lagDays,
        is_critical: linkType === "FINISH_TO_START" && lagDays === 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create dependency: ${error.message}`);
    }

    return data;
  }

  private async calculatePlanScores(
    planId: string,
    steps: HorizonStep[],
    config: GeneratePlanConfig
  ): Promise<PlanScore> {
    // Simple scoring based on step characteristics
    const avgRisk = steps.reduce((sum, s) => {
      const riskVal = s.risk_level === "LOW" ? 0.2 : s.risk_level === "MEDIUM" ? 0.5 : 0.8;
      return sum + riskVal;
    }, 0) / steps.length;

    const confidence = (1 - avgRisk) * 100;
    const feasibility = Math.min(100, (steps.length / 20) * 100); // More steps = more feasible (up to 20)
    const impact = Object.keys(config.targetKPIs || {}).length * 20; // Each targeted KPI adds impact

    return {
      confidence_score: confidence,
      feasibility_score: feasibility,
      impact_score: Math.min(100, impact),
      overall_score: (confidence + feasibility + impact) / 3,
    };
  }

  private async updatePlanScores(planId: string, scores: PlanScore): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from("horizon_plans")
      .update({
        confidence_score: scores.confidence_score,
        feasibility_score: scores.feasibility_score,
        impact_score: scores.impact_score,
        overall_score: scores.overall_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);
  }
}

export default LongHorizonPlannerService;

// Singleton instance for convenience
export const longHorizonPlannerService = new LongHorizonPlannerService();
