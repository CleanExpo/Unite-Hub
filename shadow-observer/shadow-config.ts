/**
 * Shadow Observer Configuration
 * Read-only auditing system for Unite-Hub
 * Phase: F07 (integrated with Time-Block Orchestrator)
 */

export const shadowConfig = {
  // Paths
  shadowRoot: '/tmp/unite-hub-shadow',
  reportDir: './reports',
  sourceDir: './src',

  // Supabase (read-only)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Feature flags
  features: {
    buildSimulation: true,
    migrationDryRun: true,
    schemaAnalysis: true,
    bloatDetection: true,
    typeAnalysis: true,
    securityScan: true
  },

  // Audit scope
  audit: {
    maxFilesAnalyzed: 500,
    violationSeverityThreshold: 'medium', // critical, high, medium, low
    reportFormat: 'json' // json, markdown, html
  },

  // Safety gates
  safety: {
    readOnlyMode: true,
    noModifyProduction: true,
    cloneTempRepo: true,
    requireManualApproval: true
  },

  // Thresholds for warnings
  thresholds: {
    qualityGateMin: 9.0, // 1-10 scale
    typeErrorMax: 0,
    testCoverageMin: 80,
    buildTimeWarning: 120000 // ms
  }
};

export type ShadowConfig = typeof shadowConfig;
