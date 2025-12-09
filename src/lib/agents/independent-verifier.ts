/**
 * Independent Verifier Agent
 *
 * Verifies completion of tasks by OTHER agents without trusting their self-reported status.
 * CRITICAL: This agent must NEVER verify its own work.
 *
 * Rule: verified=true ONLY when evidence proves all criteria met
 * No assumptions. No "looks good probably." No skipping checks.
 */

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { createApiLogger } from '@/lib/logger';
import * as evidenceCollector from './evidence-collector';
import * as proofGenerator from './proof-generator';
import * as evidenceStorage from './evidence-storage';

const logger = createApiLogger({ context: 'IndependentVerifier' });

// ============================================================================
// TYPES
// ============================================================================

export interface VerificationRequest {
  task_id: string;
  claimed_outputs: string[];           // Paths/identifiers agent claims it created
  completion_criteria: string[];       // What must be true for task complete
  requesting_agent_id: string;         // Agent that did the work (we won't trust)
}

export interface VerificationEvidence {
  criterion: string;                   // What was checked
  method: string;                      // HOW it was checked (reproducible)
  result: 'pass' | 'fail';
  proof: string;                       // Evidence: file path, test output, response code, etc.
  checked_at: string;                  // ISO timestamp of verification
}

export interface VerificationResult {
  verified: boolean;                   // true ONLY if ALL criteria pass
  evidence: VerificationEvidence[];
  failures: Array<{                    // Detailed failure info for agent to fix
    criterion: string;
    reason: string;
    proof: string;
  }>;
  verifier_agent_id: string;           // Proves DIFFERENT agent verified
  timestamp: string;
  task_id: string;
  summary: string;
  evidence_package?: {                 // Cryptographic proof of verification
    path: string;
    checksum: string;
    merkle_root: string;
  };
}

// ============================================================================
// VERIFICATION METHODS
// ============================================================================

/**
 * Verify a file exists and has content
 */
