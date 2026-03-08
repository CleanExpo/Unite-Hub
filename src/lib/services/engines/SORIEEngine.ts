// SORIE - Strategic Objective & Roadmap Intelligence Engine (Phase 88)
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SORIEEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async createObjective(
    tenantId: string,
    title: string,
    description: string,
    priority: number,
    timeHorizon: '1q' | '2q' | '1y' | '2y' | '5y',
    kpiTargets: Record<string, any>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('sorie_objectives')
      .insert({
        tenant_id: tenantId,
        title,
        description,
        priority,
        time_horizon: timeHorizon,
        kpi_targets: kpiTargets
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async generateRoadmap(tenantId: string, objectiveId: string): Promise<any> {
    const { data: objective } = await this.supabase
      .from('sorie_objectives')
      .select('*')
      .eq('id', objectiveId)
      .single();

    if (!objective) throw new Error('Objective not found');

    const roadmapItems = this.createRoadmapItems(objective);
    const confidence = this.calculateConfidence(objective, roadmapItems);

    const { data, error } = await this.supabase
      .from('sorie_roadmaps')
      .insert({
        tenant_id: tenantId,
        objective_id: objectiveId,
        roadmap_items: roadmapItems,
        confidence,
        impact_assessment: `Roadmap for ${objective.title}`
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createRecommendation(
    tenantId: string,
    objectiveId: string | null,
    recommendation: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    expectedImpact: Record<string, any>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('sorie_recommendations')
      .insert({
        tenant_id: tenantId,
        objective_id: objectiveId,
        recommendation,
        risk_level: riskLevel,
        expected_impact: expectedImpact,
        requires_hsoe: riskLevel === 'high' || riskLevel === 'critical'
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  private createRoadmapItems(objective: any): any[] {
    const items = [];
    const horizonMonths = {
      '1q': 3, '2q': 6, '1y': 12, '2y': 24, '5y': 60
    };
    const months = horizonMonths[objective.time_horizon as keyof typeof horizonMonths] || 12;

    items.push({
      phase: 1,
      title: 'Foundation',
      duration_months: Math.ceil(months * 0.2),
      deliverables: ['Requirements', 'Architecture', 'Team setup']
    });

    items.push({
      phase: 2,
      title: 'Implementation',
      duration_months: Math.ceil(months * 0.5),
      deliverables: ['Core features', 'Integration', 'Testing']
    });

    items.push({
      phase: 3,
      title: 'Optimization',
      duration_months: Math.ceil(months * 0.3),
      deliverables: ['Performance tuning', 'Scale testing', 'Documentation']
    });

    return items;
  }

  private calculateConfidence(objective: any, roadmapItems: any[]): number {
    let confidence = 70;
    if (objective.priority <= 3) confidence += 10;
    if (objective.kpi_targets && Object.keys(objective.kpi_targets).length > 0) confidence += 10;
    return Math.min(100, confidence);
  }
}

export const sorieEngine = new SORIEEngine();
