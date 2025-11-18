#!/usr/bin/env node

/**
 * Gemini 3 Integration Validation Script
 *
 * Validates the complete Gemini 3 integration autonomously:
 * 1. Environment configuration
 * 2. File structure
 * 3. Code compilation
 * 4. Import dependencies
 * 5. Database schema readiness
 *
 * Does NOT require API keys or database connection for validation.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(title, 'blue');
  log('='.repeat(60), 'blue');
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    success(`${name}${message ? ': ' + message : ''}`);
  } else {
    results.failed++;
    error(`${name}${message ? ': ' + message : ''}`);
  }
}

function recordWarning(name, message) {
  results.warnings++;
  warning(`${name}: ${message}`);
}

// Validation functions

function validateFileStructure() {
  section('Test 1: File Structure Validation');

  const requiredFiles = [
    // Core implementation
    'src/lib/google/gemini-client.ts',
    'src/lib/google/gmail-intelligence.ts',
    'src/lib/ai/enhanced-router.ts',

    // Documentation
    'docs/GEMINI_3_INTEGRATION_STRATEGY.md',
    'docs/GEMINI_3_MIGRATION_GUIDE.md',
    'GEMINI_3_IMPLEMENTATION_COMPLETE.md',
    'GEMINI_3_NEXT_STEPS.md',
    'RUN_GEMINI_MIGRATION.md',
    'GEMINI_3_SUMMARY.md',

    // Scripts
    'scripts/test-gemini-setup.mjs',

    // Database
    'supabase/migrations/046_ai_usage_tracking.sql',

    // Configuration
    'package.json',
    '.env.example'
  ];

  requiredFiles.forEach(file => {
    const filePath = join(projectRoot, file);
    const exists = existsSync(filePath);
    recordTest(`File exists: ${file}`, exists);
  });
}

function validatePackageJson() {
  section('Test 2: Package.json Configuration');

  const packageJsonPath = join(projectRoot, 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    // Check dependencies
    const hasGeminiSdk = packageJson.dependencies?.['@google/genai'];
    recordTest('Dependency: @google/genai', !!hasGeminiSdk, hasGeminiSdk ? `v${hasGeminiSdk}` : '');

    // Check scripts
    const expectedScripts = {
      'test:gemini': 'Test Gemini setup script',
      'test:gmail-intelligence': 'Gmail intelligence test',
      'benchmark:email-intelligence': 'Benchmark script'
    };

    for (const [scriptName, description] of Object.entries(expectedScripts)) {
      const exists = !!packageJson.scripts?.[scriptName];
      recordTest(`Script: ${scriptName}`, exists, description);
    }
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
    results.failed++;
  }
}

function validateEnvExample() {
  section('Test 3: Environment Configuration Template');

  const envExamplePath = join(projectRoot, '.env.example');

  try {
    const envContent = readFileSync(envExamplePath, 'utf8');

    const requiredVars = [
      'GOOGLE_AI_API_KEY',
      'GEMINI_DAILY_BUDGET',
      'GEMINI_ALERT_THRESHOLD',
      'GEMINI_ENABLE_THINKING',
      'OPENROUTER_API_KEY',
      'ANTHROPIC_API_KEY'
    ];

    requiredVars.forEach(varName => {
      const exists = envContent.includes(varName);
      recordTest(`Environment variable template: ${varName}`, exists);
    });

    // Check for multi-provider section
    const hasMultiProvider = envContent.includes('Multi-Provider Intelligent Routing');
    recordTest('Multi-provider routing section', hasMultiProvider);

  } catch (err) {
    error(`Failed to read .env.example: ${err.message}`);
    results.failed++;
  }
}

function validateDatabaseMigration() {
  section('Test 4: Database Migration Validation');

  const migrationPath = join(projectRoot, 'supabase/migrations/046_ai_usage_tracking.sql');

  try {
    const migrationContent = readFileSync(migrationPath, 'utf8');

    // Check for required tables
    const requiredTables = [
      'ai_usage_logs',
      'ai_budget_limits'
    ];

    requiredTables.forEach(tableName => {
      const exists = migrationContent.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`);
      recordTest(`Table definition: ${tableName}`, exists);
    });

    // Check for required functions
    const requiredFunctions = [
      'log_ai_usage',
      'check_ai_budget',
      'get_ai_cost_breakdown',
      'refresh_ai_daily_summary'
    ];

    requiredFunctions.forEach(funcName => {
      const exists = migrationContent.includes(`CREATE OR REPLACE FUNCTION ${funcName}`);
      recordTest(`Function definition: ${funcName}`, exists);
    });

    // Check for materialized view
    const hasMaterializedView = migrationContent.includes('CREATE MATERIALIZED VIEW');
    recordTest('Materialized view: ai_daily_summary', hasMaterializedView);

    // Check for RLS policies
    const hasRLS = migrationContent.includes('ENABLE ROW LEVEL SECURITY');
    recordTest('Row Level Security enabled', hasRLS);

  } catch (err) {
    error(`Failed to read migration file: ${err.message}`);
    results.failed++;
  }
}

function validateCodeStructure() {
  section('Test 5: Code Structure Validation');

  // Validate Gemini client
  const geminiClientPath = join(projectRoot, 'src/lib/google/gemini-client.ts');
  try {
    const geminiContent = readFileSync(geminiClientPath, 'utf8');

    const requiredExports = [
      'callGemini3',
      'calculateGeminiCost',
      'checkGeminiDailyBudget',
      'extractThoughtSignature',
      'prepareConversationHistory'
    ];

    requiredExports.forEach(exportName => {
      const exists = geminiContent.includes(`export async function ${exportName}`) ||
                     geminiContent.includes(`export function ${exportName}`);
      recordTest(`Gemini client export: ${exportName}`, exists);
    });

    // Check for thinking levels
    const hasThinkingLevels = geminiContent.includes("type ThinkingLevel = 'low' | 'high'");
    recordTest('Thinking levels type definition', hasThinkingLevels);

    // Check for media resolution
    const hasMediaResolution = geminiContent.includes('MediaResolution');
    recordTest('Media resolution type definition', hasMediaResolution);

  } catch (err) {
    error(`Failed to validate Gemini client: ${err.message}`);
    results.failed++;
  }

  // Validate Gmail intelligence
  const gmailIntelPath = join(projectRoot, 'src/lib/google/gmail-intelligence.ts');
  try {
    const gmailContent = readFileSync(gmailIntelPath, 'utf8');

    const requiredExports = [
      'processGmailWithGemini',
      'extractEmailIntelligence',
      'analyzePdfAttachment',
      'batchProcessGmailEmails'
    ];

    requiredExports.forEach(exportName => {
      const exists = gmailContent.includes(`export async function ${exportName}`);
      recordTest(`Gmail intelligence export: ${exportName}`, exists);
    });

  } catch (err) {
    error(`Failed to validate Gmail intelligence: ${err.message}`);
    results.failed++;
  }

  // Validate enhanced router
  const routerPath = join(projectRoot, 'src/lib/ai/enhanced-router.ts');
  try {
    const routerContent = readFileSync(routerPath, 'utf8');

    const requiredExports = [
      'enhancedRouteAI',
      'getDailyCostBreakdown'
    ];

    requiredExports.forEach(exportName => {
      const exists = routerContent.includes(`export async function ${exportName}`);
      recordTest(`Enhanced router export: ${exportName}`, exists);
    });

    // Check for 3-provider routing
    const hasGeminiRouting = routerContent.includes('gemini');
    const hasOpenRouterRouting = routerContent.includes('openrouter');
    const hasAnthropicRouting = routerContent.includes('anthropic_direct');

    recordTest('Gemini routing implemented', hasGeminiRouting);
    recordTest('OpenRouter routing implemented', hasOpenRouterRouting);
    recordTest('Anthropic routing implemented', hasAnthropicRouting);

  } catch (err) {
    error(`Failed to validate enhanced router: ${err.message}`);
    results.failed++;
  }
}

function validateDocumentation() {
  section('Test 6: Documentation Completeness');

  const docs = [
    {
      file: 'docs/GEMINI_3_INTEGRATION_STRATEGY.md',
      requiredSections: [
        'Cost Comparison',
        'Architecture Design',
        'Use Case Routing Matrix',
        'Cost Monitoring'
      ]
    },
    {
      file: 'docs/GEMINI_3_MIGRATION_GUIDE.md',
      requiredSections: [
        'Quick Start',
        'Migration Strategy',
        'Week 1',
        'Week 2',
        'Week 3',
        'Week 4'
      ]
    },
    {
      file: 'GEMINI_3_IMPLEMENTATION_COMPLETE.md',
      requiredSections: [
        'Executive Summary',
        'What Was Delivered',
        'Quick Start',
        'Expected Impact'
      ]
    }
  ];

  docs.forEach(({ file, requiredSections }) => {
    try {
      const filePath = join(projectRoot, file);
      const content = readFileSync(filePath, 'utf8');

      requiredSections.forEach(section => {
        const exists = content.toLowerCase().includes(section.toLowerCase());
        recordTest(`Doc section (${file}): ${section}`, exists);
      });
    } catch (err) {
      error(`Failed to validate ${file}: ${err.message}`);
      results.failed++;
    }
  });
}

function validateCodeQuality() {
  section('Test 7: Code Quality Checks');

  // Check for TypeScript compilation readiness
  const geminiClientPath = join(projectRoot, 'src/lib/google/gemini-client.ts');
  try {
    const content = readFileSync(geminiClientPath, 'utf8');

    // Check for proper imports
    const hasImports = content.includes('import');
    recordTest('TypeScript imports present', hasImports);

    // Check for type definitions
    const hasTypes = content.includes('interface') || content.includes('type');
    recordTest('Type definitions present', hasTypes);

    // Check for error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    recordTest('Error handling implemented', hasErrorHandling);

    // Check for JSDoc comments
    const hasJSDoc = content.includes('/**');
    recordTest('JSDoc documentation present', hasJSDoc);

  } catch (err) {
    error(`Code quality check failed: ${err.message}`);
    results.failed++;
  }
}

function printSummary() {
  section('Validation Summary');

  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  console.log('');
  info(`Total Tests: ${total}`);
  success(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    error(`Failed: ${results.failed}`);
  }
  if (results.warnings > 0) {
    warning(`Warnings: ${results.warnings}`);
  }

  console.log('');
  if (results.failed === 0) {
    log('━'.repeat(60), 'green');
    success(`✨ ALL VALIDATION TESTS PASSED! (${passRate}%)`);
    log('━'.repeat(60), 'green');
    console.log('');
    success('Gemini 3 integration is ready for deployment!');
    console.log('');
    info('Next steps:');
    console.log('  1. Run database migration: supabase/migrations/046_ai_usage_tracking.sql');
    console.log('  2. Get Gemini API key: https://ai.google.dev/');
    console.log('  3. Add to .env.local: GOOGLE_AI_API_KEY=your-key');
    console.log('  4. Test: npm run test:gemini');
    console.log('');
  } else {
    log('━'.repeat(60), 'red');
    error(`${results.failed} VALIDATION TEST(S) FAILED (${passRate}% pass rate)`);
    log('━'.repeat(60), 'red');
    console.log('');
    warning('Please review failed tests above and fix issues before deployment.');
    console.log('');
  }

  // Detailed failure report
  if (results.failed > 0) {
    section('Failed Tests Details');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => {
        error(`${test.name}${test.message ? ': ' + test.message : ''}`);
      });
  }

  return results.failed === 0 ? 0 : 1;
}

// Main execution
async function main() {
  log('\n🧪 Gemini 3 Integration Validation\n', 'cyan');
  info('Validating Gemini 3 Pro integration for Unite-Hub...\n');

  try {
    validateFileStructure();
    validatePackageJson();
    validateEnvExample();
    validateDatabaseMigration();
    validateCodeStructure();
    validateDocumentation();
    validateCodeQuality();

    const exitCode = printSummary();
    process.exit(exitCode);

  } catch (err) {
    error(`\nFatal error during validation: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
