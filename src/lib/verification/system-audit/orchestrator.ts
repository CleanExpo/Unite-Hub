/**
 * System Audit Orchestrator - Phase 3
 * Task-007: Verification System - Phased Implementation
 *
 * Runs 70+ automated checks across 7 categories and generates
 * comprehensive audit reports with remediation tasks.
 */

import {
  VerificationResult,
  SystemAuditResult,
  CategoryAuditResult,
  AuditCheck,
  RemediationTask,
  AuditCategory,
  VerificationStatus,
} from '../types';
import { allChecks, checksByCategory, CheckDefinition } from './checks';

// ============================================================================
// Audit Configuration
// ============================================================================

interface AuditConfig {
  categories?: AuditCategory[];
  parallel?: boolean;
  fail_fast?: boolean;
  timeout_ms?: number;
}

const DEFAULT_CONFIG: Required<AuditConfig> = {
  categories: [
    'architecture',
    'backend',
    'frontend',
    'api_integrations',
    'data_integrity',
    'security',
    'compliance',
  ],
  parallel: true,
  fail_fast: false,
  timeout_ms: 30000,
};

// ============================================================================
// Priority Mapping
// ============================================================================

function getPriority(category: AuditCategory, status: VerificationStatus): RemediationTask['priority'] {
  // Security and data integrity failures are critical
  if ((category === 'security' || category === 'data_integrity') && status === 'failed') {
    return 'critical';
  }
  // Failed checks in core categories are high priority
  if (status === 'failed') {
    return 'high';
  }
  // Warnings are medium priority
  if (status === 'warning') {
    return 'medium';
  }
  return 'low';
}

function getEstimatedEffort(checkId: string, autoFixable: boolean): RemediationTask['estimated_effort'] {
  if (autoFixable) {
return 'minutes';
}

  // Some checks require more effort
  const highEffortChecks = ['arch-001', 'back-001', 'sec-007'];
  if (highEffortChecks.includes(checkId)) {
    return 'hours';
  }

  return 'hours';
}

// ============================================================================
// Orchestrator Functions
// ============================================================================

/**
 * Run a single check with timeout
 */
async function runCheckWithTimeout(
  check: CheckDefinition,
  timeoutMs: number
): Promise<AuditCheck> {
  const timeoutPromise = new Promise<AuditCheck>((_, reject) => {
    setTimeout(() => reject(new Error('Check timeout')), timeoutMs);
  });

  const checkPromise = (async (): Promise<AuditCheck> => {
    try {
      const result = await check.check();
      return {
        id: check.id,
        name: check.name,
        category: check.category,
        status: result.status,
        message: result.message,
        details: result.details,
        documentation_url: check.documentation_url,
        auto_fixable: check.auto_fixable,
      };
    } catch (error) {
      return {
        id: check.id,
        name: check.name,
        category: check.category,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Check failed with error',
        auto_fixable: check.auto_fixable,
      };
    }
  })();

  try {
    return await Promise.race([checkPromise, timeoutPromise]);
  } catch {
    return {
      id: check.id,
      name: check.name,
      category: check.category,
      status: 'skipped',
      message: 'Check timed out',
      auto_fixable: check.auto_fixable,
    };
  }
}

/**
 * Run checks for a single category
 */
async function runCategoryChecks(
  category: AuditCategory,
  config: Required<AuditConfig>
): Promise<CategoryAuditResult> {
  const checks = checksByCategory[category] || [];
  const results: AuditCheck[] = [];

  if (config.parallel) {
    // Run all checks in parallel
    const promises = checks.map((check) => runCheckWithTimeout(check, config.timeout_ms));
    const checkResults = await Promise.all(promises);
    results.push(...checkResults);
  } else {
    // Run checks sequentially
    for (const check of checks) {
      const result = await runCheckWithTimeout(check, config.timeout_ms);
      results.push(result);

      // Fail fast if configured
      if (config.fail_fast && result.status === 'failed') {
        break;
      }
    }
  }

  // Calculate counts
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  return {
    name: formatCategoryName(category),
    total: results.length,
    passed,
    failed,
    warnings,
    checks: results,
  };
}

/**
 * Format category name for display
 */
function formatCategoryName(category: AuditCategory): string {
  const names: Record<AuditCategory, string> = {
    architecture: 'Architecture',
    backend: 'Backend',
    frontend: 'Frontend',
    api_integrations: 'API Integrations',
    data_integrity: 'Data Integrity',
    security: 'Security',
    compliance: 'Compliance',
  };
  return names[category] || category;
}

/**
 * Generate remediation tasks from failed checks
 */
