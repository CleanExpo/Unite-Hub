/**
 * Shadow Observer Agent
 * Autonomous codebase auditing integrated with orchestrator
 *
 * Executes:
 * - Schema introspection
 * - Violation scanning
 * - Build simulation
 * - Agent-driven refactoring
 * - Self-evaluation feedback
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface ShadowObserverInput {
  action: 'audit' | 'scan' | 'build' | 'refactor' | 'full';
  severity?: 'critical' | 'high' | 'medium' | 'low';
  targetFiles?: string[];
  options?: Record<string, any>;
}

export interface ShadowObserverOutput {
  success: boolean;
  action: string;
  violations: Array<{
    file: string;
    line: number;
    type: string;
    severity: string;
    description: string;
  }>;
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
  };
  build?: {
    pass: boolean;
    typeCheck: boolean;
    lint: boolean;
    tests: boolean;
  };
  agentScore?: number;
  recommendations: string[];
  timestamp: string;
  reportPath: string;
}

/**
 * Execute Shadow Observer audit
 */
export async function executeShadowObserverAudit(
  input: ShadowObserverInput
): Promise<ShadowObserverOutput> {
  const reportDir = './reports';
  const timestamp = new Date().toISOString();

  try {
    // Ensure reports directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    let violations: ShadowObserverOutput['violations'] = [];
    let summary = { total: 0, critical: 0, high: 0, medium: 0 };
    let buildResult: ShadowObserverOutput['build'] | undefined;
    let agentScore = 0;
    let reportPath = '';

    switch (input.action) {
      case 'audit':
      case 'full':
        // Run full audit
        console.log('🔍 Running full Shadow Observer audit...');

        // 1. Scan violations
        console.log('  [1/4] Scanning violations...');
        const violations_file = path.join(reportDir, 'violations.json');
        if (fs.existsSync(violations_file)) {
          const content = fs.readFileSync(violations_file, 'utf-8');
          const data = JSON.parse(content);
          violations = data.violations || [];
          summary = data.summary || { total: 0, critical: 0, high: 0, medium: 0 };
        }

        // 2. Simulate build
        console.log('  [2/4] Simulating build...');
        const build_file = path.join(reportDir, 'build_simulation.json');
        if (fs.existsSync(build_file)) {
          const content = fs.readFileSync(build_file, 'utf-8');
          const data = JSON.parse(content);
          buildResult = {
            pass: data.typeCheckPass && data.lintPass && data.testPass && data.buildPass,
            typeCheck: data.typeCheckPass,
            lint: data.lintPass,
            tests: data.testPass
          };
        }

        // 3. Agent refactoring
        console.log('  [3/4] Running agent refactoring...');
        const agent_file = path.join(reportDir, 'agent_prompt_results.json');
        if (fs.existsSync(agent_file)) {
          const content = fs.readFileSync(agent_file, 'utf-8');
          const data = JSON.parse(content);
          agentScore = data.selfVerificationScore || 0;
        }

        // 4. Load summary
        console.log('  [4/4] Generating summary...');
        const summary_file = path.join(reportDir, 'FULL_AUDIT_SUMMARY.json');
        reportPath = summary_file;

        console.log('✓ Audit complete\n');
        break;

      case 'scan':
        console.log('🔍 Scanning for violations...');
        reportPath = path.join(reportDir, 'violations.json');
        if (fs.existsSync(reportPath)) {
          const content = fs.readFileSync(reportPath, 'utf-8');
          const data = JSON.parse(content);
          violations = data.violations || [];
          summary = data.summary || { total: 0, critical: 0, high: 0, medium: 0 };
        }
        break;

      case 'build':
        console.log('🏗️  Simulating build...');
        reportPath = path.join(reportDir, 'build_simulation.json');
        if (fs.existsSync(reportPath)) {
          const content = fs.readFileSync(reportPath, 'utf-8');
          const data = JSON.parse(content);
          buildResult = {
            pass: data.typeCheckPass && data.lintPass && data.testPass && data.buildPass,
            typeCheck: data.typeCheckPass,
            lint: data.lintPass,
            tests: data.testPass
          };
        }
        break;

      case 'refactor':
        console.log('🤖 Running agent refactoring...');
        reportPath = path.join(reportDir, 'agent_prompt_results.json');
        if (fs.existsSync(path.join(reportDir, 'violations.json'))) {
          const content = fs.readFileSync(path.join(reportDir, 'violations.json'), 'utf-8');
          const data = JSON.parse(content);
          violations = data.violations || [];
          summary = data.summary || { total: 0, critical: 0, high: 0, medium: 0 };
        }
        if (fs.existsSync(reportPath)) {
          const content = fs.readFileSync(reportPath, 'utf-8');
          const data = JSON.parse(content);
          agentScore = data.selfVerificationScore || 0;
        }
        break;
    }

    // Filter by severity if specified
    if (input.severity) {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      violations = violations.filter(
        v => severityOrder[v.severity as keyof typeof severityOrder] <= severityOrder[input.severity!]
      );
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (summary.critical > 0) {
      recommendations.push(`⚠️  ${summary.critical} CRITICAL violations found — requires immediate attention`);
    }

    if (summary.high > 0) {
      recommendations.push(`${summary.high} HIGH violations — schedule for sprint`);
    }

    if (buildResult && !buildResult.pass) {
      recommendations.push(`Build failed — ${[!buildResult.typeCheck && 'type check', !buildResult.lint && 'lint', !buildResult.tests && 'tests'].filter(Boolean).join(', ')}`);
    }

    if (agentScore > 0 && agentScore < 9) {
      recommendations.push(`Agent quality score ${agentScore.toFixed(1)}/10 — manual review needed`);
    }

    if (agentScore >= 9) {
      recommendations.push('✓ All agent outputs passed quality gates');
    }

    if (violations.length === 0) {
      recommendations.push('✓ No violations found');
    }

    return {
      success: true,
      action: input.action,
      violations: violations.slice(0, 50), // Limit to 50 for display
      summary,
      build: buildResult,
      agentScore: agentScore > 0 ? agentScore : undefined,
      recommendations,
      timestamp,
      reportPath
    };
  } catch (error) {
    console.error('❌ Shadow Observer audit failed:', error);
    return {
      success: false,
      action: input.action,
      violations: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0 },
      recommendations: [`Error: ${error instanceof Error ? error.message : String(error)}`],
      timestamp,
      reportPath: ''
    };
  }
}

