/**
 * Independent Verifier Agent
 *
 * PURPOSE: Eliminate self-attestation by providing independent verification
 * of task completion. This agent CANNOT be the same agent that performed the work.
 *
 * CRITICAL RULES:
 * 1. Never trust self-reported status from other agents
 * 2. Perform actual checks (file exists, tests pass, endpoints respond)
 * 3. Collect evidence for every verification
 * 4. Return structured results with proof
 */

import { existsSync, statSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================================
// Types
// ============================================================================

export interface VerificationRequest {
  task_id: string;
  claimed_outputs: ClaimedOutput[];
  completion_criteria: CompletionCriterion[];
  requesting_agent_id: string;
}

export interface ClaimedOutput {
  type: 'file' | 'endpoint' | 'test' | 'build' | 'other';
  path: string;
  description: string;
}

export interface CompletionCriterion {
  type: VerificationType;
  target: string;
  expected?: string;
  threshold?: number;
}

export type VerificationType =
  | 'file_exists'
  | 'file_not_empty'
  | 'no_placeholders'
  | 'code_compiles'
  | 'lint_passes'
  | 'tests_pass'
  | 'endpoint_responds'
  | 'response_time'
  | 'content_contains'
  | 'content_not_contains';

export interface VerificationEvidence {
  criterion: string;
  type: VerificationType;
  method: string;
  result: 'pass' | 'fail';
  proof: string;
  timestamp: string;
  duration_ms: number;
}

export interface VerificationResult {
  verified: boolean;
  task_id: string;
  evidence: VerificationEvidence[];
  failures: VerificationFailure[];
  verifier_id: string;
  requesting_agent_id: string;
  timestamp: string;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
}

export interface VerificationFailure {
  criterion: string;
  type: VerificationType;
  reason: string;
  expected: string;
  actual: string;
}

// ============================================================================
// Placeholder Patterns to Detect
// ============================================================================

const PLACEHOLDER_PATTERNS = [
  /TODO(?::|$|\s)/gi,
  /TBD(?::|$|\s)/gi,
  /FIXME(?::|$|\s)/gi,
  /\[INSERT\s+.*?\]/gi,
  /\[PLACEHOLDER\]/gi,
  /XXX(?::|$|\s)/gi,
  /HACK(?::|$|\s)/gi,
  /<<<.*?>>>/g,
  /\{\{.*?\}\}/g,
  /\$\{.*?TODO.*?\}/gi,
  /NotImplementedError/g,
  /throw new Error\(['"]Not implemented['"]\)/gi,
  /pass\s*#\s*TODO/gi,
];

// ============================================================================
// Independent Verifier Class
// ============================================================================

export class IndependentVerifier {
  private readonly verifierId: string;

  constructor() {
    // Generate unique verifier ID to prove independence
    this.verifierId = `verifier_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Main verification entry point
   * Verifies ALL criteria and collects evidence for each
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const _startTime = Date.now();
    const evidence: VerificationEvidence[] = [];
    const failures: VerificationFailure[] = [];

    // CRITICAL: Verify we are not the requesting agent
    if (request.requesting_agent_id === this.verifierId) {
      throw new Error(
        'VERIFICATION INTEGRITY ERROR: Agent cannot verify its own work. ' +
          `Requesting agent: ${request.requesting_agent_id}, Verifier: ${this.verifierId}`
      );
    }

    // Verify each criterion
    for (const criterion of request.completion_criteria) {
      const result = await this.verifyCriterion(criterion);
      evidence.push(result.evidence);

      if (result.evidence.result === 'fail') {
        failures.push({
          criterion: criterion.target,
          type: criterion.type,
          reason: result.failureReason || 'Verification failed',
          expected: criterion.expected || 'pass',
          actual: result.evidence.proof,
        });
      }
    }

    // Also verify all claimed outputs exist
    for (const output of request.claimed_outputs) {
      if (output.type === 'file') {
        const fileCheck = await this.verifyFileExists(output.path);
        evidence.push(fileCheck.evidence);

        if (fileCheck.evidence.result === 'fail') {
          failures.push({
            criterion: `Claimed output: ${output.path}`,
            type: 'file_exists',
            reason: 'Claimed file does not exist',
            expected: 'file exists',
            actual: 'file not found',
          });
        }
      }
    }

    const passedChecks = evidence.filter((e) => e.result === 'pass').length;
    const failedChecks = evidence.filter((e) => e.result === 'fail').length;

    return {
      verified: failures.length === 0,
      task_id: request.task_id,
      evidence,
      failures,
      verifier_id: this.verifierId,
      requesting_agent_id: request.requesting_agent_id,
      timestamp: new Date().toISOString(),
      total_checks: evidence.length,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
    };
  }

  /**
   * Verify a single criterion
   */
  private async verifyCriterion(
    criterion: CompletionCriterion
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    switch (criterion.type) {
      case 'file_exists':
        return this.verifyFileExists(criterion.target);

      case 'file_not_empty':
        return this.verifyFileNotEmpty(criterion.target);

      case 'no_placeholders':
        return this.verifyNoPlaceholders(criterion.target);

      case 'code_compiles':
        return this.verifyCodeCompiles(criterion.target);

      case 'lint_passes':
        return this.verifyLintPasses(criterion.target);

      case 'tests_pass':
        return this.verifyTestsPass(criterion.target);

      case 'endpoint_responds':
        return this.verifyEndpointResponds(criterion.target, criterion.expected);

      case 'response_time':
        return this.verifyResponseTime(criterion.target, criterion.threshold || 500);

      case 'content_contains':
        return this.verifyContentContains(criterion.target, criterion.expected || '');

      case 'content_not_contains':
        return this.verifyContentNotContains(criterion.target, criterion.expected || '');

      default:
        return {
          evidence: {
            criterion: criterion.target,
            type: criterion.type,
            method: 'unknown',
            result: 'fail',
            proof: `Unknown verification type: ${criterion.type}`,
            timestamp: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          },
          failureReason: `Unknown verification type: ${criterion.type}`,
        };
    }
  }

  // ==========================================================================
  // Verification Methods
  // ==========================================================================

  /**
   * Verify file exists
   */
  private async verifyFileExists(
    filePath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();
    const exists = existsSync(filePath);

    let proof: string;
    let failureReason: string | undefined;

    if (exists) {
      const stats = statSync(filePath);
      proof = `File exists: ${filePath}, Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`;
    } else {
      proof = `File NOT found: ${filePath}`;
      failureReason = `File does not exist: ${filePath}`;
    }

    return {
      evidence: {
        criterion: filePath,
        type: 'file_exists',
        method: 'fs.existsSync(path)',
        result: exists ? 'pass' : 'fail',
        proof,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      failureReason,
    };
  }

  /**
   * Verify file is not empty
   */
  private async verifyFileNotEmpty(
    filePath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    if (!existsSync(filePath)) {
      return {
        evidence: {
          criterion: filePath,
          type: 'file_not_empty',
          method: 'fs.existsSync && fs.statSync.size > 0',
          result: 'fail',
          proof: `File does not exist: ${filePath}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: 'File does not exist',
      };
    }

    const stats = statSync(filePath);
    const isEmpty = stats.size === 0;

    return {
      evidence: {
        criterion: filePath,
        type: 'file_not_empty',
        method: 'fs.existsSync && fs.statSync.size > 0',
        result: isEmpty ? 'fail' : 'pass',
        proof: `File size: ${stats.size} bytes`,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      failureReason: isEmpty ? 'File is empty (0 bytes)' : undefined,
    };
  }

  /**
   * Verify file contains no placeholder text
   */
  private async verifyNoPlaceholders(
    filePath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    if (!existsSync(filePath)) {
      return {
        evidence: {
          criterion: filePath,
          type: 'no_placeholders',
          method: 'regex scan for TODO, TBD, FIXME, [INSERT], etc.',
          result: 'fail',
          proof: `File does not exist: ${filePath}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: 'File does not exist',
      };
    }

    const content = readFileSync(filePath, 'utf-8');
    const foundPlaceholders: { pattern: string; matches: string[]; lines: number[] }[] = [];

    for (const pattern of PLACEHOLDER_PATTERNS) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Find line numbers
        const lines: number[] = [];
        const contentLines = content.split('\n');
        contentLines.forEach((line, index) => {
          if (pattern.test(line)) {
            lines.push(index + 1);
          }
          // Reset regex lastIndex for global patterns
          pattern.lastIndex = 0;
        });

        foundPlaceholders.push({
          pattern: pattern.source,
          matches: matches.slice(0, 5), // Limit to first 5 matches
          lines,
        });
      }
    }

    const hasPlaceholders = foundPlaceholders.length > 0;

    return {
      evidence: {
        criterion: filePath,
        type: 'no_placeholders',
        method: 'regex scan for TODO, TBD, FIXME, [INSERT], etc.',
        result: hasPlaceholders ? 'fail' : 'pass',
        proof: hasPlaceholders
          ? `Found placeholders: ${JSON.stringify(foundPlaceholders)}`
          : 'No placeholder text found',
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      failureReason: hasPlaceholders
        ? `Found ${foundPlaceholders.length} placeholder patterns in file`
        : undefined,
    };
  }

  /**
   * Verify TypeScript code compiles
   */
  private async verifyCodeCompiles(
    filePath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(`npx tsc --noEmit ${filePath} 2>&1`);
      const output = stdout + stderr;
      const hasErrors = output.includes('error TS');

      return {
        evidence: {
          criterion: filePath,
          type: 'code_compiles',
          method: 'npx tsc --noEmit',
          result: hasErrors ? 'fail' : 'pass',
          proof: hasErrors ? output.substring(0, 1000) : 'TypeScript compilation successful',
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: hasErrors ? 'TypeScript compilation errors' : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        evidence: {
          criterion: filePath,
          type: 'code_compiles',
          method: 'npx tsc --noEmit',
          result: 'fail',
          proof: `Compilation check failed: ${errorMessage.substring(0, 500)}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: errorMessage,
      };
    }
  }

  /**
   * Verify lint passes
   */
  private async verifyLintPasses(
    filePath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(`npx eslint ${filePath} --format json 2>&1`);
      const output = stdout + stderr;

      let errorCount = 0;
      let warningCount = 0;

      try {
        const results = JSON.parse(output);
        if (Array.isArray(results)) {
          for (const result of results) {
            errorCount += result.errorCount || 0;
            warningCount += result.warningCount || 0;
          }
        }
      } catch {
        // If JSON parse fails, check for error patterns
        errorCount = (output.match(/error/gi) || []).length;
      }

      const passed = errorCount === 0;

      return {
        evidence: {
          criterion: filePath,
          type: 'lint_passes',
          method: 'npx eslint --format json',
          result: passed ? 'pass' : 'fail',
          proof: `Errors: ${errorCount}, Warnings: ${warningCount}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: passed ? undefined : `${errorCount} lint errors found`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // ESLint exits with code 1 on lint errors, which throws
      const hasErrors = errorMessage.includes('error') || errorMessage.includes('Error');
      return {
        evidence: {
          criterion: filePath,
          type: 'lint_passes',
          method: 'npx eslint --format json',
          result: hasErrors ? 'fail' : 'pass',
          proof: errorMessage.substring(0, 500),
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: hasErrors ? 'Lint errors found' : undefined,
      };
    }
  }

  /**
   * Verify tests pass
   */
  private async verifyTestsPass(
    testPath: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    try {
      // Determine test runner based on file extension and project
      const isTypeScript = testPath.endsWith('.ts') || testPath.endsWith('.tsx');
      const command = isTypeScript
        ? `npx vitest run ${testPath} --reporter=json 2>&1`
        : `npm test -- ${testPath} 2>&1`;

      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      const output = stdout + stderr;

      // Check for test failures
      const hasFailed =
        output.includes('FAIL') ||
        output.includes('failed') ||
        output.includes('Error:') ||
        output.includes('AssertionError');

      const passMatch = output.match(/(\d+)\s*pass/i);
      const failMatch = output.match(/(\d+)\s*fail/i);
      const passCount = passMatch ? parseInt(passMatch[1], 10) : 0;
      const failCount = failMatch ? parseInt(failMatch[1], 10) : 0;

      return {
        evidence: {
          criterion: testPath,
          type: 'tests_pass',
          method: command.split(' ')[0],
          result: hasFailed ? 'fail' : 'pass',
          proof: `Tests: ${passCount} passed, ${failCount} failed. Output: ${output.substring(0, 500)}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: hasFailed ? `${failCount} tests failed` : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        evidence: {
          criterion: testPath,
          type: 'tests_pass',
          method: 'test runner',
          result: 'fail',
          proof: `Test execution failed: ${errorMessage.substring(0, 500)}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: errorMessage,
      };
    }
  }

  /**
   * Verify endpoint responds
   */
  private async verifyEndpointResponds(
    endpoint: string,
    expectedStatus?: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const statusOk = expectedStatus ? response.status.toString() === expectedStatus : response.ok;

      const body = await response.text();
      const proof = `Status: ${response.status}, Body: ${body.substring(0, 200)}`;

      return {
        evidence: {
          criterion: endpoint,
          type: 'endpoint_responds',
          method: 'HTTP GET request',
          result: statusOk ? 'pass' : 'fail',
          proof,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: statusOk
          ? undefined
          : `Expected status ${expectedStatus || '2xx'}, got ${response.status}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        evidence: {
          criterion: endpoint,
          type: 'endpoint_responds',
          method: 'HTTP GET request',
          result: 'fail',
          proof: `Request failed: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: errorMessage,
      };
    }
  }

  /**
   * Verify response time is within threshold
   */
  private async verifyResponseTime(
    endpoint: string,
    thresholdMs: number
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    try {
      const requestStart = Date.now();
      await fetch(endpoint);
      const responseTime = Date.now() - requestStart;

      const withinThreshold = responseTime <= thresholdMs;

      return {
        evidence: {
          criterion: endpoint,
          type: 'response_time',
          method: `HTTP GET with ${thresholdMs}ms threshold`,
          result: withinThreshold ? 'pass' : 'fail',
          proof: `Response time: ${responseTime}ms (threshold: ${thresholdMs}ms)`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: withinThreshold
          ? undefined
          : `Response time ${responseTime}ms exceeds threshold ${thresholdMs}ms`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        evidence: {
          criterion: endpoint,
          type: 'response_time',
          method: `HTTP GET with ${thresholdMs}ms threshold`,
          result: 'fail',
          proof: `Request failed: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: errorMessage,
      };
    }
  }

  /**
   * Verify content contains expected string
   */
  private async verifyContentContains(
    filePath: string,
    expected: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    if (!existsSync(filePath)) {
      return {
        evidence: {
          criterion: filePath,
          type: 'content_contains',
          method: `Check file contains: "${expected}"`,
          result: 'fail',
          proof: `File does not exist: ${filePath}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
        failureReason: 'File does not exist',
      };
    }

    const content = readFileSync(filePath, 'utf-8');
    const contains = content.includes(expected);

    return {
      evidence: {
        criterion: filePath,
        type: 'content_contains',
        method: `Check file contains: "${expected.substring(0, 50)}..."`,
        result: contains ? 'pass' : 'fail',
        proof: contains ? `File contains expected content` : `Expected content not found in file`,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      failureReason: contains ? undefined : `Expected content "${expected}" not found`,
    };
  }

  /**
   * Verify content does NOT contain string
   */
  private async verifyContentNotContains(
    filePath: string,
    unwanted: string
  ): Promise<{ evidence: VerificationEvidence; failureReason?: string }> {
    const startTime = Date.now();

    if (!existsSync(filePath)) {
      return {
        evidence: {
          criterion: filePath,
          type: 'content_not_contains',
          method: `Check file does not contain: "${unwanted}"`,
          result: 'pass', // File doesn't exist, so it doesn't contain the unwanted string
          proof: `File does not exist: ${filePath}`,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        },
      };
    }

    const content = readFileSync(filePath, 'utf-8');
    const contains = content.includes(unwanted);

    return {
      evidence: {
        criterion: filePath,
        type: 'content_not_contains',
        method: `Check file does not contain: "${unwanted.substring(0, 50)}..."`,
        result: contains ? 'fail' : 'pass',
        proof: contains
          ? `File contains unwanted content`
          : `File does not contain unwanted content`,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      },
      failureReason: contains ? `Unwanted content "${unwanted}" found in file` : undefined,
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get the verifier ID (proves this is a different agent)
   */
  getVerifierId(): string {
    return this.verifierId;
  }

  /**
   * Quick verification for common scenarios
   */
  async quickVerify(
    taskId: string,
    requestingAgentId: string,
    filePaths: string[]
  ): Promise<VerificationResult> {
    const criteria: CompletionCriterion[] = [];
    const outputs: ClaimedOutput[] = [];

    for (const filePath of filePaths) {
      outputs.push({ type: 'file', path: filePath, description: `File: ${filePath}` });
      criteria.push({ type: 'file_exists', target: filePath });
      criteria.push({ type: 'file_not_empty', target: filePath });
      criteria.push({ type: 'no_placeholders', target: filePath });
    }

    return this.verify({
      task_id: taskId,
      claimed_outputs: outputs,
      completion_criteria: criteria,
      requesting_agent_id: requestingAgentId,
    });
  }
}

// Export singleton instance
export const independentVerifier = new IndependentVerifier();

// Export default
export default IndependentVerifier;
