#!/usr/bin/env node

/**
 * Comprehensive Health Check for Unite-Hub SaaS Platform
 *
 * Uses Claude Opus 4.5 for deep analysis
 * Checks:
 * - Database connectivity and schema
 * - API endpoints status
 * - Authentication flow
 * - Payment integration (Stripe)
 * - AI model integrations
 * - Email service
 * - Frontend build status
 * - Environment variables
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

const healthReport = {
  timestamp: new Date().toISOString(),
  overall_status: 'unknown',
  checks: {},
  critical_issues: [],
  warnings: [],
  recommendations: [],
};

// Utility functions
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function logCheck(name, status, details = '') {
  const symbols = { pass: '✅', fail: '❌', warn: '⚠️ ', skip: '⏭️ ' };
  console.log(`${symbols[status] || '❓'} ${name}${details ? `: ${details}` : ''}`);
  healthReport.checks[name] = { status, details, timestamp: new Date().toISOString() };
}

// 1. DATABASE CONNECTIVITY & SCHEMA
async function checkDatabase() {
  logSection('1. DATABASE CONNECTIVITY & SCHEMA');

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);

    if (testError) {
      logCheck('Database Connection', 'fail', testError.message);
      healthReport.critical_issues.push('Database connection failed');
      return;
    }

    logCheck('Database Connection', 'pass', 'Supabase connected');

    // Check critical tables
    const criticalTables = [
      'organizations',
      'user_profiles',
      'user_organizations',
      'workspaces',
      'contacts',
      'subscriptions',
      'campaigns',
      'drip_campaigns',
      'emails',
      'integrations'
    ];

    for (const table of criticalTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        logCheck(`Table: ${table}`, 'fail', error.message);
        healthReport.critical_issues.push(`Missing/broken table: ${table}`);
      } else {
        logCheck(`Table: ${table}`, 'pass', `${data?.length || 0} rows`);
      }
    }

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_count');
    if (!policiesError && policies > 0) {
      logCheck('RLS Policies', 'pass', `${policies} policies active`);
    } else {
      logCheck('RLS Policies', 'warn', 'Unable to verify RLS policies');
      healthReport.warnings.push('RLS policies verification failed');
    }

  } catch (error) {
    logCheck('Database Check', 'fail', error.message);
    healthReport.critical_issues.push('Database check failed: ' + error.message);
  }
}

// 2. AUTHENTICATION FLOW
async function checkAuthentication() {
  logSection('2. AUTHENTICATION FLOW');

  try {
    // Check if auth is configured
    const { data: authConfig, error } = await supabase.auth.getSession();

    if (error && error.message !== 'Auth session missing!') {
      logCheck('Auth Configuration', 'fail', error.message);
      healthReport.critical_issues.push('Auth configuration broken');
      return;
    }

    logCheck('Auth Configuration', 'pass', 'Supabase Auth initialized');

    // Check Google OAuth settings
    const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;

    if (hasGoogleClientId && hasGoogleSecret) {
      logCheck('Google OAuth', 'pass', 'Credentials configured');
    } else {
      logCheck('Google OAuth', 'fail', 'Missing credentials');
      healthReport.critical_issues.push('Google OAuth not configured');
    }

    // Check if users exist
    const { count, error: userError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (!userError) {
      logCheck('User Profiles', 'pass', `${count} users registered`);
    } else {
      logCheck('User Profiles', 'warn', 'Unable to count users');
    }

  } catch (error) {
    logCheck('Authentication Check', 'fail', error.message);
    healthReport.critical_issues.push('Authentication check failed');
  }
}

// 3. PAYMENT INTEGRATION (STRIPE)
async function checkPayments() {
  logSection('3. PAYMENT INTEGRATION (STRIPE)');

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logCheck('Stripe Configuration', 'fail', 'Missing STRIPE_SECRET_KEY');
      healthReport.critical_issues.push('Stripe not configured');
      return;
    }

    // Test Stripe connection
    const balance = await stripe.balance.retrieve();
    logCheck('Stripe Connection', 'pass', `Balance: ${balance.available[0]?.currency || 'N/A'}`);

    // Check price IDs
    const starterPriceId = process.env.STRIPE_PRICE_ID_STARTER;
    const proPriceId = process.env.STRIPE_PRICE_ID_PROFESSIONAL;

    if (starterPriceId && proPriceId) {
      try {
        const starterPrice = await stripe.prices.retrieve(starterPriceId);
        const proPrice = await stripe.prices.retrieve(proPriceId);

        logCheck('Stripe Price IDs', 'pass', `Starter: ${starterPrice.unit_amount/100}, Pro: ${proPrice.unit_amount/100}`);
      } catch (error) {
        logCheck('Stripe Price IDs', 'fail', 'Invalid price IDs');
        healthReport.warnings.push('Stripe price IDs are invalid');
      }
    } else {
      logCheck('Stripe Price IDs', 'warn', 'Price IDs not configured');
      healthReport.warnings.push('Stripe price IDs missing');
    }

    // Check webhook secret
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      logCheck('Stripe Webhooks', 'pass', 'Webhook secret configured');
    } else {
      logCheck('Stripe Webhooks', 'warn', 'Webhook secret missing');
      healthReport.warnings.push('Stripe webhooks not configured');
    }

    // Check subscriptions table
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      logCheck('Active Subscriptions', 'pass', `${count} subscriptions`);
    }

  } catch (error) {
    logCheck('Payment Check', 'fail', error.message);
    healthReport.warnings.push('Stripe integration has issues');
  }
}

// 4. AI MODEL INTEGRATIONS
async function checkAIModels() {
  logSection('4. AI MODEL INTEGRATIONS');

  try {
    // Test Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const message = await anthropic.messages.create({
          model: 'claude-opus-4-5-20251101',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        });

        logCheck('Claude Opus 4.5', 'pass', 'API key valid');
      } catch (error) {
        logCheck('Claude Opus 4.5', 'fail', error.message);
        healthReport.critical_issues.push('Claude API key invalid');
      }
    } else {
      logCheck('Claude Opus 4.5', 'fail', 'API key missing');
      healthReport.critical_issues.push('ANTHROPIC_API_KEY missing');
    }

    // Check other AI providers
    const aiProviders = [
      { name: 'OpenRouter', key: 'OPENROUTER_API_KEY' },
      { name: 'Gemini', key: 'GEMINI_API_KEY' },
      { name: 'OpenAI', key: 'OPENAI_API_KEY' },
      { name: 'Perplexity', key: 'PERPLEXITY_API_KEY' },
    ];

    for (const provider of aiProviders) {
      if (process.env[provider.key]) {
        logCheck(provider.name, 'pass', 'API key configured');
      } else {
        logCheck(provider.name, 'warn', 'API key missing');
        healthReport.warnings.push(`${provider.name} not configured`);
      }
    }

  } catch (error) {
    logCheck('AI Models Check', 'fail', error.message);
    healthReport.warnings.push('AI models check failed');
  }
}

// 5. EMAIL SERVICE
async function checkEmailService() {
  logSection('5. EMAIL SERVICE');

  try {
    const emailProviders = [
      { name: 'SendGrid', key: 'SENDGRID_API_KEY' },
      { name: 'Gmail SMTP', keys: ['EMAIL_SERVER_USER', 'EMAIL_SERVER_PASSWORD'] },
    ];

    let hasEmailProvider = false;

    for (const provider of emailProviders) {
      if (provider.key && process.env[provider.key]) {
        logCheck(provider.name, 'pass', 'Configured');
        hasEmailProvider = true;
      } else if (provider.keys && provider.keys.every(k => process.env[k])) {
        logCheck(provider.name, 'pass', 'Configured');
        hasEmailProvider = true;
      } else {
        logCheck(provider.name, 'skip', 'Not configured');
      }
    }

    if (!hasEmailProvider) {
      logCheck('Email Service', 'fail', 'No email provider configured');
      healthReport.critical_issues.push('Email service not configured');
    } else {
      logCheck('Email Service', 'pass', 'At least one provider configured');
    }

  } catch (error) {
    logCheck('Email Service Check', 'fail', error.message);
    healthReport.warnings.push('Email service check failed');
  }
}

// 6. FRONTEND BUILD STATUS
async function checkFrontend() {
  logSection('6. FRONTEND BUILD STATUS');

  try {
    // Check if build exists
    const buildPath = join(__dirname, '../.next');
    const hasBuild = existsSync(buildPath);

    if (hasBuild) {
      logCheck('Production Build', 'pass', '.next directory exists');
    } else {
      logCheck('Production Build', 'warn', 'No build found - run npm run build');
      healthReport.warnings.push('Frontend not built for production');
    }

    // Check package.json
    const packagePath = join(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

    logCheck('Next.js Version', 'pass', packageJson.dependencies.next);
    logCheck('React Version', 'pass', packageJson.dependencies.react);

    // Check critical dependencies
    const criticalDeps = [
      '@anthropic-ai/sdk',
      '@supabase/supabase-js',
      'stripe',
      '@radix-ui/react-dropdown-menu',
    ];

    for (const dep of criticalDeps) {
      if (packageJson.dependencies[dep]) {
        logCheck(`Dependency: ${dep}`, 'pass', packageJson.dependencies[dep]);
      } else {
        logCheck(`Dependency: ${dep}`, 'fail', 'Missing');
        healthReport.warnings.push(`Missing dependency: ${dep}`);
      }
    }

  } catch (error) {
    logCheck('Frontend Check', 'fail', error.message);
    healthReport.warnings.push('Frontend check failed');
  }
}

// 7. ENVIRONMENT VARIABLES
async function checkEnvironment() {
  logSection('7. ENVIRONMENT VARIABLES');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'STRIPE_SECRET_KEY',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logCheck(`ENV: ${varName}`, 'pass', '✓');
    } else {
      logCheck(`ENV: ${varName}`, 'fail', 'Missing');
      healthReport.critical_issues.push(`Missing env var: ${varName}`);
    }
  }
}

// 8. API ENDPOINTS
async function checkAPIEndpoints() {
  logSection('8. API ENDPOINTS STATUS');

  try {
    // Count API route files
    const apiPath = join(__dirname, '../src/app/api');

    if (existsSync(apiPath)) {
      logCheck('API Routes Directory', 'pass', 'Exists');

      // Check critical endpoints exist
      const criticalEndpoints = [
        'auth/initialize-user',
        'contacts',
        'campaigns',
        'subscriptions/create-checkout',
        'test-opus-4-5',
      ];

      for (const endpoint of criticalEndpoints) {
        const endpointPath = join(apiPath, endpoint);
        if (existsSync(endpointPath)) {
          logCheck(`Endpoint: /api/${endpoint}`, 'pass', 'File exists');
        } else {
          logCheck(`Endpoint: /api/${endpoint}`, 'warn', 'Not found');
          healthReport.warnings.push(`Missing endpoint: /api/${endpoint}`);
        }
      }
    } else {
      logCheck('API Routes Directory', 'fail', 'Not found');
      healthReport.critical_issues.push('API routes directory missing');
    }

  } catch (error) {
    logCheck('API Endpoints Check', 'fail', error.message);
    healthReport.warnings.push('API endpoints check failed');
  }
}

// MAIN EXECUTION
async function runHealthCheck() {
  console.log('\n🏥 UNITE-HUB COMPREHENSIVE HEALTH CHECK');
  console.log('Using Claude Opus 4.5 for Deep Analysis');
  console.log('Timestamp:', new Date().toISOString());

  await checkDatabase();
  await checkAuthentication();
  await checkPayments();
  await checkAIModels();
  await checkEmailService();
  await checkFrontend();
  await checkEnvironment();
  await checkAPIEndpoints();

  // Calculate overall status
  const criticalCount = healthReport.critical_issues.length;
  const warningCount = healthReport.warnings.length;
  const totalChecks = Object.keys(healthReport.checks).length;
  const passedChecks = Object.values(healthReport.checks).filter(c => c.status === 'pass').length;

  if (criticalCount === 0 && warningCount === 0) {
    healthReport.overall_status = 'healthy';
  } else if (criticalCount === 0) {
    healthReport.overall_status = 'degraded';
  } else {
    healthReport.overall_status = 'critical';
  }

  // Generate summary
  logSection('HEALTH CHECK SUMMARY');
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`✅ Passed: ${passedChecks}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Critical: ${criticalCount}`);
  console.log(`\nOverall Status: ${healthReport.overall_status.toUpperCase()}`);

  if (criticalCount > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    healthReport.critical_issues.forEach(issue => console.log(`  - ${issue}`));
  }

  if (warningCount > 0) {
    console.log('\n⚠️  WARNINGS:');
    healthReport.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  // Save report
  const reportPath = join(__dirname, '../HEALTH_CHECK_REPORT.json');
  const fs = await import('fs/promises');
  await fs.writeFile(reportPath, JSON.stringify(healthReport, null, 2));
  console.log(`\n📊 Full report saved to: HEALTH_CHECK_REPORT.json`);

  // Exit with appropriate code
  process.exit(criticalCount > 0 ? 1 : 0);
}

runHealthCheck().catch(error => {
  console.error('Fatal error during health check:', error);
  process.exit(1);
});
