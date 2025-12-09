/**
 * Autonomous Skill Evolution Engine (ASEE) Configuration
 * Defines skill evolution strategies and opportunity scoring
 */

export interface EvolutionStrategy {
  type: 'refine' | 'split' | 'merge' | 'deprecate' | 'create';
  criteria: string[];
  benefit: string;
  effort: string;
  risk: string;
}

export interface NewSkillBlueprint {
  name: string;
  description: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  estimatedEffort: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ASEEConfig {
  evolutionStrategies: Record<string, EvolutionStrategy>;
  commonNewSkillTemplates: NewSkillBlueprint[];
  opportunityWeights: {
    fillCapabilityGap: number;
    reduceComplexity: number;
    improvePerformance: number;
    enhanceMaintainability: number;
  };
  thresholds: {
    refineHealthThreshold: number;
    splitComplexityThreshold: number;
    mergeUnderutilizationThreshold: number;
    deprecateAgeThreshold: number;
  };
}

export const aseeConfig: ASEEConfig = {
  evolutionStrategies: {
    refine: {
      type: 'refine',
      criteria: [
        'Health score 4-7 (not too broken, not good)',
        'Moderate complexity',
        'Occasional use cases',
        'Some drift detected'
      ],
      benefit: 'Improved quality, reduced technical debt',
      effort: '1-2 weeks',
      risk: 'Medium'
    },
    split: {
      type: 'split',
      criteria: [
        'File size > 50KB',
        'Multiple responsibilities',
        'High cyclomatic complexity',
        'Unrelated concerns mixed'
      ],
      benefit: 'Better separation of concerns, easier testing',
      effort: '2-3 weeks',
      risk: 'Medium to High'
    },
    merge: {
      type: 'merge',
      criteria: [
        'Two skills < 5 uses each',
        'Overlapping functionality',
        'Similar input/output patterns',
        'Low individual value'
      ],
      benefit: 'Reduced codebase, easier maintenance',
      effort: '1 week',
      risk: 'Low'
    },
    deprecate: {
      type: 'deprecate',
      criteria: [
        'Zero uses in 90 days',
        'Outdated approach',
        'Replaced by better alternative',
        'No active users'
      ],
      benefit: 'Reduced maintenance burden, cleaner codebase',
      effort: 'Minimal',
      risk: 'Low'
    },
    create: {
      type: 'create',
      criteria: [
        'High-value capability gap',
        'Multiple requests for same functionality',
        'Clear use cases identified',
        'Team capacity available'
      ],
      benefit: 'Fill capability gaps, enable new features',
      effort: '2-4 weeks',
      risk: 'Low to Medium'
    }
  },

  commonNewSkillTemplates: [
    {
      name: 'Compliance & Governance',
      description: 'Handles regulatory compliance checks and governance rules',
      purpose: 'Ensure all code changes meet compliance standards',
      inputs: ['code_changes', 'compliance_rules'],
      outputs: ['compliance_report', 'violations'],
      dependencies: ['code_analyzer', 'rule_engine'],
      estimatedEffort: '2-3 weeks',
      priority: 'high'
    },
    {
      name: 'Performance Profiler',
      description: 'Analyzes and optimizes performance bottlenecks',
      purpose: 'Identify and fix performance issues',
      inputs: ['execution_logs', 'metrics'],
      outputs: ['profile_report', 'optimization_suggestions'],
      dependencies: ['metrics_analyzer', 'benchmarker'],
      estimatedEffort: '1-2 weeks',
      priority: 'high'
    },
    {
      name: 'Knowledge Extractor',
      description: 'Extracts institutional knowledge from codebase',
      purpose: 'Build knowledge base and improve documentation',
      inputs: ['code', 'comments', 'commits'],
      outputs: ['knowledge_base', 'insights'],
      dependencies: ['code_analyzer', 'nlp_processor'],
      estimatedEffort: '2 weeks',
      priority: 'medium'
    },
    {
      name: 'Migration Planner',
      description: 'Plans and executes framework/library migrations',
      purpose: 'Safely upgrade dependencies and frameworks',
      inputs: ['current_stack', 'target_stack'],
      outputs: ['migration_plan', 'scripts'],
      dependencies: ['dependency_analyzer', 'compatibility_checker'],
      estimatedEffort: '3-4 weeks',
      priority: 'medium'
    },
    {
      name: 'Quality Gate Enforcer',
      description: 'Ensures code meets quality standards before merge',
      purpose: 'Maintain code quality across project',
      inputs: ['code_metrics', 'test_results'],
      outputs: ['gate_report', 'approval'],
      dependencies: ['metrics_analyzer', 'test_runner'],
      estimatedEffort: '1-2 weeks',
      priority: 'high'
    },
    {
      name: 'Dependency Manager',
      description: 'Manages and optimizes project dependencies',
      purpose: 'Keep dependencies secure and minimal',
      inputs: ['package_json', 'lock_file'],
      outputs: ['dependency_report', 'update_recommendations'],
      dependencies: ['package_analyzer', 'security_checker'],
      estimatedEffort: '1 week',
      priority: 'medium'
    },
    {
      name: 'Architecture Monitor',
      description: 'Monitors architectural compliance and consistency',
      purpose: 'Ensure system design principles are maintained',
      inputs: ['codebase', 'architecture_spec'],
      outputs: ['violation_report', 'recommendations'],
      dependencies: ['code_analyzer', 'pattern_matcher'],
      estimatedEffort: '2-3 weeks',
      priority: 'high'
    }
  ],

  opportunityWeights: {
    fillCapabilityGap: 0.40,         // 40% - new capabilities
    reduceComplexity: 0.25,          // 25% - simplification
    improvePerformance: 0.20,        // 20% - efficiency gains
    enhanceMaintainability: 0.15     // 15% - maintenance improvements
  },

  thresholds: {
    refineHealthThreshold: 7,        // Health < 7 = needs refinement
    splitComplexityThreshold: 50,    // File size > 50KB = split candidate
    mergeUnderutilizationThreshold: 5,  // < 5 uses = merge candidate
    deprecateAgeThreshold: 90        // 90+ days unused = deprecate
  }
};
