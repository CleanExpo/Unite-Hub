/**
 * Skill Impact Simulation Engine (SISE) Configuration
 * Defines scenarios, impact weights, and simulation parameters
 */

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: 'fix_drift' | 'improve_health' | 'expand_opportunity' | 'consolidate' | 'modernize';
  targetSkills?: string[];
  estimatedEffort: string;
  expectedImpact: string;
}

export interface ImpactDelta {
  metric: string;
  baseline: number;
  projected: number;
  change: number;
  percentChange: number;
}

export interface SISEConfig {
  scenarios: SimulationScenario[];
  weights: {
    riskReduction: number;
    qualityImprovement: number;
    stabilityGain: number;
    maintenanceReduction: number;
  };
  thresholds: {
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
  };
}

export const siseConfig: SISEConfig = {
  scenarios: [
    {
      id: 'fix_critical_drift',
      name: 'Fix Critical Drift Issues',
      description: 'Address all critical security and architectural deviations',
      type: 'fix_drift',
      estimatedEffort: '1-2 weeks',
      expectedImpact: 'High risk reduction, improved stability'
    },
    {
      id: 'improve_low_health',
      name: 'Improve Low-Health Skills',
      description: 'Bring all health scores above 7/10',
      type: 'improve_health',
      estimatedEffort: '2-3 weeks',
      expectedImpact: 'Reduced maintenance burden, improved quality'
    },
    {
      id: 'expand_opportunities',
      name: 'Build High-ROI New Skills',
      description: 'Create top 5 high-opportunity skills identified by SOG',
      type: 'expand_opportunity',
      estimatedEffort: '3-4 weeks',
      expectedImpact: 'Enhanced capability, competitive advantage'
    },
    {
      id: 'consolidate_underutilized',
      name: 'Consolidate Underutilized Skills',
      description: 'Merge or archive 5+ underutilized skills',
      type: 'consolidate',
      estimatedEffort: '1-2 weeks',
      expectedImpact: 'Reduced maintenance, cleaner portfolio'
    },
    {
      id: 'modernize_stack',
      name: 'Modernize Technology Stack',
      description: 'Update outdated patterns and frameworks',
      type: 'modernize',
      estimatedEffort: '4-6 weeks',
      expectedImpact: 'Better performance, improved developer experience'
    },
    {
      id: 'holistic_refactor',
      name: 'Comprehensive Refactoring',
      description: 'Execute all SRRE critical and high-ROI refactors',
      type: 'modernize',
      estimatedEffort: '6-10 weeks',
      expectedImpact: 'Transformative improvement across all metrics'
    }
  ],
  weights: {
    riskReduction: 0.35,      // 35% of impact score
    qualityImprovement: 0.30,  // 30% - health, coverage, maintainability
    stabilityGain: 0.25,       // 25% - reduced drift, fewer issues
    maintenanceReduction: 0.10 // 10% - time savings
  },
  thresholds: {
    highImpact: 60,     // Score > 60 = significant improvement
    mediumImpact: 30,   // Score > 30 = moderate improvement
    lowImpact: 10       // Score > 10 = minor improvement
  }
};
