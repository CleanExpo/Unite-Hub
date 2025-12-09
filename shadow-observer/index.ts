/**
 * Shadow Observer + Agent Prompt System
 * Unified end-to-end auditing & autonomous refactoring orchestrator
 * Phase: F07 (Time-Block Orchestrator integration)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { shadowConfig } from './shadow-config';
import { pullSupabaseSchema, saveSchemaReport } from './supabase-schema-puller';
import { scanViolations, saveViolationReport } from './codebase-violation-scanner';
import { simulateBuild, saveBuildReport } from './build-simulator';
import { runAgentPromptOrchestrator, saveAgentResults } from './agent-prompt-orchestrator';
import { analyzeSVIE } from './svie/skill-analyzer';
import { runDistractionShieldAnalysis } from './distraction-shield/run-distraction-shield';

export interface AuditSummary {
  timestamp: string;
  duration: number;
  schema: { tables: number; warnings: number };
  violations: { total: number; critical: number; high: number };
  build: { pass: boolean; errors: number };
  agent: { score: number; phase: string };
  svie?: { totalSkills: number; underutilized: number; deprecated: number };
  distractionShield?: { healthStatus: string; overallScore: number };
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Create isolated temp clone for scanning
 */
function createTempClone(): string {
  console.log('📦 Creating temporary clone for scanning...');

  try {
    // Remove old clone
    if (fs.existsSync(shadowConfig.shadowRoot)) {
      execSync(`rm -rf ${shadowConfig.shadowRoot}`, { stdio: 'ignore' });
    }

    // Clone current repo to temp
    execSync(`git clone . ${shadowConfig.shadowRoot}`, { stdio: 'ignore' });
    console.log(`  ✓ Clone created: ${shadowConfig.shadowRoot}`);

    return shadowConfig.shadowRoot;
  } catch (error) {
    console.warn('  ⚠️  Could not create temp clone (will scan live repo)');
    return process.cwd();
  }
}

/**
 * Main orchestration: Shadow Observer → Agent Prompts → Self-Evaluation
 */
