/**
 * Skill Drift Detector (SDD) Configuration
 * Detects deviations from system architecture and outdated patterns
 */

export const driftConfig = {
  // Architecture pattern definitions
  architecturePatterns: {
    modernSkillSchema: {
      required: ['# Inputs', '# Outputs', '# Implementation', '# Tests', '# Examples'],
      forbidden: ['cursor://', 'claude-2', 'opus-1', 'gpt-4-old'],
      description: 'Modern skill structure with clear I/O and tests'
    },
    typeScript: {
      required: ['interface', 'type'],
      forbidden: ['any', 'unknown as any'],
      description: 'Proper TypeScript with type safety'
    },
    errorHandling: {
      required: ['try', 'catch', 'throw'],
      forbidden: ['console.error()'],
      description: 'Proper error handling patterns'
    },
    documentation: {
      minLength: 200,
      maxLength: 50000,
      requiresExamples: true,
      requiresEdgeCases: true,
      description: 'Adequate documentation with examples'
    }
  },

  // Drift severity levels
  severity: {
    critical: {
      threshold: 3,
      action: 'Block until fixed',
      color: 'FF0000'
    },
    high: {
      threshold: 2,
      action: 'Flag for review',
      color: 'FF6600'
    },
    medium: {
      threshold: 1,
      action: 'Monitor',
      color: 'FFFF00'
    },
    low: {
      threshold: 0,
      action: 'Suggest improvement',
      color: '00CC00'
    }
  },

  // Outdated pattern detection
  outdatedPatterns: {
    lowVersion: /claude-[0-2]|gpt-3|opus-[0-3]/i,
    deprecatedLibs: /axios|request-promise|node-fetch-v1/i,
    insecurePatterns: /eval\(|exec\(|new Function/i,
    poorStructure: /^\s*function anonymous|exports = |module\.exports =/i
  },

  // Compliance rules
  complianceRules: [
    { rule: 'Must have README.md', category: 'documentation' },
    { rule: 'Must have test file', category: 'testing' },
    { rule: 'Must have TypeScript types', category: 'types' },
    { rule: 'Must have usage examples', category: 'documentation' },
    { rule: 'Must handle errors explicitly', category: 'robustness' },
    { rule: 'Must not use `any` type', category: 'types' },
    { rule: 'Must follow naming conventions', category: 'consistency' },
    { rule: 'Must have change log', category: 'maintenance' }
  ]
};

export type DriftConfig = typeof driftConfig;
