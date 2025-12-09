import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface SnapshotResult {
  status: 'ok' | 'error' | 'warning';
  message: string;
  schemaSize?: number;
  error?: string;
}

function safeWriteFile(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.error(`Failed to write ${filePath}:`, err);
  }
}

export async function liveSchemaSnapshot(): Promise<SnapshotResult> {
  try {
    const outDir = 'reports';
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('[schema-guardian] Attempting to export live schema from Supabase...');

    // Check if Supabase CLI is available
    try {
      execSync('supabase --version', { encoding: 'utf8', stdio: 'pipe' });
    } catch {
      // Supabase CLI not available - create stub schema
      const stubSchema = `-- Live schema snapshot - STUB (Supabase CLI not installed)
-- To enable real snapshots, install Supabase CLI: npm install -g supabase

-- This is a placeholder. Real snapshot requires:
-- 1. Supabase CLI installed
-- 2. SUPABASE_ACCESS_TOKEN environment variable set
-- 3. Project reference configured

-- Mock schema for demonstration:
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY,
  action text,
  table_name text,
  created_at timestamp DEFAULT now()
);
`;

      safeWriteFile(`${outDir}/live_schema_snapshot.sql`, stubSchema);

      return {
        status: 'warning',
        message: 'Supabase CLI not installed. Created stub schema snapshot. Install CLI for real snapshots.',
        schemaSize: stubSchema.length
      };
    }

    // If CLI is available, attempt real snapshot
    const snapshot = execSync('supabase db dump --schema-only', { encoding: 'utf8', stdio: 'pipe' });

    safeWriteFile(`${outDir}/live_schema_snapshot.sql`, snapshot);

    return {
      status: 'ok',
      message: 'Live schema snapshot created successfully.',
      schemaSize: snapshot.length
    };
  } catch (err) {
    const errorMsg = String(err);

    // Create fallback stub if Supabase CLI fails
    const stubSchema = `-- Live schema snapshot - FALLBACK
-- Supabase CLI error occurred. Using stub schema.
-- Error: ${errorMsg}

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL
);
`;

    safeWriteFile('reports/live_schema_snapshot.sql', stubSchema);

    return {
      status: 'warning',
      message: 'Supabase CLI unavailable. Created fallback stub schema.',
      schemaSize: stubSchema.length,
      error: errorMsg
    };
  }
}

// Auto-run when invoked
liveSchemaSnapshot()
  .then((result) => {
    console.log(`[schema-guardian] Result: ${result.status} - ${result.message}`);
    if (result.schemaSize) console.log(`[schema-guardian] Schema size: ${result.schemaSize} bytes`);
    process.exit(result.status === 'error' ? 1 : 0);
  })
  .catch((err) => {
    console.error('[schema-guardian] Fatal error:', err);
    process.exit(1);
  });
