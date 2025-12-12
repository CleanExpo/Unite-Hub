/**
 * Guardian H05: H-Series Enablement Planner
 * Generates deterministic 7-stage rollout plans for H01-H04 safe enablement
 * PII-free, advisory-only, fully deterministic (no randomness)
 */

import { HSeriesRolloutState } from './hSeriesRolloutState';

export interface EnablementStage {
  index: number;
  name: string;
  description: string;
  prerequisites: string[];
  actions: {
    actionKey: string;
    description: string;
    details: Record<string, unknown>;
  }[];
  riskNotes: string[];
  rollbackPointers: string[];
  expectedDurationMinutes: number;
}

export interface EnablementPlan {
  schemaVersion: string;
  generatedAt: string;
  tenantScoped: true;
  currentStage: string;
  targetStage: string;
  stages: EnablementStage[];
  totalDurationMinutes: number;
  warnings: string[];
}

/**
 * Generate 7-stage enablement plan (fully deterministic)
 */
export function generateEnablementPlan(state: HSeriesRolloutState): EnablementPlan {
  const generatedAt = new Date().toISOString();
  const warnings = [...state.warnings];
  const currentStage = state.recommendedNextStage;
  const targetStage = 'stage_7_optimization_and_scaling';

  // Build all 7 stages (deterministic, no randomness)
  const stages: EnablementStage[] = [
    buildStage1GovernanceBaseline(state, warnings),
    buildStage2H01RulesOnly(state, warnings),
    buildStage3H01H02Anomalies(state, warnings),
    buildStage4H03Correlation(state, warnings),
    buildStage5H04IncidentScoring(state, warnings),
    buildStage6FullHSeriesActive(state, warnings),
    buildStage7OptimizationAndScaling(state, warnings),
  ];

  // Calculate total duration
  const totalDurationMinutes = stages.reduce((sum, s) => sum + s.expectedDurationMinutes, 0);

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    tenantScoped: true,
    currentStage,
    targetStage,
    stages,
    totalDurationMinutes,
    warnings,
  };
}

/**
 * Stage 1: Governance Baseline
 * Establish Z10 governance foundation (Z15 backup, Z16 validation, Z10 policies)
 */
function buildStage1GovernanceBaseline(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  // Ensure Z15 backup policy is enabled
  if (!state.z10Governance.backupPolicy) {
    actions.push({
      actionKey: 'enable_z10_backup_policy',
      description: 'Enable Z10 backup policy (required for rollback safety)',
      details: {
        flagKey: 'backup_policy',
        targetValue: true,
      },
    });
  }

  // Ensure Z16 validation gate is enabled
  if (!state.z10Governance.validationGatePolicy) {
    actions.push({
      actionKey: 'enable_z10_validation_gate_policy',
      description: 'Enable Z10 validation gate policy (ensures quality checks)',
      details: {
        flagKey: 'validation_gate_policy',
        targetValue: true,
      },
    });
  }

  // Default: AI disabled at this stage (conservative)
  if (state.z10Governance.aiUsagePolicy) {
    actions.push({
      actionKey: 'disable_z10_ai_usage_policy',
      description: 'Temporarily disable AI usage policy (will enable in later stages)',
      details: {
        flagKey: 'ai_usage_policy',
        targetValue: false,
      },
    });
  }

  // Create initial Z13 validation schedule
  actions.push({
    actionKey: 'create_z13_validation_schedule',
    description: 'Create Z13 validation schedule for health checks',
    details: {
      taskType: 'readiness_evaluation',
      frequency: 'daily',
      scheduleConfig: {
        enabled: true,
        checkBackupHealth: true,
        checkValidationResults: true,
      },
    },
  });

  // Capture baseline Z14 status snapshot
  actions.push({
    actionKey: 'capture_z14_baseline_snapshot',
    description: 'Capture Z14 baseline status snapshot (before H-series)',
    details: {
      snapshotScope: ['governance', 'automation', 'validation'],
      snapshotLabel: 'pre_h_series_baseline',
    },
  });

  return {
    index: 1,
    name: 'Governance Baseline',
    description:
      'Establish Z10/Z13/Z14/Z15/Z16 governance foundation. No H-series features enabled yet. Focus: backup, validation, audit readiness.',
    prerequisites: [],
    actions,
    riskNotes: [
      'Low risk: Only governance flags and audit schedules modified',
      'No production Guardian behavior changed',
      'Easily reversible (Z15 rollback available)',
    ],
    rollbackPointers: [
      'Revert Z10 flags to original values',
      'Delete Z13 validation schedule',
      'Restore Z14 snapshot from backup',
    ],
    expectedDurationMinutes: 15,
  };
}

