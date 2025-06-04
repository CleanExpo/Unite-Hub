import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        startsWith: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 8) || 'missing'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        startsWith: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 8) || 'missing'
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        startsWith: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 8) || 'missing'
      },
      SUPABASE_URL: {
        exists: !!process.env.SUPABASE_URL,
        length: process.env.SUPABASE_URL?.length || 0
      },
      SUPABASE_KEY: {
        exists: !!process.env.SUPABASE_KEY,
        length: process.env.SUPABASE_KEY?.length || 0
      }
    };

    // Test 2: Try to create API client
    let apiClientTest = { success: false, error: '' };
    try {
      const { createApiClient } = await import('@/lib/supabase/api');
      const client = await createApiClient();
      apiClientTest.success = true;
    } catch (error: any) {
      apiClientTest.error = error.message || 'Unknown error';
    }

    // Test 3: Try to query a simple table (if client works)
    let dbTest = { success: false, error: '', tablesFound: [] as string[] };
    if (apiClientTest.success) {
      try {
        const { createApiClient } = await import('@/lib/supabase/api');
        const supabase = await createApiClient();
        
        // Try to list tables
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .limit(1);
          
        if (error) {
          dbTest.error = error.message;
          
          // If table doesn't exist, try to check what tables do exist
          const tablesQuery = await supabase.rpc('get_tables', {});
          if (tablesQuery.data) {
            dbTest.tablesFound = tablesQuery.data;
          }
        } else {
          dbTest.success = true;
        }
      } catch (error: any) {
        dbTest.error = error.message || 'Database connection failed';
      }
    }

    // Test 4: Check Node environment
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.VERCEL_ENV;

    return NextResponse.json({
      status: 'diagnostic',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: nodeEnv,
        VERCEL_ENV: vercelEnv,
        isProduction: nodeEnv === 'production'
      },
      tests: {
        environmentVariables: envCheck,
        apiClient: apiClientTest,
        database: dbTest
      },
      recommendations: generateRecommendations(envCheck, apiClientTest, dbTest)
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Diagnostic endpoint failed',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(
  envCheck: any, 
  apiClientTest: any, 
  dbTest: any
): string[] {
  const recommendations = [];

  // Check environment variables
  if (!envCheck.NEXT_PUBLIC_SUPABASE_URL.exists) {
    recommendations.push('❌ NEXT_PUBLIC_SUPABASE_URL is missing - Add it in Vercel dashboard');
  }
  if (!envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY.exists) {
    recommendations.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing - Add it in Vercel dashboard');
  }
  if (!envCheck.SUPABASE_SERVICE_ROLE_KEY.exists && !envCheck.SUPABASE_KEY.exists) {
    recommendations.push('❌ SUPABASE_SERVICE_ROLE_KEY is missing - This is required for API routes');
  }

  // Check API client
  if (!apiClientTest.success) {
    recommendations.push(`❌ API Client failed: ${apiClientTest.error}`);
  }

  // Check database
  if (apiClientTest.success && !dbTest.success) {
    recommendations.push(`❌ Database query failed: ${dbTest.error}`);
    if (dbTest.error.includes('does not exist')) {
      recommendations.push('💡 Run the CRM setup SQL script to create required tables');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All checks passed!');
  }

  return recommendations;
}
