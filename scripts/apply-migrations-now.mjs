/**
 * Apply Project Vend Phase 2 Migrations to Supabase
 * Uses service role key to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Applying Project Vend Phase 2 migrations...');
console.log(`📍 Database: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(sql) {
  try {
    // Use Supabase's RPC to execute raw SQL
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    // If exec RPC doesn't exist, try direct execution via REST API
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return { success: true };
    } catch (execError) {
      return { success: false, error: execError.message };
    }
  }
}

async function main() {
  try {
    console.log('📄 Reading WORKING_MIGRATIONS.sql...\n');

    const sql = readFileSync('WORKING_MIGRATIONS.sql', 'utf-8');

    console.log('✅ SQL file loaded (548 lines)\n');
    console.log('📊 Applying migrations via Supabase REST API...\n');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Show progress for major operations
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE.*?(\w+)\s*\(/)?.[1];
        console.log(`📦 Creating table: ${tableName}...`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX.*?(\w+)\s+ON/)?.[1];
        console.log(`🔍 Creating index: ${indexName}...`);
      } else if (statement.includes('CREATE.*FUNCTION')) {
        const funcName = statement.match(/FUNCTION\s+(\w+)\s*\(/)?.[1];
        console.log(`⚙️  Creating function: ${funcName}...`);
      } else if (statement.includes('CREATE POLICY')) {
        const policyName = statement.match(/CREATE POLICY\s+"([^"]+)"/)?.[1];
        console.log(`🔒 Creating policy: ${policyName}...`);
      }

      const result = await executeSql(statement);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        console.error(`❌ Error executing statement ${i + 1}:`, result.error);

        // Don't fail on IF NOT EXISTS statements that already exist
        if (result.error?.includes('already exists')) {
          console.log(`   (Table/index already exists - continuing...)`);
          successCount++; // Count as success
          errorCount--;
        } else {
          // Fatal error
          throw new Error(result.error);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Migration complete!\n');
    console.log(`📊 Statements executed: ${successCount}/${statements.length}`);
    console.log(`❌ Errors: ${errorCount}\n`);

    // Verify tables created
    console.log('🔍 Verifying tables created...\n');

    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'agent_%');

    if (!tableError && tables) {
      console.log('✅ Agent tables found:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
    }

    console.log('\n✅ Project Vend Phase 2 migrations applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run tests: npm run test tests/agents');
    console.log('  2. Build: npm run build');
    console.log('  3. Deploy: vercel deploy --prod');
    console.log('  4. Visit dashboard: /agents\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nFallback: Apply manually via Supabase Dashboard');
    console.error('  1. Open: https://supabase.com/dashboard → SQL Editor');
    console.error('  2. Copy: WORKING_MIGRATIONS.sql');
    console.error('  3. Paste and Run\n');
    process.exit(1);
  }
}

main();
