/**
 * SRRE Configuration
 * Skill Refactor Recommendation Engine settings and patterns
 */

export interface RefactorPriority {
  level: 'critical' | 'high' | 'medium' | 'low';
  emoji: string;
  label: string;
  sla: string;  // Service level agreement
}

export interface RefactorCategory {
  type: 'security' | 'architecture' | 'testing' | 'documentation' | 'performance' | 'modernization';
  weight: number;
  description: string;
}

export interface SRREConfig {
  priorityLevels: Record<string, RefactorPriority>;
  categories: Record<string, RefactorCategory>;
  effortScales: {
    minimal: { estimate: string; hours: number };
    small: { estimate: string; hours: number };
    medium: { estimate: string; hours: number };
    large: { estimate: string; hours: number };
    xl: { estimate: string; hours: number };
  };
  impactScores: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  reportDir: string;
}

export const srreConfig: SRREConfig = {
  priorityLevels: {
    critical: {
      level: 'critical',
      emoji: '🚨',
      label: 'CRITICAL',
      sla: 'Fix within 3 business days'
    },
    high: {
      level: 'high',
      emoji: '⚠️',
      label: 'HIGH',
      sla: 'Fix within 2 weeks'
    },
    medium: {
      level: 'medium',
      emoji: '📋',
      label: 'MEDIUM',
      sla: 'Fix within 1 month'
    },
    low: {
      level: 'low',
      emoji: '💡',
      label: 'LOW',
      sla: 'Fix when capacity available'
    }
  },
  categories: {
    security: {
      type: 'security',
      weight: 1.5,
      description: 'Security vulnerabilities (eval, exec, unvalidated input)'
    },
    architecture: {
      type: 'architecture',
      weight: 1.3,
      description: 'Architectural deviations (outdated patterns, missing structure)'
    },
    testing: {
      type: 'testing',
      weight: 1.1,
      description: 'Missing or insufficient test coverage'
    },
    documentation: {
      type: 'documentation',
      weight: 1.0,
      description: 'Missing or incomplete documentation'
    },
    performance: {
      type: 'performance',
      weight: 1.2,
      description: 'Performance issues (bloated files, inefficient logic)'
    },
    modernization: {
      type: 'modernization',
      weight: 0.9,
      description: 'Technology upgrades and modernization'
    }
  },
  effortScales: {
    minimal: { estimate: '< 1 hour', hours: 0.5 },
    small: { estimate: '1-4 hours', hours: 2 },
    medium: { estimate: '1-2 days', hours: 8 },
    large: { estimate: '3-5 days', hours: 24 },
    xl: { estimate: '1-3 weeks', hours: 60 }
  },
  impactScores: {
    critical: 100,
    high: 60,
    medium: 30,
    low: 10
  },
  reportDir: 'reports'
};