function generateRemediationTasks(
  categoryResults: Record<AuditCategory, CategoryAuditResult>
): RemediationTask[] {
  const tasks: RemediationTask[] = [];

  for (const [category, result] of Object.entries(categoryResults)) {
    for (const check of result.checks) {
      if (check.status === 'failed' || check.status === 'warning') {
        tasks.push({
          check_id: check.id,
          priority: getPriority(category as AuditCategory, check.status),
          title: `Fix: ${check.name}`,
          description: check.message,
          estimated_effort: getEstimatedEffort(check.id, check.auto_fixable),
          auto_fix_available: check.auto_fixable,
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder: Record<RemediationTask['priority'], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return tasks;
}

// ============================================================================
// Main Audit Function
// ============================================================================

/**
 * Run a full system audit
 */
export async function runSystemAudit(
  config: AuditConfig = {}
): Promise<VerificationResult<SystemAuditResult>> {
  const startTime = Date.now();
  const mergedConfig: Required<AuditConfig> = { ...DEFAULT_CONFIG, ...config };

  const categoryResults: Partial<Record<AuditCategory, CategoryAuditResult>> = {};

  // Run checks for each category
  if (mergedConfig.parallel) {
    // Run all categories in parallel
    const categoryPromises = mergedConfig.categories.map(async (category) => {
      const result = await runCategoryChecks(category, mergedConfig);
      return { category, result };
    });

    const results = await Promise.all(categoryPromises);
    for (const { category, result } of results) {
      categoryResults[category] = result;
    }
  } else {
    // Run categories sequentially
    for (const category of mergedConfig.categories) {
      const result = await runCategoryChecks(category, mergedConfig);
      categoryResults[category] = result;
    }
  }

  // Calculate totals
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  let skipped = 0;
  const criticalFailures: AuditCheck[] = [];

  for (const result of Object.values(categoryResults)) {
    if (!result) {
continue;
}
    totalChecks += result.total;
    passed += result.passed;
    failed += result.failed;
    warnings += result.warnings;
    skipped += result.total - result.passed - result.failed - result.warnings;

    // Collect critical failures
    const criticalChecks = result.checks.filter(
      (c) =>
        c.status === 'failed' &&
        (result.name === 'Security' || result.name === 'Data Integrity')
    );
    criticalFailures.push(...criticalChecks);
  }

  const passRate = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

  // Generate remediation tasks
  const remediationTasks = generateRemediationTasks(
    categoryResults as Record<AuditCategory, CategoryAuditResult>
  );

  // Fill in any missing categories with empty results
  const fullCategoryResults: Record<AuditCategory, CategoryAuditResult> = {} as Record<
    AuditCategory,
    CategoryAuditResult
  >;
  for (const category of mergedConfig.categories) {
    fullCategoryResults[category] = categoryResults[category] || {
      name: formatCategoryName(category),
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };
  }

  const auditResult: SystemAuditResult = {
    total_checks: totalChecks,
    passed,
    failed,
    warnings,
    skipped,
    pass_rate: passRate,
    categories: fullCategoryResults,
    critical_failures: criticalFailures,
    remediation_tasks: remediationTasks,
    last_run: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  };

  // Determine overall status
  const hasCriticalFailures = criticalFailures.length > 0;
  const status: VerificationStatus = hasCriticalFailures
    ? 'failed'
    : passRate >= 80
      ? 'passed'
      : passRate >= 60
        ? 'warning'
        : 'failed';

  return {
    status,
    passed: status === 'passed',
    message: `System audit complete: ${passRate}% pass rate (${passed}/${totalChecks} checks)`,
    data: auditResult,
    errors:
      criticalFailures.length > 0
        ? criticalFailures.map((c) => ({
            code: c.id,
            message: c.message,
            severity: 'critical' as const,
          }))
        : undefined,
    warnings:
      warnings > 0 ? [`${warnings} warning(s) require attention`] : undefined,
    suggestions:
      remediationTasks.length > 0
        ? [`${remediationTasks.length} remediation task(s) identified`]
        : undefined,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Run audit for specific categories only
 */
export async function runCategoryAudit(
  categories: AuditCategory[],
  config: Omit<AuditConfig, 'categories'> = {}
): Promise<VerificationResult<SystemAuditResult>> {
  return runSystemAudit({ ...config, categories });
}

/**
 * Run a quick health check (critical checks only)
 */
export async function runQuickHealthCheck(): Promise<{
  healthy: boolean;
  issues: string[];
}> {
  const criticalChecks = allChecks.filter(
    (c) => c.category === 'security' || c.category === 'backend'
  );

  const issues: string[] = [];

  for (const check of criticalChecks.slice(0, 10)) {
    // Run first 10 critical checks
    try {
      const result = await check.check();
      if (result.status === 'failed') {
        issues.push(`${check.name}: ${result.message}`);
      }
    } catch {
      issues.push(`${check.name}: Check error`);
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
  };
}

/**
 * Get audit summary for display
 */
export function formatAuditSummary(result: SystemAuditResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('SYSTEM AUDIT REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Pass Rate: ${result.pass_rate}%`);
  lines.push(`Total Checks: ${result.total_checks}`);
  lines.push(`  ✅ Passed: ${result.passed}`);
  lines.push(`  ❌ Failed: ${result.failed}`);
  lines.push(`  ⚠️  Warnings: ${result.warnings}`);
  lines.push(`  ⏭️  Skipped: ${result.skipped}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('CATEGORY BREAKDOWN');
  lines.push('-'.repeat(60));

  for (const [, categoryResult] of Object.entries(result.categories)) {
    const pct = Math.round((categoryResult.passed / categoryResult.total) * 100) || 0;
    lines.push(
      `${categoryResult.name.padEnd(20)} ${pct}% (${categoryResult.passed}/${categoryResult.total})`
    );
  }

  if (result.critical_failures.length > 0) {
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('⚠️  CRITICAL FAILURES');
    lines.push('-'.repeat(60));
    for (const failure of result.critical_failures) {
      lines.push(`• ${failure.name}: ${failure.message}`);
    }
  }

  if (result.remediation_tasks.length > 0) {
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('REMEDIATION TASKS');
    lines.push('-'.repeat(60));
    for (const task of result.remediation_tasks.slice(0, 10)) {
      const priority = task.priority.toUpperCase().padEnd(8);
      lines.push(`[${priority}] ${task.title}`);
    }
    if (result.remediation_tasks.length > 10) {
      lines.push(`... and ${result.remediation_tasks.length - 10} more tasks`);
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push(`Completed in ${result.duration_ms}ms at ${result.last_run}`);
  lines.push('='.repeat(60));

  return lines.join('\n');
}

export default {
  runSystemAudit,
  runCategoryAudit,
  runQuickHealthCheck,
  formatAuditSummary,
};
