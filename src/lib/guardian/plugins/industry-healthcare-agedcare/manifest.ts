/**
 * Guardian Industry Pack: Healthcare & Aged Care Oversight
 * Plugin manifest for healthcare and aged-care operational intelligence
 *
 * Read-only, aggregate-only oversight signals focused on care environment risk,
 * operational stability, and escalation patterns. No patient, resident, or staff data.
 */

import { definePluginManifest } from '@/lib/guardian/plugins/pluginManifest';

export const manifest = definePluginManifest({
  key: 'industry_healthcare_agedcare_pack',
  name: 'Industry Pack: Healthcare & Aged Care Oversight',
  version: '1.0.0',
  description: 'Healthcare and aged-care operational intelligence for care environment risk oversight',
  author: 'Guardian Team',

  capabilities: ['ui_panel', 'report'],

  routes: [
    {
      path: '/guardian/plugins/industry/healthcare',
      title: 'Healthcare & Aged Care Ops',
      role: 'admin',
      icon: 'heartbeat',
      description: 'Care environment risk signals and operational stability metrics'
    }
  ],

  governance: {
    piiSafe: true,
    requiresExternalSharing: false,
    auditLogged: false,
    notes: 'Uses aggregate-only data; no patient, resident, staff, or room identifiers. ' +
           'Signals are operational oversight indicators only, not clinical guidance or compliance determinations. ' +
           'All outputs are heuristic risk indicators.'
  },

  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  requiresAI: false,

  entry: '/guardian/plugins/industry/healthcare',
  dependencies: [],
  stable: true,

  metadata: {
    industry: 'healthcare_agedcare',
    signalCategories: [
      'environmental_risk',
      'repeat_incident',
      'response_latency',
      'afterhours_events',
      'care_stability',
      'escalation_pressure'
    ],
    supportedWorkflows: [
      'care_environment_monitoring',
      'incident_pattern_detection',
      'operational_risk_assessment',
      'escalation_tracking'
    ],
    dataRetention: '30_days'
  }
});
