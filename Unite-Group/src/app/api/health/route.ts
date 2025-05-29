import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Health check endpoint for monitoring
 * Returns system status and component health
 */
export async function GET() {
  const startTime = Date.now();
  
  const systemInfo = {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '4.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  // Define component health status types
  type ComponentStatus = 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | 'not_configured' | 'configured';
  
  interface ComponentHealth {
    status: ComponentStatus;
    error?: string;
  }
  
  // Component health status
  const health = {
    status: 'healthy',
    components: {
      api: { status: 'healthy' } as ComponentHealth,
      database: { status: 'unknown' } as ComponentHealth,
      email: { status: 'unknown' } as ComponentHealth,
    },
    responseTimeMs: 0
  };
  
  try {
    // Check database connection
    const supabase = createServerComponentClient<Database>({ cookies });
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      health.components.database.status = 'unhealthy';
      health.components.database.error = error.message;
      health.status = 'degraded';
    } else {
      health.components.database.status = 'healthy';
    }
  } catch (error) {
    health.components.database.status = 'unhealthy';
    health.components.database.error = error instanceof Error ? error.message : 'Unknown database error';
    health.status = 'degraded';
  }
  
  try {
    // Basic email configuration check
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      health.components.email.status = 'configured';
    } else {
      health.components.email.status = 'not_configured';
      health.status = 'degraded';
    }
  } catch (error) {
    health.components.email.status = 'unhealthy';
    health.components.email.error = error instanceof Error ? error.message : 'Unknown email error';
    health.status = 'degraded';
  }
  
  // Calculate response time
  health.responseTimeMs = Date.now() - startTime;
  
  // Return health status with appropriate status code
  return NextResponse.json(
    { 
      health,
      systemInfo
    }, 
    { 
      status: health.status === 'healthy' ? 200 : 
              health.status === 'degraded' ? 200 : 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    }
  );
}
