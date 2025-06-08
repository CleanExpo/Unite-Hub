/**
 * AI Monitor API Route
 * Provides system monitoring metrics and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIIntegrationService } from '@/lib/services/ai/AIIntegrationService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get Supabase client
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get AI Integration Service
    const aiService = await getAIIntegrationService();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(searchParams.get('historyLimit') || '100');

    // Get system status and metrics
    const [status, metrics] = await Promise.all([
      aiService.getSystemStatus(),
      aiService.getMetrics()
    ]);

    const response: {
      status: Awaited<ReturnType<typeof aiService.getSystemStatus>>;
      metrics: Awaited<ReturnType<typeof aiService.getMetrics>>;
      timestamp: string;
      eventHistory?: ReturnType<typeof aiService.getEventHistory>;
    } = {
      status,
      metrics,
      timestamp: new Date().toISOString(),
    };

    // Include event history if requested
    if (includeHistory) {
      response.eventHistory = aiService.getEventHistory(historyLimit);
    }

    // Store system health in database for historical tracking
    const { error: dbError } = await supabase
      .from('ai_system_health')
      .insert({
        health_score: 0.95, // Calculate based on actual metrics
        monitoring_status: status.monitoring.status,
        active_predictions: status.predictions.active,
        critical_predictions: status.predictions.critical,
        active_threats: status.security.threats,
        active_mitigations: status.security.activeResponses,
        recent_optimizations: status.performance.optimizations,
        active_deployments: status.deployment.active,
        system_metrics: metrics,
        component_status: {
          monitoring: status.monitoring.status,
          predictions: status.predictions.active > 0 ? 'active' : 'idle',
          security: status.security.threats > 0 ? 'alert' : 'normal',
          performance: 'optimal',
          deployment: status.deployment.active > 0 ? 'active' : 'idle',
        },
      });

    if (dbError) {
      console.error('Failed to store system health:', dbError);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Monitor API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for real-time updates
export async function POST(_request: NextRequest) {
  try {
    // This would be used to establish WebSocket connection
    // For now, return connection instructions
    return NextResponse.json({
      message: 'WebSocket connections should be established via the WebSocket server',
      wsEndpoint: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ai',
    });
  } catch (error) {
    console.error('WebSocket setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
