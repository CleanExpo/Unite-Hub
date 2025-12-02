/**
 * Leviathan Orchestrate API
 * POST /api/leviathan/orchestrate
 *
 * Full end-to-end orchestration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { LeviathanOrchestratorService } from '@/lib/services/leviathan/LeviathanOrchestratorService';
import { DeploymentAuditService } from '@/lib/services/leviathan/DeploymentAuditService';

export async function POST(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      orgId,
      targetUrl,
      runType = 'full',
      name,
      description,
      fabrication,
      cloud,
      social,
      healthCheck,
    } = body;

    // Validate required fields
    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'targetUrl is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const orchestrator = new LeviathanOrchestratorService();
    const auditService = new DeploymentAuditService();

    // Execute orchestration
    const result = await orchestrator.orchestrate({
      orgId,
      targetUrl,
      runType,
      name,
      description,
      fabrication,
      cloud: cloud || {
        providers: ['aws', 'gcs', 'azure', 'netlify'],
        variantCount: 4,
        deploymentType: 'daisy_chain',
      },
      social: social || {
        gsiteEnabled: true,
        bloggerCount: 2,
        gsiteCount: 1,
      },
      healthCheck: healthCheck || {
        checkIndexing: true,
        checkSchema: true,
        checkOgImage: true,
      },
    });

    // Log the orchestration result
    if (result.success) {
      auditService.log({
        orgId,
        runId: result.run.id,
        actionType: 'orchestration_complete',
        actionTarget: targetUrl,
        actionResult: 'success',
        details: {
          runType,
          stepsCompleted: result.run.result?.stepsCompleted,
          deployedUrls: result.deployedUrls.length,
        },
        linksCreated: 0,
        assetsUploaded: result.deployedUrls.length,
        durationMs: result.run.durationMs,
        actorType: 'system',
        metadata: {},
      });
    }

    return NextResponse.json({
      success: result.success,
      runId: result.run.id,
      status: result.run.status,
      deployedUrls: result.deployedUrls,
      healthScores: result.healthScores,
      errors: result.errors,
      duration: result.run.durationMs,
      steps: result.run.steps.map(step => ({
        name: step.name,
        status: step.status,
        duration: step.durationMs,
        error: step.error,
      })),
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Authentication check
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { error: 'runId is required' },
        { status: 400 }
      );
    }

    const orchestrator = new LeviathanOrchestratorService();
    const run = orchestrator.getRunStatus(runId);

    if (!run) {
      return NextResponse.json(
        { error: 'Run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      runId: run.id,
      status: run.status,
      steps: run.steps,
      result: run.result,
      error: run.error,
    });

  } catch (error) {
    console.error('Get run status error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
