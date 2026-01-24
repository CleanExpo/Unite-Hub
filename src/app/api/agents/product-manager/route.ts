/**
 * Senior Product Manager Agent API Route
 *
 * Endpoints for product management AI capabilities:
 * - Feature prioritization (RICE/KANO)
 * - Roadmap generation
 * - Release readiness assessment
 * - Sprint analysis
 * - Issue-to-task synthesis
 *
 * HUMAN_GOVERNED: All outputs are recommendations only
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { authenticateRequest } from '@/lib/auth';
import {
  prioritizeFeatures,
  generateRoadmap,
  assessReleaseReadiness,
  analyzeSprintPerformance,
  synthesizeIssuesToTasks,
  type PrioritizedFeature,
  type LinearIssue
} from '@/lib/agents/senior-product-manager';

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  // Authenticate request (dev bypass for testing)
  const isDev = process.env.NODE_ENV === 'development';
  const isTestMode = req.headers.get('x-test-mode') === 'true';

  if (isDev && isTestMode) {
    // Allow testing without auth in development
  } else {
    const authResult = await authenticateRequest(req);
    if (!authResult?.user) {
      return errorResponse('Unauthorized', 401);
    }
  }

  const body = await req.json();
  const { action, ...payload } = body;

  if (!action) {
    return errorResponse('action required', 400);
  }

  let result;

  switch (action) {
    case 'prioritize_features': {
      if (!payload.features || !Array.isArray(payload.features)) {
        return errorResponse('features array required', 400);
      }
      result = await prioritizeFeatures(
        workspaceId,
        payload.features as Array<{ id: string; title: string; description: string; metadata?: Record<string, unknown> }>,
        payload.context
      );
      break;
    }

    case 'generate_roadmap': {
      if (!payload.projectName || !payload.features) {
        return errorResponse('projectName and features required', 400);
      }
      result = await generateRoadmap(
        workspaceId,
        payload.projectName,
        payload.features as PrioritizedFeature[],
        payload.targetVersions || ['V1', 'V2', 'V3']
      );
      break;
    }

    case 'assess_readiness': {
      if (!payload.projectName || !payload.version || !payload.issues) {
        return errorResponse('projectName, version, and issues required', 400);
      }
      result = await assessReleaseReadiness(
        workspaceId,
        payload.projectName,
        payload.version,
        payload.issues as LinearIssue[]
      );
      break;
    }

    case 'analyze_sprint': {
      if (!payload.sprintName) {
        return errorResponse('sprintName required', 400);
      }
      result = await analyzeSprintPerformance(
        workspaceId,
        payload.sprintName,
        payload.completedIssues || [],
        payload.incompleteIssues || []
      );
      break;
    }

    case 'synthesize_tasks': {
      if (!payload.projectName || !payload.issues || !payload.targetVersion) {
        return errorResponse('projectName, issues, and targetVersion required', 400);
      }
      result = await synthesizeIssuesToTasks(
        workspaceId,
        payload.projectName,
        payload.issues as LinearIssue[],
        payload.targetVersion
      );
      break;
    }

    case 'test_connection': {
      // Health check endpoint
      result = {
        success: true,
        data: {
          agent: 'senior-product-manager',
          status: 'healthy',
          capabilities: [
            'prioritize_features',
            'generate_roadmap',
            'assess_readiness',
            'analyze_sprint',
            'synthesize_tasks'
          ],
          governance: 'HUMAN_GOVERNED',
          timestamp: new Date().toISOString()
        }
      };
      break;
    }

    default:
      return errorResponse(`Unknown action: ${action}. Valid actions: prioritize_features, generate_roadmap, assess_readiness, analyze_sprint, synthesize_tasks, test_connection`, 400);
  }

  if (!result.success) {
    return errorResponse(result.error || 'PM agent failed', 500);
  }

  return successResponse({
    action,
    governance: 'HUMAN_GOVERNED',
    advisory: 'All recommendations require stakeholder approval before implementation',
    ...result
  });
});

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const action = req.nextUrl.searchParams.get('action');

  // Health check without auth
  if (action === 'health' || action === 'test_connection') {
    return successResponse({
      agent: 'senior-product-manager',
      status: 'healthy',
      version: '1.0.0',
      capabilities: [
        'prioritize_features',
        'generate_roadmap',
        'assess_readiness',
        'analyze_sprint',
        'synthesize_tasks'
      ],
      governance: 'HUMAN_GOVERNED',
      model: 'claude-opus-4-5-20251101',
      timestamp: new Date().toISOString()
    });
  }

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  // Authenticate for other GET requests
  const { user } = await authenticateRequest(req);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  return successResponse({
    agent: 'senior-product-manager',
    workspaceId,
    message: 'Use POST to invoke PM agent actions',
    availableActions: [
      {
        action: 'prioritize_features',
        description: 'Prioritize features using RICE/KANO frameworks',
        required: ['features'],
        optional: ['context']
      },
      {
        action: 'generate_roadmap',
        description: 'Generate version roadmaps from prioritized features',
        required: ['projectName', 'features'],
        optional: ['targetVersions']
      },
      {
        action: 'assess_readiness',
        description: 'Assess release readiness for a version',
        required: ['projectName', 'version', 'issues']
      },
      {
        action: 'analyze_sprint',
        description: 'Analyze sprint performance and provide recommendations',
        required: ['sprintName'],
        optional: ['completedIssues', 'incompleteIssues']
      },
      {
        action: 'synthesize_tasks',
        description: 'Synthesize Linear issues into development tasks',
        required: ['projectName', 'issues', 'targetVersion']
      }
    ]
  });
});
