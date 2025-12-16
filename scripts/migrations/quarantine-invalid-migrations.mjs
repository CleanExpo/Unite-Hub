#!/usr/bin/env node
/**
 * Quarantine invalid migrations in `supabase/migrations/`.
 *
 * Moves anything NOT matching `YYYYMMDDHHMMSS_name.sql` into:
 *   `supabase/migrations/_quarantine_invalid_names/`
 *
 * - Uses `git mv` for tracked files (preserves history).
 * - Uses filesystem rename for untracked files.
 * - Prints a report of moved files.
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const rootDir = process.cwd();
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
const quarantineDir = path.join(migrationsDir, '_quarantine_invalid_names');

const VALID_MIGRATION_RE = /^\d{14}_[a-z0-9_]+\.sql$/i;

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  return result;
}

function getTrackedMigrationRelPaths() {
  const result = runGit(['ls-files', 'supabase/migrations']);
  if (result.status !== 0) {
    throw new Error(result.stdout || result.stderr || 'git ls-files failed');
  }
  return new Set(
    (result.stdout || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean),
  );
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function uniqueDestination(destPath) {
  if (!fs.existsSync(destPath)) return destPath;
  const parsed = path.parse(destPath);
  for (let i = 1; i < 1000; i++) {
    const candidate = path.join(
      parsed.dir,
      `${parsed.name}__dup${i}${parsed.ext}`,
    );
    if (!fs.existsSync(candidate)) return candidate;
  }
  throw new Error(`Could not find unique destination for ${destPath}`);
}

function main() {
  if (!fs.existsSync(migrationsDir)) {
    console.error(`❌ Migrations directory not found: ${migrationsDir}`);
    process.exit(1);
  }

  ensureDir(quarantineDir);

  const tracked = getTrackedMigrationRelPaths();
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });

  const moved = [];
  const skipped = [];
  const trackedToMove = [];

  for (const entry of entries) {
    if (entry.name === '_quarantine_invalid_names') continue;
    if (entry.isDirectory()) continue;

    const fileName = entry.name;
    const relPath = path.posix.join('supabase/migrations', fileName);

    const isValid = VALID_MIGRATION_RE.test(fileName);
    if (isValid) {
      skipped.push(relPath);
      continue;
    }

    if (tracked.has(relPath)) {
      trackedToMove.push(relPath);
    } else {
      const target = uniqueDestination(path.join(quarantineDir, fileName));
      fs.renameSync(path.join(migrationsDir, fileName), target);
      const relTarget = path
        .relative(rootDir, target)
        .split(path.sep)
        .join('/');
      moved.push({ from: relPath, to: relTarget });
    }
  }

  const batchSize = 100;
  for (let i = 0; i < trackedToMove.length; i += batchSize) {
    const batch = trackedToMove.slice(i, i + batchSize);
    const mv = runGit(['mv', ...batch, 'supabase/migrations/_quarantine_invalid_names/']);
    if (mv.status !== 0) {
      console.error(`❌ git mv failed for batch starting at index ${i}`);
      console.error(mv.stdout || mv.stderr);
      process.exit(1);
    }
    for (const from of batch) {
      moved.push({
        from,
        to: 'supabase/migrations/_quarantine_invalid_names/' + from.split('/').pop(),
      });
    }
  }

  console.log('=== Quarantine Invalid Migrations Report ===');
  console.log(`Moved: ${moved.length}`);
  console.log(`Kept (valid timestamped): ${skipped.length}`);
  if (moved.length > 0) {
    console.log('\nMoved files:');
    for (const m of moved) console.log(`- ${m.from} -> ${m.to}`);
  }
}

main();

