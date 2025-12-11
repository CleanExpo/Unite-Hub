/**
 * Guardian Z02: Uplift Playbook Model
 *
 * Defines static playbook templates that match readiness gaps and
 * recommendation patterns to suggested adoption tasks.
 */

import { GuardianCapabilityReadinessResult } from './readinessComputationService';

/**
 * Trigger conditions for a playbook
 */
export interface GuardianUpliftPlaybookTrigger {
  capabilityKey?: string;
  minScore?: number;
  maxScore?: number;
  readinessStatus?: 'not_configured' | 'partial' | 'ready' | 'advanced';
  recommendationType?: string;
  suggestionTheme?: string;
  category?: 'core' | 'ai_intelligence' | 'qa_chaos' | 'network_intelligence' | 'governance';
}

/**
 * Task template within a playbook
 */
export interface GuardianUpliftPlaybookTaskTemplate {
  title: string;
  description: string;
  category: 'core' | 'ai_intelligence' | 'qa_chaos' | 'network_intelligence' | 'governance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  effortEstimate?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  capabilityKey?: string;
  hints?: Record<string, unknown>;
  linkTargets?: Array<{
    module: string;
    route: string;
    label: string;
  }>;
}

/**
 * Playbook definition
 */
export interface GuardianUpliftPlaybook {
  id: string;
  name: string;
  description: string;
  triggers: GuardianUpliftPlaybookTrigger[];
  tasks: GuardianUpliftPlaybookTaskTemplate[];
}

/**
 * Canonical uplift playbooks
 */