export async function runFullAudit(): Promise<AuditSummary> {
  const startTime = Date.now();

  console.log('=====================================');
  console.log('🕵️  Shadow Observer + Agent System');
  console.log('Phase: F07 (Time-Block Orchestrator)');
  console.log('=====================================\n');

  const summary: AuditSummary = {
    timestamp: new Date().toISOString(),
    duration: 0,
    schema: { tables: 0, warnings: 0 },
    violations: { total: 0, critical: 0, high: 0 },
    build: { pass: false, errors: 0 },
    agent: { score: 0, phase: 'audit' },
    recommendations: [],
    nextSteps: []
  };

  try {
    // Ensure reports directory exists
    if (!fs.existsSync(shadowConfig.reportDir)) {
      fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
    }

    // STEP 1: Schema Analysis
    console.log('STEP 1: Schema Analysis');
    console.log('─────────────────────────');
    try {
      const schema = await pullSupabaseSchema();
      await saveSchemaReport(schema);
      summary.schema = {
        tables: schema.tables.length,
        warnings: schema.warnings.length
      };
      console.log(`✓ Found ${schema.tables.length} tables, ${schema.warnings.length} warnings\n`);
    } catch (error) {
      console.warn('⚠️  Schema analysis skipped (Supabase unavailable)\n');
      summary.recommendations.push('Supabase schema pull failed — check credentials');
    }

    // STEP 2: Codebase Violation Scan
    console.log('STEP 2: Codebase Violation Scan');
    console.log('────────────────────────────────');
    const violations = await scanViolations();
    await saveViolationReport(violations);
    summary.violations = {
      total: violations.summary.total,
      critical: violations.summary.critical,
      high: violations.summary.high
    };
    console.log(`✓ Found ${violations.summary.total} violations\n`);

    // STEP 3: Build Simulation
    console.log('STEP 3: Build Simulation');
    console.log('────────────────────────');
    const buildResult = await simulateBuild();
    await saveBuildReport(buildResult);
    summary.build = {
      pass: buildResult.typeCheckPass && buildResult.lintPass && buildResult.testPass && buildResult.buildPass,
      errors: buildResult.errors.length
    };
    console.log();

    // STEP 4: Agent Prompt System
    console.log('STEP 4: Agent Prompt System');
    console.log('───────────────────────────');
    const agentResult = await runAgentPromptOrchestrator();
    await saveAgentResults(agentResult);
    summary.agent = {
      score: agentResult.selfVerificationScore,
      phase: agentResult.phase
    };
    console.log();

    // STEP 5: Skill Value Intelligence Engine (SVIE)
    console.log('STEP 5: Skill Value Intelligence (SVIE)');
    console.log('─────────────────────────────────────');
    try {
      const svieReport = await analyzeSVIE();
      summary.svie = {
        totalSkills: svieReport.totalSkills,
        underutilized: svieReport.summary.underutilized,
        deprecated: svieReport.summary.deprecated
      };
      console.log(`✓ Analyzed ${svieReport.totalSkills} skills (${svieReport.summary.underutilized} underutilized, ${svieReport.summary.deprecated} deprecated)\n`);
    } catch (error) {
      console.warn('⚠️  SVIE analysis skipped (skills directory unavailable)\n');
      summary.recommendations.push('SVIE analysis failed — check .claude/skills directory');
    }

    // STEP 6: Distraction Shield Intelligence
    console.log('STEP 6: Distraction Shield Intelligence');
    console.log('──────────────────────────────────────');
    try {
      const distractionReport = await runDistractionShieldAnalysis({
        tenantId: 'system-audit',
        days: 7,
        reportDir: shadowConfig.reportDir
      });
      summary.distractionShield = {
        healthStatus: distractionReport.healthStatus,
        overallScore: distractionReport.overallScore
      };
      console.log(`✓ Distraction Shield: ${distractionReport.healthStatus.toUpperCase()} (score: ${distractionReport.overallScore}/100)\n`);
    } catch (error) {
      console.warn('⚠️  Distraction Shield analysis skipped (database unavailable)\n');
      summary.recommendations.push('Distraction Shield analysis failed — check distraction_events table');
    }

    // STEP 7: Recommendations & Next Steps
    console.log('STEP 5: Analysis & Recommendations');
    console.log('──────────────────────────────────');

    if (summary.violations.critical > 0) {
      summary.recommendations.push(`⚠️  ${summary.violations.critical} CRITICAL violations found — requires immediate attention`);
      summary.nextSteps.push('Run: npm run agent:refactor -- --severity critical');
    }

    if (summary.violations.high > 0) {
      summary.recommendations.push(`${summary.violations.high} HIGH violations — schedule for sprint`);
    }

    if (!summary.build.pass) {
      summary.recommendations.push(`Build failed (${summary.build.errors} errors) — check type check and tests`);
      summary.nextSteps.push('npm run typecheck && npm run test:unit');
    }

    if (summary.agent.score < 9) {
      summary.recommendations.push(`Agent quality score ${summary.agent.score}/10 — manual review needed`);
    } else {
      summary.recommendations.push('✓ All agent outputs passed quality gates');
    }

    if (summary.schema.warnings > 0) {
      summary.recommendations.push(`Database schema has ${summary.schema.warnings} warnings`);
      summary.nextSteps.push('Review schema_health.json for RLS/type issues');
    }

    summary.nextSteps.push('Store metrics in self_evaluation_factors table');
    summary.nextSteps.push('Check reports/*.json for detailed findings');

    // Final Summary
    const duration = Date.now() - startTime;
    summary.duration = duration;

    console.log('\n✓ AUDIT COMPLETE\n');
    console.log('Summary:');
    console.log(`  Schema:      ${summary.schema.tables} tables, ${summary.schema.warnings} warnings`);
    console.log(`  Violations:  ${summary.violations.total} total (${summary.violations.critical} critical, ${summary.violations.high} high)`);
    console.log(`  Build:       ${summary.build.pass ? '✓' : '✗'} (${summary.build.errors} errors)`);
    console.log(`  Agent Score: ${summary.agent.score.toFixed(1)}/10`);
    console.log(`  Duration:    ${(duration / 1000).toFixed(1)}s\n`);

    console.log('📋 Reports Generated:');
    console.log('  - reports/schema_health.json');
    console.log('  - reports/violations.json');
    console.log('  - reports/build_simulation.json');
    console.log('  - reports/agent_prompt_results.json');
    if (summary.svie) {
      console.log('  - reports/SVIE_*.json');
    }
    if (summary.distractionShield) {
      console.log('  - reports/DISTRACTION_SHIELD_*.json');
    }
    console.log('  - reports/FULL_AUDIT_SUMMARY.json\n');

    console.log('Recommendations:');
    summary.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('\nNext Steps:');
    summary.nextSteps.forEach(step => console.log(`  → ${step}`));

    return summary;
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
    throw error;
  }
}

/**
 * Save full audit summary
 */
export async function saveSummary(summary: AuditSummary): Promise<void> {
  const reportPath = path.join(shadowConfig.reportDir, 'FULL_AUDIT_SUMMARY.json');

  if (!fs.existsSync(shadowConfig.reportDir)) {
    fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
}

export async function main() {
  try {
    const summary = await runFullAudit();
    await saveSummary(summary);

    // Exit with error code if critical issues found
    if (summary.violations.critical > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
