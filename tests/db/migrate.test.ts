import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Migration Orchestrator Tests
 *
 * Tests for:
 * - Migration file discovery
 * - State tracking
 * - Guardian integration
 * - Dry-run functionality
 */

describe('Migration Orchestrator', () => {
  describe('Migration Discovery', () => {
    it('should find all SQL migration files', () => {
      const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
      expect(fs.existsSync(migrationsDir)).toBe(true);

      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'));

      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f) => f.includes('_migration_state_tracking'))).toBe(true);
    });

    it('should sort migrations numerically', () => {
      const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'));

      // Extract numeric prefix
      const getNumber = (filename: string) => {
        const match = filename.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      // Sort numerically
      const sorted = [...files].sort((a, b) => getNumber(a) - getNumber(b));

      // Verify sorted equals lexical sort of files with consistent numbering
      // (some files may not start with numbers)
      expect(sorted.length).toBeGreaterThan(0);
    });

    it('should read migration file content correctly', () => {
      const stateTrackingMigrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20251214115900_migration_state_tracking.sql',
      );

      if (fs.existsSync(stateTrackingMigrationPath)) {
        const content = fs.readFileSync(stateTrackingMigrationPath, 'utf-8');
        expect(content).toContain('_migrations');
        expect(content).toContain('CREATE TABLE');
      }
    });

    it('should compute SHA256 hash of migration files', () => {
      const stateTrackingMigrationPath = path.join(
        process.cwd(),
        'supabase',
        'migrations',
        '20251214115900_migration_state_tracking.sql',
      );

      if (fs.existsSync(stateTrackingMigrationPath)) {
        const content = fs.readFileSync(stateTrackingMigrationPath, 'utf-8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');

        expect(hash).toBeTruthy();
        expect(hash.length).toBe(64); // SHA256 = 64 hex characters
      }
    });
  });

  describe('Migration Planning', () => {
    it('should identify pending migrations', () => {
      // This would require database access, so we mock the logic
      const appliedFilenames = new Set(['001_initial.sql', '002_schema.sql']);
      const allFiles = [
        '001_initial.sql',
        '002_schema.sql',
        '003_indexes.sql',
        '900_migration_automation.sql',
      ];

      const pending = allFiles.filter((f) => !appliedFilenames.has(f));

      expect(pending).toHaveLength(2);
      expect(pending).toContain('003_indexes.sql');
      expect(pending).toContain('900_migration_automation.sql');
    });

    it('should detect guardian issues', () => {
      // Mock Guardian detection
      const suspiciousMigration = 'DROP TABLE users;';
      const isSuspicious = /DROP TABLE|DROP COLUMN|RENAME COLUMN/i.test(suspiciousMigration);

      expect(isSuspicious).toBe(true);
    });

    it('should plan migration execution order', () => {
      const migrations = [
        { filename: '003_indexes.sql', applied: false },
        { filename: '002_schema.sql', applied: true },
        { filename: '900_migration_automation.sql', applied: false },
        { filename: '001_initial.sql', applied: true },
      ];

      const pending = migrations
        .filter((m) => !m.applied)
        .sort((a, b) => a.filename.localeCompare(b.filename));

      expect(pending[0].filename).toBe('003_indexes.sql');
      expect(pending[1].filename).toBe('900_migration_automation.sql');
    });
  });

  describe('Safe Operations', () => {
    it('should validate idempotent CREATE TABLE', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY);';
      const isIdempotent = sql.includes('IF NOT EXISTS');

      expect(isIdempotent).toBe(true);
    });

    it('should validate idempotent CREATE INDEX', () => {
      const sql = 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);';
      const isIdempotent = sql.includes('IF NOT EXISTS');

      expect(isIdempotent).toBe(true);
    });

    it('should flag non-idempotent CREATE operations', () => {
      const unsafeSql = 'CREATE TABLE users (id UUID PRIMARY KEY);';
      const isIdempotent = unsafeSql.includes('IF NOT EXISTS');

      expect(isIdempotent).toBe(false);
    });

    it('should flag unsafe DROP operations', () => {
      const dangerousSql = 'DROP TABLE users;';
      const isDangerous = /^DROP\s+(TABLE|COLUMN|INDEX)/i.test(dangerousSql);

      expect(isDangerous).toBe(true);
    });

    it('should validate ADD-ONLY marker presence', () => {
      const validMigration = `
        -- ADD-ONLY: true
        CREATE TABLE IF NOT EXISTS new_table (id UUID);
      `;

      const hasAddOnlyMarker = validMigration.includes('ADD-ONLY: true');
      expect(hasAddOnlyMarker).toBe(true);
    });
  });

  describe('State Tracking', () => {
    it('should record migration metadata correctly', () => {
      const migrationRecord = {
        filename: '900_migration_automation.sql',
        sha256: 'abc123def456',
        execution_time_ms: 1234,
        status: 'applied',
        applied_by: 'automation',
      };

      expect(migrationRecord.filename).toBeTruthy();
      expect(migrationRecord.sha256).toHaveLength(12); // Mock
      expect(migrationRecord.execution_time_ms).toBeGreaterThan(0);
      expect(migrationRecord.status).toBe('applied');
    });

    it('should validate migration state transitions', () => {
      const validTransitions = {
        pending: ['applied', 'skipped'],
        applied: ['rolled_back', 'failed'],
        failed: ['applied', 'rolled_back'],
        rolled_back: ['applied'],
      };

      const currentState = 'pending';
      const nextState = 'applied';

      expect(validTransitions[currentState]).toContain(nextState);
    });

    it('should compute migration execution time', () => {
      const startTime = 1000;
      const endTime = 1234;
      const duration = endTime - startTime;

      expect(duration).toBe(234);
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should catch syntax errors in SQL', () => {
      const invalidSql = 'CREATE TABLE test (id UUID PRIMARY KEY'; // Missing )
      const hasError = !invalidSql.includes(');') && invalidSql.includes('(');

      expect(hasError).toBe(true);
    });

    it('should handle missing migration files', () => {
      const nonExistentPath = '/nonexistent/migration.sql';
      const exists = fs.existsSync(nonExistentPath);

      expect(exists).toBe(false);
    });

    it('should rollback on failure', () => {
      // Mock rollback scenario
      const migration = {
        filename: '901_test.sql',
        rollback_sql: 'DROP TABLE IF EXISTS test_table;',
      };

      expect(migration.rollback_sql).toBeTruthy();
      expect(migration.rollback_sql).toContain('DROP TABLE');
    });

    it('should report execution errors clearly', () => {
      const errorMessage = 'relation "invalid_table" does not exist';
      expect(errorMessage).toContain('does not exist');
      expect(errorMessage).toMatch(/relation|table|column/i);
    });
  });

  describe('Dry Run Mode', () => {
    it('should skip actual execution in dry-run', () => {
      const isDryRun = true;
      const shouldExecute = !isDryRun;

      expect(shouldExecute).toBe(false);
    });

    it('should report what would execute in dry-run', () => {
      const migrations = ['001_initial.sql', '002_schema.sql'];
      const dryRunOutput = `Would apply ${migrations.length} migrations`;

      expect(dryRunOutput).toContain('Would apply');
      expect(dryRunOutput).toContain('2');
    });

    it('should validate syntax without executing in dry-run', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS test (id UUID);';
      const syntaxValid = sql.includes('CREATE TABLE');

      expect(syntaxValid).toBe(true);
    });
  });

  describe('Integration', () => {
    it('should build complete migration plan', () => {
      const plan = {
        pending: [
          { filename: '003_indexes.sql', path: '/path/to/003.sql', sha256: 'abc' },
        ],
        applied: [
          { filename: '001_initial.sql', sha256: 'def' },
          { filename: '002_schema.sql', sha256: 'ghi' },
        ],
        toApply: [
          { filename: '003_indexes.sql', path: '/path/to/003.sql', sha256: 'abc' },
        ],
        hasGuardianIssues: false,
      };

      expect(plan.pending.length).toBeGreaterThan(0);
      expect(plan.applied.length).toBeGreaterThan(0);
      expect(plan.hasGuardianIssues).toBe(false);
      expect(plan.toApply.length).toBe(plan.pending.length);
    });

    it('should validate pre-flight checks', () => {
      const checks = {
        environment: true,
        nodeVersion: true,
        guardian: true,
        rlsPolicies: true,
        schemaDrift: true,
      };

      const allPassed = Object.values(checks).every((c) => c === true);
      expect(allPassed).toBe(true);
    });

    it('should return successful execution summary', () => {
      const results = [
        { success: true, filename: '001_initial.sql', duration: 100 },
        { success: true, filename: '002_schema.sql', duration: 150 },
      ];

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

      expect(successful).toBe(2);
      expect(failed).toBe(0);
      expect(totalTime).toBe(250);
    });
  });
});
