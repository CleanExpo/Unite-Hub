/**
 * Z05 Adoption Signals Model
 * Defines adoption dimensions, subdimensions, scoring thresholds, and signals
 * Pure, deterministic model for testing and configuration
 */

/**
 * Adoption dimensions representing major feature areas
 */
export type GuardianAdoptionDimensionKey =
  | 'core'
  | 'ai_intelligence'
  | 'qa_chaos'
  | 'network_intelligence'
  | 'governance'
  | 'meta';

/**
 * Subdimensions for granular adoption tracking
 */
export type GuardianAdoptionSubDimensionKey =
  | 'rules_usage'
  | 'incidents_workflow'
  | 'risk_usage'
  | 'ai_features'
  | 'playbook_usage'
  | 'simulation_runs'
  | 'qa_coverage'
  | 'incident_drills'
  | 'network_console'
  | 'early_warnings'
  | 'recommendations'
  | 'uplift_tasks'
  | 'readiness_checks'
  | 'executive_reports'
  | 'governance_events';

/**
 * Adoption status levels (same scale as Z01-Z04)
 */
export type GuardianAdoptionStatus = 'inactive' | 'light' | 'regular' | 'power';

/**
 * Individual metric signal
 */
export interface GuardianAdoptionSignal {
  metricKey: string; // e.g., 'rules_count_30d', 'simulation_runs_7d'
  value: number; // aggregated count, not raw data
  windowDays: number; // lookback window (7, 30, 90)
  description?: string;
}

/**
 * Adoption score definition (configuration for a dimension/subdimension)
 */
export interface GuardianAdoptionScoreDefinition {
  dimension: GuardianAdoptionDimensionKey;
  subDimension: GuardianAdoptionSubDimensionKey;
  label: string; // human-readable label
  description: string; // explanation of this metric
  weight: number; // 0..1, relative importance
  thresholds: {
    inactive: number; // score < this → inactive (default: 0)
    light: number; // score < this → light (default: 25)
    regular: number; // score < this → regular (default: 60)
    power: number; // score >= this → power (default: 85)
  };
  category: string; // 'onboarding', 'activation', 'expansion', 'habit', 'health'
}

/**
 * Canonical adoption score definitions
 * Maps each dimension/subdimension to metrics and thresholds
 */
