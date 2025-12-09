/**
 * Skill Value Intelligence Engine (SVIE) Configuration
 * Read-only skill health, usage, and impact analysis
 */

export const svieConfig = {
  // Paths
  skillRoot: '.claude/skills',
  reportDir: './reports',
  usageLogPath: './logs/skill-usage.log',

  // Analysis thresholds
  minActivityThreshold: 5,        // Skills used less than 5 times flagged as underused
  maxFileSize: 50000,             // Bytes - skills larger than this flagged for bloat
  deprecationAge: 90,             // Days - skills not used in 90 days are deprecated

  // Scoring weights (must sum to 1.0)
  scoreWeights: {
    usage: 0.4,        // 40% - How much is it used?
    expertise: 0.25,   // 25% - How complex/valuable is it?
    health: 0.2,       // 20% - Documentation, maintenance quality
    performance: 0.15  // 15% - Speed, efficiency
  },

  // Report settings
  reportFormat: 'json' as const,
  includeRecommendations: true,
  topSkillsCount: 10
};

export type SVIEConfig = typeof svieConfig;
