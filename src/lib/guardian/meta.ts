/**
 * Guardian Module Metadata (G48)
 *
 * Version information and capability flags for the Guardian module.
 * Used for documentation, debugging, and feature detection.
 */

export const GUARDIAN_VERSION = '1.0.0';
export const GUARDIAN_BUILD_DATE = '2025-12-10';

export interface GuardianCapabilityFlag {
  id: string;
  label: string;
  enabled: boolean;
  phase: string;
}

/**
 * Guardian capability flags
 * All capabilities are enabled in v1.0.0
 */
export const GUARDIAN_CAPABILITIES: GuardianCapabilityFlag[] = [
  // Core Infrastructure (G30-G32)
  { id: 'tenant_hardening', label: 'Tenant Hardening & Context', enabled: true, phase: 'G30' },
  { id: 'tenant_enforcement', label: 'Tenant Enforcement', enabled: true, phase: 'G31' },
  { id: 'access_levels', label: 'Role-Based Access Control', enabled: true, phase: 'G32' },

  // Audit & Logging (G33-G34)
  { id: 'access_audit', label: 'Access Audit Trail', enabled: true, phase: 'G33' },
  { id: 'audit_viewer', label: 'Access Audit Viewer UI', enabled: true, phase: 'G34' },

  // Alert System (G35-G37)
  { id: 'alert_rules', label: 'Alert Rules & Events', enabled: true, phase: 'G35' },
  { id: 'alert_evaluation', label: 'Alert Evaluation Engine', enabled: true, phase: 'G36' },
  { id: 'alert_scheduler', label: 'Scheduled Evaluation', enabled: true, phase: 'G37' },

  // Integrations (G38-G42)
  { id: 'incident_bridge', label: 'Alert → Incident Bridge', enabled: true, phase: 'G38' },
  { id: 'webhook_dispatch', label: 'Webhook Notifications', enabled: true, phase: 'G39' },
  { id: 'email_notifications', label: 'Email Notifications', enabled: true, phase: 'G41' },
  { id: 'slack_notifications', label: 'Slack Notifications', enabled: true, phase: 'G42' },

  // UI & Analytics (G43-G47)
  { id: 'activity_feed', label: 'Activity Feed & Dashboard', enabled: true, phase: 'G43-G44' },
  { id: 'rule_editor', label: 'Rule Editor UI', enabled: true, phase: 'G45' },
  { id: 'correlation', label: 'Correlation Clusters', enabled: true, phase: 'G46' },
  { id: 'risk_score', label: 'Risk Score (Standard Model)', enabled: true, phase: 'G47' },
];

/**
 * Get Guardian module version
 */
export function getGuardianVersion(): string {
  return GUARDIAN_VERSION;
}

/**
 * Check if a specific capability is enabled
 */
export function isGuardianCapabilityEnabled(capabilityId: string): boolean {
  const capability = GUARDIAN_CAPABILITIES.find((c) => c.id === capabilityId);
  return capability?.enabled ?? false;
}

/**
 * Get all enabled Guardian capabilities
 */
export function getEnabledGuardianCapabilities(): GuardianCapabilityFlag[] {
  return GUARDIAN_CAPABILITIES.filter((c) => c.enabled);
}
