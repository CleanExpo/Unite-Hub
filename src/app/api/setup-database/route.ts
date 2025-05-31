import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/setup-database
 * Run database migrations and setup
 * This endpoint uses admin client for initial setup
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting database setup...');

    // Test admin connection first
    const { data: testConnection, error: connectionError } = await supabaseAdmin
      .from('users')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      console.error('❌ Admin connection failed:', connectionError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: connectionError.message,
        message: 'Please check Supabase environment variables'
      }, { status: 500 });
    }

    console.log('✅ Admin connection successful');

    // Create compliance tables
    const migrations = [
      {
        name: 'cookie_consents',
        sql: `
          -- Cookie Consent Compliance Table
          CREATE TABLE IF NOT EXISTS cookie_consents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id TEXT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            necessary BOOLEAN DEFAULT true,
            preferences BOOLEAN DEFAULT false,
            analytics BOOLEAN DEFAULT false,
            marketing BOOLEAN DEFAULT false,
            ip_address TEXT,
            user_agent TEXT,
            consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS cookie_consents_session_id_idx ON cookie_consents(session_id);
          CREATE INDEX IF NOT EXISTS cookie_consents_user_id_idx ON cookie_consents(user_id);
          CREATE INDEX IF NOT EXISTS cookie_consents_timestamp_idx ON cookie_consents(consent_timestamp);

          -- Enable Row Level Security
          ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

          -- Create RLS policy for cookie_consents
          CREATE POLICY IF NOT EXISTS "Users can manage their own cookie consents"
            ON cookie_consents FOR ALL
            USING (user_id = auth.uid() OR user_id IS NULL);
        `
      },
      {
        name: 'user_consents',
        sql: `
          -- User Consent Types
          CREATE TYPE IF NOT EXISTS consent_type AS ENUM (
            'privacy_policy',
            'terms_of_service',
            'marketing',
            'cookies',
            'data_processing'
          );

          -- User Consents Table
          CREATE TABLE IF NOT EXISTS user_consents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            consent_type consent_type NOT NULL,
            consented BOOLEAN NOT NULL,
            consent_version TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS user_consents_user_id_idx ON user_consents(user_id);
          CREATE INDEX IF NOT EXISTS user_consents_type_idx ON user_consents(consent_type);
          CREATE INDEX IF NOT EXISTS user_consents_created_idx ON user_consents(created_at);

          -- Enable RLS
          ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

          -- Create RLS policy
          CREATE POLICY IF NOT EXISTS "Users can manage their own consents"
            ON user_consents FOR ALL
            USING (user_id = auth.uid());
        `
      },
      {
        name: 'compliance_audit_log',
        sql: `
          -- Compliance Audit Log
          CREATE TABLE IF NOT EXISTS compliance_audit_log (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            action_type TEXT NOT NULL,
            action_details JSONB,
            ip_address TEXT,
            user_agent TEXT,
            admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes
          CREATE INDEX IF NOT EXISTS compliance_audit_log_user_id_idx ON compliance_audit_log(user_id);
          CREATE INDEX IF NOT EXISTS compliance_audit_log_action_type_idx ON compliance_audit_log(action_type);
          CREATE INDEX IF NOT EXISTS compliance_audit_log_created_idx ON compliance_audit_log(created_at);

          -- Enable RLS
          ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;

          -- Create RLS policy - only admins can read audit logs
          CREATE POLICY IF NOT EXISTS "Only admins can access audit logs"
            ON compliance_audit_log FOR SELECT
            USING (
              EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'admin'
              )
            );
        `
      }
    ];

    const results = [];

    for (const migration of migrations) {
      console.log(`⏳ Creating ${migration.name} table...`);
      
      try {
        // Execute the SQL migration
        const { error: migrationError } = await supabaseAdmin.rpc('exec_sql', {
          sql: migration.sql
        });

        if (migrationError) {
          // If rpc doesn't work, try alternative approach
          console.warn(`RPC exec_sql failed for ${migration.name}, trying direct table access...`);
          
          // Test if table exists by trying to query it
          const { error: testError } = await supabaseAdmin
            .from(migration.name)
            .select('count(*)')
            .limit(1);

          if (testError && testError.code === '42P01') {
            results.push({
              table: migration.name,
              status: 'failed',
              message: `Table ${migration.name} needs manual creation`,
              sql: migration.sql
            });
          } else {
            results.push({
              table: migration.name,
              status: 'exists',
              message: `Table ${migration.name} already exists`
            });
          }
        } else {
          results.push({
            table: migration.name,
            status: 'created',
            message: `Table ${migration.name} created successfully`
          });
        }

        console.log(`✅ ${migration.name} completed`);
      } catch (error) {
        console.error(`❌ Error with ${migration.name}:`, error);
        results.push({
          table: migration.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          sql: migration.sql
        });
      }
    }

    // Check final status
    const failedTables = results.filter(r => r.status === 'failed' || r.status === 'error');
    
    if (failedTables.length > 0) {
      console.log('⚠️ Some tables need manual setup');
      return NextResponse.json({
        success: false,
        message: 'Database setup partially completed',
        results,
        manualSetupRequired: true,
        instructions: 'Please execute the provided SQL manually in Supabase dashboard'
      }, { status: 206 });
    }

    console.log('🎉 Database setup completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      results,
      tablesCreated: results.length
    });

  } catch (error) {
    console.error('💥 Database setup failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: `Database setup failed: ${message}`,
      message: 'Please check Supabase configuration and try again'
    }, { status: 500 });
  }
}

/**
 * GET /api/setup-database
 * Check database setup status
 */
export async function GET() {
  try {
    console.log('🔍 Checking database status...');

    const tables = ['cookie_consents', 'user_consents', 'compliance_audit_log'];
    const status = {};

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('count(*)')
          .limit(1);

        status[table] = !error;
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists`);
        }
      } catch (error) {
        status[table] = false;
        console.log(`❌ Table ${table}: error checking`);
      }
    }

    const allTablesExist = Object.values(status).every(exists => exists);

    return NextResponse.json({
      tables: status,
      ready: allTablesExist,
      message: allTablesExist ? 'Database ready' : 'Database setup required',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking database status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: `Database check failed: ${message}`,
      ready: false
    }, { status: 500 });
  }
}
