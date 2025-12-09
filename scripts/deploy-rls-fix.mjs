#!/usr/bin/env node

/**
 * RLS Remediation Deployment Script
 * Deploys migration 555_enable_rls_critical_tables.sql
 *
 * Usage:
 *   npm run rls:deploy        # Interactive mode
 *   npm run rls:deploy --dry  # Dry-run (shows SQL without executing)
 *
 * Safety:
 *   - Always backups first (interactive prompt)
 *   - Idempotent (safe to run multiple times)
 *   - Rollback plan documented
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function run() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║         RLS REMEDIATION DEPLOYMENT SCRIPT                     ║
║         Migration 555: Enable RLS on Critical Tables           ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Verify migration exists
    console.log('📋 Step 1: Verifying migration file...');
    const migrationPath = path.resolve('supabase/migrations/555_enable_rls_critical_tables.sql');

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    const lineCount = migrationContent.split('\n').length;
    console.log(`✅ Migration found: ${lineCount} lines`);
    console.log(`   Location: ${migrationPath}\n`);

    // Step 2: Check if dry-run mode
    const isDryRun = process.argv.includes('--dry');
    if (isDryRun) {
      console.log('🔍 DRY-RUN MODE: Showing SQL without executing\n');
      console.log('Migration SQL:');
      console.log('─'.repeat(60));
      console.log(migrationContent.slice(0, 500) + '\n... [content truncated]\n');
      console.log('─'.repeat(60));
      console.log('\n✅ Dry-run complete. To deploy, run: npm run rls:deploy\n');
      process.exit(0);
    }

    // Step 3: Backup confirmation
    console.log('⚠️  Step 2: Backup required before deployment');
    console.log('   Do you have a recent database backup?');
    const hasBackup = await question('   (y/n): ');

    if (hasBackup.toLowerCase() !== 'y') {
      console.log('\n❌ Backup required. Please backup your database first:');
      console.log('   - Supabase: Dashboard → Database → Backups → Create Backup');
      console.log('   - Or: supabase db dump > backup-$(date +%s).sql\n');
      process.exit(1);
    }
    console.log('✅ Backup confirmed\n');

    // Step 4: Review migration
    console.log('📖 Step 3: Review migration (first 1000 chars)');
    console.log('─'.repeat(60));
    console.log(migrationContent.slice(0, 1000) + '\n... [content truncated]\n');
    console.log('─'.repeat(60));

    const readyToDeploy = await question('\n🚀 Ready to deploy? (y/n): ');

    if (readyToDeploy.toLowerCase() !== 'y') {
      console.log('\n❌ Deployment cancelled.');
      console.log('   Review migration at:', migrationPath);
      process.exit(0);
    }

    // Step 5: Deploy
    console.log('\n🔄 Step 4: Deploying migration...\n');

    try {
      // Try Supabase CLI first
      const result = execSync('supabase migration up 555', {
        cwd: process.cwd(),
        stdio: 'inherit'
      });
      console.log('\n✅ Migration deployed successfully via Supabase CLI\n');
    } catch (err) {
      console.log('\n⚠️  Supabase CLI not available or migration already applied');
      console.log('   Manual deployment required:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy migration file content');
      console.log('   3. Paste and run in SQL Editor\n');
      process.exit(1);
    }

    // Step 6: Verification
    console.log('✅ Step 5: Verification SQL (run in Supabase SQL Editor)');
    console.log('─'.repeat(60));
    console.log(`
-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN (
  'users', 'contacts', 'campaigns', 'emails', 'projects', 'audit_log'
);
-- Expected: All should be true

-- Verify policies created
SELECT COUNT(*) as policy_count FROM pg_policies
WHERE schemaname = 'public';
-- Expected: >= 12

-- Test workspace isolation
SELECT * FROM public.users LIMIT 5;
-- Should return only users in your workspace
`);
    console.log('─'.repeat(60));

    // Step 7: Post-deployment checklist
    console.log(`
📋 Step 6: Post-Deployment Checklist
   [ ] Run verification SQL above
   [ ] Test basic auth flow
   [ ] Verify workspace isolation
   [ ] Monitor logs for 24 hours
   [ ] Team sign-off

🎉 Deployment Complete!

📚 Resources:
   - Action Plan: RLS-REMEDIATION-ACTION-PLAN.md
   - Validation: PHASE-3-VALIDATION-REPORT.md
   - Migration: supabase/migrations/555_enable_rls_critical_tables.sql
    `);

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

run();