export const ADOPTION_SCORE_DEFS: GuardianAdoptionScoreDefinition[] = [
  // ===========================================================================
  // CORE: Rule engine, alert management, incident response
  // ===========================================================================
  {
    dimension: 'core',
    subDimension: 'rules_usage',
    label: 'Rules Engine Adoption',
    description: 'Adoption of rule creation, editing, and management',
    weight: 1.0,
    category: 'onboarding',
    thresholds: {
      inactive: 0,
      light: 20, // Few or no rules
      regular: 50, // Moderate rule usage
      power: 80, // Heavy rule creation and management
    },
  },
  {
    dimension: 'core',
    subDimension: 'incidents_workflow',
    label: 'Incident Management Workflow',
    description: 'Adoption of incident tracking, correlation, and response',
    weight: 1.0,
    category: 'activation',
    thresholds: {
      inactive: 0,
      light: 25,
      regular: 55,
      power: 85,
    },
  },
  {
    dimension: 'core',
    subDimension: 'risk_usage',
    label: 'Risk Engine Adoption',
    description: 'Risk scoring, monitoring, and analysis usage',
    weight: 0.8,
    category: 'expansion',
    thresholds: {
      inactive: 0,
      light: 30,
      regular: 60,
      power: 90,
    },
  },

  // ===========================================================================
  // AI_INTELLIGENCE: AI features, playbooks, auto-remediation
  // ===========================================================================
  {
    dimension: 'ai_intelligence',
    subDimension: 'ai_features',
    label: 'AI Features Adoption',
    description: 'Usage of AI-powered rule suggestions, investigations, playbooks',
    weight: 0.9,
    category: 'expansion',
    thresholds: {
      inactive: 0,
      light: 20,
      regular: 50,
      power: 80,
    },
  },
  {
    dimension: 'ai_intelligence',
    subDimension: 'playbook_usage',
    label: 'Playbook Management',
    description: 'Playbook creation, execution, and ai-generated playbooks',
    weight: 1.0,
    category: 'habit',
    thresholds: {
      inactive: 0,
      light: 25,
      regular: 55,
      power: 85,
    },
  },

  // ===========================================================================
  // QA_CHAOS: Simulation, chaos testing, coverage tracking
  // ===========================================================================
  {
    dimension: 'qa_chaos',
    subDimension: 'simulation_runs',
    label: 'Simulation Engine Usage',
    description: 'Simulation scenario creation and execution frequency',
    weight: 1.0,
    category: 'activation',
    thresholds: {
      inactive: 0, // No simulations
      light: 15, // Occasional runs
      regular: 45, // Regular simulation testing
      power: 75, // Frequent, structured simulation program
    },
  },
  {
    dimension: 'qa_chaos',
    subDimension: 'qa_coverage',
    label: 'QA Coverage & Baseline Health',
    description: 'Coverage score tracking and baseline drift management',
    weight: 1.0,
    category: 'habit',
    thresholds: {
      inactive: 0, // No baselines or coverage tracking
      light: 30, // Basic baseline exists
      regular: 60, // Regular coverage snapshots, monitored drift
      power: 85, // Comprehensive coverage, aggressive drift management
    },
  },
  {
    dimension: 'qa_chaos',
    subDimension: 'incident_drills',
    label: 'Incident Drill Practice',
    description: 'Frequency and participation in incident war games and drills',
    weight: 0.8,
    category: 'health',
    thresholds: {
      inactive: 0,
      light: 20,
      regular: 50,
      power: 80,
    },
  },

  // ===========================================================================
  // NETWORK_INTELLIGENCE: Network telemetry, anomalies, early warnings, console
  // ===========================================================================
  {
    dimension: 'network_intelligence',
    subDimension: 'network_console',
    label: 'Network Console Engagement',
    description: 'Usage of network console for monitoring and investigation',
    weight: 0.9,
    category: 'activation',
    thresholds: {
      inactive: 0,
      light: 20,
      regular: 50,
      power: 80,
    },
  },
  {
    dimension: 'network_intelligence',
    subDimension: 'early_warnings',
    label: 'Early Warning Signal Engagement',
    description: 'Acknowledgment and response to network early warning alerts',
    weight: 1.0,
    category: 'habit',
    thresholds: {
      inactive: 0, // No acknowledgments
      light: 25, // Few acknowledged
      regular: 60, // Most acknowledged, some actioned
      power: 90, // Proactive engagement with warnings
    },
  },
  {
    dimension: 'network_intelligence',
    subDimension: 'recommendations',
    label: 'Network Recommendations Engagement',
    description: 'Implementation of network-driven recommendations',
    weight: 1.0,
    category: 'expansion',
    thresholds: {
      inactive: 0,
      light: 30,
      regular: 65,
      power: 90,
    },
  },

  // ===========================================================================
  // GOVERNANCE: Feature flags, compliance, policy management
  // ===========================================================================
  {
    dimension: 'governance',
    subDimension: 'governance_events',
    label: 'Governance & Policy Management',
    description: 'Network feature flag management and governance events',
    weight: 0.7,
    category: 'health',
    thresholds: {
      inactive: 0,
      light: 25,
      regular: 60,
      power: 85,
    },
  },

  // ===========================================================================
  // META: Z01-Z04 adoption (readiness, uplift, editions, reports)
  // ===========================================================================
  {
    dimension: 'meta',
    subDimension: 'readiness_checks',
    label: 'Readiness Monitoring',
    description: 'Regular readiness assessments and capability tracking',
    weight: 0.8,
    category: 'onboarding',
    thresholds: {
      inactive: 0,
      light: 30,
      regular: 65,
      power: 90,
    },
  },
  {
    dimension: 'meta',
    subDimension: 'uplift_tasks',
    label: 'Uplift Plan Engagement',
    description: 'Completion of adoption playbooks and uplift tasks',
    weight: 1.0,
    category: 'habit',
    thresholds: {
      inactive: 0, // No tasks or plans
      light: 25, // Minimal task completion
      regular: 60, // Active uplift plan with good progress
      power: 85, // Multiple completed plans
    },
  },
  {
    dimension: 'meta',
    subDimension: 'executive_reports',
    label: 'Executive Reporting Usage',
    description: 'Generation and review of executive Guardian reports',
    weight: 0.8,
    category: 'habit',
    thresholds: {
      inactive: 0,
      light: 20,
      regular: 55,
      power: 85,
    },
  },
];

/**
 * Classify adoption score to status bucket
 * Determines which adoption level a score falls into
 */
export function classifyAdoptionStatus(
  score: number,
  thresholds: GuardianAdoptionScoreDefinition['thresholds']
): GuardianAdoptionStatus {
  if (score < thresholds.light) return 'inactive';
  if (score < thresholds.regular) return 'light';
  if (score < thresholds.power) return 'regular';
  return 'power';
}

/**
 * Get definition for a specific dimension/subdimension
 */
export function getAdoptionDefinition(
  dimension: GuardianAdoptionDimensionKey,
  subDimension: GuardianAdoptionSubDimensionKey
): GuardianAdoptionScoreDefinition | null {
  return (
    ADOPTION_SCORE_DEFS.find(
      (d) => d.dimension === dimension && d.subDimension === subDimension
    ) || null
  );
}

/**
 * Get all definitions for a dimension
 */
export function getAdoptionDefinitionsForDimension(
  dimension: GuardianAdoptionDimensionKey
): GuardianAdoptionScoreDefinition[] {
  return ADOPTION_SCORE_DEFS.filter((d) => d.dimension === dimension);
}

/**
 * Get all unique dimensions
 */
export function getAllAdoptionDimensions(): GuardianAdoptionDimensionKey[] {
  const dimensions = new Set(ADOPTION_SCORE_DEFS.map((d) => d.dimension));
  return Array.from(dimensions) as GuardianAdoptionDimensionKey[];
}
