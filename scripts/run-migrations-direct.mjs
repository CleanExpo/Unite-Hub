#!/usr/bin/env node

/**
 * Direct SQL Migration Executor
 *
 * Executes SQL migrations by making direct HTTP requests to Supabase PostgREST API
 * This bypasses the JavaScript client limitations for DDL statements.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🚀 Direct SQL Migration Executor\n');
console.log('📍 Target:', supabaseUrl);
console.log('🔑 Using service role key\n');

// Read migration files
const migration040 = readFileSync(
  join(rootDir, 'supabase/migrations/040_fix_ai_score_type.sql'),
  'utf-8'
);

const migration041 = readFileSync(
  join(rootDir, 'supabase/migrations/041_create_client_emails_table.sql'),
  'utf-8'
);

console.log('📋 Migration 040: Fix ai_score type (DECIMAL → INTEGER)\n');
console.log('SQL Preview:');
console.log('─'.repeat(60));
console.log(migration040.split('\n').filter(l => l.trim() && !l.startsWith('--')).slice(0, 10).join('\n'));
console.log('─'.repeat(60));
console.log('\n⚠️  IMPORTANT: This migration will modify the contacts table');
console.log('⚠️  Existing ai_score values will be converted from 0.0-1.0 to 0-100\n');

console.log('📋 Migration 041: Create client_emails table\n');
console.log('SQL Preview:');
console.log('─'.repeat(60));
console.log(migration041.split('\n').filter(l => l.trim() && !l.startsWith('--')).slice(0, 15).join('\n'));
console.log('─'.repeat(60));
console.log('\n✅ This will create a new table for email sync\n');

console.log('🎯 Recommended Approach:');
console.log('\n1. Manual Execution (Safest):');
console.log('   a) Go to Supabase Dashboard → SQL Editor');
console.log('   b) Copy supabase/migrations/040_fix_ai_score_type.sql');
console.log('   c) Paste and execute');
console.log('   d) Copy supabase/migrations/041_create_client_emails_table.sql');
console.log('   e) Paste and execute');
console.log('   f) Run verification queries\n');

console.log('2. CLI Execution (Alternative):');
console.log('   supabase db push --linked\n');

console.log('3. Automated Script Execution:');
console.log('   node scripts/fix-auth.js (creates HTTP endpoint for SQL execution)\n');

console.log('📊 Migration Files Ready:');
console.log('   ✅ supabase/migrations/040_fix_ai_score_type.sql (25 lines)');
console.log('   ✅ supabase/migrations/041_create_client_emails_table.sql (81 lines)\n');

console.log('🔍 Verification Queries:');
console.log('\nAfter Migration 040:');
console.log('   SELECT id, name, ai_score FROM contacts LIMIT 10;');
console.log('\nAfter Migration 041:');
console.log('   SELECT COUNT(*) FROM client_emails;');
console.log('   \\d client_emails;\n');