/**
 * Stage 2: H01 Rules Only
 * Enable H01 rule suggestion (lowest impact H-series feature)
 */
function buildStage2H01RulesOnly(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  if (!state.hSeriesPresence.h01RuleSuggestion) {
    actions.push({
      actionKey: 'enable_h01_rule_suggestion',
      description: 'Enable H01 AI rule suggestion (advisory alerts on rule patterns)',
      details: {
        h01Enabled: true,
        readTables: ['alerts', 'rules'],
        mode: 'advisory_only',
      },
    });
  }

  // Create Z13 schedule for H01 evaluations
  actions.push({
    actionKey: 'create_h01_z13_schedule',
    description: 'Create Z13 schedule for H01 rule evaluations',
    details: {
      taskType: 'readiness_evaluation',
      frequency: 'daily',
      focusArea: 'h01_rule_suggestions',
    },
  });

  // Capture H01 activation Z14 snapshot
  actions.push({
    actionKey: 'capture_h01_activation_snapshot',
    description: 'Capture Z14 snapshot after H01 enablement',
    details: {
      snapshotScope: ['h01_metrics', 'rule_suggestion_count', 'adoption_rate'],
    },
  });

  return {
    index: 2,
    name: 'H01 Rules Only',
    description: 'Enable H01 AI rule suggestion. Lowest-impact H-series feature (read-only, advisory-only). Monitor for 1-2 days before proceeding.',
    prerequisites: ['Stage 1 complete: Governance baseline established', 'Z15 backup policy enabled', 'Z16 validation gate enabled'],
    actions,
    riskNotes: [
      'Low risk: H01 is read-only and advisory (never modifies rules)',
      'No breaking changes to existing rule systems',
      'Users must manually adopt suggestions',
      'Monitor: Rule suggestion count and operator adoption',
    ],
    rollbackPointers: [
      'Disable H01 flag',
      'Delete H01 Z13 schedule',
      'Restore from Z15 backup if needed',
    ],
    expectedDurationMinutes: 30,
  };
}

/**
 * Stage 3: H01 + H02 Anomalies
 * Add H02 anomaly detection (baseline-only, no alerts yet)
 */
