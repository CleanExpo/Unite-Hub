#!/usr/bin/env node

/**
 * Migration State Tracker
 *
 * Manages _migrations table for:
 * - Tracking applied migrations
 * - Comparing local vs production state
 * - Checking migration status
 *
 * Usage:
 *   npm run db:status                      # Show current state
 *   npx tsx scripts/db/state-tracker.ts    # Same as above
 */

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

// =====================================================
// TYPES
// =====================================================

interface AppliedMigration {
  id: string;
  filename: string;
  applied_at: string;
  sha256: string;
  execution_time_ms: number | null;
  status: string;
  error_message: string | null;
  applied_by: string | null;
}

interface LocalMigration {
  filename: string;
  sha256: string;
  size: number;
}

interface MigrationStatus {
  filename: string;
  local: boolean;
  applied: boolean;
  sha256Match: boolean;
  appliedTime: string | null;
  executionTime: number | null;
  status: string;
}

// =====================================================
// LOGGER
// =====================================================

const log = {
  title: (msg: string) => console.log(`\n${'═'.repeat(60)}\n${msg}\n${'═'.repeat(60)}`),
  section: (msg: string) => console.log(`\n📊 ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  warning: (msg: string) => console.log(`⚠️  ${msg}`),
  info: (msg: string) => console.log(`   ${msg}`),
  table: (title: string, rows: any[]) => {
    console.log(`\n${title}`);
    console.log('─'.repeat(80));
    rows.forEach((row) => {
      console.log(`  ${row}`);
    });
  },
};

// =====================================================
// SUPABASE CLIENT
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  log.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// =====================================================
// FILE OPERATIONS
// =====================================================

function getLocalMigrations(): LocalMigration[] {
  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    log.error(`Migrations directory not found: ${migrationsDir}`);
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .map((filename) => {
      const filePath = path.join(migrationsDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const sha256 = crypto.createHash('sha256').update(content).digest('hex');
      const size = fs.statSync(filePath).size;

      return { filename, sha256, size };
    })
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

// =====================================================
// STATE QUERIES
// =====================================================

async function getAppliedMigrations(): Promise<AppliedMigration[]> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('*')
      .order('applied_at', { ascending: true });

    if (error) {
      log.warning(`Could not read applied migrations: ${error.message}`);
      log.info('(This is normal on first run before migration 900 is applied)');
      return [];
    }

    return data || [];
  } catch (err) {
    log.warning(`Error querying state table: ${err.message}`);
    return [];
  }
}

async function getPendingMigrations(): Promise<string[]> {
  const local = getLocalMigrations();
  const applied = await getAppliedMigrations();
  const appliedSet = new Set(applied.map((m) => m.filename));

  return local.filter((m) => !appliedSet.has(m.filename)).map((m) => m.filename);
}

// =====================================================
// STATUS REPORTING
// =====================================================

function compareStatus(
  local: LocalMigration[],
  applied: AppliedMigration[],
): MigrationStatus[] {
  const appliedMap = new Map(applied.map((m) => [m.filename, m]));

  const allFilenames = new Set([
    ...local.map((m) => m.filename),
    ...applied.map((m) => m.filename),
  ]);

  return Array.from(allFilenames)
    .sort()
    .map((filename) => {
      const localMig = local.find((m) => m.filename === filename);
      const appliedMig = appliedMap.get(filename);

      return {
        filename,
        local: !!localMig,
        applied: !!appliedMig,
        sha256Match: localMig && appliedMig ? localMig.sha256 === appliedMig.sha256 : null,
        appliedTime: appliedMig?.applied_at || null,
        executionTime: appliedMig?.execution_time_ms || null,
        status: appliedMig?.status || 'pending',
      };
    });
}

// =====================================================
// DISPLAY FUNCTIONS
// =====================================================

function displayStatus(status: MigrationStatus[]) {
  log.title('📋 Migration Status');

  const pending = status.filter((s) => !s.applied);
  const applied = status.filter((s) => s.applied);
  const drifted = status.filter((s) => s.applied && !s.sha256Match);

  // Summary
  log.section('Summary');
  log.info(`Total migrations: ${status.length}`);
  log.info(`Applied: ${applied.length}`);
  log.info(`Pending: ${pending.length}`);
  log.info(`Drifted (modified after apply): ${drifted.length}`);

  // Pending
  if (pending.length > 0) {
    console.log(`\n⏳ PENDING (${pending.length}):`);
    console.log('─'.repeat(80));
    pending.slice(0, 10).forEach((s) => {
      console.log(`  ${s.filename}`);
    });
    if (pending.length > 10) {
      console.log(`  ... and ${pending.length - 10} more`);
    }
  }

  // Applied (recent)
  if (applied.length > 0) {
    console.log(`\n✅ APPLIED (${applied.length}):`);
    console.log('─'.repeat(80));
    applied
      .slice(-5)
      .reverse()
      .forEach((s) => {
        const time = s.executionTime ? `${s.executionTime}ms` : '—';
        const date = s.appliedTime ? new Date(s.appliedTime).toLocaleDateString() : '—';
        console.log(`  ${s.filename.padEnd(50)} ${date.padEnd(12)} ${time.padEnd(8)}`);
      });
    if (applied.length > 5) {
      console.log(`  ... and ${applied.length - 5} more`);
    }
  }

  // Drifted
  if (drifted.length > 0) {
    console.log(`\n⚠️  DRIFTED - Modified after apply (${drifted.length}):`);
    console.log('─'.repeat(80));
    drifted.forEach((s) => {
      console.log(`  ${s.filename}`);
    });
    log.warning('These migrations have been edited after applying.');
    log.warning('This may cause issues with rollback or re-application.');
  }
}

function displayDetailed(status: MigrationStatus[], filterStatus?: string) {
  log.title('📊 Detailed Migration Status');

  const filtered = filterStatus
    ? status.filter((s) => s.status === filterStatus)
    : status;

  console.log(`\n${filtered.length} migrations:\n`);
  console.log(
    'Status         Filename                                      Applied       Time',
  );
  console.log('─'.repeat(100));

  filtered.forEach((s) => {
    const statusIcon = s.applied ? '✅' : '⏳';
    const timeStr = s.executionTime ? `${s.executionTime}ms` : '—';
    const dateStr = s.appliedTime
      ? new Date(s.appliedTime).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: '2-digit',
        })
      : '—';

    console.log(
      `${statusIcon} ${s.status.padEnd(10)} ${s.filename.padEnd(40)} ${dateStr.padEnd(12)} ${timeStr}`,
    );
  });
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  const command = process.argv[2] || 'status';

  const local = getLocalMigrations();
  const applied = await getAppliedMigrations();
  const status = compareStatus(local, applied);

  switch (command) {
    case 'status':
    case '--status':
      displayStatus(status);
      break;

    case 'detail':
    case '--detail':
    case '--detailed':
      displayDetailed(status);
      break;

    case 'pending':
    case '--pending':
      const pending = status.filter((s) => !s.applied);
      console.log(pending.map((s) => s.filename).join('\n'));
      break;

    case 'applied':
    case '--applied':
      const appliedMigs = status.filter((s) => s.applied);
      console.log(appliedMigs.map((s) => s.filename).join('\n'));
      break;

    case 'json':
    case '--json':
      console.log(JSON.stringify(status, null, 2));
      break;

    case 'count':
    case '--count':
      console.log(`Applied: ${applied.length}`);
      console.log(`Pending: ${status.filter((s) => !s.applied).length}`);
      console.log(`Total: ${status.length}`);
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log(`
Migration State Tracker

Usage: npm run db:status [command]

Commands:
  status      (default) Show migration summary
  detail      Show detailed migration status table
  pending     List pending migrations (one per line)
  applied     List applied migrations (one per line)
  json        Output status as JSON
  count       Show migration counts
  help        Show this help message
      `);
      break;

    default:
      log.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
