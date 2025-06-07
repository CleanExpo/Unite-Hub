import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCARSIToken } from '@/lib/auth/sso-bridge';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks = {
    database: false,
    carsi: false,
    stripe: false,
    redis: false,
    email: false,
  };
  const errors: Record<string, string> = {};

  try {
    // Check if this is a health check request
    const isHealthCheck = request.headers.get('X-Health-Check') === 'true';

    // 1. Database Health Check
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('customers')
        .select('count')
        .limit(1)
        .single();
      
      checks.database = !error;
      if (error) errors.database = error.message;
    } catch (error) {
      checks.database = false;
      errors.database = error instanceof Error ? error.message : 'Database check failed';
    }

    // 2. CARSI Integration Check
    try {
      const carsiToken = await getCARSIToken();
      if (carsiToken || process.env.CARSI_API_KEY) {
        // In production, would make a lightweight API call
        checks.carsi = true;
      } else {
        checks.carsi = false;
        errors.carsi = 'CARSI integration not configured';
      }
    } catch (error) {
      checks.carsi = false;
      errors.carsi = error instanceof Error ? error.message : 'CARSI check failed';
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

    // 4. Redis Check (optional)
    try {
      if (process.env.REDIS_HOST) {
        // In production, would check Redis connection
        checks.redis = true;
      } else {
        checks.redis = false;
        errors.redis = 'Redis not configured (optional)';
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

    // Calculate overall health
    const criticalChecks = ['database', 'stripe', 'email'];
    const allHealthy = Object.entries(checks)
      .filter(([key]) => criticalChecks.includes(key))
      .every(([_, value]) => value);
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '14.0',
      environment: process.env.NODE_ENV,
      checks,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
      metrics: {
        responseTime,
        uptime: process.uptime(),
      },
    };

    // Record metrics if not a health check request
    if (!isHealthCheck) {
      try {
        const supabase = await createClient();
        await supabase.from('api_metrics').insert({
          endpoint: '/api/health',
          response_time: responseTime,
          status_code: allHealthy ? 200 : 503,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to record metrics:', error);
      }
    }

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