function buildStage3H01H02Anomalies(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  if (!state.hSeriesPresence.h02AnomalyDetection) {
    actions.push({
      actionKey: 'enable_h02_anomaly_detection',
      description: 'Enable H02 anomaly detection (collects baselines, generates event snapshots)',
      details: {
        h02Enabled: true,
        baselinesLookbackDays: 30,
        detectionMode: 'snapshot_only',
        aiAnomalyExplainer: false, // No AI explanations at this stage
      },
    });
  }

  // Create H02 baseline collection schedule
  actions.push({
    actionKey: 'create_h02_z13_schedule',
    description: 'Create Z13 schedule for H02 baseline collection',
    details: {
      taskType: 'readiness_evaluation',
      frequency: 'daily',
      focusArea: 'h02_anomaly_baselines',
    },
  });

  // Run Z16 validation to confirm H02 health
  actions.push({
    actionKey: 'run_z16_validation',
    description: 'Run Z16 validation to confirm H02 baselines are healthy',
    details: {
      validationLevel: 'h02_specific',
      checkForAnomalyCorruption: true,
    },
  });

  actions.push({
    actionKey: 'capture_h02_activation_snapshot',
    description: 'Capture Z14 snapshot after H02 enablement',
    details: {
      snapshotScope: ['h02_metrics', 'baseline_count', 'event_snapshot_count'],
    },
  });

  return {
    index: 3,
    name: 'H01 + H02 Anomalies',
    description:
      'Enable H02 anomaly detection (baseline collection and event snapshots). No anomaly alerts generated yet. Focus: baseline quality and event capture.',
    prerequisites: [
      'Stage 2 complete: H01 rules enabled and monitored',
      'H01 adoption confirmed (at least 2 days of data)',
      'Z13 H01 schedule running successfully',
    ],
    actions,
    riskNotes: [
      'Medium risk: H02 reads from alert tables (high volume)',
      'Baselines collected over 30 days (no immediate actions)',
      'Event snapshots created (aggregate-only, no PII)',
      'Monitor: Baseline data quality, false negative risk',
    ],
    rollbackPointers: [
      'Disable H02 flag',
      'Delete H02 Z13 schedule',
      'Purge H02 baselines and snapshots',
      'Restore from Z15 backup if data corrupted',
    ],
    expectedDurationMinutes: 45,
  };
}

/**
 * Stage 4: H01 + H02 + H03 Correlation
 * Add H03 correlation refinement (cluster-based recommendations)
 */
function buildStage4H03Correlation(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  if (!state.hSeriesPresence.h03CorrelationRefinement) {
    actions.push({
      actionKey: 'enable_h03_correlation_refinement',
      description: 'Enable H03 correlation refinement (cluster detection and recommendations)',
      details: {
        h03Enabled: true,
        clusteringMode: 'heuristic_only', // No AI at this stage
        correlationThreshold: 0.75,
      },
    });
  }

  // Create H03 clustering schedule
  actions.push({
    actionKey: 'create_h03_z13_schedule',
    description: 'Create Z13 schedule for H03 correlation evaluation',
    details: {
      taskType: 'readiness_evaluation',
      frequency: 'every_6_hours',
      focusArea: 'h03_correlation_clusters',
    },
  });

  // Run Z16 validation for H03
  actions.push({
    actionKey: 'run_z16_validation_h03',
    description: 'Run Z16 validation to confirm H03 clustering quality',
    details: {
      validationLevel: 'h03_specific',
      checkForClusteringAnomalies: true,
    },
  });

  actions.push({
    actionKey: 'capture_h03_activation_snapshot',
    description: 'Capture Z14 snapshot after H03 enablement',
    details: {
      snapshotScope: ['h03_metrics', 'cluster_count', 'noisy_cluster_percentage'],
    },
  });

  return {
    index: 4,
    name: 'H01 + H02 + H03 Correlation',
    description:
      'Enable H03 correlation refinement. Detects alert clusters, generates heuristic recommendations (no AI). Focus: cluster quality and noise filtering.',
    prerequisites: [
      'Stage 3 complete: H02 anomalies enabled and baseline collected',
      'H02 baselines populated (at least 30 days data)',
      'Z13 H02 schedule running successfully',
      'Z16 validation passed for H02',
    ],
    actions,
    riskNotes: [
      'Medium-high risk: H03 correlates alerts (complex heuristics)',
      'Cluster quality depends on H02 baseline health',
      'Noisy cluster filtering may need tuning',
      'Monitor: Cluster precision, recall, false positive rate',
    ],
    rollbackPointers: [
      'Disable H03 flag',
      'Delete H03 Z13 schedule',
      'Purge H03 clusters and recommendations',
      'Revert H03 configuration if tuning needed',
    ],
    expectedDurationMinutes: 60,
  };
}

/**
 * Stage 5: H01 + H02 + H03 + H04 Incident Scoring
 * Add H04 incident scoring and triage queue
 */
