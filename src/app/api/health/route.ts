import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // Test database connection
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (dbError) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        error: dbError.message,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    // Test compliance tables
    const complianceStatus = {};
    const complianceTables = ['cookie_consents', 'user_consents', 'compliance_audit_log'];
    
    for (const table of complianceTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1);
        complianceStatus[table] = !error;
      } catch {
        complianceStatus[table] = false;
      }
    }
    
    const allComplianceTablesReady = Object.values(complianceStatus).every(status => status);
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      compliance: {
        tables: complianceStatus,
        ready: allComplianceTablesReady
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