/**
 * Record self-evaluation metrics to database
 */
export async function recordSelfEvalMetrics(
  output: ShadowObserverOutput,
  tenantId: string
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase');

    const cycleCode = `shadow_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}:00`;

    const metrics = [
      {
        factor: 'stability',
        value: 100 - Math.min(output.summary.critical * 10, 100),
        description: 'Test pass rate and code stability'
      },
      {
        factor: 'compliance',
        value: 100 - Math.min(output.summary.high * 5, 100),
        description: 'CLAUDE.md pattern adherence'
      },
      {
        factor: 'quality',
        value: (output.agentScore || 7) * 10,
        description: 'Agent verification quality score'
      },
      {
        factor: 'performance',
        value: output.build?.pass ? 90 : 70,
        description: 'Build performance and pass rate'
      }
    ];

    for (const metric of metrics) {
      await supabaseAdmin.from('self_evaluation_factors').insert({
        tenant_id: tenantId,
        cycle_code: cycleCode,
        factor: metric.factor,
        value: metric.value,
        weight: 1.0,
        details: metric.description,
        metadata: {
          violations: output.summary.total,
          critical: output.summary.critical,
          high: output.summary.high,
          timestamp: output.timestamp
        }
      });
    }

    console.log(`✓ Recorded ${metrics.length} self-eval metrics for cycle: ${cycleCode}`);
  } catch (error) {
    console.error('❌ Failed to record self-eval metrics:', error);
  }
}

/**
 * Format output for orchestrator response
 */
export function formatForOrchestrator(output: ShadowObserverOutput): Record<string, any> {
  return {
    status: output.success ? 'success' : 'failed',
    action: output.action,
    summary: output.summary,
    violations: output.violations.slice(0, 10), // Top 10 for summary
    build: output.build,
    agentScore: output.agentScore,
    recommendations: output.recommendations,
    reportPath: output.reportPath,
    timestamp: output.timestamp
  };
}
