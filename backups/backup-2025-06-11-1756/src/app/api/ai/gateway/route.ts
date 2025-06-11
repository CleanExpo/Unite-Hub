import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =============================================================================
// AI GATEWAY API - NO MOCK DATA
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Check if AI Gateway is configured
    const { data: config, error: configError } = await supabase
      .from('ai_gateway_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      return NextResponse.json({
        configured: false,
        message: 'AI Gateway not configured',
        data: {
          status: 'not_configured',
          providers: [],
          metrics: {
            totalRequests: 0,
            successRate: 0,
            averageResponseTime: 0,
            totalCost: 0,
            cacheHitRate: 0,
            activeProviders: 0
          },
          alerts: [],
          setupRequired: true,
          setupSteps: [
            'Configure AI provider API keys',
            'Set up routing rules',
            'Enable content moderation',
            'Configure cost limits'
          ]
        }
      });
    }

    // If configured, check provider status
    const { data: providers, error: providersError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('config_id', config.id)
      .eq('enabled', true);

    if (providersError) {
      console.error('Error fetching AI providers:', providersError);
      return NextResponse.json(
        { error: 'Failed to fetch AI providers' },
        { status: 500 }
      );
    }

    // Get recent metrics if available
    const { data: metrics, error: metricsError } = await supabase
      .from('ai_gateway_metrics')
      .select('*')
      .eq('config_id', config.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (metricsError) {
      console.warn('Error fetching AI metrics:', metricsError);
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateMetrics(metrics || []);

    // Get recent alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('ai_gateway_alerts')
      .select('*')
      .eq('config_id', config.id)
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) {
      console.warn('Error fetching AI alerts:', alertsError);
    }

    return NextResponse.json({
      configured: true,
      data: {
        status: 'active',
        providers: providers || [],
        metrics: aggregatedMetrics,
        alerts: alerts || [],
        config: {
          name: config.name,
          created_at: config.created_at,
          updated_at: config.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Unexpected error in AI Gateway API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...configData } = body;

    if (action === 'configure') {
      // Create or update AI Gateway configuration
      const { data: config, error: configError } = await supabase
        .from('ai_gateway_config')
        .upsert([{
          user_id: user.id,
          name: configData.name || 'AI Gateway',
          settings: configData.settings || {},
          enabled: true,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (configError) {
        console.error('Error creating AI Gateway config:', configError);
        return NextResponse.json(
          { error: 'Failed to create AI Gateway configuration' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: config,
        message: 'AI Gateway configured successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Unexpected error in AI Gateway configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateMetrics(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      totalCost: 0,
      cacheHitRate: 0,
      activeProviders: 0
    };
  }

  const totalRequests = metrics.reduce((sum, m) => sum + (m.request_count || 0), 0);
  const totalSuccessful = metrics.reduce((sum, m) => sum + (m.successful_requests || 0), 0);
  const totalResponseTime = metrics.reduce((sum, m) => sum + (m.total_response_time || 0), 0);
  const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalCacheHits = metrics.reduce((sum, m) => sum + (m.cache_hits || 0), 0);
  
  const successRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;
  const averageResponseTime = totalSuccessful > 0 ? totalResponseTime / totalSuccessful : 0;
  const cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;
  
  // Count unique providers from metrics
  const uniqueProviders = new Set(metrics.map(m => m.provider_id)).size;

  return {
    totalRequests,
    successRate: Math.round(successRate * 10) / 10,
    averageResponseTime: Math.round(averageResponseTime),
    totalCost: Math.round(totalCost * 100) / 100,
    cacheHitRate: Math.round(cacheHitRate * 10) / 10,
    activeProviders: uniqueProviders
  };
}
