/**
 * Skill Opportunity Generator (SOG) Configuration
 * Identifies gaps, consolidation opportunities, and strategic expansions
 */

export const opportunityConfig = {
  // Gap analysis thresholds
  gapAnalysis: {
    usageGapThreshold: 5,        // Skills used < 5 times indicate potential gaps
    valueGapThreshold: 6,        // Skills with value < 6/10
    frequencyGapThreshold: 14,   // Skills not used in 14 days
    skillCountThreshold: 50      // Recommend consolidation if > 50 skills
  },

  // Strategic opportunity categories
  opportunities: {
    consolidation: {
      description: 'Combine overlapping or low-value skills',
      triggers: ['underutilized', 'deprecated', 'similar_functionality'],
      priority: 'high'
    },
    expansion: {
      description: 'Create new skills based on gaps and trends',
      triggers: ['high_demand_gap', 'missing_capability', 'industry_trend'],
      priority: 'medium'
    },
    modernization: {
      description: 'Update outdated skills to new standards',
      triggers: ['old_pattern', 'drift_detected', 'new_framework'],
      priority: 'medium'
    },
    specialization: {
      description: 'Split large skills into focused modules',
      triggers: ['file_bloat', 'multiple_responsibilities', 'high_complexity'],
      priority: 'low'
    }
  },

  // Common skill gap patterns
  commonGaps: [
    { name: 'Compliance & Governance', domain: 'Enterprise', priority: 'high' },
    { name: 'Data Security & Privacy', domain: 'Security', priority: 'high' },
    { name: 'Financial Reporting', domain: 'Finance', priority: 'medium' },
    { name: 'Performance Optimization', domain: 'DevOps', priority: 'high' },
    { name: 'Incident Response', domain: 'Operations', priority: 'high' },
    { name: 'API Design & Documentation', domain: 'Development', priority: 'medium' },
    { name: 'Testing & QA Strategy', domain: 'Quality', priority: 'high' },
    { name: 'Multi-tenant Architecture', domain: 'Architecture', priority: 'high' }
  ],

  // Strategic skill categories
  strategicCategories: {
    coreInfrastructure: { value: 'critical', growth: 'minimal' },
    customerFacing: { value: 'high', growth: 'rapid' },
    dataProcessing: { value: 'high', growth: 'rapid' },
    devTools: { value: 'medium', growth: 'moderate' },
    admin: { value: 'low', growth: 'slow' }
  },

  // Impact scoring
  impactScoring: {
    highUsage: 3,              // Each usage event
    documentation: 2,           // Complete docs present
    tests: 2,                   // Test coverage
    expertise: 1,               // Per expertise point
    recentUsage: 1              // Recent use bonus
  }
};

export type OpportunityConfig = typeof opportunityConfig;
