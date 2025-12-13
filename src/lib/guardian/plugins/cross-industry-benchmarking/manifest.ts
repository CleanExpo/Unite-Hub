/**
 * Guardian Cross-Industry Benchmarking & Peer Signals Plugin
 *
 * Plugin Key: cross_industry_benchmarking_pack
 * Purpose: Privacy-preserving benchmarking against anonymised peer cohorts
 * Audience: Enterprise tenants, leadership, compliance teams
 */

import { definePluginManifest } from '../pluginManifest';

export const manifest = definePluginManifest({
  key: 'cross_industry_benchmarking_pack',
  name: 'Cross-Industry Benchmarking & Peer Signals',
  version: '1.0.0',
  description: 'Privacy-preserving aggregate benchmarking against anonymised peer cohorts with k-anonymity enforcement',
  requiredTiers: ['ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'insights_dashboard', 'risk_engine'],
  governance: {
    piiSafe: true,
    requiresExternalSharing: false,
    auditLogged: true,
    notes: 'Aggregate-only plugin; k-anonymity enforced with minimum cohort size 10'
  },
  capabilities: ['ui_panel', 'report'],
  entry: 'plugins/cross-industry-benchmarking',
  metadata: {
    category: 'cross_industry_benchmarking',
    description: 'Privacy-preserving aggregate benchmarking against anonymised peer cohorts with k-anonymity enforcement',
    routes: [
      {
        path: '/guardian/plugins/benchmarking',
        title: 'Benchmarking',
        role: 'admin'
      }
    ],
    signals: [
      {
        key: 'alert_rate',
        description: 'Tenant alerts per day vs cohort median, P75, P90'
      },
      {
        key: 'incident_rate',
        description: 'Tenant incidents per day vs cohort distribution'
      },
      {
        key: 'correlation_density',
        description: 'Correlation/incident ratio indicating incident clustering'
      },
      {
        key: 'risk_label_distribution',
        description: 'Tenant risk label vs cohort distribution (low/medium/high %)'
      },
      {
        key: 'volatility_index',
        description: 'Metric variance over time indicating stability'
      }
    ],
    piiSafetyNotes: [
      'No tenant identifiers or names in output',
      'No industry-specific secrets or competitive data',
      'All values are aggregate statistics only',
      'Minimum cohort size (k>=10) enforced',
      'Cohort membership never exposed to tenant',
      'Benchmarks are informational indicators only',
      'No reverse inference possible from deltas'
    ],
    governance: {
      aiSummaryGated: true,
      requiresZ10Approval: true,
      minCohortSize: 10,
      defaultIndustryPrivate: true,
      explicitNoRanking: true
    }
  }
});
