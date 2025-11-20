/**
 * Cross-Domain Coordinator Service
 * Phase 11 Week 7-8: Balances SEO/GEO/CONTENT/ADS/CRO dependencies
 *
 * Prevents domain over-optimization and ensures balanced resource allocation.
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export type Domain = 'SEO' | 'GEO' | 'CONTENT' | 'ADS' | 'CRO';

export interface DomainBalance {
  id: string;
  organization_id: string;
  refinement_cycle_id: string | null;
  snapshot_date: string;
  seo_allocation: number;
  geo_allocation: number;
  content_allocation: number;
  ads_allocation: number;
  cro_allocation: number;
  seo_performance: number | null;
  geo_performance: number | null;
  content_performance: number | null;
  ads_performance: number | null;
  cro_performance: number | null;
  balance_score: number | null;
  entropy: number | null;
  gini_coefficient: number | null;
  recommended_shifts: Record<string, number>;
  over_optimized_domains: string[];
  under_invested_domains: string[];
  changes_applied: boolean;
}

export interface DomainDependency {
  source: Domain;
  target: Domain;
  strength: number; // -1 to 1 (negative = inverse, positive = direct)
  lag_days: number;
  description: string;
}

export interface BalanceAnalysis {
  current_allocations: Record<Domain, number>;
  current_performance: Record<Domain, number>;
  balance_score: number;
  entropy: number;
  gini_coefficient: number;
  over_optimized: Domain[];
  under_invested: Domain[];
  recommended_shifts: Record<Domain, number>;
  dependency_conflicts: Array<{
    domains: [Domain, Domain];
    conflict: string;
    resolution: string;
  }>;
}

export interface CoordinationConfig {
  min_allocation?: number; // Minimum % for any domain
  max_allocation?: number; // Maximum % for any domain
  rebalance_threshold?: number; // Trigger rebalance if imbalance exceeds this
  performance_weight?: number; // How much performance affects allocation
}

// Cross-domain dependencies matrix
const DOMAIN_DEPENDENCIES: DomainDependency[] = [
  // SEO dependencies
  { source: 'CONTENT', target: 'SEO', strength: 0.8, lag_days: 14, description: 'Content quality drives organic rankings' },
  { source: 'GEO', target: 'SEO', strength: 0.4, lag_days: 7, description: 'Local signals boost overall SEO' },

  // GEO dependencies
  { source: 'SEO', target: 'GEO', strength: 0.5, lag_days: 7, description: 'Domain authority helps local rankings' },
  { source: 'CRO', target: 'GEO', strength: 0.3, lag_days: 3, description: 'Better UX improves local engagement' },

  // CONTENT dependencies
  { source: 'SEO', target: 'CONTENT', strength: 0.3, lag_days: 0, description: 'SEO insights guide content strategy' },
  { source: 'ADS', target: 'CONTENT', strength: 0.2, lag_days: 0, description: 'Ad performance informs content topics' },

  // ADS dependencies
  { source: 'CONTENT', target: 'ADS', strength: 0.4, lag_days: 0, description: 'Quality content improves ad performance' },
  { source: 'CRO', target: 'ADS', strength: 0.6, lag_days: 0, description: 'Better landing pages improve ROAS' },

  // CRO dependencies
  { source: 'CONTENT', target: 'CRO', strength: 0.5, lag_days: 0, description: 'Engaging content boosts conversions' },
  { source: 'ADS', target: 'CRO', strength: -0.2, lag_days: 0, description: 'Aggressive ads can hurt UX' },
];

export class CrossDomainCoordinatorService {
  private defaultConfig: Required<CoordinationConfig> = {
    min_allocation: 10,
    max_allocation: 40,
    rebalance_threshold: 15,
    performance_weight: 0.6,
  };

  /**
   * Analyze current domain balance
   */
  async analyzeBalance(
    organizationId: string,
    cycleId?: string
  ): Promise<BalanceAnalysis> {
    const supabase = await getSupabaseServer();

    // Get current allocations (from most recent balance or defaults)
    const { data: lastBalance } = await supabase
      .from('domain_balances')
      .select('*')
      .eq('organization_id', organizationId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    const allocations: Record<Domain, number> = lastBalance
      ? {
          SEO: lastBalance.seo_allocation,
          GEO: lastBalance.geo_allocation,
          CONTENT: lastBalance.content_allocation,
          ADS: lastBalance.ads_allocation,
          CRO: lastBalance.cro_allocation,
        }
      : {
          SEO: 20,
          GEO: 20,
          CONTENT: 20,
          ADS: 20,
          CRO: 20,
        };

    // Get current performance from KPI snapshots
    const performance = await this.getDomainPerformance(organizationId);

    // Calculate balance metrics
    const entropy = this.calculateEntropy(Object.values(allocations));
    const gini = this.calculateGini(Object.values(allocations));
    const balanceScore = this.calculateBalanceScore(allocations, performance);

    // Identify over/under optimized domains
    const { overOptimized, underInvested } = this.identifyImbalances(
      allocations,
      performance
    );

    // Calculate recommended shifts
    const recommendedShifts = this.calculateRecommendedShifts(
      allocations,
      performance
    );

    // Check for dependency conflicts
    const conflicts = this.identifyDependencyConflicts(allocations, performance);

    // Save balance snapshot
    await this.saveBalanceSnapshot(organizationId, cycleId, {
      allocations,
      performance,
      balanceScore,
      entropy,
      gini,
      overOptimized,
      underInvested,
      recommendedShifts,
    });

    return {
      current_allocations: allocations,
      current_performance: performance,
      balance_score: balanceScore,
      entropy,
      gini_coefficient: gini,
      over_optimized: overOptimized,
      under_invested: underInvested,
      recommended_shifts: recommendedShifts,
      dependency_conflicts: conflicts,
    };
  }

  /**
   * Apply recommended balance shifts
   */
  async applyBalanceShifts(
    organizationId: string,
    shifts: Record<Domain, number>,
    config?: CoordinationConfig
  ): Promise<Record<Domain, number>> {
    const cfg = { ...this.defaultConfig, ...config };
    const supabase = await getSupabaseServer();

    // Get current allocations
    const { data: lastBalance } = await supabase
      .from('domain_balances')
      .select('*')
      .eq('organization_id', organizationId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (!lastBalance) {
      throw new Error('No existing balance to adjust');
    }

    // Apply shifts with constraints
    const newAllocations: Record<Domain, number> = {
      SEO: Math.max(cfg.min_allocation, Math.min(cfg.max_allocation,
        lastBalance.seo_allocation + (shifts.SEO || 0))),
      GEO: Math.max(cfg.min_allocation, Math.min(cfg.max_allocation,
        lastBalance.geo_allocation + (shifts.GEO || 0))),
      CONTENT: Math.max(cfg.min_allocation, Math.min(cfg.max_allocation,
        lastBalance.content_allocation + (shifts.CONTENT || 0))),
      ADS: Math.max(cfg.min_allocation, Math.min(cfg.max_allocation,
        lastBalance.ads_allocation + (shifts.ADS || 0))),
      CRO: Math.max(cfg.min_allocation, Math.min(cfg.max_allocation,
        lastBalance.cro_allocation + (shifts.CRO || 0))),
    };

    // Normalize to 100%
    const total = Object.values(newAllocations).reduce((a, b) => a + b, 0);
    for (const domain of Object.keys(newAllocations) as Domain[]) {
      newAllocations[domain] = (newAllocations[domain] / total) * 100;
    }

    // Mark old balance as applied and create new one
    await supabase
      .from('domain_balances')
      .update({ changes_applied: true, applied_at: new Date().toISOString() })
      .eq('id', lastBalance.id);

    // Create new balance record
    await supabase.from('domain_balances').insert({
      organization_id: organizationId,
      seo_allocation: newAllocations.SEO,
      geo_allocation: newAllocations.GEO,
      content_allocation: newAllocations.CONTENT,
      ads_allocation: newAllocations.ADS,
      cro_allocation: newAllocations.CRO,
    });

    return newAllocations;
  }

  /**
   * Get domain dependencies
   */
  getDomainDependencies(domain?: Domain): DomainDependency[] {
    if (domain) {
      return DOMAIN_DEPENDENCIES.filter(
        d => d.source === domain || d.target === domain
      );
    }
    return DOMAIN_DEPENDENCIES;
  }

  /**
   * Calculate optimal allocation based on performance and dependencies
   */
  async calculateOptimalAllocation(
    organizationId: string,
    config?: CoordinationConfig
  ): Promise<Record<Domain, number>> {
    const cfg = { ...this.defaultConfig, ...config };
    const performance = await this.getDomainPerformance(organizationId);

    // Start with equal allocation
    const optimal: Record<Domain, number> = {
      SEO: 20,
      GEO: 20,
      CONTENT: 20,
      ADS: 20,
      CRO: 20,
    };

    // Adjust based on performance (invest more in underperforming areas)
    for (const domain of Object.keys(optimal) as Domain[]) {
      const perf = performance[domain];
      if (perf < 50) {
        // Underperforming - increase allocation
        optimal[domain] += (50 - perf) * 0.1 * cfg.performance_weight;
      } else if (perf > 80) {
        // Over-performing - can reduce slightly
        optimal[domain] -= (perf - 80) * 0.05 * cfg.performance_weight;
      }
    }

    // Adjust based on dependencies
    for (const dep of DOMAIN_DEPENDENCIES) {
      if (performance[dep.source] > 70 && dep.strength > 0) {
        // Strong source performance should boost target
        optimal[dep.target] += dep.strength * 2;
      }
    }

    // Apply constraints
    for (const domain of Object.keys(optimal) as Domain[]) {
      optimal[domain] = Math.max(cfg.min_allocation, Math.min(cfg.max_allocation, optimal[domain]));
    }

    // Normalize to 100%
    const total = Object.values(optimal).reduce((a, b) => a + b, 0);
    for (const domain of Object.keys(optimal) as Domain[]) {
      optimal[domain] = (optimal[domain] / total) * 100;
    }

    return optimal;
  }

  /**
   * Check if rebalancing is needed
   */
  async needsRebalancing(
    organizationId: string,
    config?: CoordinationConfig
  ): Promise<{
    needed: boolean;
    reason: string | null;
    imbalance_percent: number;
  }> {
    const cfg = { ...this.defaultConfig, ...config };
    const analysis = await this.analyzeBalance(organizationId);

    // Check if any domain is significantly over/under allocated
    const maxShift = Math.max(...Object.values(analysis.recommended_shifts).map(Math.abs));

    if (maxShift > cfg.rebalance_threshold) {
      return {
        needed: true,
        reason: `Max recommended shift of ${maxShift.toFixed(1)}% exceeds threshold`,
        imbalance_percent: maxShift,
      };
    }

    if (analysis.over_optimized.length > 0) {
      return {
        needed: true,
        reason: `Over-optimized domains: ${analysis.over_optimized.join(', ')}`,
        imbalance_percent: maxShift,
      };
    }

    if (analysis.dependency_conflicts.length > 0) {
      return {
        needed: true,
        reason: `Dependency conflicts detected`,
        imbalance_percent: maxShift,
      };
    }

    return {
      needed: false,
      reason: null,
      imbalance_percent: maxShift,
    };
  }

  // Private helper methods

  private async getDomainPerformance(organizationId: string): Promise<Record<Domain, number>> {
    const supabase = await getSupabaseServer();

    const domains: Domain[] = ['SEO', 'GEO', 'CONTENT', 'ADS', 'CRO'];
    const performance: Record<Domain, number> = {
      SEO: 50,
      GEO: 50,
      CONTENT: 50,
      ADS: 50,
      CRO: 50,
    };

    for (const domain of domains) {
      const { data } = await supabase
        .from('kpi_snapshots')
        .select('metric_value, target_value')
        .eq('organization_id', organizationId)
        .eq('domain', domain)
        .eq('snapshot_type', 'CURRENT')
        .order('snapshot_date', { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        const avgAchievement = data.reduce((sum, s) => {
          const target = s.target_value || s.metric_value;
          return sum + (target ? (s.metric_value / target) * 100 : 50);
        }, 0) / data.length;

        performance[domain] = Math.min(100, avgAchievement);
      }
    }

    return performance;
  }

  private calculateEntropy(allocations: number[]): number {
    // Shannon entropy - higher means more balanced
    const total = allocations.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    let entropy = 0;
    for (const alloc of allocations) {
      if (alloc > 0) {
        const p = alloc / total;
        entropy -= p * Math.log2(p);
      }
    }

    // Normalize to 0-1 range
    return entropy / Math.log2(allocations.length);
  }

  private calculateGini(allocations: number[]): number {
    // Gini coefficient - 0 = perfect equality, 1 = max inequality
    const sorted = [...allocations].sort((a, b) => a - b);
    const n = sorted.length;
    const total = sorted.reduce((a, b) => a + b, 0);

    if (total === 0) return 0;

    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (2 * (i + 1) - n - 1) * sorted[i];
    }

    return sum / (n * total);
  }

  private calculateBalanceScore(
    allocations: Record<Domain, number>,
    performance: Record<Domain, number>
  ): number {
    // 0-100 score where 100 = perfectly balanced
    const entropy = this.calculateEntropy(Object.values(allocations));
    const gini = this.calculateGini(Object.values(allocations));

    // Check allocation-performance alignment
    let alignmentScore = 0;
    for (const domain of Object.keys(allocations) as Domain[]) {
      const alloc = allocations[domain];
      const perf = performance[domain];

      // Penalize high allocation with low performance
      if (alloc > 25 && perf < 50) {
        alignmentScore -= 10;
      }
      // Reward balanced allocation with good performance
      if (alloc >= 15 && alloc <= 25 && perf >= 60) {
        alignmentScore += 5;
      }
    }

    return Math.max(0, Math.min(100, entropy * 50 + (1 - gini) * 30 + alignmentScore + 20));
  }

  private identifyImbalances(
    allocations: Record<Domain, number>,
    performance: Record<Domain, number>
  ): { overOptimized: Domain[]; underInvested: Domain[] } {
    const overOptimized: Domain[] = [];
    const underInvested: Domain[] = [];

    for (const domain of Object.keys(allocations) as Domain[]) {
      const alloc = allocations[domain];
      const perf = performance[domain];

      // Over-optimized: high allocation with diminishing returns
      if (alloc > 30 && perf < 60) {
        overOptimized.push(domain);
      }

      // Under-invested: low allocation with potential
      if (alloc < 15 && perf >= 50) {
        underInvested.push(domain);
      }
    }

    return { overOptimized, underInvested };
  }

  private calculateRecommendedShifts(
    allocations: Record<Domain, number>,
    performance: Record<Domain, number>
  ): Record<Domain, number> {
    const shifts: Record<Domain, number> = {
      SEO: 0,
      GEO: 0,
      CONTENT: 0,
      ADS: 0,
      CRO: 0,
    };

    for (const domain of Object.keys(allocations) as Domain[]) {
      const alloc = allocations[domain];
      const perf = performance[domain];

      // High allocation, low performance - reduce
      if (alloc > 25 && perf < 50) {
        shifts[domain] = -Math.min(5, (alloc - 20) * 0.5);
      }
      // Low allocation, high performance - increase
      else if (alloc < 20 && perf > 70) {
        shifts[domain] = Math.min(5, (20 - alloc) * 0.5);
      }
      // Low performance in general - slight increase
      else if (perf < 40) {
        shifts[domain] = 2;
      }
    }

    return shifts;
  }

  private identifyDependencyConflicts(
    allocations: Record<Domain, number>,
    performance: Record<Domain, number>
  ): Array<{ domains: [Domain, Domain]; conflict: string; resolution: string }> {
    const conflicts: Array<{ domains: [Domain, Domain]; conflict: string; resolution: string }> = [];

    for (const dep of DOMAIN_DEPENDENCIES) {
      // Check for inverse dependency conflicts
      if (dep.strength < 0) {
        if (allocations[dep.source] > 30 && performance[dep.target] < 50) {
          conflicts.push({
            domains: [dep.source, dep.target],
            conflict: `High ${dep.source} allocation may be hurting ${dep.target}`,
            resolution: `Reduce ${dep.source} allocation or adjust ${dep.target} strategy`,
          });
        }
      }

      // Check for unmet positive dependencies
      if (dep.strength > 0.5) {
        if (performance[dep.source] < 50 && allocations[dep.target] > 25) {
          conflicts.push({
            domains: [dep.source, dep.target],
            conflict: `${dep.target} is over-allocated but depends on underperforming ${dep.source}`,
            resolution: `Improve ${dep.source} performance first`,
          });
        }
      }
    }

    return conflicts;
  }

  private async saveBalanceSnapshot(
    organizationId: string,
    cycleId: string | undefined,
    data: {
      allocations: Record<Domain, number>;
      performance: Record<Domain, number>;
      balanceScore: number;
      entropy: number;
      gini: number;
      overOptimized: Domain[];
      underInvested: Domain[];
      recommendedShifts: Record<Domain, number>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('domain_balances').insert({
      organization_id: organizationId,
      refinement_cycle_id: cycleId || null,
      seo_allocation: data.allocations.SEO,
      geo_allocation: data.allocations.GEO,
      content_allocation: data.allocations.CONTENT,
      ads_allocation: data.allocations.ADS,
      cro_allocation: data.allocations.CRO,
      seo_performance: data.performance.SEO,
      geo_performance: data.performance.GEO,
      content_performance: data.performance.CONTENT,
      ads_performance: data.performance.ADS,
      cro_performance: data.performance.CRO,
      balance_score: data.balanceScore,
      entropy: data.entropy,
      gini_coefficient: data.gini,
      recommended_shifts: data.recommendedShifts,
      over_optimized_domains: data.overOptimized,
      under_invested_domains: data.underInvested,
    });
  }
}

export const crossDomainCoordinatorService = new CrossDomainCoordinatorService();