export const UPLIFT_PLAYBOOKS: GuardianUpliftPlaybook[] = [
  {
    id: 'baseline-to-operational',
    name: 'Baseline to Operational: Core Rule Foundation',
    description: 'Build core rule engine and alert channels to move from baseline to operational Guardian maturity.',
    triggers: [
      {
        capabilityKey: 'guardian.core.rules',
        maxScore: 50,
        category: 'core',
      },
      {
        capabilityKey: 'guardian.core.alerts',
        maxScore: 50,
        category: 'core',
      },
    ],
    tasks: [
      {
        title: 'Define core rules for your primary services',
        description: 'Create rule templates for the top 3–5 critical metrics/services in your infrastructure.',
        category: 'core',
        priority: 'critical',
        effortEstimate: 'M',
        capabilityKey: 'guardian.core.rules',
        hints: {
          count_target: '5-10 active rules',
          topics: ['error rates', 'latency', 'throughput', 'resource utilization'],
        },
        linkTargets: [
          {
            module: 'Guardian Rules',
            route: '/guardian/rules',
            label: 'Go to Rule Editor',
          },
        ],
      },
      {
        title: 'Configure alert notification channels',
        description: 'Set up at least one reliable alert channel (Slack, PagerDuty, email, webhook).',
        category: 'core',
        priority: 'critical',
        effortEstimate: 'S',
        capabilityKey: 'guardian.core.alerts',
        hints: {
          channels: ['Slack integration', 'PagerDuty escalation', 'Email digest'],
        },
        linkTargets: [
          {
            module: 'Guardian Alerts',
            route: '/guardian/alerts/channels',
            label: 'Configure Channels',
          },
        ],
      },
      {
        title: 'Create incident severity levels and response procedures',
        description: 'Define what constitutes critical, high, medium, and low incidents; establish basic runbooks.',
        category: 'core',
        priority: 'high',
        effortEstimate: 'M',
        capabilityKey: 'guardian.core.incidents',
        hints: {
          structure: ['Define 4 severity levels', 'Create basic response steps', 'Assign initial owners'],
        },
        linkTargets: [
          {
            module: 'Guardian Incidents',
            route: '/guardian/incidents/settings',
            label: 'Incident Configuration',
          },
        ],
      },
    ],
  },

  {
    id: 'operational-to-mature',
    name: 'Operational to Mature: Add Risk Scoring & QA Testing',
    description: 'Enable risk engine and QA simulation to enhance Guardian confidence and validation.',
    triggers: [
      {
        capabilityKey: 'guardian.core.risk',
        maxScore: 60,
        category: 'core',
      },
      {
        capabilityKey: 'guardian.qa.i_series.simulation',
        maxScore: 50,
        category: 'qa_chaos',
      },
    ],
    tasks: [
      {
        title: 'Enable and calibrate the risk scoring engine',
        description: 'Activate risk engine to score incidents by impact and urgency. Calibrate risk thresholds for your environment.',
        category: 'core',
        priority: 'high',
        effortEstimate: 'M',
        capabilityKey: 'guardian.core.risk',
        hints: {
          steps: [
            'Enable risk engine in Guardian settings',
            'Configure risk weights (e.g., customer impact vs. system impact)',
            'Review first week of risk scores and adjust as needed',
          ],
        },
        linkTargets: [
          {
            module: 'Guardian Risk',
            route: '/guardian/risk/settings',
            label: 'Risk Engine Configuration',
          },
        ],
      },
      {
        title: 'Create and run your first simulation tests',
        description: 'Simulate rule firing to validate that your rules detect realistic issues without false positives.',
        category: 'qa_chaos',
        priority: 'high',
        effortEstimate: 'M',
        capabilityKey: 'guardian.qa.i_series.simulation',
        hints: {
          count_target: '3-5 simulation runs covering top rules',
          topics: ['Error spike simulation', 'Latency surge test', 'Resource exhaustion scenario'],
        },
        linkTargets: [
          {
            module: 'Guardian QA Studio',
            route: '/guardian/qa/simulation',
            label: 'Simulation & Testing',
          },
        ],
      },
      {
        title: 'Build regression test packs',
        description: 'Combine multiple simulations into regression packs to run before rule deployments.',
        category: 'qa_chaos',
        priority: 'medium',
        effortEstimate: 'M',
        capabilityKey: 'guardian.qa.i_series.simulation',
        hints: {
          pack_structure: ['Golden path (all rules fire correctly)', 'Edge cases (no false positives)', 'Performance (alert latency < 1s)'],
        },
        linkTargets: [
          {
            module: 'Guardian QA Studio',
            route: '/guardian/qa/regression',
            label: 'Regression Packs',
          },
        ],
      },
    ],
  },

  {
    id: 'mature-to-network-intelligent',
    name: 'Mature to Network-Intelligent: Enable X-Series Peer Intelligence',
    description: 'Activate X-series network intelligence to leverage cohort benchmarks, anomaly detection, and early warnings.',
    triggers: [
      {
        capabilityKey: 'guardian.network.x01_telemetry',
        maxScore: 50,
        category: 'network_intelligence',
      },
      {
        capabilityKey: 'guardian.network.x02_anomalies',
        maxScore: 50,
        category: 'network_intelligence',
      },
      {
        capabilityKey: 'guardian.network.x03_early_warnings',
        maxScore: 50,
        category: 'network_intelligence',
      },
    ],
    tasks: [
      {
        title: 'Enable network telemetry collection',
        description: 'Opt into X-series network telemetry to share anonymized metrics with peer cohorts. View benchmarks for your infrastructure metrics.',
        category: 'network_intelligence',
        priority: 'high',
        effortEstimate: 'S',
        capabilityKey: 'guardian.network.x01_telemetry',
        hints: {
          privacy: 'All metrics anonymized; no cross-tenant data sharing',
          benefits: ['See peer error rates', 'Compare latency percentiles', 'Identify unusual patterns early'],
        },
        linkTargets: [
          {
            module: 'Network Console',
            route: '/guardian/admin/network',
            label: 'Network Intelligence',
          },
        ],
      },
      {
        title: 'Review and act on anomaly detections',
        description: 'Monitor X02 anomaly detections. These identify metrics that diverge from your cohort peers.',
        category: 'network_intelligence',
        priority: 'medium',
        effortEstimate: 'M',
        capabilityKey: 'guardian.network.x02_anomalies',
        hints: {
          review_cadence: 'Weekly anomaly digest',
          actions: ['Tighten thresholds if alert-volume is above peer average', 'Relax thresholds if below average', 'Investigate sustained anomalies'],
        },
        linkTargets: [
          {
            module: 'Network Console',
            route: '/guardian/admin/network',
            label: 'View Anomalies',
          },
        ],
      },
      {
        title: 'Operationalize early-warning signals',
        description: 'X03 early warnings predict emerging issues based on cohort patterns. Assign team members to acknowledge and action warnings.',
        category: 'network_intelligence',
        priority: 'medium',
        effortEstimate: 'M',
        capabilityKey: 'guardian.network.x03_early_warnings',
        hints: {
          process: ['Triage warnings by pattern type', 'Verify with your metrics', 'Update rules or runbooks based on insights'],
        },
        linkTargets: [
          {
            module: 'Network Console',
            route: '/guardian/admin/network',
            label: 'Early Warnings Dashboard',
          },
        ],
      },
      {
        title: 'Act on network recommendations',
        description: 'Review X06 recommendations derived from network intelligence. These suggest rule tuning, playbook exercises, and QA focus areas.',
        category: 'network_intelligence',
        priority: 'medium',
        effortEstimate: 'M',
        hints: {
          types: ['Rule threshold tuning', 'Playbook drill exercises', 'QA coverage expansion', 'Performance optimization'],
        },
        linkTargets: [
          {
            module: 'Network Console',
            route: '/guardian/admin/network',
            label: 'Recommendations Tab',
          },
        ],
      },
    ],
  },

  {
    id: 'playbook-rehearsal-operationalization',
    name: 'Incident Response: Playbook Rehearsal & Automation',
    description: 'Automate and rehearse incident response playbooks to ensure team readiness.',
    triggers: [
      {
        capabilityKey: 'guardian.qa.i_series.playbook_rehearsal',
        maxScore: 50,
        category: 'qa_chaos',
      },
      {
        recommendationType: 'playbook_drill',
      },
    ],
    tasks: [
      {
        title: 'Document incident runbooks and playbooks',
        description: 'Create clear, step-by-step playbooks for your top 5 incident types (e.g., database outage, cache failure, load spike).',
        category: 'qa_chaos',
        priority: 'high',
        effortEstimate: 'L',
        hints: {
          sections: [
            'Detection (what metrics/alerts confirm this incident)',
            'Immediate response (first 5 minutes)',
            'Investigation (root cause finding)',
            'Recovery (restore service)',
            'Communication (notify stakeholders)',
          ],
        },
        linkTargets: [
          {
            module: 'Guardian Runbooks',
            route: '/guardian/playbooks',
            label: 'Playbook Management',
          },
        ],
      },
      {
        title: 'Schedule and run playbook rehearsals',
        description: 'Regularly rehearse playbooks in test environments or low-traffic periods to ensure team muscle memory.',
        category: 'qa_chaos',
        priority: 'high',
        effortEstimate: 'M',
        hints: {
          cadence: 'Monthly playbook drills',
          format: ['Tabletop (discussion)', 'Simulation (automation)', 'Post-incident review (learning)'],
        },
      },
      {
        title: 'Automate response steps where possible',
        description: 'Implement automated remediation for safe, idempotent actions (e.g., restarting services, scaling resources).',
        category: 'qa_chaos',
        priority: 'medium',
        effortEstimate: 'L',
        hints: {
          candidates: [
            'Auto-scale workloads on high load',
            'Restart service on repeated failures',
            'Route traffic away from degraded zones',
          ],
        },
      },
    ],
  },

  {
    id: 'recommendations-continuous-improvement',
    name: 'Continuous Improvement: Act on Network Recommendations',
    description: 'Review and implement recommendations from network intelligence to continuously refine Guardian configuration.',
    triggers: [
      {
        recommendationType: 'rule_tuning',
      },
      {
        recommendationType: 'qa_focus',
      },
      {
        recommendationType: 'performance_tuning',
      },
      {
        recommendationType: 'coverage_gap',
      },
    ],
    tasks: [
      {
        title: 'Prioritize and review open recommendations',
        description: 'Review X06 recommendations. Categorize by impact and effort. Assign owners.',
        category: 'network_intelligence',
        priority: 'medium',
        effortEstimate: 'M',
        hints: {
          process: [
            'List all open recommendations',
            'Grade by impact (low/medium/high)',
            'Estimate effort (XS/S/M/L/XL)',
            'Assign owner + due date',
          ],
        },
        linkTargets: [
          {
            module: 'Network Console',
            route: '/guardian/admin/network',
            label: 'Recommendations',
          },
        ],
      },
      {
        title: 'Implement rule threshold tuning recommendations',
        description: 'If X06 suggests tightening or relaxing alert thresholds, update your rules and test via simulation.',
        category: 'core',
        priority: 'high',
        effortEstimate: 'M',
        capabilityKey: 'guardian.core.rules',
        hints: {
          steps: ['Identify recommended threshold change', 'Update rule in staging', 'Run simulation to validate', 'Deploy to production'],
        },
      },
      {
        title: 'Expand QA coverage for identified gaps',
        description: 'If X06 recommends QA focus on specific rules, add regression test cases.',
        category: 'qa_chaos',
        priority: 'medium',
        effortEstimate: 'M',
        capabilityKey: 'guardian.qa.i_series.simulation',
        hints: {
          approach: [
            'Identify rules with low/no test coverage',
            'Design test scenarios covering normal + edge cases',
            'Add to regression pack',
            'Run with each rule update',
          ],
        },
      },
      {
        title: 'Monitor post-implementation impact',
        description: 'After implementing a recommendation, monitor its impact. Update readiness and plan as needed.',
        category: 'other',
        priority: 'low',
        effortEstimate: 'S',
        hints: {
          metrics: ['Alert volume reduction', 'False positive rate', 'MTTR improvement', 'Cohort position change'],
        },
      },
    ],
  },
];

