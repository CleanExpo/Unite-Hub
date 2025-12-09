import fs from 'fs';
import path from 'path';

interface SqlInventoryReport {
  timestamp: string;
  migrationsDir: string;
  exists: boolean;
  files: Array<{
    fileName: string;
    fullPath: string;
    sizeBytes: number;
    createdAt: string | null;
    modifiedAt: string | null;
  }>;
  summary: {
    count: number;
    totalSizeBytes: number;
    largestFileBytes: number;
  };
}

interface SqlDiffPlan {
  timestamp: string;
  status: 'draft';
  notes: string[];
  assumptions: string[];
  steps: Array<{
    stepId: string;
    description: string;
    requiresDbAccess: boolean;
    destructive: boolean;
  }>;
  migrationFiles: Array<{
    fileName: string;
    sizeBytes: number;
    plannedStatus: 'unknown' | 'to-verify' | 'legacy';
  }>;
}

function loadJSON<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJSON(filePath: string, data: unknown): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

export async function buildSqlDiffPlan(): Promise<SqlDiffPlan> {
  const inventory = loadJSON<SqlInventoryReport>('reports/sql_migration_inventory.json', {
    timestamp: '',
    migrationsDir: '',
    exists: false,
    files: [],
    summary: { count: 0, totalSizeBytes: 0, largestFileBytes: 0 }
  });

  const plan: SqlDiffPlan = {
    timestamp: new Date().toISOString(),
    status: 'draft',
    notes: [
      'Non-destructive SQL diff PLAN only. No database access, no schema changes.',
      'Intended to be wired later to Supabase SQL Editor / read-only DB access.',
      'Use this as a checklist before you touch any production schema.'
    ],
    assumptions: [
      'supabase/migrations is the single source of truth for migration scripts.',
      'Live Supabase schema may contain legacy or manual changes.',
      'All destructive actions MUST be manually reviewed.'
    ],
    steps: [
      {
        stepId: 'collect_live_schema',
        description: 'Export live schema from Supabase (read-only) into a snapshot file, e.g. reports/live_schema_snapshot.sql',
        requiresDbAccess: true,
        destructive: false
      },
      {
        stepId: 'compare_migrations_to_live',
        description: 'Diff migration history vs live schema to detect drift, missing objects, and legacy artefacts.',
        requiresDbAccess: true,
        destructive: false
      },
      {
        stepId: 'classify_changes',
        description: 'Classify differences into safe additions, risky changes, and dangerous deletions.',
        requiresDbAccess: false,
        destructive: false
      },
      {
        stepId: 'manual_review_gate',
        description: 'Human must sign off before any destructive SQL is executed in Supabase SQL Editor.',
        requiresDbAccess: false,
        destructive: false
      }
    ],
    migrationFiles: []
  };

  if (!inventory.exists) {
    plan.notes.push('No supabase/migrations directory found or inventory missing. Nothing to plan yet.');
    safeWriteJSON('reports/sql_diff_plan.json', plan);
    return plan;
  }

  plan.migrationFiles = inventory.files.map((f) => ({
    fileName: f.fileName,
    sizeBytes: f.sizeBytes,
    plannedStatus: 'to-verify' as const
  }));

  safeWriteJSON('reports/sql_diff_plan.json', plan);
  return plan;
}

// Auto-run when imported as main module
buildSqlDiffPlan().then(() => {
  console.log('[shadow-observer] SQL diff plan written to reports/sql_diff_plan.json');
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
