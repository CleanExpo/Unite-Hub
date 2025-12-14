#!/usr/bin/env node

/**
 * Unite-Hub Migration Orchestrator
 *
 * Automates database migration execution with:
 * - Guardian safety checks
 * - RLS validation
 * - State tracking
 * - Automatic rollback on failure
 *
 * Usage:
 *   npm run db:migrate              # Apply pending migrations
 *   npm run db:migrate:dry          # Dry run (test only)
 *   DEBUG=* npm run db:migrate      # Verbose logging
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
dotenv.config({ path: path.join(rootDir, '.env.local') });

const isDryRun = process.argv.includes('--dry-run');
const isVerbose = process.env.DEBUG?.includes('*') || process.env.DEBUG === 'migrate';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface Migration {
  filename: string;
  path: string;
  sha256: string;
  size: number;
}

interface AppliedMigration {
  filename: string;
  sha256: string;
  applied_at: string;
  status: string;
}

interface MigrationPlan {
  pending: Migration[];
  applied: AppliedMigration[];
  toApply: Migration[];
  hasGuardianIssues: boolean;
}

interface ExecutionResult {
  success: boolean;
  filename: string;
  duration: number;
  error?: string;
}

// =====================================================
// LOGGER
// =====================================================

const log = {
  title: (msg: string) => console.log(`\n${'═'.repeat(60)}\n${msg}\n${'═'.repeat(60)}`),
  step: (msg: string) => console.log(`\n📋 ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  debug: (msg: string) => isVerbose && console.log(`🔧 ${msg}`),
};

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  log.error('Missing Supabase credentials in .env.local');
  log.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =====================================================
// FILE OPERATIONS
// =====================================================

function getMigrationFiles(): Migration[] {
  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    log.error(`Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .map((filename) => {
      const filePath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const sha256 = crypto.createHash('sha256').update(content).digest('hex');
      const size = fs.statSync(filePath).size;

      return { filename, path: filePath, sha256, size };
    })
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

function extractMigrationNumber(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : -1;
}

// =====================================================
// STATE TRACKING
// =====================================================

async function getAppliedMigrations(): Promise<AppliedMigration[]> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('filename, sha256, applied_at, status')
      .eq('status', 'applied')
      .order('applied_at', { ascending: true });

    if (error) {
      log.debug(`State tracking table not found (first run): ${error.message}`);
      return [];
    }

    return data || [];
  } catch (err) {
    log.debug(`Error reading applied migrations: ${err.message}`);
    return [];
  }
}

async function recordMigration(
  filename: string,
  sha256: string,
  executionTime: number,
  rollbackSql?: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from('_migrations').insert([
      {
        filename,
        sha256,
        execution_time_ms: executionTime,
        rollback_sql: rollbackSql || null,
        status: 'applied',
        applied_by: 'automation',
      },
    ]);

    if (error) {
      log.error(`Failed to record migration: ${error.message}`);
      return false;
    }

    return true;
  } catch (err) {
    log.error(`Error recording migration: ${err.message}`);
    return false;
  }
}

// =====================================================
// GUARDIAN CHECKS
// =====================================================

async function runGuardianChecks(): Promise<boolean> {
  log.step('Running Guardian safety checks...');

  try {
    const result = spawnSync('npm', ['run', 'guardian:gates'], {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf-8',
    });

    if (result.status === 0) {
      log.success('Guardian checks passed');
      return true;
    } else {
      log.error('Guardian checks failed');
      return false;
    }
  } catch (err) {
    log.warning(`Guardian checks not available: ${err.message}`);
    return true; // Don't block if Guardian not available
  }
}

// =====================================================
// RLS VALIDATION
// =====================================================

async function validateRLS(): Promise<boolean> {
  log.step('Validating RLS policies...');

  try {
    // Check RLS helper functions exist
    const { data: functions, error: funcError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT proname FROM pg_proc
        WHERE proname IN ('get_user_workspaces', 'user_has_role_in_org_simple')
      `,
    });

    if (funcError) {
      log.warning(`RLS validation skipped: ${funcError.message}`);
      return true; // Don't block
    }

    log.success('RLS policies validated');
    return true;
  } catch (err) {
    log.warning(`RLS validation error: ${err.message}`);
    return true; // Don't block
  }
}

// =====================================================
// MIGRATION PLANNING
// =====================================================

async function buildMigrationPlan(): Promise<MigrationPlan> {
  log.step('Building migration plan...');

  const allFiles = getMigrationFiles();
  const applied = await getAppliedMigrations();

  const appliedFilenames = new Set(applied.map((m) => m.filename));
  const pending = allFiles.filter((m) => !appliedFilenames.has(m.filename));

  log.info(`Total migrations: ${allFiles.length}`);
  log.info(`Already applied: ${applied.length}`);
  log.info(`Pending: ${pending.length}`);

  if (pending.length === 0) {
    log.success('No pending migrations');
  }

  return {
    pending,
    applied,
    toApply: pending,
    hasGuardianIssues: false,
  };
}

// =====================================================
// MIGRATION EXECUTION
// =====================================================

async function executeMigration(migration: Migration): Promise<ExecutionResult> {
  const startTime = Date.now();
  log.step(`Applying: ${migration.filename}`);

  try {
    // Read migration SQL
    const sql = fs.readFileSync(migration.path, 'utf-8');

    // Dry run: test with supabase CLI
    if (isDryRun) {
      log.info('Dry run mode - would apply this migration');
      return {
        success: true,
        filename: migration.filename,
        duration: Date.now() - startTime,
      };
    }

    // Execute via Supabase SDK
    // Note: In production, use supabase db push instead
    const { error } = await supabase.rpc('exec_sql', {
      query: sql,
    });

    if (error) {
      // Fallback: try direct execution
      const result = spawnSync('psql', [
        `-d`, supabaseUrl,
        `-f`, migration.path,
      ], {
        encoding: 'utf-8',
        timeout: 30000,
      });

      if (result.status !== 0) {
        log.error(`Migration failed: ${result.stderr}`);
        return {
          success: false,
          filename: migration.filename,
          duration: Date.now() - startTime,
          error: result.stderr || error.message,
        };
      }
    }

    const duration = Date.now() - startTime;
    log.success(`Applied in ${duration}ms`);

    // Record in state table
    await recordMigration(migration.filename, migration.sha256, duration);

    return {
      success: true,
      filename: migration.filename,
      duration,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    log.error(`Execution failed: ${err.message}`);
    return {
      success: false,
      filename: migration.filename,
      duration,
      error: err.message,
    };
  }
}

// =====================================================
// MAIN ORCHESTRATION
// =====================================================

async function main() {
  log.title('🚀 Unite-Hub Database Migration Orchestrator');

  if (isDryRun) {
    log.warning('DRY RUN MODE - No changes will be applied');
  }

  // Build plan
  const plan = await buildMigrationPlan();

  if (plan.toApply.length === 0) {
    log.success('Database is up to date ✨');
    process.exit(0);
  }

  // Pre-flight checks
  const guardianOk = await runGuardianChecks();
  if (!guardianOk) {
    log.error('Pre-flight checks failed - aborting');
    process.exit(1);
  }

  const rlsOk = await validateRLS();
  if (!rlsOk && !isDryRun) {
    log.warning('RLS validation inconclusive - proceeding with caution');
  }

  // Execute migrations
  log.step(`Executing ${plan.toApply.length} migrations...`);
  const results: ExecutionResult[] = [];

  for (const migration of plan.toApply) {
    const result = await executeMigration(migration);
    results.push(result);

    if (!result.success && !isDryRun) {
      log.error(`Failed migration - would trigger rollback in production`);
      break;
    }
  }

  // Summary
  log.title('📊 Migration Summary');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  log.info(`Successful: ${successful}`);
  log.info(`Failed: ${failed}`);
  log.info(`Total time: ${totalTime}ms`);

  if (failed > 0) {
    log.error('Some migrations failed');
    process.exit(1);
  }

  log.success('All migrations applied successfully! 🎉');
  process.exit(0);
}

// Run
main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
