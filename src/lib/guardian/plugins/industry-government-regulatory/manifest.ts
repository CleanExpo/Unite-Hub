/**
 * Guardian Industry Pack: Government & Regulatory Oversight
 *
 * Plugin Key: industry_government_regulatory_pack
 * Purpose: Read-only governance oversight and regulatory readiness signals
 * Audience: Government agencies, regulated entities, compliance teams
 */

import { definePluginManifest } from '../pluginManifest';

export const manifest = definePluginManifest({
  key: 'industry_government_regulatory_pack',
  name: 'Industry Pack: Government & Regulatory Oversight',
  version: '1.0.0',
  description: 'Aggregate-only governance oversight, audit readiness, and policy posture signals for regulated environments',
  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  governance: {
    piiSafe: true,
    requiresExternalSharing: false
  },
  capabilities: ['ui_panel', 'report'],
  entry: 'plugins/industry-government-regulatory',
  metadata: {
    category: 'government_regulatory',
    description: 'Aggregate-only governance oversight, audit readiness, and policy posture signals for regulated environments',
    signals: [
      {
        key: 'audit_readiness',
        description: 'Validation passing + audit capabilities enabled + export module present'
      },
      {
        key: 'policy_posture',
        description: 'External sharing and AI governance controls configured appropriately'
      },
      {
        key: 'control_drift',
        description: 'Rising risk despite stable incident volumes indicating emerging operational pressure'
      },
      {
        key: 'validation_health',
        description: 'Validation system status and trend over time'
      },
      {
        key: 'backup_posture',
        description: 'Backup currency and readiness for recovery operations'
      },
      {
        key: 'transparency_score',
        description: 'Composite operational transparency based on governance artifact availability (informational only)'
      }
    ],
    piiSafetyNotes: [
      'Aggregate counts only',
      'No case IDs, citizen data, or staff identifiers',
      'Policy posture indicators only (not compliance certification)',
      'Transparency score is informational and not regulatory proof'
    ]
  }
});
