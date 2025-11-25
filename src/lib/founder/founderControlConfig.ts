/**
 * Founder Control Configuration
 *
 * Global settings for founder oversight, approvals, and safety controls.
 * Defines what requires manual founder approval vs automated routing.
 *
 * Used by: Risk engine, approval workflow, agent control routing
 */

export const founderControlConfig = {
  // Feature flags for founder governance
  enableTruthLayer: true,
  enableRiskScoring: true,
  enableBrandSafetyValidation: true,
  enableAgentApproval: true,
  enableExecutionLogging: true,

  // Actions that require manual founder override
  manualOverrideRequiredFor: [
    'public_claims',           // Any public-facing claims (financial, health, legal)
    'brand_position_changes',  // Changes to brand mission, promise, or positioning
    'high_risk_automation',    // Automation affecting brand perception or compliance
    'external_communications', // Communications sent to external parties
    'financial_estimates',     // Revenue, savings, or financial outcome predictions
  ],

  // Risk thresholds
  riskThresholds: {
    low: 0,
    medium: 20,
    high: 40,
    critical: 70,
  },

  // Approval rules by risk level
  autoApprovalRules: {
    low: true,                    // Auto-approve low risk
    medium: 'content_review',     // Medium requires content review only
    high: false,                  // High requires manual approval
    critical: false,              // Critical always requires manual approval
  },

  // Audit logging
  auditConfig: {
    enableAll: true,
    logEventTypes: [
      'agent_action',
      'approval_decision',
      'risk_assessment',
      'override_decision',
      'brand_change',
      'campaign_launch',
      'system_health_check',
    ],
    retentionDays: 365,
  },

  // Brand safety constraints
  brandSafety: {
    enforceMissionConsistency: true,
    enforceRiskFlags: true,
    enforceAudienceAlignment: true,
    enforceToneConsistency: true,
  },
} as const;

export type FounderOverrideType = typeof founderControlConfig.manualOverrideRequiredFor[number];
export type RiskLevel = keyof typeof founderControlConfig.riskThresholds;
export type AuditEventType = typeof founderControlConfig.auditConfig.logEventTypes[number];
