/**
 * Policy Matrix
 * Phase 63: Define governance policies and thresholds
 */

import { RiskCategory } from './governanceEngine';

export interface PolicyRule {
  id: string;
  name: string;
  category: RiskCategory;
  description: string;
  threshold: number;
  action_on_breach: 'alert' | 'block' | 'founder_approval';
  auto_resolve: boolean;
  severity_mapping: {
    minor: string;
    moderate: string;
    severe: string;
  };
}

export interface PolicyThreshold {
  warning: number;
  critical: number;
}

// Governance policy definitions
export const GOVERNANCE_POLICIES: PolicyRule[] = [
  // AI Behavior Policies
  {
    id: 'ai-truth-layer',
    name: 'Truth Layer Compliance',
    category: 'ai_behavior',
    description: 'All AI outputs must comply with truth-layer guidelines',
    threshold: 95,
    action_on_breach: 'alert',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Single non-compliant output detected',
      moderate: 'Multiple non-compliant outputs in 24h',
      severe: 'Systematic truth-layer violations',
    },
  },
  {
    id: 'ai-hallucination',
    name: 'No Hallucinated Capabilities',
    category: 'ai_behavior',
    description: 'AI must not claim capabilities that do not exist',
    threshold: 100,
    action_on_breach: 'block',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Ambiguous capability claim',
      moderate: 'False capability stated',
      severe: 'Repeated hallucinated capabilities',
    },
  },

  // Brand Consistency Policies
  {
    id: 'brand-colors',
    name: 'Brand Color Compliance',
    category: 'brand_consistency',
    description: 'Visual outputs must use approved brand colors',
    threshold: 80,
    action_on_breach: 'alert',
    auto_resolve: true,
    severity_mapping: {
      minor: 'Minor color variation',
      moderate: 'Off-brand colors used',
      severe: 'Complete brand color violation',
    },
  },
  {
    id: 'brand-tone',
    name: 'Tone of Voice Compliance',
    category: 'brand_consistency',
    description: 'Copy must match brand tone guidelines',
    threshold: 75,
    action_on_breach: 'alert',
    auto_resolve: true,
    severity_mapping: {
      minor: 'Slight tone inconsistency',
      moderate: 'Tone significantly off-brand',
      severe: 'Complete tone mismatch',
    },
  },

  // Financial Policies
  {
    id: 'cost-daily-budget',
    name: 'Daily Cost Budget',
    category: 'financial_costs',
    description: 'Daily AI costs must not exceed budget',
    threshold: 100,
    action_on_breach: 'founder_approval',
    auto_resolve: false,
    severity_mapping: {
      minor: '80-100% of budget used',
      moderate: '100-120% of budget used',
      severe: 'Over 120% of budget used',
    },
  },
  {
    id: 'cost-per-client',
    name: 'Per-Client Cost Limit',
    category: 'financial_costs',
    description: 'Per-client costs must not exceed allocation',
    threshold: 100,
    action_on_breach: 'alert',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Approaching limit',
      moderate: 'At limit',
      severe: 'Significantly over limit',
    },
  },

  // Performance Policies
  {
    id: 'performance-response',
    name: 'Response Time SLA',
    category: 'performance_load',
    description: 'API responses must meet SLA targets',
    threshold: 95,
    action_on_breach: 'alert',
    auto_resolve: true,
    severity_mapping: {
      minor: 'Occasional slow responses',
      moderate: 'Frequent slow responses',
      severe: 'System-wide performance degradation',
    },
  },
  {
    id: 'performance-load',
    name: 'System Load Threshold',
    category: 'performance_load',
    description: 'System load must stay within capacity',
    threshold: 80,
    action_on_breach: 'alert',
    auto_resolve: true,
    severity_mapping: {
      minor: 'Load at 70-80%',
      moderate: 'Load at 80-90%',
      severe: 'Load over 90%',
    },
  },

  // Security Policies
  {
    id: 'security-access',
    name: 'Unauthorized Access Detection',
    category: 'security_events',
    description: 'Detect and block unauthorized access attempts',
    threshold: 0,
    action_on_breach: 'block',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Single failed attempt',
      moderate: 'Multiple failed attempts',
      severe: 'Successful unauthorized access',
    },
  },
  {
    id: 'security-data',
    name: 'Data Isolation',
    category: 'security_events',
    description: 'Ensure no cross-tenant data exposure',
    threshold: 100,
    action_on_breach: 'block',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Query without workspace filter',
      moderate: 'Potential data leak',
      severe: 'Confirmed cross-tenant exposure',
    },
  },

  // Data Integrity Policies
  {
    id: 'data-consistency',
    name: 'Data Consistency Check',
    category: 'data_integrity',
    description: 'Ensure data consistency across systems',
    threshold: 99,
    action_on_breach: 'alert',
    auto_resolve: true,
    severity_mapping: {
      minor: 'Minor inconsistency detected',
      moderate: 'Data sync issues',
      severe: 'Critical data corruption',
    },
  },

  // Client Outcome Policies
  {
    id: 'client-health',
    name: 'Client Health Monitoring',
    category: 'client_outcomes',
    description: 'Monitor client health and trigger interventions',
    threshold: 60,
    action_on_breach: 'alert',
    auto_resolve: false,
    severity_mapping: {
      minor: 'Health score declining',
      moderate: 'Health score below 60',
      severe: 'Health score critical (<40)',
    },
  },
];

// Score thresholds
export const SCORE_THRESHOLDS: Record<string, PolicyThreshold> = {
  compliance: { warning: 80, critical: 60 },
  governance_risk: { warning: 70, critical: 50 },
  system_integrity: { warning: 85, critical: 70 },
};

/**
 * Policy Matrix
 * Evaluate and enforce governance policies
 */
export class PolicyMatrix {
  /**
   * Get all policies
   */
  getAllPolicies(): PolicyRule[] {
    return GOVERNANCE_POLICIES;
  }

  /**
   * Get policies by category
   */
  getPoliciesByCategory(category: RiskCategory): PolicyRule[] {
    return GOVERNANCE_POLICIES.filter((p) => p.category === category);
  }

  /**
   * Evaluate a metric against policy
   */
  evaluatePolicy(
    policyId: string,
    value: number
  ): {
    passed: boolean;
    breach_level: 'none' | 'minor' | 'moderate' | 'severe';
    action: string;
  } {
    const policy = GOVERNANCE_POLICIES.find((p) => p.id === policyId);
    if (!policy) {
      return { passed: true, breach_level: 'none', action: 'none' };
    }

    const diff = policy.threshold - value;

    if (value >= policy.threshold) {
      return { passed: true, breach_level: 'none', action: 'none' };
    }

    // Determine breach level
    let breachLevel: 'minor' | 'moderate' | 'severe';
    if (diff <= 10) {
      breachLevel = 'minor';
    } else if (diff <= 25) {
      breachLevel = 'moderate';
    } else {
      breachLevel = 'severe';
    }

    return {
      passed: false,
      breach_level: breachLevel,
      action: policy.action_on_breach,
    };
  }

  /**
   * Get score status
   */
  getScoreStatus(
    scoreType: keyof typeof SCORE_THRESHOLDS,
    value: number
  ): 'healthy' | 'warning' | 'critical' {
    const thresholds = SCORE_THRESHOLDS[scoreType];
    if (!thresholds) {
return 'healthy';
}

    if (value < thresholds.critical) {
return 'critical';
}
    if (value < thresholds.warning) {
return 'warning';
}
    return 'healthy';
  }
}

export default PolicyMatrix;
