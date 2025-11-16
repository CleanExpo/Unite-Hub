#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking user_organizations table schema\n');

  try {
    // Try to get one row to see what columns exist
    const { data, error } = await supabase
      .from('user_organizations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Available columns:');
      console.log(Object.keys(data[0]).join(', '));
      console.log('\n📊 Sample row:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  No rows in table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
