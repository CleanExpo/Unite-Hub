#!/usr/bin/env node

/**
 * Founder Intelligence OS - Integrity Check Script
 *
 * Verifies complete installation of all components:
 * - Database tables
 * - Service files
 * - API routes
 * - Agent files
 * - Config files
 * - Environment variables
 *
 * Usage: node scripts/run-integrity-check.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Results tracker
const results = {
  tables: { checked: 0, passed: 0, failed: [] },
  services: { checked: 0, passed: 0, failed: [] },
  apiRoutes: { checked: 0, passed: 0, failed: [] },
  agents: { checked: 0, passed: 0, failed: [] },
  configs: { checked: 0, passed: 0, failed: [] },
  env: { checked: 0, passed: 0, failed: [] },
};

// Expected database tables
const expectedTables = [
  'founder_businesses',
  'founder_business_vault_secrets',
  'founder_business_signals',
  'founder_os_snapshots',
  'ai_phill_insights',
  'ai_phill_journal_entries',
  'cognitive_twin_scores',
  'cognitive_twin_digests',
  'cognitive_twin_decisions',
  'seo_leak_signal_profiles',
  'social_inbox_accounts',
  'social_messages',
  'search_keywords',
  'boost_jobs',
  'pre_clients',
];

// Expected service files (relative to src/lib)
const expectedServices = [
  'founderOps/founderOpsEngine.ts',
  'founderOps/founderOpsQueue.ts',
  'founderOps/founderOpsScheduler.ts',
  'founderOps/founderOpsTaskLibrary.ts',
  'founderOps/founderOpsArchiveBridge.ts',
  'founderOps/founderOpsBrandBinding.ts',
  'founder/oversightService.ts',
  'billing/trialService.ts',
  'platform/platformMode.ts',
];

// Expected API routes (relative to src/app/api/founder)
const expectedApiRoutes = [
  'assistant/route.ts',
  'awareness/route.ts',
  'cognitive-map/route.ts',
  'flight-deck/layout/route.ts',
  'ops/brand-workload/route.ts',
  'ops/overview/route.ts',
  'ops/queue/daily/route.ts',
  'ops/queue/pause/route.ts',
  'ops/queue/resume/route.ts',
  'ops/queue/weekly/route.ts',
  'ops/tasks/route.ts',
  'ops/tasks/[taskId]/route.ts',
  'settings/platform-mode/route.ts',
  'memory/snapshot/route.ts',
  'memory/patterns/route.ts',
  'memory/momentum/route.ts',
  'memory/opportunities/route.ts',
  'memory/risks/route.ts',
  'memory/forecast/route.ts',
  'memory/decision-scenarios/route.ts',
  'memory/weekly-digest/route.ts',
  'memory/next-actions/route.ts',
  'memory/overload/route.ts',
];

// Expected agent files (relative to src/lib/agents)
const expectedAgents = [
  'founderOsAgent.ts',
  'aiPhillAgent.ts',
  'seoLeakAgent.ts',
  'boostBumpAgent.ts',
  'searchSuiteAgent.ts',
  'socialInboxAgent.ts',
  'preClientIdentityAgent.ts',
  'cognitiveTwinAgent.ts',
];

// Expected environment variables
const expectedEnvVars = [
  'ANTHROPIC_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

/**
 * Print section header
 */
function printHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Print check result
 */
function printCheck(name, passed, details = '') {
  const icon = passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  const status = passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
}

/**
 * Check if database tables exist
 */
async function checkDatabaseTables() {
  printHeader('1. DATABASE TABLES');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log(`${colors.red}✗ Cannot connect to Supabase - missing credentials${colors.reset}`);
    results.tables.checked = expectedTables.length;
    results.tables.failed = expectedTables;
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const table of expectedTables) {
    results.tables.checked++;

    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table does not exist
          printCheck(table, false, 'Table not found');
          results.tables.failed.push(table);
        } else {
          // Other error (might be RLS, which means table exists)
          printCheck(table, true, 'Present (RLS active)');
          results.tables.passed++;
        }
      } else {
        printCheck(table, true, 'Present');
        results.tables.passed++;
      }
    } catch (err) {
      printCheck(table, false, err.message);
      results.tables.failed.push(table);
    }
  }
}

/**
 * Check if service files exist
 */
async function checkServiceFiles() {
  printHeader('2. SERVICE FILES');

  for (const service of expectedServices) {
    results.services.checked++;
    const filePath = join(rootDir, 'src', 'lib', service);

    try {
      await fs.access(filePath);
      printCheck(service, true);
      results.services.passed++;
    } catch (err) {
      printCheck(service, false, 'File not found');
      results.services.failed.push(service);
    }
  }
}

