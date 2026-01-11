/**
 * Guardian Industry Pack: Education & Campus Operations
 *
 * Plugin Key: industry_education_campus_pack
 * Purpose: Read-only campus operations and educational environment oversight signals
 * Audience: Educational institutions, campus administrators, compliance teams
 */

import { definePluginManifest } from '../pluginManifest';

export const manifest = definePluginManifest({
  key: 'industry_education_campus_pack',
  name: 'Industry Pack: Education & Campus Operations',
  version: '1.0.0',
  description: 'Aggregate-only campus operations, environmental safety, and operational disruption signals for educational institutions',
  requiredTiers: ['PROFESSIONAL', 'ENTERPRISE'],
  requiredFeatures: ['guardian_core', 'h06_intelligence_dashboard'],
  governance: {
    piiSafe: true,
    requiresExternalSharing: false
  },
  capabilities: ['ui_panel', 'report'],
  entry: 'plugins/industry-education-campus',
  metadata: {
    category: 'education_campus',
    description: 'Aggregate-only campus operations, environmental safety, and operational disruption signals for educational institutions',
    signals: [
      {
        key: 'operational_disruption',
        description: 'Elevated incident volumes indicating operational disruption or campus-wide issues'
      },
      {
        key: 'environmental_risk',
        description: 'Environmental or facility-related risk indicators and escalation patterns'
      },
      {
        key: 'repeat_pattern',
        description: 'Clustered recurring incidents in similar contexts or timeframes'
      },
      {
        key: 'response_latency',
        description: 'Response and resolution latency indicating stretched resources or complex issues'
      },
      {
        key: 'afterhours_activity',
        description: 'Off-hours incident activity indicating extended operational stress'
      },
      {
        key: 'stability_indicator',
        description: 'Overall campus operational stability assessment based on aggregate metrics'
      }
    ],
    piiSafetyNotes: [
      'Aggregate counts only',
      'No student IDs, staff identifiers, or location details',
      'Operational indicators only (not safety certifications)',
      'Trend analysis without individual case references',
      'Temporal patterns only (no identity mapping)'
    ]
  }
});
