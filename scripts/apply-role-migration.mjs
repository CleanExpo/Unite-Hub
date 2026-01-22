import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Statements to execute
  const statements = [
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'`,
    `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS workspace_id UUID`,
    `UPDATE user_profiles SET role = 'founder' WHERE email = 'phill.mcgurk@gmail.com'`,
    `CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role)`
  ];

  for (const sql of statements) {
    console.log('Executing:', sql.substring(0, 50) + '...');

    try {
      const response = await fetch(`${url}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query_text: sql })
      });

      if (!response.ok) {
        // Try alternate method - direct postgres connection would be needed
        console.log('RPC not available, will need manual application');
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  // Verify by checking the profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('email, role')
    .eq('email', 'phill.mcgurk@gmail.com')
    .single();

  if (error) {
    console.log('\nColumn still missing. Apply migration manually:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste contents of: supabase/migrations/20260123_add_user_role.sql');
    console.log('3. Run the migration');
  } else if (data) {
    console.log('\nSuccess! User profile:', data);
  }
}

applyMigration();
