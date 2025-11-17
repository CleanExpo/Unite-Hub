#!/usr/bin/env node

/**
 * SaaS Platform Comprehensive Audit
 *
 * Evaluator-Optimizer Pattern:
 * 1. EVALUATE: What exists (ground truth)
 * 2. ANALYZE: What's broken/missing
 * 3. OPTIMIZE: Generate fix priorities
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Ground Truth: What we expect a production SaaS to have
const EXPECTED_FEATURES = {
  'User Management': [
    'User registration',
    'Email verification',
    'Password reset',
    'Profile management',
    'Account deletion'
  ],
  'Organization Management': [
    'Create organization',
    'Invite team members',
    'Manage roles',
    'Organization settings'
  ],
  'Workspace Management': [
    'Create workspace',
    'Switch workspaces',
    'Workspace settings'
  ],
  'Contact Management': [
    'Create contact',
    'Edit contact',
    'Delete contact',
    'Import contacts',
    'Export contacts'
  ],
  'Email Management': [
    'Gmail integration',
    'Send email',
    'Email tracking',
    'Email templates'
  ],
  'Campaign Management': [
    'Create campaign',
    'Drip campaigns',
    'Campaign analytics',
    'A/B testing'
  ],
  'AI Features': [
    'Contact intelligence',
    'Content generation',
    'Lead scoring',
    'Sentiment analysis'
  ],
  'Billing': [
    'Subscription plans',
    'Payment processing',
    'Invoice history',
    'Usage limits'
  ]
};

async function* walkDirectory(dir, pattern = null) {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const path = join(dir, file.name);

    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && !file.name.includes('node_modules')) {
        yield* walkDirectory(path, pattern);
      }
    } else {
      if (!pattern || pattern.test(file.name)) {
        yield path;
      }
    }
  }
}

async function auditAPIRoutes() {
  console.log('\n📡 AUDITING API ROUTES...\n');

  const apiDir = join(rootDir, 'src/app/api');
  const routes = [];
  const broken = [];
  const placeholders = [];

  for await (const file of walkDirectory(apiDir, /route\.(ts|js)$/)) {
    const relativePath = relative(apiDir, file);
    const endpoint = '/' + relativePath.replace(/\/route\.(ts|js)$/, '').replace(/\\/g, '/');

    const content = await readFile(file, 'utf-8');

    // Check for placeholder implementations
    if (content.includes('TODO') || content.includes('placeholder') || content.includes('Not implemented')) {
      placeholders.push({ endpoint, file: relativePath });
    }

    // Check for auth validation
    const hasAuth = content.includes('validateUserAuth') ||
                   content.includes('getSession') ||
                   content.includes('auth.getUser');

    // Check for error handling
    const hasErrorHandling = content.includes('try {') && content.includes('catch');

    // Check for response validation
    const hasResponseValidation = content.includes('NextResponse.json');

    routes.push({
      endpoint,
      file: relativePath,
      hasAuth,
      hasErrorHandling,
      hasResponseValidation,
      isPlaceholder: placeholders.some(p => p.endpoint === endpoint)
    });
  }

  console.log(`Total API Routes: ${routes.length}`);
  console.log(`With Auth: ${routes.filter(r => r.hasAuth).length}`);
  console.log(`With Error Handling: ${routes.filter(r => r.hasErrorHandling).length}`);
  console.log(`Placeholders: ${placeholders.length}\n`);

  if (placeholders.length > 0) {
    console.log('⚠️  PLACEHOLDER IMPLEMENTATIONS:');
    placeholders.forEach(p => console.log(`   - ${p.endpoint}`));
    console.log();
  }

  return { routes, placeholders };
}

async function auditDatabaseIntegration() {
  console.log('\n💾 AUDITING DATABASE INTEGRATION...\n');

  const srcDir = join(rootDir, 'src');
  const supabaseCalls = [];
  const missingTables = new Set();

  // Known tables from migrations
  const knownTables = [
    'user_profiles',
    'organizations',
    'user_organizations',
    'workspaces',
    'contacts',
    'emails',
    'campaigns',
    'drip_campaigns',
    'campaign_steps',
    'campaign_enrollments',
    'integrations',
    'generatedContent',
    'aiMemory',
    'auditLogs'
  ];

  for await (const file of walkDirectory(srcDir, /\.(ts|tsx|js|jsx)$/)) {
    const content = await readFile(file, 'utf-8');
    const relativePath = relative(rootDir, file);

    // Find all .from('table_name') calls
    const fromMatches = content.matchAll(/\.from\(['"](.*?)['"]\)/g);

    for (const match of fromMatches) {
      const tableName = match[1];

      if (!knownTables.includes(tableName)) {
        missingTables.add(tableName);
        supabaseCalls.push({
          file: relativePath,
          table: tableName,
          exists: false
        });
      }
    }
  }

  console.log(`Known Tables: ${knownTables.length}`);
  console.log(`Unknown Tables Referenced: ${missingTables.size}\n`);

  if (missingTables.size > 0) {
    console.log('❌ TABLES REFERENCED BUT NOT IN SCHEMA:');
    Array.from(missingTables).forEach(table => {
      const files = supabaseCalls.filter(c => c.table === table).map(c => c.file);
      console.log(`   - ${table} (used in ${files.length} files)`);
    });
    console.log();
  }

  return { knownTables, missingTables: Array.from(missingTables), supabaseCalls };
}

async function auditFrontendRoutes() {
  console.log('\n🎨 AUDITING FRONTEND ROUTES...\n');

  const appDir = join(rootDir, 'src/app');
  const pages = [];

  for await (const file of walkDirectory(appDir, /page\.(tsx|jsx)$/)) {
    const relativePath = relative(appDir, file);
    const route = '/' + dirname(relativePath).replace(/\\/g, '/').replace(/\(.*?\)\//g, '');

    const content = await readFile(file, 'utf-8');

    // Check for common issues
    const hasUseClient = content.includes("'use client'");
    const hasErrorBoundary = content.includes('ErrorBoundary');
    const hasLoading = content.includes('loading') || content.includes('Suspense');

    pages.push({
      route: route === '.' ? '/' : route,
      file: relativePath,
      hasUseClient,
      hasErrorBoundary,
      hasLoading
    });
  }

  console.log(`Total Pages: ${pages.length}`);
  console.log(`Client Components: ${pages.filter(p => p.hasUseClient).length}`);
  console.log(`With Error Boundaries: ${pages.filter(p => p.hasErrorBoundary).length}\n`);

  return { pages };
}

async function auditIntegrations() {
  console.log('\n🔌 AUDITING INTEGRATIONS...\n');

  const integrations = {
    'Gmail OAuth': {
      envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      files: ['src/app/api/integrations/gmail/callback/route.ts'],
      status: 'unknown'
    },
    'Anthropic Claude': {
      envVars: ['ANTHROPIC_API_KEY'],
      files: ['src/lib/agents/contact-intelligence.ts', 'src/lib/agents/content-personalization.ts'],
      status: 'unknown'
    },
    'Stripe': {
      envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
      files: ['src/app/api/stripe/*'],
      status: 'unknown'
    },
    'Redis': {
      envVars: ['REDIS_URL'],
      files: ['src/lib/rate-limit.ts'],
      status: 'unknown'
    }
  };

  // Check if integration files exist
  for (const [name, config] of Object.entries(integrations)) {
    let filesExist = 0;

    for (const filePattern of config.files) {
      try {
        if (filePattern.includes('*')) {
          const dir = join(rootDir, dirname(filePattern));
          const files = await readdir(dir);
          filesExist += files.length;
        } else {
          const filePath = join(rootDir, filePattern);
          await stat(filePath);
          filesExist++;
        }
      } catch (err) {
        // File doesn't exist
      }
    }

    config.filesExist = filesExist;
    config.status = filesExist > 0 ? 'implemented' : 'missing';
  }

  console.log('Integration Status:');
  for (const [name, config] of Object.entries(integrations)) {
    const status = config.status === 'implemented' ? '✅' : '❌';
    console.log(`   ${status} ${name}: ${config.filesExist} files found`);
  }
  console.log();

  return { integrations };
}

async function auditCriticalWorkflows() {
  console.log('\n🔄 AUDITING CRITICAL WORKFLOWS...\n');

  const workflows = [
    {
      name: 'User Signup → Dashboard',
      steps: [
        { check: 'OAuth login page exists', path: 'src/app/(auth)/login/page.tsx' },
        { check: 'OAuth callback exists', path: 'src/app/auth/implicit-callback/page.tsx' },
        { check: 'Initialize user API exists', path: 'src/app/api/auth/initialize-user/route.ts' },
        { check: 'Dashboard page exists', path: 'src/app/dashboard/overview/page.tsx' }
      ]
    },
    {
      name: 'Create Contact → View in List',
      steps: [
        { check: 'Create contact API exists', path: 'src/app/api/contacts/route.ts' },
        { check: 'Contacts list page exists', path: 'src/app/dashboard/contacts/page.tsx' },
        { check: 'Contact detail page exists', path: 'src/app/dashboard/contacts/[id]/page.tsx' }
      ]
    },
    {
      name: 'Create Campaign → Send Emails',
      steps: [
        { check: 'Create campaign API exists', path: 'src/app/api/campaigns/route.ts' },
        { check: 'Campaign builder page exists', path: 'src/app/dashboard/campaigns/drip/builder/page.tsx' },
        { check: 'Send email API exists', path: 'src/app/api/emails/send/route.ts' }
      ]
    }
  ];

  for (const workflow of workflows) {
    console.log(`${workflow.name}:`);
    let allPass = true;

    for (const step of workflow.steps) {
      try {
        await stat(join(rootDir, step.path));
        console.log(`   ✅ ${step.check}`);
      } catch (err) {
        console.log(`   ❌ ${step.check} - FILE MISSING`);
        allPass = false;
      }
    }

    workflow.complete = allPass;
    console.log(`   Status: ${allPass ? '✅ Complete' : '❌ Broken'}\n`);
  }

  return { workflows };
}

async function generateReport() {
  console.log('═'.repeat(80));
  console.log('🔍 UNITE-HUB SAAS PLATFORM AUDIT');
  console.log('═'.repeat(80));

  const apiAudit = await auditAPIRoutes();
  const dbAudit = await auditDatabaseIntegration();
  const frontendAudit = await auditFrontendRoutes();
  const integrationAudit = await auditIntegrations();
  const workflowAudit = await auditCriticalWorkflows();

  console.log('\n═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));

  const totalIssues =
    apiAudit.placeholders.length +
    dbAudit.missingTables.length +
    workflowAudit.workflows.filter(w => !w.complete).length +
    Object.values(integrationAudit.integrations).filter(i => i.status === 'missing').length;

  console.log(`\nTotal Issues Found: ${totalIssues}`);
  console.log(`  - Placeholder APIs: ${apiAudit.placeholders.length}`);
  console.log(`  - Missing Tables: ${dbAudit.missingTables.length}`);
  console.log(`  - Broken Workflows: ${workflowAudit.workflows.filter(w => !w.complete).length}`);
  console.log(`  - Missing Integrations: ${Object.values(integrationAudit.integrations).filter(i => i.status === 'missing').length}`);

  console.log('\n🎯 PRIORITY FIXES:');
  console.log('  1. Fix placeholder API implementations');
  console.log('  2. Create missing database tables or remove dead code');
  console.log('  3. Complete broken workflows');
  console.log('  4. Add missing integrations or remove UI references');

  console.log('\n✅ Platform Health Score: ' + Math.round(((143 - totalIssues) / 143) * 100) + '%\n');

  return {
    apiAudit,
    dbAudit,
    frontendAudit,
    integrationAudit,
    workflowAudit,
    totalIssues
  };
}

// Run audit
generateReport().catch(console.error);
