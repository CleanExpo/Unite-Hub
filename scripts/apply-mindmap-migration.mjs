#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying Mindmap Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '028_mindmap_feature_FIXED.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('📊 Executing SQL statements...\n');

    // Execute the migration using the rpc endpoint
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Alternative: Use psql if available
      console.log('⚠️  Direct SQL execution not available via REST API');
      console.log('📋 Please execute the migration manually:');
      console.log('\n1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy the contents of: supabase/migrations/028_mindmap_feature_FIXED.sql');
      console.log('3. Paste and execute the SQL\n');

      // Try using direct connection if available
      if (process.env.DIRECT_CONNECT) {
        console.log('💡 Or use the direct connection string with psql:');
        console.log(`   psql "${process.env.DIRECT_CONNECT}" -f supabase/migrations/028_mindmap_feature_FIXED.sql\n`);
      }

      return;
    }

    console.log('✅ Migration applied successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const tables = ['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table "${table}" verification failed: ${error.message}`);
      } else {
        console.log(`✅ Table "${table}" verified`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Execute: supabase/migrations/028_mindmap_feature_FIXED.sql\n');
  }
}

applyMigration();
