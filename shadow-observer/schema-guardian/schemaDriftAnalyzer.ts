import fs from 'fs';
import path from 'path';

interface DriftItem {
  category: 'table' | 'column' | 'index' | 'policy' | 'function' | 'trigger';
  name: string;
  status: 'in-migrations-only' | 'in-live-only' | 'mismatch';
  source?: string;
  liveDefinition?: string;
  migrationsDefinition?: string;
  severity: 'low' | 'medium' | 'high';
}

interface SchemaDriftReport {
  timestamp: string;
  snapshotFile: string;
  migrationDir: string;
  liveSchemaSize: number;
  driftItems: DriftItem[];
  summary: {
    totalDrifts: number;
    tablesDrifted: number;
    highSeverityCount: number;
    migrationOnlyCount: number;
    liveOnlyCount: number;
    mismatchCount: number;
  };
  recommendations: string[];
}

function readFileOrNull(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
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

function extractTableNames(sqlContent: string): Set<string> {
  const tablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/gi;
  const tables = new Set<string>();
  let match;
  while ((match = tablePattern.exec(sqlContent)) !== null) {
    tables.add(match[1].toLowerCase());
  }
  return tables;
}

function extractPolicies(sqlContent: string): Set<string> {
  const policyPattern = /CREATE\s+POLICY\s+['""`]?(\w+)['""`]?\s+ON\s+(?:public\.)?(\w+)/gi;
  const policies = new Set<string>();
  let match;
  while ((match = policyPattern.exec(sqlContent)) !== null) {
    policies.add(`${match[2]}.${match[1]}`.toLowerCase());
  }
  return policies;
}

function extractFunctions(sqlContent: string): Set<string> {
  const funcPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(/gi;
  const funcs = new Set<string>();
  let match;
  while ((match = funcPattern.exec(sqlContent)) !== null) {
    funcs.add(match[1].toLowerCase());
  }
  return funcs;
}

function extractTriggers(sqlContent: string): Set<string> {
  const triggerPattern = /CREATE\s+TRIGGER\s+['""`]?(\w+)['""`]?\s+/gi;
  const triggers = new Set<string>();
  let match;
  while ((match = triggerPattern.exec(sqlContent)) !== null) {
    triggers.add(match[1].toLowerCase());
  }
  return triggers;
}

function analyzeDrift(liveSchema: string, migrationFiles: string[]): DriftItem[] {
  const drifts: DriftItem[] = [];

  // Extract schema elements
  const liveTables = extractTableNames(liveSchema);
  const liveRls = extractPolicies(liveSchema);
  const liveFuncs = extractFunctions(liveSchema);
  const liveTriggers = extractTriggers(liveSchema);

  // Extract from migration files
  const migrationContent = migrationFiles.join('\n\n');
  const migrationTables = extractTableNames(migrationContent);
  const migrationRls = extractPolicies(migrationContent);
  const migrationFuncs = extractFunctions(migrationContent);
  const migrationTriggers = extractTriggers(migrationContent);

  // Find tables in live schema but not in migrations
  for (const table of liveTables) {
    if (!migrationTables.has(table)) {
      drifts.push({
        category: 'table',
        name: table,
        status: 'in-live-only',
        severity: 'high',
        liveDefinition: liveSchema
          .split('\n')
          .find((line) => line.toLowerCase().includes(`create table`) && line.toLowerCase().includes(table))
      });
    }
  }

  // Find tables in migrations but not in live
  for (const table of migrationTables) {
    if (!liveTables.has(table)) {
      drifts.push({
        category: 'table',
        name: table,
        status: 'in-migrations-only',
        severity: 'medium'
      });
    }
  }

  // Find RLS policies in live but not in migrations
  for (const policy of liveRls) {
    if (!migrationRls.has(policy)) {
      drifts.push({
        category: 'policy',
        name: policy,
        status: 'in-live-only',
        severity: 'high'
      });
    }
  }

  // Find RLS policies in migrations but not in live
  for (const policy of migrationRls) {
    if (!liveRls.has(policy)) {
      drifts.push({
        category: 'policy',
        name: policy,
        status: 'in-migrations-only',
        severity: 'medium'
      });
    }
  }

  // Find functions in live but not in migrations
  for (const func of liveFuncs) {
    if (!migrationFuncs.has(func)) {
      drifts.push({
        category: 'function',
        name: func,
        status: 'in-live-only',
        severity: 'medium'
      });
    }
  }

  // Find triggers in live but not in migrations
  for (const trigger of liveTriggers) {
    if (!migrationTriggers.has(trigger)) {
      drifts.push({
        category: 'trigger',
        name: trigger,
        status: 'in-live-only',
        severity: 'medium'
      });
    }
  }

  return drifts;
}

export async function schemaDriftAnalyzer(): Promise<SchemaDriftReport> {
  try {
    const snapshotPath = 'reports/live_schema_snapshot.sql';
    const migrationDir = path.resolve('supabase', 'migrations');

    console.log('[schema-guardian] Analyzing schema drift...');

    // Read live schema snapshot
    const liveSchema = readFileOrNull(snapshotPath);
    if (!liveSchema) {
      return {
        timestamp: new Date().toISOString(),
        snapshotFile: snapshotPath,
        migrationDir: migrationDir,
        liveSchemaSize: 0,
        driftItems: [],
        summary: {
          totalDrifts: 0,
          tablesDrifted: 0,
          highSeverityCount: 0,
          migrationOnlyCount: 0,
          liveOnlyCount: 0,
          mismatchCount: 0
        },
        recommendations: [
          'Live schema snapshot not found. Run liveSchemaSnapshot() first.',
          'Execute: npm run shadow:schema:snapshot'
        ]
      };
    }

    // Read migration files
    let migrationFiles: string[] = [];
    try {
      if (fs.existsSync(migrationDir)) {
        const files = fs.readdirSync(migrationDir);
        migrationFiles = files
          .filter((f) => f.endsWith('.sql'))
          .map((f) => readFileOrNull(path.join(migrationDir, f)) || '')
          .filter((content) => content.length > 0);
      }
    } catch (err) {
      console.error(`Failed to read migrations: ${err}`);
    }

    // Analyze drift
    const driftItems = analyzeDrift(liveSchema, migrationFiles);

    // Summarize
    const summary = {
      totalDrifts: driftItems.length,
      tablesDrifted: driftItems.filter((d) => d.category === 'table').length,
      highSeverityCount: driftItems.filter((d) => d.severity === 'high').length,
      migrationOnlyCount: driftItems.filter((d) => d.status === 'in-migrations-only').length,
      liveOnlyCount: driftItems.filter((d) => d.status === 'in-live-only').length,
      mismatchCount: driftItems.filter((d) => d.status === 'mismatch').length
    };

    // Generate recommendations
    const recommendations: string[] = [];
    if (summary.highSeverityCount > 0) {
      recommendations.push(`⚠️ ${summary.highSeverityCount} high-severity drifts detected`);
      recommendations.push('Review live-only tables and policies — may indicate schema divergence');
    }
    if (summary.migrationOnlyCount > 0) {
      recommendations.push(`📝 ${summary.migrationOnlyCount} migrations describe objects not in live schema`);
      recommendations.push('Verify if these are intentional (not yet deployed) or orphaned');
    }
    if (summary.liveOnlyCount > 0) {
      recommendations.push(`🔄 ${summary.liveOnlyCount} live objects not documented in migrations`);
      recommendations.push('Consider adding these to migration history for reproducibility');
    }
    if (summary.totalDrifts === 0) {
      recommendations.push('✅ No drift detected — live schema matches migration history');
    }

    const report: SchemaDriftReport = {
      timestamp: new Date().toISOString(),
      snapshotFile: snapshotPath,
      migrationDir: migrationDir,
      liveSchemaSize: liveSchema.length,
      driftItems,
      summary,
      recommendations
    };

    safeWriteJSON('reports/schema_drift_report.json', report);
    console.log(`   ✓ Schema drift analysis complete (${driftItems.length} drifts found)`);

    return report;
  } catch (err) {
    const errorMsg = String(err);
    console.error(`[schema-guardian] Drift analysis error: ${errorMsg}`);

    const fallbackReport: SchemaDriftReport = {
      timestamp: new Date().toISOString(),
      snapshotFile: 'reports/live_schema_snapshot.sql',
      migrationDir: path.resolve('supabase', 'migrations'),
      liveSchemaSize: 0,
      driftItems: [],
      summary: {
        totalDrifts: 0,
        tablesDrifted: 0,
        highSeverityCount: 0,
        migrationOnlyCount: 0,
        liveOnlyCount: 0,
        mismatchCount: 0
      },
      recommendations: [`Error during analysis: ${errorMsg}`]
    };

    safeWriteJSON('reports/schema_drift_report.json', fallbackReport);
    return fallbackReport;
  }
}

// Auto-run when invoked
schemaDriftAnalyzer()
  .then((result) => {
    console.log(`[schema-guardian] Drift analysis complete: ${result.summary.totalDrifts} drifts found`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[schema-guardian] Fatal error:', err);
    process.exit(1);
  });
