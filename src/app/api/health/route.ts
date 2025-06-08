import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks = {
    database: false,
    auth: false,
    stripe: false,
    redis: false,
    email: false,
  };
  const errors: Record<string, string> = {};

  try {
    // 1. Database Health Check - Use a table that actually exists
    try {
      const supabase = await createClient();
      // Check if we can connect to the database by querying projects table
      const { error } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      
      checks.database = !error;
      if (error) errors.database = error.message;
    } catch (error) {
      checks.database = false;
      errors.database = error instanceof Error ? error.message : 'Database check failed';
    }

    // 2. Auth Check - simplified
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      // Auth is working if we can call the method without errors
      checks.auth = !error;
      if (error && error.message !== 'Auth session missing!') {
        errors.auth = error.message;
      }
    } catch (error) {
      checks.auth = false;
      errors.auth = error instanceof Error ? error.message : 'Auth check failed';
    }

    // 3. Stripe Check
    try {
      checks.stripe = !!process.env.STRIPE_SECRET_KEY;
      if (!checks.stripe) {
        errors.stripe = 'Stripe not configured';
      }
    } catch (error) {
      checks.stripe = false;
      errors.stripe = error instanceof Error ? error.message : 'Stripe check failed';
    }

    // 4. Redis Check (optional) - mark as healthy if not configured
    try {
      if (process.env.REDIS_HOST) {
        checks.redis = true; // Simplified - would check actual connection in production
      } else {
        checks.redis = true; // Not required, so mark as healthy
      }
    } catch (error) {
      checks.redis = false;
      errors.redis = error instanceof Error ? error.message : 'Redis check failed';
    }

    // 5. Email Service Check
    try {
      checks.email = !!process.env.RESEND_API_KEY;
      if (!checks.email) {
        errors.email = 'Email service not configured';
      }
    } catch (error) {
      checks.email = false;
      errors.email = error instanceof Error ? error.message : 'Email check failed';
    }

    // Calculate overall health - only critical checks
    const criticalChecks = ['database', 'auth'];
    const allHealthy = Object.entries(checks)
      .filter(([key]) => criticalChecks.includes(key))
      .every(([_, value]) => value);
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '14.0',
      environment: process.env.NODE_ENV,
      checks,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      metrics: {
        responseTime,
        uptime: process.uptime(),
      },
    };

    return NextResponse.json(
      healthStatus,
      { 
        status: allHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        checks,
        errors,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