function buildStage5H04IncidentScoring(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  if (!state.hSeriesPresence.h04IncidentScoring) {
    actions.push({
      actionKey: 'enable_h04_incident_scoring',
      description: 'Enable H04 incident scoring (heuristic scoring + triage queue)',
      details: {
        h04Enabled: true,
        scoringModel: 'heuristic_7_component',
        triageQueueEnabled: true,
        aiExplainer: false, // No AI explanations at this stage
      },
    });
  }

  // Create H04 scoring schedule
  actions.push({
    actionKey: 'create_h04_z13_schedule',
    description: 'Create Z13 schedule for H04 incident scoring',
    details: {
      taskType: 'incident_scoring_run',
      frequency: 'every_4_hours',
      config: {
        lookbackHours: 24,
        maxIncidents: 100,
      },
    },
  });

  // Run Z16 validation for H04
  actions.push({
    actionKey: 'run_z16_validation_h04',
    description: 'Run Z16 validation to confirm H04 scoring health',
    details: {
      validationLevel: 'h04_specific',
      checkForScoringAnomalies: true,
    },
  });

  actions.push({
    actionKey: 'capture_h04_activation_snapshot',
    description: 'Capture Z14 snapshot after H04 enablement',
    details: {
      snapshotScope: ['h04_metrics', 'scored_incidents_count', 'triage_queue_size', 'score_distribution'],
    },
  });

  return {
    index: 5,
    name: 'H01 + H02 + H03 + H04 Incident Scoring',
    description:
      'Enable H04 incident scoring and triage queue. All H-series features now active (heuristic mode). Prepare for optional AI enablement.',
    prerequisites: [
      'Stage 4 complete: H03 correlation enabled and clusters generated',
      'H03 clustering quality validated (cluster precision > 70%)',
      'Z13 H03 schedule running successfully',
      'Z16 validation passed for H03',
    ],
    actions,
    riskNotes: [
      'Medium risk: H04 reads from incidents, alerts, rules (all tables)',
      'Triage queue is non-breaking (advisory-only updates)',
      'Scoring is fully deterministic (no randomness)',
      'Monitor: Score distribution, triage queue growth, scoring latency',
    ],
    rollbackPointers: [
      'Disable H04 flag',
      'Delete H04 Z13 schedule',
      'Purge H04 scores and triage entries',
      'Restore from Z15 backup if data corrupted',
    ],
    expectedDurationMinutes: 90,
  };
}

/**
 * Stage 6: Full H-Series Active
 * Enable optional AI explanations and optional AI coach (gated by Z10 policy)
 */
function buildStage6FullHSeriesActive(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  // Enable AI usage policy (now safe with heuristics as fallback)
  if (!state.z10Governance.aiUsagePolicy) {
    actions.push({
      actionKey: 'enable_z10_ai_usage_policy',
      description: 'Enable Z10 AI usage policy (AI explanations now available)',
      details: {
        flagKey: 'ai_usage_policy',
        targetValue: true,
      },
    });
  }

  // Create governance coach audit schedule
  actions.push({
    actionKey: 'create_governance_coach_schedule',
    description: 'Create Z13 schedule for governance coach audit sessions',
    details: {
      taskType: 'governance_coach_audit_session',
      frequency: 'weekly',
      coachMode: 'operator',
    },
  });

  // Run comprehensive Z16 validation
  actions.push({
    actionKey: 'run_z16_comprehensive_validation',
    description: 'Run comprehensive Z16 validation across all H-series features',
    details: {
      validationLevel: 'comprehensive',
      checkAllHSeriesTables: true,
    },
  });

  actions.push({
    actionKey: 'capture_h_series_full_activation_snapshot',
    description: 'Capture Z14 snapshot for full H-series activation',
    details: {
      snapshotScope: ['all_h_series', 'ai_status', 'full_system_health'],
    },
  });

  return {
    index: 6,
    name: 'Full H-Series Active',
    description:
      'All H-series features active with optional AI explanations enabled. Transition to optimization phase. Set up continuous health monitoring.',
    prerequisites: [
      'Stage 5 complete: H04 incident scoring operational',
      'H04 scoring validated (triage queue populating correctly)',
      'All Z13 schedules running without errors',
      'Z16 validation passed for all H-series features',
      'All H-series data metrics within expected ranges',
    ],
    actions,
    riskNotes: [
      'Medium risk: AI explanations now active (governed by Z10 policy)',
      'All H-series features working in concert',
      'Continuous validation required (Z16 running)',
      'Monitor: System latency, AI explanation quality, user adoption',
    ],
    rollbackPointers: [
      'Disable Z10 AI usage policy',
      'Delete governance coach schedule',
      'Disable individual H-series features if needed',
      'Restore from Z15 backup for major rollback',
    ],
    expectedDurationMinutes: 120,
  };
}

