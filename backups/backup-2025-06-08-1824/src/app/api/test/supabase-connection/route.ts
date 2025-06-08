import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasAdminEmail: !!process.env.ADMIN_EMAIL
    },
    tests: {
      apiClient: { success: false, error: '' },
      crmTables: { success: false, tables: [] as string[], error: '' },
      consultationsTable: { success: false, exists: false, error: '' }
    }
  };

  try {
    // Test 1: Create API client
    const supabase = await createApiClient();
    results.tests.apiClient.success = true;

    // Test 2: Check CRM tables
    try {
      const crmTables = ['clients', 'contacts', 'deals', 'activities', 'tasks', 'projects'];
      const foundTables: string[] = [];
      
      for (const table of crmTables) {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (!error) {
          foundTables.push(table);
        }
      }
      
      results.tests.crmTables.tables = foundTables;
      results.tests.crmTables.success = foundTables.length > 0;
      
      if (foundTables.length === 0) {
        results.tests.crmTables.error = 'No CRM tables found - run database setup';
      }
    } catch (error: any) {
      results.tests.crmTables.error = error.message;
    }

    // Test 3: Check consultations table specifically
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('id')
        .limit(1);
      
      if (!error) {
        results.tests.consultationsTable.success = true;
        results.tests.consultationsTable.exists = true;
      } else if (error.message.includes('does not exist')) {
        results.tests.consultationsTable.error = 'Table does not exist - needs creation';
      } else {
        results.tests.consultationsTable.error = error.message;
      }
    } catch (error: any) {
      results.tests.consultationsTable.error = error.message;
    }

  } catch (error: any) {
    results.tests.apiClient.error = error.message || 'Failed to create client';
  }

  // Generate summary
  const allPassed = 
    results.tests.apiClient.success && 
    results.tests.crmTables.success && 
    results.tests.consultationsTable.success;

  return NextResponse.json({
    ...results,
    summary: {
      status: allPassed ? 'READY' : 'NEEDS_SETUP',
      recommendations: generateRecommendations(results)
    }
  });
}

function generateRecommendations(results: any): string[] {
  const recommendations: string[] = [];

  if (!results.environment.hasSupabaseUrl) {
    recommendations.push('❌ Add NEXT_PUBLIC_SUPABASE_URL to environment');
  }
  if (!results.environment.hasServiceKey) {
    recommendations.push('❌ Add SUPABASE_SERVICE_ROLE_KEY to environment');
  }
  if (!results.environment.hasResendKey) {
    recommendations.push('⚠️ Add RESEND_API_KEY for email functionality');
  }
  if (!results.environment.hasAdminEmail) {
    recommendations.push('⚠️ Add ADMIN_EMAIL for consultation notifications');
  }

  if (!results.tests.apiClient.success) {
    recommendations.push('❌ Fix Supabase client connection first');
  } else {
    if (!results.tests.crmTables.success) {
      recommendations.push('❌ Run database/setup-crm-complete.sql to create CRM tables');
    }
    if (!results.tests.consultationsTable.success) {
      recommendations.push('❌ Run database/setup-consultations-table.sql to create consultations table');
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All database checks passed!');
  }

  return recommendations;
}
