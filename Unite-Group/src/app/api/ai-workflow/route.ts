/**
 * AI Workflow API Endpoints
 * Unite Group - Version 11.0 Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIWorkflowService } from '@/lib/ai/workflow/service';
import { AIGateway } from '@/lib/ai/gateway/ai-gateway';
import type { WorkflowConfig } from '@/lib/ai/workflow/types';

// Initialize AI Workflow Service
const aiGateway = new AIGateway({
  providers: [
    {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.1
    }
  ],
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 1000,
    keyStrategy: 'hash'
  },
  monitoring: {
    enabled: true,
    metricsRetentionDays: 30,
    healthCheckIntervalSeconds: 60
  }
});

const workflowConfig: WorkflowConfig = {
  aiProvider: 'openai',
  fallbackProviders: ['claude', 'google'],
  maxRetries: 3,
  timeoutMs: 30000,
  enableCaching: true,
  humanReviewThreshold: 0.7,
  autoApprovalThreshold: 0.9,
  costLimits: {
    perExecution: 5.0,
    perDay: 100.0,
    perMonth: 1000.0
  },
  notifications: {
    onFailure: true,
    onHumanReviewRequired: true,
    onCompletion: false,
    recipients: ['admin@unitegroup.com.au']
  }
};

const workflowService = new AIWorkflowService(aiGateway, workflowConfig);

/**
 * GET /api/ai-workflow - List all workflows
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    
    let workflows = workflowService.listWorkflows();
    
    // Filter by category if specified
    if (category) {
      workflows = workflows.filter(w => w.category === category);
    }
    
    // Filter by active status if specified
    if (active !== null) {
      const isActive = active === 'true';
      workflows = workflows.filter(w => w.isActive === isActive);
    }
    
    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('Error listing workflows:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list workflows',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-workflow - Execute a workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, inputs, executedBy } = body;
    
    if (!workflowId || !inputs || !executedBy) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: workflowId, inputs, executedBy' 
        },
        { status: 400 }
      );
    }
    
    // Execute the workflow
    const execution = await workflowService.executeWorkflow(
      workflowId,
      inputs,
      executedBy
    );
    
    return NextResponse.json({
      success: true,
      data: execution
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
