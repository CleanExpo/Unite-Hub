#!/usr/bin/env node

/**
 * Pre-Flight Checks - Autonomous System Validation
 *
 * Runs before critical operations (RLS migrations, deployments, agent tasks)
 * to validate system state and prevent common failures.
 *
 * Usage:
 *   node scripts/pre-flight-checks.mjs [--check=rls|env|db|agents|all]
 *
 * Exit Codes:
 *   0 - All checks passed
 *   1 - Critical failures detected
 *   2 - Warnings detected (non-blocking)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '..', '.env.local') });

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Result tracking
const results = {
  passed: 0,
  warnings: 0,
  failed: 0,
  checks: [],
};

// Parse command line arguments
const args = process.argv.slice(2);
const checkType = args.find(arg => arg.startsWith('--check='))?.split('=')[1] || 'all';

/**
 * Print section header
 */
function printHeader(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * Print check result
 */
function printResult(name, status, message = '') {
  const symbols = {
    pass: `${colors.green}✓${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
  };

  const statusText = {
    pass: `${colors.green}PASS${colors.reset}`,
    warn: `${colors.yellow}WARN${colors.reset}`,
    fail: `${colors.red}FAIL${colors.reset}`,
  };

  console.log(`${symbols[status]} ${name}: ${statusText[status]}`);
  if (message) {
    console.log(`  ${colors.blue}→${colors.reset} ${message}`);
  }

  results[status === 'pass' ? 'passed' : status === 'warn' ? 'warnings' : 'failed']++;
  results.checks.push({ name, status, message });
}

/**
 * Check 1: Environment Variables
 */
async function checkEnvironment() {
  printHeader('1. ENVIRONMENT VALIDATION');

  const required = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', critical: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', critical: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', critical: true },
    { name: 'ANTHROPIC_API_KEY', critical: true },
    { name: 'NEXTAUTH_SECRET', critical: true },
    { name: 'NEXTAUTH_URL', critical: false },
  ];

  const optional = [
    { name: 'GOOGLE_CLIENT_ID', service: 'Google OAuth' },
    { name: 'GOOGLE_CLIENT_SECRET', service: 'Google OAuth' },
    { name: 'SENDGRID_API_KEY', service: 'SendGrid Email' },
    { name: 'RESEND_API_KEY', service: 'Resend Email' },
    { name: 'PERPLEXITY_API_KEY', service: 'Perplexity SEO' },
    { name: 'OPENROUTER_API_KEY', service: 'OpenRouter AI' },
  ];

  // Check required variables
  for (const { name, critical } of required) {
    const value = process.env[name];
    if (!value) {
      if (critical) {
        printResult(name, 'fail', 'Missing critical environment variable');
      } else {
        printResult(name, 'warn', 'Recommended but not critical');
      }
    } else {
      // Validate format
      let valid = true;
      if (name.includes('URL')) {
        valid = value.startsWith('http://') || value.startsWith('https://');
      } else if (name.includes('KEY')) {
        valid = value.length > 20;
      }

      if (valid) {
        printResult(name, 'pass', `Set (${value.substring(0, 20)}...)`);
      } else {
        printResult(name, 'warn', 'Set but format may be invalid');
      }
    }
  }

  // Check optional variables
  console.log(`\n${colors.bright}Optional Services:${colors.reset}`);
  for (const { name, service } of optional) {
    const value = process.env[name];
    if (value) {
      printResult(`${service} (${name})`, 'pass', 'Configured');
    } else {
      console.log(`  ${colors.yellow}○${colors.reset} ${service}: Not configured (optional)`);
    }
  }
}

/**
 * Check 2: Database Connection & RLS
 */
async function checkDatabase() {
  printHeader('2. DATABASE & RLS VALIDATION');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    printResult('Database Connection', 'fail', 'Missing Supabase credentials');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Test connection
    const { error: connError } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
    if (connError) {
      printResult('Database Connection', 'fail', `Connection failed: ${connError.message}`);
      return;
    }
    printResult('Database Connection', 'pass', 'Successfully connected');

    // Check RLS helper functions
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `SELECT proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND (proname LIKE '%workspace%' OR proname LIKE '%org%')`
    }).catch(() => ({ data: null, error: null }));

    const expectedFunctions = ['get_user_workspaces', 'user_has_role_in_org_simple'];
    const foundFunctions = functions?.map(f => f.proname) || [];

    for (const func of expectedFunctions) {
      if (foundFunctions.includes(func)) {
        printResult(`RLS Function: ${func}`, 'pass', 'Present in database');
      } else {
        printResult(`RLS Function: ${func}`, 'fail', 'Missing - run migration 023 first');
      }
    }

    // Check RLS status on core tables
    const coreTables = [
      'organizations', 'workspaces', 'user_profiles', 'user_organizations',
      'contacts', 'emails', 'campaigns', 'drip_campaigns'
    ];

    for (const table of coreTables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        if (error.message.includes('permission denied')) {
          printResult(`RLS: ${table}`, 'pass', 'RLS enabled (permission denied as expected)');
        } else {
          printResult(`RLS: ${table}`, 'warn', `Unexpected error: ${error.message}`);
        }
      } else {
        printResult(`RLS: ${table}`, 'warn', 'RLS may not be enabled (no permission error)');
      }
    }

  } catch (error) {
    printResult('Database Checks', 'fail', `Error: ${error.message}`);
  }
}

/**
 * Check 3: Agent Definitions
 */
async function checkAgents() {
  printHeader('3. AGENT DEFINITIONS');

  const agentsDir = join(__dirname, '..', '.claude', 'agents');
  const expectedAgents = [
    { id: 'orchestrator', name: 'Orchestrator', priority: 1 },
    { id: 'email-agent', name: 'Email Agent', priority: 2 },
    { id: 'content-agent', name: 'Content Agent', priority: 2 },
    { id: 'frontend-specialist', name: 'Frontend Specialist', priority: 3 },
    { id: 'backend-specialist', name: 'Backend Specialist', priority: 3 },
    { id: 'seo-intelligence', name: 'SEO Intelligence', priority: 3 },
    { id: 'founder-os', name: 'Founder OS', priority: 2 },
  ];

  // Check REGISTRY.md exists
  const registryPath = join(agentsDir, 'REGISTRY.md');
  if (existsSync(registryPath)) {
    printResult('Agent Registry', 'pass', 'REGISTRY.md found');
  } else {
    printResult('Agent Registry', 'fail', 'REGISTRY.md not found');
  }

  // Check each agent directory
  for (const agent of expectedAgents) {
    const agentPath = join(agentsDir, agent.id);
    const agentFile = join(agentPath, 'agent.md');

    if (existsSync(agentFile)) {
      // Check for YAML frontmatter
      const content = readFileSync(agentFile, 'utf-8');
      if (content.startsWith('---')) {
        printResult(`${agent.name} (${agent.id})`, 'pass', 'Definition with frontmatter found');
      } else {
        printResult(`${agent.name} (${agent.id})`, 'warn', 'Found but missing YAML frontmatter');
      }
    } else {
      printResult(`${agent.name} (${agent.id})`, 'fail', 'Definition file not found');
    }
  }

  // Check for deprecated agent files
  const deprecatedPattern = /^[A-Z][A-Z-]+AGENT\.md$/;
  const { readdirSync } = await import('fs');
  const files = readdirSync(agentsDir);
  const deprecated = files.filter(f => deprecatedPattern.test(f));

  if (deprecated.length > 0) {
    printResult('Deprecated Agent Files', 'warn', `Found ${deprecated.length} old files: ${deprecated.join(', ')}`);
  } else {
    printResult('Deprecated Agent Files', 'pass', 'No deprecated files found');
  }
}

/**
 * Check 4: Anthropic API
 */
async function checkAnthropicAPI() {
  printHeader('4. ANTHROPIC API VALIDATION');

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    printResult('Anthropic API Key', 'fail', 'ANTHROPIC_API_KEY not set');
    return;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    printResult('Anthropic API Key', 'warn', 'Key format may be invalid (should start with sk-ant-)');
  } else {
    printResult('Anthropic API Key', 'pass', 'Key format valid');
  }

  // Check rate limiter exists
  const rateLimiterPath = join(__dirname, '..', 'src', 'lib', 'anthropic', 'rate-limiter.ts');
  if (existsSync(rateLimiterPath)) {
    printResult('Rate Limiter', 'pass', 'Found at src/lib/anthropic/rate-limiter.ts');
  } else {
    printResult('Rate Limiter', 'warn', 'Rate limiter not found (may cause API errors)');
  }

  // Test API connection (optional, commented out to avoid unnecessary API calls)
  // Uncomment this if you want to actually test the API connection
  /*
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    });

    printResult('Anthropic API Connection', 'pass', 'Successfully connected and received response');
  } catch (error) {
    printResult('Anthropic API Connection', 'fail', `Connection failed: ${error.message}`);
  }
  */
}

/**
 * Check 5: Critical Files
 */
async function checkCriticalFiles() {
  printHeader('5. CRITICAL FILES');

  const criticalFiles = [
    { path: 'src/lib/supabase/server.ts', name: 'Supabase Server Client' },
    { path: 'src/lib/supabase/client.ts', name: 'Supabase Browser Client' },
    { path: 'src/lib/db.ts', name: 'Database Wrapper' },
    { path: 'src/middleware.ts', name: 'Next.js Middleware' },
    { path: '.claude/CLAUDE.md', name: 'Main Documentation' },
    { path: '.claude/agents/REGISTRY.md', name: 'Agent Registry' },
    { path: 'package.json', name: 'Package Configuration' },
  ];

  for (const { path, name } of criticalFiles) {
    const fullPath = join(__dirname, '..', path);
    if (existsSync(fullPath)) {
      printResult(name, 'pass', path);
    } else {
      printResult(name, 'fail', `Missing: ${path}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║       UNITE-HUB PRE-FLIGHT CHECKS                           ║');
  console.log('║       Autonomous System Validation                           ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  console.log(`${colors.cyan}Check Type: ${checkType}${colors.reset}`);
  console.log(`${colors.cyan}Started: ${new Date().toISOString()}${colors.reset}\n`);

  try {
    // Run checks based on type
    if (checkType === 'all' || checkType === 'env') {
      await checkEnvironment();
    }

    if (checkType === 'all' || checkType === 'db' || checkType === 'rls') {
      await checkDatabase();
    }

    if (checkType === 'all' || checkType === 'agents') {
      await checkAgents();
    }

    if (checkType === 'all' || checkType === 'api') {
      await checkAnthropicAPI();
    }

    if (checkType === 'all' || checkType === 'files') {
      await checkCriticalFiles();
    }

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}FATAL ERROR:${colors.reset} ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }

  // Print summary
  printHeader('SUMMARY');

  console.log(`${colors.green}✓ Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${results.warnings}${colors.reset}`);
  console.log(`${colors.red}✗ Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.cyan}Total:     ${results.checks.length}${colors.reset}\n`);

  // Exit with appropriate code
  if (results.failed > 0) {
    console.log(`${colors.red}${colors.bright}❌ PRE-FLIGHT CHECKS FAILED${colors.reset}`);
    console.log(`${colors.red}Fix critical issues before proceeding.${colors.reset}\n`);
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log(`${colors.yellow}${colors.bright}⚠ PRE-FLIGHT CHECKS PASSED WITH WARNINGS${colors.reset}`);
    console.log(`${colors.yellow}Review warnings before proceeding.${colors.reset}\n`);
    process.exit(2);
  } else {
    console.log(`${colors.green}${colors.bright}✅ ALL PRE-FLIGHT CHECKS PASSED${colors.reset}`);
    console.log(`${colors.green}System ready for operation.${colors.reset}\n`);
    process.exit(0);
  }
}

// Run main function
main().catch(error => {
  console.error(`${colors.red}${colors.bright}FATAL ERROR:${colors.reset}`, error);
  process.exit(1);
});