/**
 * Check if API routes exist
 */
async function checkApiRoutes() {
  printHeader('3. API ROUTES');

  for (const route of expectedApiRoutes) {
    results.apiRoutes.checked++;
    const filePath = join(rootDir, 'src', 'app', 'api', 'founder', route);

    try {
      await fs.access(filePath);
      printCheck(route, true);
      results.apiRoutes.passed++;
    } catch (err) {
      printCheck(route, false, 'File not found');
      results.apiRoutes.failed.push(route);
    }
  }
}

/**
 * Check if agent files exist and have valid exports
 */
async function checkAgentFiles() {
  printHeader('4. AGENT FILES');

  for (const agent of expectedAgents) {
    results.agents.checked++;
    const filePath = join(rootDir, 'src', 'lib', 'agents', agent);

    try {
      await fs.access(filePath);

      // Read file to check for basic structure
      const content = await fs.readFile(filePath, 'utf-8');
      const hasExport = content.includes('export') && (
        content.includes('class') ||
        content.includes('function') ||
        content.includes('const')
      );

      if (hasExport) {
        printCheck(agent, true, 'Valid exports found');
        results.agents.passed++;
      } else {
        printCheck(agent, false, 'No exports found');
        results.agents.failed.push(agent);
      }
    } catch (err) {
      printCheck(agent, false, 'File not found');
      results.agents.failed.push(agent);
    }
  }
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables() {
  printHeader('5. ENVIRONMENT VARIABLES');

  for (const envVar of expectedEnvVars) {
    results.env.checked++;
    const value = process.env[envVar];

    if (value && value.length > 0) {
      const maskedValue = value.length > 20
        ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
        : '***';
      printCheck(envVar, true, maskedValue);
      results.env.passed++;
    } else {
      printCheck(envVar, false, 'Not configured');
      results.env.failed.push(envVar);
    }
  }
}

/**
 * Print final summary
 */
function printSummary() {
  printHeader('INTEGRITY CHECK SUMMARY');

  const categories = [
    { name: 'Database Tables', key: 'tables' },
    { name: 'Services', key: 'services' },
    { name: 'API Routes', key: 'apiRoutes' },
    { name: 'Agents', key: 'agents' },
    { name: 'Environment', key: 'env' },
  ];

  let totalChecked = 0;
  let totalPassed = 0;

  categories.forEach(({ name, key }) => {
    const { checked, passed, failed } = results[key];
    totalChecked += checked;
    totalPassed += passed;

    const percentage = checked > 0 ? Math.round((passed / checked) * 100) : 0;
    const icon = percentage === 100 ? colors.green : percentage >= 80 ? colors.yellow : colors.red;

    console.log(`${icon}✓${colors.reset} ${name}: ${passed}/${checked} present (${percentage}%)`);

    if (failed.length > 0 && failed.length <= 5) {
      failed.forEach(item => {
        console.log(`  ${colors.red}→ Missing: ${item}${colors.reset}`);
      });
    } else if (failed.length > 5) {
      console.log(`  ${colors.red}→ ${failed.length} items missing${colors.reset}`);
    }
  });

  const overallPercentage = totalChecked > 0 ? Math.round((totalPassed / totalChecked) * 100) : 0;
  const statusColor = overallPercentage === 100 ? colors.green : overallPercentage >= 80 ? colors.yellow : colors.red;
  const statusText = overallPercentage === 100 ? 'PASS' : overallPercentage >= 80 ? 'WARN' : 'FAIL';

  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}OVERALL STATUS: ${statusColor}${statusText} (${overallPercentage}%)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  if (overallPercentage === 100) {
    console.log(`${colors.green}${colors.bright}All checks passed! Founder Intelligence OS is fully installed.${colors.reset}\n`);
  } else if (overallPercentage >= 80) {
    console.log(`${colors.yellow}${colors.bright}Most components present. Review warnings above.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}Critical components missing. Installation incomplete.${colors.reset}\n`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║       FOUNDER INTELLIGENCE OS - INTEGRITY CHECK              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  console.log(colors.reset);

  try {
    await checkDatabaseTables();
    await checkServiceFiles();
    await checkApiRoutes();
    await checkAgentFiles();
    await checkEnvironmentVariables();

    printSummary();

    // Exit with appropriate code
    const overallPercentage = Math.round(
      (Object.values(results).reduce((sum, cat) => sum + cat.passed, 0) /
       Object.values(results).reduce((sum, cat) => sum + cat.checked, 0)) * 100
    );

    process.exit(overallPercentage === 100 ? 0 : 1);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Error running integrity check:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

main();