/**
 * Match playbooks for readiness snapshot
 */
export function matchPlaybooksForReadiness(
  readinessResults: GuardianCapabilityReadinessResult[],
  overallScore: number
): GuardianUpliftPlaybook[] {
  const matched: GuardianUpliftPlaybook[] = [];

  for (const playbook of UPLIFT_PLAYBOOKS) {
    let isMatched = false;

    for (const trigger of playbook.triggers) {
      let triggerMatched = true;

      if (trigger.capabilityKey) {
        const result = readinessResults.find((r) => r.capabilityKey === trigger.capabilityKey);
        if (!result) {
          triggerMatched = false;
          continue;
        }

        if (trigger.minScore !== undefined && result.score < trigger.minScore) {
          triggerMatched = false;
          continue;
        }

        if (trigger.maxScore !== undefined && result.score > trigger.maxScore) {
          triggerMatched = false;
          continue;
        }

        if (trigger.readinessStatus && result.status !== trigger.readinessStatus) {
          triggerMatched = false;
          continue;
        }
      }

      if (triggerMatched) {
        isMatched = true;
        break;
      }
    }

    if (isMatched) {
      matched.push(playbook);
    }
  }

  return matched;
}

/**
 * Match playbooks for recommendations
 */
export function matchPlaybooksForRecommendations(
  recommendations: Array<{
    recommendationType?: string;
    suggestionTheme?: string;
  }>
): GuardianUpliftPlaybook[] {
  const matched: Set<GuardianUpliftPlaybook> = new Set();

  for (const rec of recommendations) {
    for (const playbook of UPLIFT_PLAYBOOKS) {
      for (const trigger of playbook.triggers) {
        if (trigger.recommendationType && rec.recommendationType === trigger.recommendationType) {
          matched.add(playbook);
        }
      }
    }
  }

  return Array.from(matched);
}
