#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeMigration() {
  const client = new Client({
    connectionString: process.env.DIRECT_CONNECT,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '028_mindmap_feature_FIXED.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration...\n');

    // Execute the entire SQL file
    await client.query(sql);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`, [table]);
      if (result.rows[0].count === '1') {
        console.log(`✅ Table "${table}" exists`);
      } else {
        console.log(`❌ Table "${table}" NOT found`);
      }
    }

    console.log('\n🔍 Verifying RLS policies...');
    const policyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions')
    `);
    console.log(`✅ ${policyResult.rows[0].count} RLS policies created`);

    console.log('\n✨ Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.position) {
      console.error('   Position:', error.position);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();
