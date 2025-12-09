import fs from 'fs';
import path from 'path';

interface HealthIndicator {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
  remediation?: string;
}

interface SchemaHealthReport {
  timestamp: string;
  schemaFile: string;
  totalSize: number;
  indicators: HealthIndicator[];
  summary: {
    passCount: number;
    warningCount: number;
    failCount: number;
    overallScore: number; // 0-100
  };
  securityScore: {
    rlsEnforcement: number; // 0-100
    policyCount: number;
    unprotectedTables: string[];
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

function countMatches(content: string, pattern: RegExp): number {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

function extractTableNames(content: string): string[] {
  const pattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
  const tables: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    tables.push(match[1]);
  }
  return [...new Set(tables)];
}

function extractRlsTableNames(content: string): string[] {
  const pattern = /CREATE\s+POLICY\s+['""`]?\w+['""`]?\s+ON\s+(?:public\.)?(\w+)/gi;
  const tables: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    tables.push(match[1]);
  }
  return [...new Set(tables)];
}

function runHealthChecks(schemaContent: string): HealthIndicator[] {
  const indicators: HealthIndicator[] = [];

  // Check 1: UUIDs for primary keys
  const hasUuidExtension = /CREATE EXTENSION.*uuid/i.test(schemaContent);
  const uuidPks = countMatches(schemaContent, /id\s+uuid\s+PRIMARY\s+KEY/gi);
  indicators.push({
    id: 'uuid-adoption',
    name: 'UUID Primary Keys',
    status: hasUuidExtension && uuidPks > 5 ? 'pass' : 'warning',
    message: `${uuidPks} tables use UUID primary keys`,
    details: `UUID extension: ${hasUuidExtension ? 'enabled' : 'missing'}`,
    remediation: 'Enable uuid-ossp extension: CREATE EXTENSION IF NOT EXISTS uuid-ossp'
  });

  // Check 2: Timestamps
  const createdAtCount = countMatches(schemaContent, /created_at\s+(?:timestamp|timestamptz)/gi);
  const updatedAtCount = countMatches(schemaContent, /updated_at\s+(?:timestamp|timestamptz)/gi);
  indicators.push({
    id: 'timestamp-coverage',
    name: 'Timestamp Columns',
    status: createdAtCount > 10 && updatedAtCount > 5 ? 'pass' : 'warning',
    message: `created_at: ${createdAtCount}, updated_at: ${updatedAtCount}`,
    details: 'Good practice: track record changes with timestamps',
    remediation: 'Add created_at and updated_at to all tables'
  });

  // Check 3: RLS Policies
  const policyCount = countMatches(schemaContent, /CREATE\s+POLICY/gi);
  const allTables = extractTableNames(schemaContent);
  const rlsTables = extractRlsTableNames(schemaContent);
  const unprotected = allTables.filter((t) => !rlsTables.includes(t));

  indicators.push({
    id: 'rls-coverage',
    name: 'Row Level Security',
    status: policyCount > 20 ? 'pass' : policyCount > 5 ? 'warning' : 'fail',
    message: `${policyCount} policies covering ${rlsTables.length}/${allTables.length} tables`,
    details: `Unprotected tables: ${unprotected.slice(0, 5).join(', ')}${unprotected.length > 5 ? `...+${unprotected.length - 5}` : ''}`,
    remediation: 'Enable RLS on public tables and define policies for workspace isolation'
  });

  // Check 4: Indexes
  const indexCount = countMatches(schemaContent, /CREATE\s+(?:UNIQUE\s+)?INDEX/gi);
  indicators.push({
    id: 'index-coverage',
    name: 'Database Indexes',
    status: indexCount > 50 ? 'pass' : indexCount > 20 ? 'warning' : 'fail',
    message: `${indexCount} indexes defined`,
    details: 'Indexes improve query performance and enable unique constraints',
    remediation: 'Add indexes on frequently queried columns (email, workspace_id, etc.)'
  });

  // Check 5: Functions/Triggers
  const funcCount = countMatches(schemaContent, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/gi);
  const triggerCount = countMatches(schemaContent, /CREATE\s+TRIGGER/gi);
  indicators.push({
    id: 'automation',
    name: 'Functions & Triggers',
    status: funcCount + triggerCount > 20 ? 'pass' : 'warning',
    message: `${funcCount} functions, ${triggerCount} triggers`,
    details: 'Triggers enforce constraints and maintain data integrity',
    remediation: 'Use triggers for: updated_at updates, audit logging, denormalization'
  });

  // Check 6: Constraints
  const pkCount = countMatches(schemaContent, /PRIMARY\s+KEY/gi);
  const fkCount = countMatches(schemaContent, /FOREIGN\s+KEY/gi);
  const uniqueCount = countMatches(schemaContent, /UNIQUE\s+\(/gi);

  indicators.push({
    id: 'constraints',
    name: 'Data Integrity Constraints',
    status: pkCount > 10 && fkCount > 5 ? 'pass' : 'warning',
    message: `PKs: ${pkCount}, FKs: ${fkCount}, UNIQUEs: ${uniqueCount}`,
    details: 'Constraints enforce referential integrity and data quality',
    remediation: 'Define foreign keys and unique constraints on important columns'
  });

  // Check 7: Enums
  const enumCount = countMatches(schemaContent, /CREATE\s+TYPE.*AS\s+ENUM/gi);
  indicators.push({
    id: 'enums',
    name: 'Enum Types',
    status: enumCount > 5 ? 'pass' : 'warning',
    message: `${enumCount} enum types defined`,
    details: 'Enums prevent invalid status values and improve type safety',
    remediation: 'Use enums for status columns (status, role, tier)'
  });

  // Check 8: Partitioning/Archive Strategy
  const hasPartitioning = /PARTITION\s+BY/i.test(schemaContent);
  indicators.push({
    id: 'scalability',
    name: 'Scalability Features',
    status: hasPartitioning ? 'pass' : 'warning',
    message: `Table partitioning: ${hasPartitioning ? 'enabled' : 'not configured'}`,
    details: 'Partitioning improves performance for large tables',
    remediation: 'Consider partitioning for audit_log, events, and other high-volume tables'
  });

  // Check 9: Comments/Documentation
  const commentCount = countMatches(schemaContent, /COMMENT\s+ON/gi);
  indicators.push({
    id: 'documentation',
    name: 'Schema Documentation',
    status: commentCount > 10 ? 'pass' : 'warning',
    message: `${commentCount} COMMENT statements in schema`,
    details: 'Comments help developers understand table purposes',
    remediation: 'Add COMMENT ON TABLE/COLUMN for important entities'
  });

  // Check 10: Sensitive Data Handling
  const hasEncryption = /pgcrypto|encrypt|hash/i.test(schemaContent);
  indicators.push({
    id: 'sensitive-data',
    name: 'Sensitive Data Protection',
    status: hasEncryption ? 'pass' : 'warning',
    message: `Encryption functions: ${hasEncryption ? 'found' : 'not detected'}`,
    details: 'Sensitive fields (passwords, tokens) should be hashed/encrypted',
    remediation: 'Use pgcrypto or similar for sensitive data; avoid storing plaintext secrets'
  });

  return indicators;
}

export async function schemaHealthScan(): Promise<SchemaHealthReport> {
  try {
    const snapshotPath = 'reports/live_schema_snapshot.sql';

    console.log('[schema-guardian] Running health scan...');

    // Read live schema
    const schemaContent = readFileOrNull(snapshotPath);
    if (!schemaContent) {
      return {
        timestamp: new Date().toISOString(),
        schemaFile: snapshotPath,
        totalSize: 0,
        indicators: [],
        summary: {
          passCount: 0,
          warningCount: 0,
          failCount: 1,
          overallScore: 0
        },
        securityScore: {
          rlsEnforcement: 0,
          policyCount: 0,
          unprotectedTables: []
        },
        recommendations: [
          'Live schema snapshot not found. Run liveSchemaSnapshot() first.',
          'Execute: npm run shadow:schema:snapshot'
        ]
      };
    }

    // Run health checks
    const indicators = runHealthChecks(schemaContent);

    // Calculate scores
    const passCount = indicators.filter((i) => i.status === 'pass').length;
    const warningCount = indicators.filter((i) => i.status === 'warning').length;
    const failCount = indicators.filter((i) => i.status === 'fail').length;
    const overallScore = Math.max(0, 100 - failCount * 10 - warningCount * 5);

    // Security score
    const policyCount = countMatches(schemaContent, /CREATE\s+POLICY/gi);
    const allTables = extractTableNames(schemaContent);
    const rlsTables = extractRlsTableNames(schemaContent);
    const unprotectedTables = allTables.filter((t) => !rlsTables.includes(t));
    const rlsEnforcement = Math.max(0, 100 - (unprotectedTables.length / allTables.length) * 100);

    // Generate recommendations
    const recommendations: string[] = [];
    for (const indicator of indicators) {
      if (indicator.status !== 'pass' && indicator.remediation) {
        recommendations.push(`${indicator.name}: ${indicator.remediation}`);
      }
    }

    if (unprotectedTables.length > 0) {
      recommendations.push(`🔐 Enable RLS on: ${unprotectedTables.slice(0, 3).join(', ')}`);
    }

    if (overallScore >= 80) {
      recommendations.push('✅ Schema health is good — maintain current practices');
    } else if (overallScore >= 60) {
      recommendations.push('⚠️ Schema needs improvements — address warnings first');
    } else {
      recommendations.push('❌ Schema has critical issues — prioritize remediation');
    }

    const report: SchemaHealthReport = {
      timestamp: new Date().toISOString(),
      schemaFile: snapshotPath,
      totalSize: schemaContent.length,
      indicators,
      summary: {
        passCount,
        warningCount,
        failCount,
        overallScore
      },
      securityScore: {
        rlsEnforcement,
        policyCount,
        unprotectedTables: unprotectedTables.slice(0, 10)
      },
      recommendations
    };

    safeWriteJSON('reports/schema_health_report.json', report);
    console.log(`   ✓ Health scan complete (score: ${overallScore}/100)`);

    return report;
  } catch (err) {
    const errorMsg = String(err);
    console.error(`[schema-guardian] Health scan error: ${errorMsg}`);

    const fallbackReport: SchemaHealthReport = {
      timestamp: new Date().toISOString(),
      schemaFile: 'reports/live_schema_snapshot.sql',
      totalSize: 0,
      indicators: [],
      summary: {
        passCount: 0,
        warningCount: 0,
        failCount: 1,
        overallScore: 0
      },
      securityScore: {
        rlsEnforcement: 0,
        policyCount: 0,
        unprotectedTables: []
      },
      recommendations: [`Error during health scan: ${errorMsg}`]
    };

    safeWriteJSON('reports/schema_health_report.json', fallbackReport);
    return fallbackReport;
  }
}

// Auto-run when invoked
schemaHealthScan()
  .then((result) => {
    console.log(`[schema-guardian] Health scan: ${result.summary.overallScore}/100`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('[schema-guardian] Fatal error:', err);
    process.exit(1);
  });
