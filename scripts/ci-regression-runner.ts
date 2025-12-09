/**
 * CI Regression Runner
 * v1.1.1 Stabilisation - Automated regression suite for CI pipelines
 *
 * Executes:
 * - Global regression suite
 * - Performance audit
 * - Reliability matrix
 * - Error surface scan
 */

import * as fs from 'fs';
import * as path from 'path';

interface RegressionResult {
  suite: string;
  passed: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
}

interface RegressionReport {
  timestamp: string;
  version: string;
  overall: 'pass' | 'fail' | 'warn';
  results: RegressionResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

const CRITICAL_FILES = [
  'src/lib/supabase.ts',
  'src/contexts/AuthContext.tsx',
  'src/app/api/health/route.ts',
  'src/lib/email/email-service.ts',
];

const CRITICAL_PATTERNS = [
  { pattern: /supabaseAdmin/g, file: 'src/lib/supabase.ts', description: 'Admin client export' },
  { pattern: /getSupabaseServer/g, file: 'src/lib/supabase.ts', description: 'Server client factory' },
  { pattern: /export const dynamic/g, file: 'src/app/(staff)/staff/layout.tsx', description: 'Dynamic rendering' },
];

async function runGlobalRegression(): Promise<RegressionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  console.log('📋 Running global regression suite...');

  // Check critical files exist
  for (const file of CRITICAL_FILES) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Critical file missing: ${file}`);
    }
  }

  // Check critical patterns
  for (const check of CRITICAL_PATTERNS) {
    const filePath = path.join(process.cwd(), check.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!check.pattern.test(content)) {
        errors.push(`Missing pattern in ${check.file}: ${check.description}`);
      }
    }
  }

  // Check package.json scripts
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const requiredScripts = ['dev', 'build', 'test', 'start'];
    for (const script of requiredScripts) {
      if (!packageJson.scripts?.[script]) {
        warnings.push(`Missing npm script: ${script}`);
      }
    }
  }

  return {
    suite: 'Global Regression',
    passed: errors.length === 0,
    duration: Date.now() - startTime,
    errors,
    warnings,
  };
}

async function runPerformanceAudit(): Promise<RegressionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  console.log('⚡ Running performance audit...');

  // Check for large files
  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    const checkLargeFiles = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.includes('node_modules')) {
          checkLargeFiles(filePath);
        } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
          const sizeKB = stat.size / 1024;
          if (sizeKB > 100) {
            warnings.push(`Large file (${sizeKB.toFixed(1)}KB): ${filePath.replace(process.cwd(), '')}`);
          }
        }
      }
    };
    checkLargeFiles(srcDir);
  }

  // Check for console.log in production code
  const grepForConsoleLogs = (dir: string): number => {
    let count = 0;
    if (!fs.existsSync(dir)) {
return 0;
}

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('__tests__')) {
        count += grepForConsoleLogs(filePath);
      } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(/console\.log\(/g);
        if (matches) {
count += matches.length;
}
      }
    }
    return count;
  };

  const consoleLogCount = grepForConsoleLogs(srcDir);
  if (consoleLogCount > 50) {
    warnings.push(`High console.log count: ${consoleLogCount} (consider removing for production)`);
  }

  return {
    suite: 'Performance Audit',
    passed: errors.length === 0,
    duration: Date.now() - startTime,
    errors,
    warnings,
  };
}

async function runReliabilityMatrix(): Promise<RegressionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  console.log('🔒 Running reliability matrix...');

  // Check environment variables documentation
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    warnings.push('Missing .env.example file');
  }

  // Check for error boundaries
  const errorBoundaryPattern = /ErrorBoundary|error\.tsx/;
  const appDir = path.join(process.cwd(), 'src/app');
  if (fs.existsSync(appDir)) {
    const hasErrorBoundary = fs.readdirSync(appDir).some(f => errorBoundaryPattern.test(f));
    if (!hasErrorBoundary) {
      warnings.push('No error boundary found in app directory');
    }
  }

  // Check for health endpoint
  const healthRoute = path.join(process.cwd(), 'src/app/api/health/route.ts');
  if (!fs.existsSync(healthRoute)) {
    errors.push('Health endpoint missing: /api/health');
  }

  // Check migrations directory
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    console.log(`  Found ${migrations.length} migrations`);
  } else {
    warnings.push('Migrations directory not found');
  }

  return {
    suite: 'Reliability Matrix',
    passed: errors.length === 0,
    duration: Date.now() - startTime,
    errors,
    warnings,
  };
}

async function runErrorSurfaceScan(): Promise<RegressionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const startTime = Date.now();

  console.log('🔍 Running error surface scan...');

  // Check for try-catch in API routes
  const apiDir = path.join(process.cwd(), 'src/app/api');
  if (fs.existsSync(apiDir)) {
    const checkApiRoutes = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          checkApiRoutes(filePath);
        } else if (file === 'route.ts') {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (!content.includes('try') || !content.includes('catch')) {
            warnings.push(`API route without try-catch: ${filePath.replace(process.cwd(), '')}`);
          }
        }
      }
    };
    checkApiRoutes(apiDir);
  }

  // Check TypeScript strict mode
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    if (!tsconfig.compilerOptions?.strict) {
      warnings.push('TypeScript strict mode is not enabled');
    }
  }

  return {
    suite: 'Error Surface Scan',
    passed: errors.length === 0,
    duration: Date.now() - startTime,
    errors,
    warnings,
  };
}

async function main() {
  console.log('🚀 CI Regression Runner v1.1.1\n');

  const results: RegressionResult[] = [];

  // Run all suites
  results.push(await runGlobalRegression());
  results.push(await runPerformanceAudit());
  results.push(await runReliabilityMatrix());
  results.push(await runErrorSurfaceScan());

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    warnings: results.reduce((acc, r) => acc + r.warnings.length, 0),
  };

  // Determine overall status
  let overall: 'pass' | 'fail' | 'warn' = 'pass';
  if (summary.failed > 0) {
overall = 'fail';
} else if (summary.warnings > 0) {
overall = 'warn';
}

  // Create report
  const report: RegressionReport = {
    timestamp: new Date().toISOString(),
    version: '1.1.1',
    overall,
    results,
    summary,
  };

  // Output results
  console.log('\n' + '='.repeat(50));
  console.log('REGRESSION REPORT');
  console.log('='.repeat(50) + '\n');

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.suite} (${result.duration}ms)`);

    for (const error of result.errors) {
      console.log(`   ❌ ${error}`);
    }
    for (const warning of result.warnings) {
      console.log(`   ⚠️  ${warning}`);
    }
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`Summary: ${summary.passed}/${summary.total} passed, ${summary.warnings} warnings`);
  console.log(`Overall: ${overall.toUpperCase()}`);
  console.log('='.repeat(50));

  // Write report to file
  const reportPath = path.join(process.cwd(), 'regression-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Exit with appropriate code
  if (overall === 'fail') {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Regression runner failed:', error);
  process.exit(1);
});
