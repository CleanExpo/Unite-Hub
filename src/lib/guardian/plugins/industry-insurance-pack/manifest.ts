/**
 * Guardian Industry Pack: Insurance & Claims Oversight
 * Plugin manifest for insurance-specific operational intelligence
 */

import { definePluginManifest } from '@/lib/guardian/plugins/pluginManifest';

export const manifest = definePluginManifest({
  key: 'industry_insurance_pack',
  name: 'Industry Pack: Insurance & Claims Oversight',
  version: '1.0.0',
  description: 'Insurance/adjuster operational intelligence for claims processing oversight',
  author: 'Guardian Team',

  capabilities: ['ui_panel', 'report'],

  routes: [
    {
      path: '/guardian/plugins/industry/insurance',
      title: 'Insurance Ops Dashboard',
      role: 'admin',
      icon: 'shield',
      description: 'Claims processing signals and operational risk metrics'
    }
  ],

  governance: {
    piiSafe: true,
    requiresExternalSharing: false,
    auditLogged: false,
    notes: 'Uses aggregate-only data; no claim numbers, policy data, or PII. ' +
           'Signals are heuristic operational indicators, not claim decisions.'
  },

  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  requiresAI: false,

  entry: '/guardian/plugins/industry/insurance',
  dependencies: [],
  stable: true,

  metadata: {
    industry: 'insurance_claims',
    signalCategories: ['claims_velocity', 'fraud_risk', 'adjuster_load', 'sla_breach', 'severity_drift'],
    supportedWorkflows: ['claims_intake', 'fraud_detection', 'adjuster_assignment', 'sla_monitoring'],
    dataRetention: '30_days'
  }
});
