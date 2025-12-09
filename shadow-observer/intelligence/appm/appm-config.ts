/**
 * APPM Configuration
 * Agent Performance Prediction Model thresholds and risk weights
 */

export interface APPMConfig {
  riskWeights: {
    driftIssue: number;           // Per drift issue
    underutilizedSkill: number;   // Per underutilized skill
    poorHealthSkill: number;      // Per poor health skill
    missingTest: number;          // Per missing test
    missingDocs: number;          // Per missing documentation
  };
  riskThresholds: {
    highRisk: number;             // Score > this = high-risk
    mediumRisk: number;           // Score > this = medium-risk
    lowRisk: number;              // Score <= this = low-risk
  };
  classifications: {
    highRisk: {
      label: string;
      emoji: string;
      recommendation: string;
    };
    mediumRisk: {
      label: string;
      emoji: string;
      recommendation: string;
    };
    lowRisk: {
      label: string;
      emoji: string;
      recommendation: string;
    };
  };
}

export const appmConfig: APPMConfig = {
  riskWeights: {
    driftIssue: 12,              // Critical - architecture deviation
    underutilizedSkill: 8,       // High - underused but might be needed
    poorHealthSkill: 5,          // Medium - maintenance risk
    missingTest: 3,              // Low - quality concern
    missingDocs: 2,              // Low - accessibility concern
  },
  riskThresholds: {
    highRisk: 60,                // Score > 60 = high-risk (requires immediate attention)
    mediumRisk: 30,              // Score > 30 = medium-risk (monitor and plan)
    lowRisk: 0,                  // Score <= 30 = low-risk (healthy)
  },
  classifications: {
    highRisk: {
      label: 'HIGH RISK',
      emoji: '🚨',
      recommendation: 'Immediate action required - address critical issues, conduct architecture review, increase monitoring'
    },
    mediumRisk: {
      label: 'MEDIUM RISK',
      emoji: '⚠️',
      recommendation: 'Schedule modernization sprint - plan improvements over next 1-2 weeks'
    },
    lowRisk: {
      label: 'LOW RISK',
      emoji: '✅',
      recommendation: 'Continue current practices - maintain regular monitoring and updates'
    }
  }
};
