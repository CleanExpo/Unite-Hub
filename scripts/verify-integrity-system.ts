/* eslint-disable no-console, no-undef */
/* global process */

/**
 * Verification Script for Phase 3: Completion Integrity System
 *
 * Verifies that all components are properly installed and functional
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface VerificationResult {
  component: string;
  status: 'pass' | 'fail';
  message: string;
}

async function verifyFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function verifyIntegritySystem(): Promise<void> {
  const results: VerificationResult[] = [];

  console.log('=== Phase 3: Completion Integrity System Verification ===\n');

  // 1. Check core files
  const coreFiles = [
    'src/lib/integrity/index.ts',
    'src/lib/integrity/milestone-definitions.ts',
    'src/lib/integrity/checkpoint-validators.ts',
    'src/lib/integrity/completion-gates.ts',
    'src/lib/integrity/progress-reporter.ts',
  ];

  for (const file of coreFiles) {
    const filePath = path.resolve(process.cwd(), file);
    const exists = await verifyFileExists(filePath);

    results.push({
      component: file,
      status: exists ? 'pass' : 'fail',
      message: exists ? 'File exists' : 'File missing',
    });
  }

  // 2. Check test file
  const testFile = 'tests/integrity/completion-integrity.test.ts';
  const testPath = path.resolve(process.cwd(), testFile);
  const testExists = await verifyFileExists(testPath);

  results.push({
    component: testFile,
    status: testExists ? 'pass' : 'fail',
    message: testExists ? 'Test file exists' : 'Test file missing',
  });

  // 3. Check orchestrator integration
  const orchestratorFile = 'src/lib/orchestrator/orchestratorEngine.ts';
  const orchestratorPath = path.resolve(process.cwd(), orchestratorFile);
  const orchestratorExists = await verifyFileExists(orchestratorPath);

  if (orchestratorExists) {
    const content = await fs.readFile(orchestratorPath, 'utf-8');
    const hasIntegrity = content.includes("import * as milestones from '@/lib/integrity/milestone-definitions'");

    results.push({
      component: 'Orchestrator Integration',
      status: hasIntegrity ? 'pass' : 'fail',
      message: hasIntegrity ? 'Integration imports present' : 'Integration missing',
    });
  }

  // 4. Check documentation
  const docFiles = [
    'docs/COMPLETION_INTEGRITY_SYSTEM.md',
    'PHASE_3_COMPLETION_SUMMARY.md',
  ];

  for (const file of docFiles) {
    const filePath = path.resolve(process.cwd(), file);
    const exists = await verifyFileExists(filePath);

    results.push({
      component: file,
      status: exists ? 'pass' : 'fail',
      message: exists ? 'Documentation exists' : 'Documentation missing',
    });
  }

  // 5. Check module exports
  try {
    const integrityIndex = await import('../src/lib/integrity/index.js');

    const hasExports = [
      'defineMilestone',
      'validateCheckpoint',
      'canTaskComplete',
      'reportProgress',
    ].every(fn => typeof integrityIndex[fn] === 'function');

    results.push({
      component: 'Module Exports',
      status: hasExports ? 'pass' : 'fail',
      message: hasExports ? 'All key functions exported' : 'Missing exports',
    });
  } catch (error) {
    results.push({
      component: 'Module Exports',
      status: 'fail',
      message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Display results
  console.log('Component Verification:\n');

  for (const result of results) {
    const icon = result.status === 'pass' ? '✓' : '✗';
    const color = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${icon}${reset} ${result.component}`);
    console.log(`   ${result.message}\n`);
  }

  // Summary
  const passed = results.filter(r => r.status === 'pass').length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('\n=== Summary ===');
  console.log(`Passed: ${passed}/${total} (${percentage}%)`);

  if (passed === total) {
    console.log('\n✓ Phase 3 verification PASSED - System ready for use');
  } else {
    console.log('\n✗ Phase 3 verification FAILED - Please review errors above');
    process.exit(1);
  }
}

// Run verification
verifyIntegritySystem().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
