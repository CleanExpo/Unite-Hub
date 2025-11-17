#!/usr/bin/env node
// Phase 2 Complete Health Check
// Verifies all components are operational

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  console.log();
  log('cyan', '='.repeat(70));
  log('bold', text);
  log('cyan', '='.repeat(70));
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

let totalChecks = 0;
let passedChecks = 0;

async function checkEnvVars() {
  header('1️⃣  ENVIRONMENT VARIABLES');

  const vars = {
    'NEXT_PUBLIC_SUPABASE_URL': SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': SUPABASE_SERVICE_KEY,
    'OPENAI_API_KEY': OPENAI_KEY,
    'ANTHROPIC_API_KEY': ANTHROPIC_KEY,
  };

  for (const [name, value] of Object.entries(vars)) {
    totalChecks++;
    if (value && value.length > 10) {
      log('green', `✅ ${name}: ${value.substring(0, 20)}...`);
      passedChecks++;
    } else {
      log('red', `❌ ${name}: Missing or invalid`);
    }
  }
}

async function checkDatabase() {
  header('2️⃣  DATABASE SCHEMA');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('red', '❌ Cannot check database - missing credentials');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Check media_files table
  totalChecks++;
  const { count: mediaCount, error: mediaError } = await supabase
    .from('media_files')
    .select('*', { count: 'exact', head: true });

  if (mediaError) {
    log('red', `❌ media_files table: ${mediaError.message}`);
  } else {
    log('green', `✅ media_files table: ${mediaCount || 0} records`);
    passedChecks++;
  }

  // Check organizations table
  totalChecks++;
  const { count: orgCount, error: orgError } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  if (orgError) {
    log('red', `❌ organizations table: ${orgError.message}`);
  } else {
    log('green', `✅ organizations table: ${orgCount || 0} records`);
    passedChecks++;
  }

  // Check workspaces table
  totalChecks++;
  const { count: workspaceCount, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true });

  if (workspaceError) {
    log('red', `❌ workspaces table: ${workspaceError.message}`);
  } else {
    log('green', `✅ workspaces table: ${workspaceCount || 0} records`);
    passedChecks++;
  }

  // Check auditLogs table
  totalChecks++;
  const { count: auditCount, error: auditError } = await supabase
    .from('auditLogs')
    .select('*', { count: 'exact', head: true });

  if (auditError) {
    log('red', `❌ auditLogs table: ${auditError.message}`);
  } else {
    log('green', `✅ auditLogs table: ${auditCount || 0} records`);
    passedChecks++;
  }
}

async function checkStorage() {
  header('3️⃣  STORAGE BUCKETS');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('red', '❌ Cannot check storage - missing credentials');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  totalChecks++;
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

  if (bucketError) {
    log('red', `❌ Storage API error: ${bucketError.message}`);
  } else {
    const mediaUploadsBucket = buckets?.find(b => b.id === 'media-uploads');
    if (mediaUploadsBucket) {
      log('green', `✅ media-uploads bucket exists`);
      log('cyan', `   - Public: ${mediaUploadsBucket.public}`);
      log('cyan', `   - File size limit: ${(mediaUploadsBucket.file_size_limit || 0) / 1024 / 1024}MB`);
      passedChecks++;
    } else {
      log('red', '❌ media-uploads bucket not found');
      if (buckets && buckets.length > 0) {
        log('yellow', `   Available buckets: ${buckets.map(b => b.id).join(', ')}`);
      }
    }
  }
}

