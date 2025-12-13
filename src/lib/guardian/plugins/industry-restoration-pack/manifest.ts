/**
 * Guardian Industry Pack: Restoration Operations
 *
 * Provides industry-specific insights for water/mould/fire restoration workflows.
 * Read-only plugin demonstrating PLUGIN-01 and PLUGIN-02 frameworks.
 *
 * Features:
 * - Restoration-specific risk signals (water spike, mould risk, fire event)
 * - SOP-aligned operational intelligence
 * - PII-safe, aggregate-only data model
 * - Governance-aware (respects external sharing, AI policies)
 */

import { definePluginManifest } from '@/lib/guardian/plugins/pluginManifest';

export const manifest = definePluginManifest({
  key: 'industry_restoration_pack',
  name: 'Industry Pack: Restoration Operations',
  version: '1.0.0',
  description: 'Restoration-specific operational intelligence for water, mould, and fire workflows',
  author: 'Guardian Team',

  // Capabilities
  capabilities: ['ui_panel', 'report'],

  // UI Routes
  routes: [
    {
      path: '/guardian/plugins/industry/restoration',
      title: 'Restoration Ops Dashboard',
      role: 'admin',
      icon: 'activity',
      description: 'Restoration-specific risk signals and operational metrics'
    }
  ],

  // Governance: PII-safe, no external sharing requirement
  governance: {
    piiSafe: true,
    requiresExternalSharing: false,
    auditLogged: false,
    notes:
      'Uses aggregate-only data; no PII. Safe to view by admin only. ' +
      'Signals are heuristic indicators, not compliance determinations.'
  },

  // Gating
  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  requiresAI: false, // No AI required; AI is optional for ops brief

  // Module entry point (maps to Next.js route)
  entry: '/guardian/plugins/industry/restoration',
  dependencies: [],

  stable: true,

  metadata: {
    industry: 'restoration_operations',
    signalCategories: ['water_damage', 'mould_contamination', 'fire_response', 'operational_load'],
    supportedWorkflows: ['water_restoration', 'mould_remediation', 'fire_cleanup'],
    dataRetention: '30_days'
  }
});
