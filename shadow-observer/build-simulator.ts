/**
 * Build Simulator
 * Non-destructive type check, lint, and build validation
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { shadowConfig } from './shadow-config';

export interface BuildCheckResult {
  typeCheckPass: boolean;
  lintPass: boolean;
  testPass: boolean;
  buildPass: boolean;
  performance: {
    typeCheckTime: number;
    lintTime: number;
    testTime: number;
    buildTime: number;
  };
  errors: Array<{
    stage: string;
    message: string;
    details?: string;
  }>;
  timestamp: string;
}

function safeRun(
  cmd: string,
  label: string
): { success: boolean; time: number; error?: string } {
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'ignore', timeout: 300000 }); // 5 min timeout
    const time = Date.now() - start;
    console.log(`  ✓ ${label} passed (${time}ms)`);
    return { success: true, time };
  } catch (error: any) {
    const time = Date.now() - start;
    console.log(`  ✗ ${label} failed (${time}ms)`);
    return {
      success: false,
      time,
      error: error.message || String(error)
    };
  }
}

/**
 * Run build simulation (type check, lint, test, build)
 */
export async function simulateBuild(): Promise<BuildCheckResult> {
  const result: BuildCheckResult = {
    typeCheckPass: false,
    lintPass: false,
    testPass: false,
    buildPass: false,
    performance: {
      typeCheckTime: 0,
      lintTime: 0,
      testTime: 0,
      buildTime: 0
    },
    errors: [],
    timestamp: new Date().toISOString()
  };

  console.log('🏗️  Simulating build pipeline...');

  // Step 1: Type check
  console.log('  [1/4] Running type check...');
  const typeCheck = safeRun('npm run typecheck', 'Type check');
  result.typeCheckPass = typeCheck.success;
  result.performance.typeCheckTime = typeCheck.time;
  if (!typeCheck.success && typeCheck.error) {
    result.errors.push({
      stage: 'typecheck',
      message: 'TypeScript compilation failed',
      details: typeCheck.error
    });
  }

  // Step 2: Lint
  console.log('  [2/4] Running linter...');
  const lint = safeRun('npm run lint', 'Lint');
  result.lintPass = lint.success;
  result.performance.lintTime = lint.time;
  if (!lint.success && lint.error) {
    result.errors.push({
      stage: 'lint',
      message: 'ESLint validation failed',
      details: lint.error
    });
  }

  // Step 3: Unit tests
  console.log('  [3/4] Running unit tests...');
  const test = safeRun('npm run test:unit', 'Unit tests');
  result.testPass = test.success;
  result.performance.testTime = test.time;
  if (!test.success && test.error) {
    result.errors.push({
      stage: 'test',
      message: 'Unit tests failed',
      details: test.error
    });
  }

  // Step 4: Build
  console.log('  [4/4] Running production build...');
  const build = safeRun('npm run build', 'Build');
  result.buildPass = build.success;
  result.performance.buildTime = build.time;
  if (!build.success && build.error) {
    result.errors.push({
      stage: 'build',
      message: 'Production build failed',
      details: build.error
    });
  }

  // Check performance warnings
  if (result.performance.buildTime > shadowConfig.thresholds.buildTimeWarning) {
    result.errors.push({
      stage: 'performance',
      message: `Build time ${result.performance.buildTime}ms exceeds warning threshold`,
      details: `Consider: code splitting, lazy loading, or caching optimization`
    });
  }

  return result;
}

/**
 * Save build result
 */
export async function saveBuildReport(result: BuildCheckResult): Promise<void> {
  const reportPath = path.join(shadowConfig.reportDir, 'build_simulation.json');

  if (!fs.existsSync(shadowConfig.reportDir)) {
    fs.mkdirSync(shadowConfig.reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`✓ Build report saved: ${reportPath}`);
}

export async function main() {
  try {
    const result = await simulateBuild();
    await saveBuildReport(result);

    console.log('\n📊 Build Simulation Summary:');
    console.log(`  Type Check:  ${result.typeCheckPass ? '✓' : '✗'} (${result.performance.typeCheckTime}ms)`);
    console.log(`  Lint:        ${result.lintPass ? '✓' : '✗'} (${result.performance.lintTime}ms)`);
    console.log(`  Tests:       ${result.testPass ? '✓' : '✗'} (${result.performance.testTime}ms)`);
    console.log(`  Build:       ${result.buildPass ? '✓' : '✗'} (${result.performance.buildTime}ms)`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors found: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.log(`  - ${err.stage}: ${err.message}`);
      });
    }

    const allPass = result.typeCheckPass && result.lintPass && result.testPass && result.buildPass;
    console.log(`\n${allPass ? '✓ All checks passed' : '✗ Some checks failed'}`);

    return result;
  } catch (error) {
    console.error('❌ Build simulation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