/**
 * Stage 7: Optimization and Scaling
 * Fine-tune weights, expand automation, prepare for production scaling
 */
function buildStage7OptimizationAndScaling(state: HSeriesRolloutState, warnings: string[]): EnablementStage {
  const actions = [];

  // Enable external sharing policy (safe after full H-series optimization)
  if (!state.z10Governance.externalSharingPolicy) {
    actions.push({
      actionKey: 'enable_z10_external_sharing_policy',
      description: 'Enable Z10 external sharing policy (export bundles for CS/exec)',
      details: {
        flagKey: 'external_sharing_policy',
        targetValue: true,
      },
    });
  }

  // Create Z11 export bundle schedule
  actions.push({
    actionKey: 'create_z11_export_schedule',
    description: 'Create Z13 schedule for Z11 export bundle generation',
    details: {
      taskType: 'export_bundle_generation',
      frequency: 'weekly',
      bundleScopes: ['readiness', 'uplift', 'adoption', 'governance'],
    },
  });

  // Scale Z13 schedules for production load
  actions.push({
    actionKey: 'scale_z13_schedules',
    description: 'Adjust Z13 schedule frequencies for production load',
    details: {
      h01Schedule: { frequency: 'every_6_hours', enabled: true },
      h02Schedule: { frequency: 'daily', enabled: true },
      h03Schedule: { frequency: 'every_4_hours', enabled: true },
      h04Schedule: { frequency: 'every_2_hours', enabled: true },
    },
  });

  // Establish continuous Z16 validation
  actions.push({
    actionKey: 'establish_continuous_validation',
    description: 'Establish continuous Z16 validation (every 6 hours)',
    details: {
      validationFrequency: 'every_6_hours',
      validationScope: 'comprehensive',
      alertOnFailure: true,
    },
  });

  // Create executive readiness report schedule
  actions.push({
    actionKey: 'create_executive_reporting',
    description: 'Create Z14 executive status reports (for leadership)',
    details: {
      reportingFrequency: 'weekly',
      includeMetrics: ['h_series_adoption', 'incident_resolution_time', 'ai_accuracy'],
      reportingAudience: 'leadership',
    },
  });

  actions.push({
    actionKey: 'capture_optimization_baseline',
    description: 'Capture Z14 optimization baseline snapshot',
    details: {
      snapshotScope: ['all_h_series', 'adoption_metrics', 'performance_metrics', 'quality_metrics'],
    },
  });

  return {
    index: 7,
    name: 'Optimization and Scaling',
    description:
      'Fine-tune H-series weights, expand automation coverage, establish executive reporting. Production-ready and continuously improving.',
    prerequisites: [
      'Stage 6 complete: Full H-series active with AI explanations',
      'All H-series features stable for 1+ week',
      'Z13 schedules running without errors',
      'Z16 validation passing consistently',
      'User adoption metrics positive',
    ],
    actions,
    riskNotes: [
      'Low risk: Optimization phase (no breaking changes)',
      'Focus: Tuning weights and automation based on real data',
      'External sharing policy enables Z11 exports',
      'Monitor: Production metrics, user adoption, system stability',
    ],
    rollbackPointers: [
      'Adjust Z13 schedule frequencies back to Stage 6 settings',
      'Disable external sharing if data privacy concerns arise',
      'Disable individual optimizations without full rollback',
    ],
    expectedDurationMinutes: 150,
  };
}
