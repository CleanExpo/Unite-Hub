/**
 * H15: AI Model & Prompt Lifecycle Manager API
 * GET /api/founder/h15?action=<action>
 * POST /api/founder/h15 - Create/update configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createH15Manager } from '@/lib/founder/h15/modelLifecycleManager';
import { validateUserAndWorkspace } from '@/lib/api-helpers';

const manager = createH15Manager();

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId required' },
        { status: 400 }
      );
    }

    await validateUserAndWorkspace(req, workspaceId);

    const action = req.nextUrl.searchParams.get('action');

    switch (action) {
      case 'list-models': {
        const status = req.nextUrl.searchParams.get('status');
        const provider = req.nextUrl.searchParams.get('provider');
        return NextResponse.json({
          models: manager.listModels({ status: status || undefined, provider: provider || undefined }),
        });
      }

      case 'get-model': {
        const name = req.nextUrl.searchParams.get('name');
        if (!name) {
          return NextResponse.json(
            { error: 'name parameter required' },
            { status: 400 }
          );
        }
        const model = manager.getActiveModel(name);
        return NextResponse.json({ model });
      }

      case 'get-metrics': {
        const modelId = req.nextUrl.searchParams.get('modelId');
        if (!modelId) {
          return NextResponse.json(
            { error: 'modelId parameter required' },
            { status: 400 }
          );
        }
        const limit = req.nextUrl.searchParams.get('limit');
        const metrics = manager.getMetrics(modelId, limit ? parseInt(limit) : undefined);
        return NextResponse.json({ metrics });
      }

      case 'cost-optimization': {
        const recommendations = manager.getCostOptimizationRecommendations();
        return NextResponse.json({ recommendations });
      }

      case 'compare-models': {
        const modelIds = req.nextUrl.searchParams.get('models')?.split(',') || [];
        if (modelIds.length === 0) {
          return NextResponse.json(
            { error: 'models parameter required (comma-separated)' },
            { status: 400 }
          );
        }
        const comparison = manager.compareModels(modelIds);
        return NextResponse.json({ comparison });
      }

      case 'export-config': {
        const config = manager.exportConfiguration();
        return NextResponse.json({ config });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in H15 API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId required' },
        { status: 400 }
      );
    }

    await validateUserAndWorkspace(req, workspaceId);

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case 'register-model': {
        if (!body.model) {
          return NextResponse.json(
            { error: 'model object required' },
            { status: 400 }
          );
        }
        manager.registerModel(body.model);
        return NextResponse.json({
          success: true,
          message: `Model ${body.model.id} registered`,
        });
      }

      case 'create-prompt': {
        if (!body.template) {
          return NextResponse.json(
            { error: 'template object required' },
            { status: 400 }
          );
        }
        manager.createPromptTemplate(body.template);
        return NextResponse.json({
          success: true,
          message: `Prompt template ${body.template.id} created`,
        });
      }

      case 'create-ab-test': {
        if (!body.test) {
          return NextResponse.json(
            { error: 'test object required' },
            { status: 400 }
          );
        }
        manager.createABTest(body.test);
        return NextResponse.json({
          success: true,
          message: `A/B test ${body.test.id} created`,
        });
      }

      case 'record-metrics': {
        if (!body.metrics) {
          return NextResponse.json(
            { error: 'metrics object required' },
            { status: 400 }
          );
        }
        manager.recordMetrics(body.metrics);
        return NextResponse.json({
          success: true,
          message: 'Metrics recorded',
        });
      }

      case 'import-config': {
        if (!body.config) {
          return NextResponse.json(
            { error: 'config object required' },
            { status: 400 }
          );
        }
        manager.importConfiguration(body.config);
        return NextResponse.json({
          success: true,
          message: 'Configuration imported',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error in H15 API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
