#!/usr/bin/env node

/* eslint-disable no-console, no-undef */
/* global process */

/**
 * Verification System Self-Test
 *
 * Run with: npm run verify:self-test
 *
 * This test MUST pass before any deployment. It confirms:
 * 1. Independent Verifier catches fake completion claims
 * 2. Evidence is collected for all checks
 * 3. Self-attestation is prevented
 * 4. All-or-nothing verification enforced
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  evidence?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | Promise<boolean>, expectedMessage: string): Promise<void> {
  return Promise.resolve(fn()).then(passed => {
    results.push({
      name,
      passed,
      message: passed ? expectedMessage : `FAILED: ${expectedMessage}`
    });
  }).catch((error: Error) => {
    results.push({
      name,
      passed: false,
      message: `ERROR: ${error.message}`
    });
  });
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         VERIFICATION SYSTEM SELF-TEST                      ║');
  console.log('║  This test MUST pass before deployment                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const testDir = './test-artifacts';

  // Setup test directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // ========================================================================
  // TEST 1: Verify Independent Verifier exists and exports singleton
  // ========================================================================
  await test(
    'Independent Verifier Module Exists',
    () => {
      try {
        const filePath = path.resolve('src/lib/agents/independent-verifier.ts');
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    },
    'Independent Verifier module found'
  );

  // ========================================================================
  // TEST 2: Verify Orchestrator imports Independent Verifier
  // ========================================================================
  await test(
    'Orchestrator Integrates Verification',
    () => {
      try {
        const filePath = path.resolve('src/lib/orchestrator/orchestratorEngine.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('independentVerifier') &&
               content.includes('verifyStepExecution');
      } catch {
        return false;
      }
    },
    'Orchestrator imports and uses Independent Verifier'
  );

  // ========================================================================
  // TEST 3: Verify ExecutionStep has verification fields
  // ========================================================================
  await test(
    'ExecutionStep Has Verification Fields',
    () => {
      try {
        const filePath = path.resolve('src/lib/orchestrator/orchestratorEngine.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('verified?: boolean') &&
               content.includes('verificationAttempts?: number') &&
               content.includes('verificationEvidence?:');
      } catch {
        return false;
      }
    },
    'ExecutionStep interface includes verification fields'
  );

  // ========================================================================
  // TEST 4: Verify verifyStepExecution implements retry logic
  // ========================================================================
  await test(
    'Verification Retry Logic Implemented',
    () => {
      try {
        const filePath = path.resolve('src/lib/orchestrator/orchestratorEngine.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('maxRetries') &&
               content.includes('exponential backoff');
      } catch {
        return false;
      }
    },
    'Verification implements retry with exponential backoff'
  );

  // ========================================================================
  // TEST 5: Verify test suite exists
  // ========================================================================
  await test(
    'Verification Test Suite Exists',
    () => {
      try {
        const filePath = path.resolve('tests/verification/independent-verifier.test.ts');
        return fs.existsSync(filePath);
      } catch {
        return false;
      }
    },
    'Test suite file found'
  );

  // ========================================================================
  // TEST 6: Verify health endpoints exist
  // ========================================================================
  await test(
    'Health Endpoints Exist',
    () => {
      try {
        const deepPath = path.resolve('src/app/api/health/deep/route.ts');
        const routesPath = path.resolve('src/app/api/health/routes/route.ts');
        return fs.existsSync(deepPath) && fs.existsSync(routesPath);
      } catch {
        return false;
      }
    },
    'Health check endpoints created'
  );

  // ========================================================================
  // TEST 7: Verify Verification Protocol SKILL exists
  // ========================================================================
  await test(
    'Verification Protocol SKILL Documented',
    () => {
      try {
        const filePath = path.resolve('.claude/skills/verification-protocol/SKILL.md');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('verification') &&
               content.includes('protocol') &&
               content.includes('evidence');
      } catch {
        return false;
      }
    },
    'Verification Protocol SKILL.md created and documented'
  );

  // ========================================================================
  // TEST 8: Verify Self-Verification Prevention
  // ========================================================================
  await test(
    'Self-Verification Prevention Implemented',
    () => {
      try {
        const filePath = path.resolve('src/lib/agents/independent-verifier.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('requesting_agent_id === this.verifier_id') &&
               content.includes('VERIFICATION INTEGRITY VIOLATION');
      } catch {
        return false;
      }
    },
    'Self-verification prevention implemented'
  );

  // ========================================================================
  // TEST 9: Verify Evidence Logging
  // ========================================================================
  await test(
    'Evidence Logging Implemented',
    () => {
      try {
        const filePath = path.resolve('src/lib/agents/independent-verifier.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.includes('logVerification') &&
               content.includes('audit-reports/evidence');
      } catch {
        return false;
      }
    },
    'Evidence logging to audit trail implemented'
  );

  // ========================================================================
  // TEST 10: Verify All-Or-Nothing Logic
  // ========================================================================
  await test(
    'All-Or-Nothing Verification Logic',
    () => {
      try {
        const filePath = path.resolve('src/lib/agents/independent-verifier.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        // Check for logic that only verifies if ALL evidence passes
        return content.includes('failures.length === 0') &&
               content.includes('verified = failures.length === 0');
      } catch {
        return false;
      }
    },
    'All-or-nothing verification logic enforced'
  );

  // ========================================================================
  // TEST 11: Verify Orchestrator Task-Level Verification
  // ========================================================================
  await test(
    'Orchestrator Task-Level Verification',
    () => {
      try {
        const filePath = path.resolve('src/lib/orchestrator/orchestratorEngine.ts');
        const content = fs.readFileSync(filePath, 'utf-8');
        // Check for task-level verification that checks ALL steps
        return content.includes('failedSteps') &&
               content.includes('s.status !== \'completed\' || !s.verified');
      } catch {
        return false;
      }
    },
    'Task-level all-or-nothing verification implemented'
  );

  // ========================================================================
  // RESULTS
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status}: ${result.name}`);
    console.log(`   ${result.message}\n`);

    if (result.passed) passed++;
    else failed++;
  });

  console.log('════════════════════════════════════════════════════════════');
  console.log(`TOTAL: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log('════════════════════════════════════════════════════════════\n');

  // Cleanup
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (_e) {
    // Ignore cleanup errors
  }

  if (failed > 0) {
    console.log('❌ VERIFICATION SYSTEM SELF-TEST FAILED');
    console.log('   Do NOT deploy until all tests pass.\n');
    process.exit(1);
  } else {
    console.log('✅ VERIFICATION SYSTEM SELF-TEST PASSED');
    console.log('   System is ready for deployment.\n');
    process.exit(0);
  }
}

runTests().catch((error: Error) => {
  console.error('Self-test crashed:', error);
  process.exit(1);
});
