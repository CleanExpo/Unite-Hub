/**
 * AI Deployments API Route
 * Provides deployment management and automation
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
    const status = searchParams.get('status');
    const environment = searchParams.get('environment');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get active deployments from AI service
    const deployments = await aiService.getDeployments();
    
    // Get historical deployments from database
    let query = supabase
      .from('ai_deployments')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    
    if (environment) {
      query = query.eq('environment', environment);
    }

    const { data: historicalDeployments, error: dbError } = await query;

    if (dbError) {
      console.error('Failed to fetch historical deployments:', dbError);
    }

    // Calculate deployment statistics
    const stats = calculateDeploymentStats(historicalDeployments || []);

    return NextResponse.json({
      activeDeployments: deployments,
      historicalDeployments: historicalDeployments || [],
      statistics: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Deployments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Start a new deployment or update deployment status
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, deploymentId, ...deploymentData } = body;

    const aiService = await getAIIntegrationService();

    if (action === 'start') {
      // Validate deployment configuration
      const validationResult = await aiService.validateDeployment({
        id: `deploy-${Date.now()}`,
        name: deploymentData.name,
        version: deploymentData.version,
        strategy: deploymentData.strategy || 'rolling',
        targets: deploymentData.targets || [],
        healthChecks: deploymentData.healthChecks || [],
        rollbackCriteria: deploymentData.rollbackCriteria || {
          errorRateThreshold: 5,
          latencyThreshold: 1000,
          healthCheckFailures: 3,
          userReports: 10,
          autoRollback: true,
        },
        metadata: deploymentData.metadata || {},
      });

      const validation = validationResult as Record<string, unknown>;
      if (!validation.overallStatus || validation.overallStatus === 'failed') {
        return NextResponse.json(
          { 
            error: 'Deployment validation failed',
            validationReport: validationResult
          },
          { status: 400 }
        );
      }

      // Start deployment
      const deployment = await aiService.startDeployment({
        id: `deploy-${Date.now()}`,
        name: deploymentData.name,
        version: deploymentData.version,
        strategy: deploymentData.strategy || 'rolling',
        targets: deploymentData.targets || [],
        healthChecks: deploymentData.healthChecks || [],
        rollbackCriteria: deploymentData.rollbackCriteria || {
          errorRateThreshold: 5,
          latencyThreshold: 1000,
          healthCheckFailures: 3,
          userReports: 10,
          autoRollback: true,
        },
        metadata: deploymentData.metadata || {},
      });

      // Store deployment in database
      await supabase
        .from('ai_deployments')
        .insert({
          deployment_id: (deployment as Record<string, unknown>).id as string,
          name: deploymentData.name,
          version: deploymentData.version,
          strategy: deploymentData.strategy || 'rolling',
          status: 'pending',
          environment: deploymentData.environment || 'production',
          targets: deploymentData.targets || [],
          health_checks: deploymentData.healthChecks || [],
          metadata: deploymentData.metadata || {},
        });

      return NextResponse.json({
        message: 'Deployment started successfully',
        deployment,
      });
    } else if (action === 'rollback') {
      // Update deployment status to rolled-back
      const { data, error } = await supabase
        .from('ai_deployments')
        .update({
          status: 'rolled-back',
          completed_at: new Date().toISOString(),
          issues: deploymentData.issues || [],
        })
        .eq('deployment_id', deploymentId)
        .select();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        message: 'Deployment rolled back successfully',
        deployment: data[0],
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('AI Deployments POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Calculate deployment statistics
function calculateDeploymentStats(deployments: Array<Record<string, unknown>>) {
  const total = deployments.length;
  const successful = deployments.filter(d => d.status === 'completed').length;
  const failed = deployments.filter(d => d.status === 'failed').length;
  const rolledBack = deployments.filter(d => d.status === 'rolled-back').length;
  
  const avgDuration = deployments
    .filter(d => d.completed_at && d.started_at)
    .map(d => {
      const start = new Date(d.started_at as string).getTime();
      const end = new Date(d.completed_at as string).getTime();
      return end - start;
    })
    .reduce((sum, duration, _, arr) => sum + duration / arr.length, 0);

  return {
    total,
    successful,
    failed,
    rolledBack,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    avgDurationMs: avgDuration,
    avgDurationMinutes: avgDuration / 60000,
  };
}
