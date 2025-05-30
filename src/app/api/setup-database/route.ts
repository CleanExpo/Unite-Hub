import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * POST /api/setup-database
 * Run database migrations and setup
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Create cookie_consents table
    const createTableQuery = `
      -- Cookie Consent Compliance Table
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        necessary BOOLEAN DEFAULT true,
        preferences JSONB,
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
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableQuery 
    });

    if (createError) {
      console.error('Error creating cookie_consents table:', createError);
      // Try direct SQL execution
      const { error: directError } = await supabase
        .from('cookie_consents')
        .select('count(*)')
        .limit(1);
      
      if (directError && directError.code === '42P01') {
        // Table doesn't exist, we need to create it manually
        return NextResponse.json({
          error: 'Database setup required',
          message: 'Please run the cookie_consents.sql migration in Supabase dashboard',
          sql: createTableQuery
        }, { status: 500 });
      }
    }

    // Test if table exists by querying it
    const { error: testError } = await supabase
      .from('cookie_consents')
      .select('count(*)')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        error: 'Database setup incomplete',
        message: 'Cookie consents table not accessible',
        details: testError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully'
    });

  } catch (error) {
    console.error('Error setting up database:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Database setup failed: ${message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup-database
 * Check database setup status
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Test if cookie_consents table exists
    const { error: tableError } = await supabase
      .from('cookie_consents')
      .select('count(*)')
      .limit(1);

    const tables = {
      cookie_consents: !tableError
    };

    return NextResponse.json({
      tables,
      ready: !tableError,
      message: tableError ? 'Database setup required' : 'Database ready'
    });

  } catch (error) {
    console.error('Error checking database status:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Database check failed: ${message}` },
      { status: 500 }
    );
  }
}