async function checkWorkspace() {
  header('4️⃣  WORKSPACE INFORMATION');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    log('red', '❌ Cannot check workspace - missing credentials');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  totalChecks++;
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      workspaces (
        id,
        name
      )
    `)
    .limit(1);

  if (error) {
    log('red', `❌ Workspace query error: ${error.message}`);
  } else if (orgs && orgs.length > 0) {
    const org = orgs[0];
    const workspace = org.workspaces?.[0];

    log('green', `✅ Found organization: ${org.name}`);
    if (workspace) {
      log('cyan', `   Workspace: ${workspace.name}`);
      log('yellow', '\n📋 Use these IDs for testing:');
      log('cyan', `   workspace_id: ${workspace.id}`);
      log('cyan', `   org_id: ${org.id}`);
    }
    passedChecks++;
  } else {
    log('yellow', '⚠️  No organizations found (create one in dashboard first)');
  }
}

async function checkAPIRoutes() {
  header('5️⃣  API ROUTES (File Existence)');

  const routes = [
    'src/app/api/media/upload/route.ts',
    'src/app/api/media/transcribe/route.ts',
    'src/app/api/media/analyze/route.ts',
    'src/app/api/media/search/route.ts',
  ];

  const fs = await import('fs');

  for (const route of routes) {
    totalChecks++;
    const fullPath = path.join(process.cwd(), route);
    if (fs.existsSync(fullPath)) {
      log('green', `✅ ${route}`);
      passedChecks++;
    } else {
      log('red', `❌ ${route} - NOT FOUND`);
    }
  }
}

async function checkTestTools() {
  header('6️⃣  TEST TOOLS');

  const files = [
    'public/test-media-upload.html',
    'scripts/quick-verify.mjs',
    'scripts/verify-phase2-setup.sql',
    'docs/PHASE2_DEPLOYMENT_GUIDE.md',
    'PHASE2_COMPLETE_SUMMARY.md',
    'PHASE2_QUICK_START.md',
  ];

  const fs = await import('fs');

  for (const file of files) {
    totalChecks++;
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      log('green', `✅ ${file}`);
      passedChecks++;
    } else {
      log('red', `❌ ${file} - NOT FOUND`);
    }
  }
}

async function checkMigrations() {
  header('7️⃣  MIGRATION FILES');

  const migrations = [
    'supabase/migrations/029_media_files.sql',
    'supabase/migrations/030_media_storage_bucket.sql',
  ];

  const fs = await import('fs');

  for (const migration of migrations) {
    totalChecks++;
    const fullPath = path.join(process.cwd(), migration);
    if (fs.existsSync(fullPath)) {
      log('green', `✅ ${migration}`);
      passedChecks++;
    } else {
      log('red', `❌ ${migration} - NOT FOUND`);
    }
  }
}

async function printSummary() {
  header('📊 HEALTH CHECK SUMMARY');

  const percentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  log('cyan', `Total Checks: ${totalChecks}`);
  log('green', `Passed: ${passedChecks}`);
  log('red', `Failed: ${totalChecks - passedChecks}`);

  console.log();
  if (percentage === 100) {
    log('green', `🎉 ALL CHECKS PASSED! (${percentage}%)`);
    log('green', '\n✅ Phase 2 is fully operational and ready for testing!');
    log('cyan', '\n📌 Next Steps:');
    log('cyan', '   1. npm run dev');
    log('cyan', '   2. Open http://localhost:3008/test-media-upload.html');
    log('cyan', '   3. Upload a test file and watch it process!\n');
  } else if (percentage >= 80) {
    log('yellow', `⚠️  MOSTLY READY (${percentage}%)`);
    log('yellow', '\nSome non-critical components may be missing.');
    log('yellow', 'Review failed checks above.\n');
  } else {
    log('red', `❌ SYSTEM NOT READY (${percentage}%)`);
    log('red', '\nCritical components are missing or misconfigured.');
    log('red', 'Please review failed checks above and fix issues.\n');
  }
}

async function main() {
  log('cyan', '\n🚀 Phase 2: Multimedia Input System - Health Check\n');

  try {
    await checkEnvVars();
    await checkDatabase();
    await checkStorage();
    await checkWorkspace();
    await checkAPIRoutes();
    await checkTestTools();
    await checkMigrations();
    await printSummary();
  } catch (error) {
    console.error('\n❌ Health check failed with error:', error);
    process.exit(1);
  }
}

main();