async function verifyFileExists(filePath: string): Promise<VerificationEvidence> {
  try {
    const fullPath = resolve(filePath);
    const stats = await fs.stat(fullPath);

    if (stats.size === 0) {
      return {
        criterion: `file_exists: ${filePath}`,
        method: `fs.stat(${filePath}) && size > 0`,
        result: 'fail',
        proof: `File exists but is empty (0 bytes)`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `file_exists: ${filePath}`,
      method: `fs.stat(${filePath}) && size > 0`,
      result: 'pass',
      proof: `File: ${fullPath}, Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      criterion: `file_exists: ${filePath}`,
      method: `fs.stat(${filePath})`,
      result: 'fail',
      proof: `File not found or not accessible: ${error instanceof Error ? error.message : String(error)}`,
      checked_at: new Date().toISOString(),
    };
  }
}

/**
 * Verify file has no placeholder text (TODO, TBD, FIXME, [INSERT])
 */
async function verifyNoPlaceholders(filePath: string): Promise<VerificationEvidence> {
  const placeholderPatterns = [
    /TODO/i,
    /TBD/i,
    /FIXME/i,
    /\[INSERT.*?\]/i,
    /\[\s*TODO\s*\]/i,
    /\[\s*IMPLEMENT\s*\]/i,
    /\/\*\s*@todo/i,
  ];

  try {
    const fullPath = resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    const issues: string[] = [];
    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (pattern.test(lines[i])) {
            issues.push(`Line ${i + 1}: ${lines[i].trim().slice(0, 80)}`);
          }
        }
      }
    }

    if (issues.length > 0) {
      return {
        criterion: `no_placeholders: ${filePath}`,
        method: `Scan for TODO, TBD, FIXME, [INSERT] patterns`,
        result: 'fail',
        proof: `Found ${issues.length} placeholder(s):\n${issues.join('\n')}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `no_placeholders: ${filePath}`,
      method: `Regex scan for TODO, TBD, FIXME, [INSERT]`,
      result: 'pass',
      proof: `No placeholder text found in ${filePath}`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      criterion: `no_placeholders: ${filePath}`,
      method: `File scan`,
      result: 'fail',
      proof: `Could not read file: ${error instanceof Error ? error.message : String(error)}`,
      checked_at: new Date().toISOString(),
    };
  }
}

/**
 * Verify TypeScript file compiles without errors
 */
async function verifyTypeScriptCompiles(filePath: string): Promise<VerificationEvidence> {
  try {
    // Run tsc on the specific file
    const result = execSync(
      `npx tsc --noEmit "${resolve(filePath)}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    return {
      criterion: `typescript_compiles: ${filePath}`,
      method: `npx tsc --noEmit [file]`,
      result: 'pass',
      proof: `TypeScript compilation successful`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    const stderr = error instanceof Error ? error.message : String(error);
    return {
      criterion: `typescript_compiles: ${filePath}`,
      method: `npx tsc --noEmit [file]`,
      result: 'fail',
      proof: `Compilation failed:\n${stderr.slice(0, 500)}`,
      checked_at: new Date().toISOString(),
    };
  }
}

/**
 * Verify file passes ESLint
 */
async function verifyLintPasses(filePath: string): Promise<VerificationEvidence> {
  try {
    const result = execSync(
      `npx eslint "${resolve(filePath)}" --format json`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    // Parse JSON output
    let lintResults = [];
    try {
      lintResults = JSON.parse(result);
    } catch {
      // Sometimes eslint returns empty string on success
      lintResults = [];
    }

    const hasErrors = lintResults.some((r: any) => r.messages?.some((m: any) => m.severity === 2));

    if (hasErrors) {
      return {
        criterion: `lint_passes: ${filePath}`,
        method: `npx eslint [file] --format json`,
        result: 'fail',
        proof: `Linting errors found: ${JSON.stringify(lintResults.slice(0, 2))}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `lint_passes: ${filePath}`,
      method: `npx eslint [file]`,
      result: 'pass',
      proof: `ESLint passed with 0 errors`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    // eslint exits with code 1 on errors
    const stderr = error instanceof Error ? error.message : String(error);

    // Check if it's just linting errors (code 1) vs actual error
    if (stderr.includes('error') || stderr.includes('Error')) {
      return {
        criterion: `lint_passes: ${filePath}`,
        method: `npx eslint [file]`,
        result: 'fail',
        proof: `Linting failed: ${stderr.slice(0, 500)}`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `lint_passes: ${filePath}`,
      method: `npx eslint [file]`,
      result: 'pass',
      proof: `ESLint check completed`,
      checked_at: new Date().toISOString(),
    };
  }
}

/**
 * Verify specific tests pass
 */
async function verifyTestsPassing(testFile: string): Promise<VerificationEvidence> {
  try {
    const result = execSync(
      `npm test -- ${resolve(testFile)} --run`,
      { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 10 * 1024 * 1024 }
    );

    if (result.includes('PASS') || result.includes('passed')) {
      // Count passes
      const passMatch = result.match(/(\d+) passed/);
      const passCount = passMatch ? passMatch[1] : '?';

      return {
        criterion: `tests_pass: ${testFile}`,
        method: `npm test -- [file] --run`,
        result: 'pass',
        proof: `${passCount} tests passed`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `tests_pass: ${testFile}`,
      method: `npm test -- [file] --run`,
      result: 'fail',
      proof: `Tests did not pass: ${result.slice(0, 500)}`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      criterion: `tests_pass: ${testFile}`,
      method: `npm test -- [file] --run`,
      result: 'fail',
      proof: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
      checked_at: new Date().toISOString(),
    };
  }
}

/**
 * Verify API endpoint responds
 */
async function verifyEndpointResponds(endpoint: string, method: string = 'GET'): Promise<VerificationEvidence> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `http://localhost:3008${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return {
        criterion: `endpoint_responds: ${endpoint}`,
        method: `HTTP ${method} ${endpoint}`,
        result: 'pass',
        proof: `Status: ${response.status}, Content-Length: ${response.headers.get('content-length')} bytes`,
        checked_at: new Date().toISOString(),
      };
    }

    return {
      criterion: `endpoint_responds: ${endpoint}`,
      method: `HTTP ${method} ${endpoint}`,
      result: 'fail',
      proof: `HTTP ${response.status} - ${response.statusText}`,
      checked_at: new Date().toISOString(),
    };
  } catch (error) {
    return {
      criterion: `endpoint_responds: ${endpoint}`,
      method: `HTTP ${method} ${endpoint}`,
      result: 'fail',
      proof: `Request failed: ${error instanceof Error ? error.message : String(error)}`,
      checked_at: new Date().toISOString(),
    };
  }
}

// ============================================================================
// INDEPENDENT VERIFIER CLASS
// ============================================================================

export class IndependentVerifier {
  private verifier_id = 'independent-verifier-1';

  /**
   * Verify a task's claimed outputs meet all completion criteria
   *
   * CRITICAL: This method NEVER trusts the requesting agent
   * CRITICAL: verified=true ONLY when ALL evidence passes
   * CRITICAL: Self-verification is BLOCKED
   */
  async verify(request: VerificationRequest): Promise<VerificationResult> {
    // CRITICAL: Prevent self-verification (security violation)
    if (request.requesting_agent_id === this.verifier_id) {
      const error = {
        verified: false,
        evidence: [],
        failures: [
          {
            criterion: 'self_verification_check',
            reason: 'VERIFICATION INTEGRITY VIOLATION',
            proof: `Agent ${request.requesting_agent_id} cannot verify its own work. Verifier ID: ${this.verifier_id}`,
          },
        ],
        verifier_agent_id: this.verifier_id,
        timestamp: new Date().toISOString(),
        task_id: request.task_id,
        summary: '✗ VERIFICATION REJECTED - Self-verification attempt detected',
      };
      logger.error('Self-verification attempt blocked', {
        task_id: request.task_id,
        requesting_agent: request.requesting_agent_id,
        verifier_id: this.verifier_id,
      });
      return error;
    }

    logger.info('Verification request received', {
      task_id: request.task_id,
      criteria_count: request.completion_criteria.length,
      output_count: request.claimed_outputs.length,
      requesting_agent: request.requesting_agent_id,
    });

    const evidence: VerificationEvidence[] = [];
    const failures: Array<{ criterion: string; reason: string; proof: string }> = [];

    // Process each completion criterion
    for (const criterion of request.completion_criteria) {
      let criterionEvidence: VerificationEvidence | null = null;

      // Determine verification method based on criterion type
      if (criterion.startsWith('file_exists:')) {
        const filePath = criterion.replace('file_exists:', '').trim();
        criterionEvidence = await verifyFileExists(filePath);
      } else if (criterion.startsWith('no_placeholders:')) {
        const filePath = criterion.replace('no_placeholders:', '').trim();
        criterionEvidence = await verifyNoPlaceholders(filePath);
      } else if (criterion.startsWith('typescript_compiles:')) {
        const filePath = criterion.replace('typescript_compiles:', '').trim();
        criterionEvidence = await verifyTypeScriptCompiles(filePath);
      } else if (criterion.startsWith('lint_passes:')) {
        const filePath = criterion.replace('lint_passes:', '').trim();
        criterionEvidence = await verifyLintPasses(filePath);
      } else if (criterion.startsWith('tests_pass:')) {
        const testFile = criterion.replace('tests_pass:', '').trim();
        criterionEvidence = await verifyTestsPassing(testFile);
      } else if (criterion.startsWith('endpoint_responds:')) {
        const endpoint = criterion.replace('endpoint_responds:', '').trim();
        const [path, method] = endpoint.split('|').map(s => s.trim());
        criterionEvidence = await verifyEndpointResponds(path, method || 'GET');
      } else {
        // Unknown criterion type
        criterionEvidence = {
          criterion,
          method: 'unknown',
          result: 'fail',
          proof: `Unknown criterion type: ${criterion}`,
          checked_at: new Date().toISOString(),
        };
      }

      if (criterionEvidence) {
        evidence.push(criterionEvidence);

        if (criterionEvidence.result === 'fail') {
          failures.push({
            criterion: criterionEvidence.criterion,
            reason: `Verification method: ${criterionEvidence.method}`,
            proof: criterionEvidence.proof,
          });
        }
      }
    }

    // CRITICAL: Only return verified=true if ALL evidence passes
    const verified = failures.length === 0 && evidence.length > 0;

    // Collect evidence for audit trail
    let evidencePackageInfo: { path: string; checksum: string; merkle_root: string } | undefined;
    try {
      // Capture execution log
      await evidenceCollector.captureExecutionLog(request.task_id, evidence.map(e => ({
        step_id: `verify-${e.criterion}`,
        description: e.criterion,
        status: e.result === 'pass' ? 'completed' : 'failed',
        start_time: Date.now() - 1000,
        end_time: Date.now(),
        error: e.result === 'fail' ? e.proof : undefined,
      })), this.verifier_id);

      // Capture state snapshot
      const stateSnapshot = await evidenceCollector.captureStateSnapshot(
        request.task_id,
        'after',
        {
          verified,
          criteria_count: request.completion_criteria.length,
          passed_count: evidence.filter(e => e.result === 'pass').length,
          failed_count: failures.length,
        },
        this.verifier_id
      );

      // Get evidence package
      const pkg = await evidenceCollector.getEvidencePackage(request.task_id);

      // Generate cryptographic proof
      const proof = await proofGenerator.generateProofPackage(request.task_id, pkg);

      // Store evidence
      await evidenceStorage.storeEvidence(request.task_id, pkg, {
        verification_status: verified,
        verifier_id: this.verifier_id,
        proof_merkle_root: proof.merkle_root,
      }, this.verifier_id);

      evidencePackageInfo = {
        path: stateSnapshot,
        checksum: proof.checksums[stateSnapshot] || proof.hmac,
        merkle_root: proof.merkle_root,
      };

      logger.info('Evidence collected and stored', {
        task_id: request.task_id,
        merkle_root: proof.merkle_root,
      });
    } catch (error) {
      logger.warn('Failed to collect evidence', {
        task_id: request.task_id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue - evidence collection failure shouldn't block verification result
    }

    const result: VerificationResult = {
      verified,
      evidence,
      failures,
      verifier_agent_id: this.verifier_id,
      timestamp: new Date().toISOString(),
      task_id: request.task_id,
      summary: verified
        ? `✓ Task ${request.task_id} VERIFIED - All ${evidence.length} criteria passed`
        : `✗ Task ${request.task_id} FAILED - ${failures.length} of ${evidence.length} criteria failed`,
      evidence_package: evidencePackageInfo,
    };

    logger.info('Verification complete', {
      task_id: request.task_id,
      verified: result.verified,
      passed: evidence.filter(e => e.result === 'pass').length,
      failed: failures.length,
      evidence_collected: !!evidencePackageInfo,
    });

    return result;
  }

  /**
   * Get verifier identity for audit trail
   */
  getVerifierId(): string {
    return this.verifier_id;
  }

  /**
   * Log verification result to audit trail (immutable evidence storage)
   */
  async logVerification(result: VerificationResult): Promise<void> {
    try {
      const evidenceDir = 'audit-reports/evidence';
      const taskDir = `${evidenceDir}/${result.task_id}`;

      // Create directories if they don't exist
      await fs.mkdir(taskDir, { recursive: true });

      // Log individual verification with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFile = `${taskDir}/verification-${timestamp}.json`;

      await fs.writeFile(
        logFile,
        JSON.stringify(
          {
            ...result,
            logged_at: new Date().toISOString(),
            verifier_version: '1.0.0',
          },
          null,
          2
        )
      );

      logger.info('Verification logged', {
        task_id: result.task_id,
        file: logFile,
        verified: result.verified,
      });

      // Append to verification log for quick reference
      const logSummary = `${result.timestamp} | Task: ${result.task_id} | Verified: ${result.verified} | Evidence: ${result.evidence.length} | Failures: ${result.failures.length}\n`;
      const summaryFile = `${evidenceDir}/verification-log.jsonl`;
      await fs.appendFile(summaryFile, logSummary);
    } catch (error) {
      logger.error('Failed to log verification', {
        task_id: result.task_id,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - logging failure shouldn't block verification
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const independentVerifier = new IndependentVerifier();

/**
 * Factory function for testing with different verifier IDs
 */
export function createIndependentVerifier(verifierId?: string): IndependentVerifier {
  const verifier = new IndependentVerifier();
  if (verifierId) {
    (verifier as any).verifier_id = verifierId;
  }
  return verifier;
}
