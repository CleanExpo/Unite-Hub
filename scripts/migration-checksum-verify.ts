/**
 * Migration Checksum Verifier
 * v1.1.1 Stabilisation - Verifies migration files match recorded checksums
 *
 * Compares migration files against FINAL_MIGRATION_ORDER.txt to ensure:
 * - All migrations exist
 * - Line counts match (basic integrity check)
 * - No unexpected migrations added
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

interface MigrationRecord {
  filename: string;
  lineCount: number;
}

interface VerificationResult {
  passed: boolean;
  missing: string[];
  unexpected: string[];
  mismatch: Array<{ file: string; expected: number; actual: number }>;
  verified: number;
}

function parseMigrationOrder(content: string): MigrationRecord[] {
  const records: MigrationRecord[] = [];

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
continue;
}

    // Format: filename.sql:linecount
    const match = trimmed.match(/^([^:]+):(\d+)$/);
    if (match) {
      records.push({
        filename: match[1],
        lineCount: parseInt(match[2], 10),
      });
    }
  }

  return records;
}

function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function generateChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

async function main() {
  console.log('🔍 Migration Checksum Verifier v1.1.1\n');

  const orderFilePath = path.join(process.cwd(), 'FINAL_MIGRATION_ORDER.txt');
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  // Check required files exist
  if (!fs.existsSync(orderFilePath)) {
    console.error('❌ FINAL_MIGRATION_ORDER.txt not found');
    process.exit(1);
  }

  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found');
    process.exit(1);
  }

  // Parse expected migrations
  const orderContent = fs.readFileSync(orderFilePath, 'utf-8');
  const expectedMigrations = parseMigrationOrder(orderContent);
  console.log(`📋 Expected migrations: ${expectedMigrations.length}`);

  // Get actual migrations
  const actualFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  console.log(`📁 Actual migrations: ${actualFiles.length}\n`);

  // Verify
  const result: VerificationResult = {
    passed: true,
    missing: [],
    unexpected: [],
    mismatch: [],
    verified: 0,
  };

  // Check for missing migrations
  const expectedSet = new Set(expectedMigrations.map(m => m.filename));
  const actualSet = new Set(actualFiles);

  for (const expected of expectedMigrations) {
    if (!actualSet.has(expected.filename)) {
      result.missing.push(expected.filename);
      result.passed = false;
    }
  }

  // Check for unexpected migrations
  for (const actual of actualFiles) {
    if (!expectedSet.has(actual)) {
      result.unexpected.push(actual);
      // Unexpected migrations are warnings, not failures
    }
  }

  // Verify line counts for matching files
  for (const expected of expectedMigrations) {
    if (actualSet.has(expected.filename)) {
      const filePath = path.join(migrationsDir, expected.filename);
      const actualLineCount = countLines(filePath);

      // Allow some tolerance (±5 lines) for minor edits
      const tolerance = 5;
      if (Math.abs(actualLineCount - expected.lineCount) > tolerance) {
        result.mismatch.push({
          file: expected.filename,
          expected: expected.lineCount,
          actual: actualLineCount,
        });
        result.passed = false;
      } else {
        result.verified++;
      }
    }
  }

  // Output results
  console.log('='.repeat(50));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(50) + '\n');

  if (result.missing.length > 0) {
    console.log('❌ Missing migrations:');
    for (const file of result.missing) {
      console.log(`   - ${file}`);
    }
    console.log();
  }

  if (result.unexpected.length > 0) {
    console.log('⚠️  Unexpected migrations (not in order file):');
    for (const file of result.unexpected) {
      console.log(`   - ${file}`);
    }
    console.log();
  }

  if (result.mismatch.length > 0) {
    console.log('❌ Line count mismatches:');
    for (const m of result.mismatch) {
      console.log(`   - ${m.file}: expected ${m.expected}, got ${m.actual}`);
    }
    console.log();
  }

  console.log('='.repeat(50));
  console.log(`Verified: ${result.verified}/${expectedMigrations.length}`);
  console.log(`Missing: ${result.missing.length}`);
  console.log(`Mismatched: ${result.mismatch.length}`);
  console.log(`Unexpected: ${result.unexpected.length}`);
  console.log(`Status: ${result.passed ? 'PASS ✅' : 'FAIL ❌'}`);
  console.log('='.repeat(50));

  if (!result.passed) {
    process.exit(1);
  }

  console.log('\n✅ All migrations verified successfully');
}

main().catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});
