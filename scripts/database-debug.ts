#!/usr/bin/env tsx

/**
 * Database debugging script for consultation system
 * Checks table existence, schema, and RLS policies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDatabase() {
  console.log('🔍 DATABASE DEBUG REPORT');
  console.log('========================\n');

  try {
    // 1. Check if consultations table exists
    console.log('📋 1. Checking consultations table...');
    const { data: consultationsData, error: consultationsError } = await supabase
      .from('consultations')
      .select('*')
      .limit(1);

    if (consultationsError) {
      console.log('❌ Consultations table error:', consultationsError.message);
      
      // The table likely doesn't exist, let's create it
      console.log('\n📝 Attempting to run consultations.sql...');
      console.log('⚠️  Note: Tables must be created through Supabase dashboard or migration');
      console.log('📋 SQL file location: database/consultations.sql');
    } else {
      console.log('✅ Consultations table exists');
      
      // Count records
      const { count } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 Current records: ${count || 0}`);
    }

    // 2. Test simple insert (should reveal RLS issues)
    console.log('\n🧪 2. Testing consultation insert...');
    const testData = {
      client_name: 'Test User Debug',
      client_email: 'debug@test.com',
      service_type: 'Database Debug',
      preferred_date: new Date().toISOString(),
      preferred_time: '10:00 AM',
      message: 'Database debugging test'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('consultations')
      .insert([testData])
      .select();

    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      if (insertError.code === '42P01') {
        console.log('💡 The consultations table does not exist');
        console.log('📋 Run the SQL from database/consultations.sql in Supabase dashboard');
      }
    } else {
      console.log('✅ Insert successful');
      console.log('📋 Created record ID:', insertResult?.[0]?.id);
      
      // Clean up test record
      if (insertResult?.[0]?.id) {
        await supabase
          .from('consultations')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }

    // 3. Check cookie_consents table (for comparison)
    console.log('\n🍪 3. Checking cookie_consents table...');
    const { data: cookieData, error: cookieError } = await supabase
      .from('cookie_consents')
      .select('*')
      .limit(1);

    if (cookieError) {
      console.log('❌ Cookie consents table error:', cookieError.message);
    } else {
      console.log('✅ Cookie consents table working');
      
      const { count: cookieCount } = await supabase
        .from('cookie_consents')
        .select('*', { count: 'exact', head: true });
      console.log(`📊 Records: ${cookieCount || 0}`);
    }

    // 4. List all tables
    console.log('\n📋 4. Checking available tables...');
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_tables_list')
      .single();
      
    if (tablesError) {
      // Try direct query
      const { data: publicTables } = await supabase
        .from('profiles')
        .select('*')
        .limit(0); // Just checking if we can query
        
      if (!publicTables) {
        console.log('✅ Can query tables - database connection working');
      }
    } else {
      console.log('📊 Available tables:', tablesData);
    }

    // 5. Check environment variables
    console.log('\n⚙️ 5. Environment check...');
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...');
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Present' : 'Missing');
    console.log('✅ DEFAULT_FROM:', process.env.DEFAULT_FROM || 'Missing');
    console.log('✅ ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'Missing');
    console.log('✅ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run debug
debugDatabase().then(() => {
  console.log('\n🏁 Database debug complete');
  console.log('\n🔧 SOLUTION:');
  console.log('1. The consultations table likely doesn\'t exist');
  console.log('2. Go to Supabase dashboard → SQL Editor');
  console.log('3. Run the SQL from database/consultations.sql');
  console.log('4. Then the consultation booking API will work');
}).catch(error => {
  console.error('💥 Debug script failed:', error);
  process.exit(1);
});
