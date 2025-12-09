import fs from 'fs';
import path from 'path';

interface MigrationFileInfo {
  fileName: string;
  fullPath: string;
  sizeBytes: number;
  createdAt: string | null;
  modifiedAt: string | null;
  firstLine: string | null;
}

interface SqlInventoryReport {
  timestamp: string;
  migrationsDir: string;
  exists: boolean;
  files: MigrationFileInfo[];
  summary: {
    count: number;
    totalSizeBytes: number;
    largestFileBytes: number;
  };
}

function readFirstLine(p: string): string | null {
  try {
    const buf = fs.readFileSync(p, 'utf8');
    const idx = buf.indexOf('\n');
    return (idx === -1 ? buf : buf.slice(0, idx)).slice(0, 500);
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

export async function runSqlInventory(): Promise<SqlInventoryReport> {
  const migrationsDir = path.resolve('supabase', 'migrations');
  const report: SqlInventoryReport = {
    timestamp: new Date().toISOString(),
    migrationsDir,
    exists: false,
    files: [],
    summary: {
      count: 0,
      totalSizeBytes: 0,
      largestFileBytes: 0
    }
  };

  if (!fs.existsSync(migrationsDir)) {
    safeWriteJSON('reports/sql_migration_inventory.json', report);
    return report;
  }

  report.exists = true;
  const entries = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

  for (const fileName of entries) {
    const fullPath = path.join(migrationsDir, fileName);
    try {
      const stats = fs.statSync(fullPath);
      const sizeBytes = stats.size;
      const info: MigrationFileInfo = {
        fileName,
        fullPath,
        sizeBytes,
        createdAt: stats.birthtime ? stats.birthtime.toISOString() : null,
        modifiedAt: stats.mtime ? stats.mtime.toISOString() : null,
        firstLine: readFirstLine(fullPath)
      };
      report.files.push(info);
      report.summary.count += 1;
      report.summary.totalSizeBytes += sizeBytes;
      if (sizeBytes > report.summary.largestFileBytes) {
        report.summary.largestFileBytes = sizeBytes;
      }
    } catch {
      continue;
    }
  }

  report.files.sort((a, b) => a.fileName.localeCompare(b.fileName));
  safeWriteJSON('reports/sql_migration_inventory.json', report);
  return report;
}

// Auto-run when imported as main module
runSqlInventory().then(() => {
  console.log('[shadow-observer] SQL migration inventory written to reports/sql_migration_inventory.json');
}).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
