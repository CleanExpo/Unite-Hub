/**
 * Playbooks API
 *
 * Phase: D53 - Knowledge Graph + SOP/Playbook Engine
 *
 * Routes:
 * - GET /api/synthex/playbooks - List playbooks
 * - POST /api/synthex/playbooks - Create playbook
 *
 * Query Params:
 * - action=get&id=<playbook-id> - Get specific playbook
 * - action=steps&id=<playbook-id> - List steps
 * - action=summary&id=<playbook-id> - Get execution summary
 * - action=create_step - Create step
 * - action=delete_step&step_id=<id> - Delete step
 * - action=start_execution - Start playbook execution
 * - action=update_execution&execution_id=<id> - Update execution
 * - action=next_step&execution_id=<id> - Get next step
 * - action=update&id=<playbook-id> - Update playbook
 * - action=delete&id=<playbook-id> - Delete playbook
 * - action=ai_generate - AI-generate playbook
 * - action=ai_analyze&execution_id=<id> - AI-analyze execution
 * - status=<status> - Filter by status
 * - category=<category> - Filter by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createPlaybook,
  getPlaybook,
  listPlaybooks,
  updatePlaybook,
  deletePlaybook,
  createPlaybookStep,
  listPlaybookSteps,
  deletePlaybookStep,
  startPlaybookExecution,
  updatePlaybookExecution,
  getNextPlaybookStep,
  getPlaybookExecutionSummary,
  aiGeneratePlaybook,
  aiAnalyzeExecution,
  CreatePlaybookInput,
  CreateStepInput,
  CreateExecutionInput,
  PlaybookStatus,
  PlaybookExecution,
} from '@/lib/synthex/knowledgePlaybookService';
import { supabaseAdmin } from '@/lib/supabase';

// =============================================================================
// GET - List playbooks, get playbook, list steps, get summary
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const id = request.nextUrl.searchParams.get('id');

    // Get specific playbook
    if (action === 'get' && id) {
      const playbook = await getPlaybook(tenantId, id);
      if (!playbook) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }
      return NextResponse.json({ playbook });
    }

    // List steps
    if (action === 'steps' && id) {
      const steps = await listPlaybookSteps(id);
      return NextResponse.json({ steps });
    }

    // Get execution summary
    if (action === 'summary' && id) {
      const summary = await getPlaybookExecutionSummary(id);
      return NextResponse.json({ summary });
    }

    // Get next step in execution
    if (action === 'next_step') {
      const executionId = request.nextUrl.searchParams.get('execution_id');
      if (!executionId) {
        return NextResponse.json({ error: 'execution_id is required' }, { status: 400 });
      }

      const nextStep = await getNextPlaybookStep(executionId);
      return NextResponse.json({ next_step: nextStep });
    }

    // List playbooks
    const status = request.nextUrl.searchParams.get('status') as PlaybookStatus | null;
    const category = request.nextUrl.searchParams.get('category');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);

    const playbooks = await listPlaybooks(tenantId, {
      status: status || undefined,
      category: category || undefined,
      limit,
    });

    return NextResponse.json({ playbooks });
  } catch (error: unknown) {
    console.error('GET /api/synthex/playbooks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch playbooks' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create, update, delete playbooks, steps, and executions
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const tenantId = orgData?.org_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');
    const body = await request.json();

    // AI-generate playbook
    if (action === 'ai_generate') {
      const { description, category } = body;

      if (!description) {
        return NextResponse.json({ error: 'description is required' }, { status: 400 });
      }

      const generated = await aiGeneratePlaybook(description, category);
      return NextResponse.json({ playbook: generated });
    }

    // AI-analyze execution
    if (action === 'ai_analyze') {
      const executionId = request.nextUrl.searchParams.get('execution_id') || body.execution_id;

      if (!executionId) {
        return NextResponse.json({ error: 'execution_id is required' }, { status: 400 });
      }

      // Fetch execution
      const { data: execution } = await supabaseAdmin
        .from('unite_playbook_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (!execution) {
        return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
      }

      // Fetch playbook and steps
      const playbook = await getPlaybook(tenantId, execution.playbook_id);
      if (!playbook) {
        return NextResponse.json({ error: 'Playbook not found' }, { status: 404 });
      }

      const steps = await listPlaybookSteps(execution.playbook_id);

      const analysis = await aiAnalyzeExecution(execution as PlaybookExecution, playbook, steps);
      return NextResponse.json({ analysis });
    }

    // Create playbook
    if (!action || action === 'create') {
      const input: CreatePlaybookInput = {
        name: body.name,
        description: body.description,
        category: body.category,
        tags: body.tags,
        estimated_duration_minutes: body.estimated_duration_minutes,
        difficulty: body.difficulty,
        created_by: user.id,
      };

      if (!input.name) {
        return NextResponse.json({ error: 'name is required' }, { status: 400 });
      }

      const playbook = await createPlaybook(tenantId, input);
      return NextResponse.json({ playbook }, { status: 201 });
    }

    // Create step
    if (action === 'create_step') {
      const input: CreateStepInput = {
        playbook_id: body.playbook_id,
        step_order: body.step_order,
        name: body.name,
        description: body.description,
        step_type: body.step_type,
        config: body.config,
        dependencies: body.dependencies,
      };

      if (!input.playbook_id || !input.step_order || !input.name || !input.step_type) {
        return NextResponse.json(
          { error: 'playbook_id, step_order, name, and step_type are required' },
          { status: 400 }
        );
      }

      const step = await createPlaybookStep(input);
      return NextResponse.json({ step }, { status: 201 });
    }

    // Delete step
    if (action === 'delete_step') {
      const stepId = request.nextUrl.searchParams.get('step_id') || body.step_id;
      if (!stepId) {
        return NextResponse.json({ error: 'step_id is required' }, { status: 400 });
      }

      await deletePlaybookStep(stepId);
      return NextResponse.json({ success: true });
    }

    // Start execution
    if (action === 'start_execution') {
      const input: CreateExecutionInput = {
        playbook_id: body.playbook_id,
        executed_by: user.id,
        context: body.context,
      };

      if (!input.playbook_id) {
        return NextResponse.json({ error: 'playbook_id is required' }, { status: 400 });
      }

      const execution = await startPlaybookExecution(tenantId, input);
      return NextResponse.json({ execution }, { status: 201 });
    }

    // Update execution
    if (action === 'update_execution') {
      const executionId = request.nextUrl.searchParams.get('execution_id') || body.execution_id;
      if (!executionId) {
        return NextResponse.json({ error: 'execution_id is required' }, { status: 400 });
      }

      const updates = {
        status: body.status,
        current_step_id: body.current_step_id,
        step_results: body.step_results,
        outcome: body.outcome,
        completed_at: body.completed_at,
      };

      const execution = await updatePlaybookExecution(tenantId, executionId, updates);
      return NextResponse.json({ execution });
    }

    // Update playbook
    if (action === 'update') {
      const playbookId = request.nextUrl.searchParams.get('id') || body.playbook_id;
      if (!playbookId) {
        return NextResponse.json({ error: 'playbook_id is required' }, { status: 400 });
      }

      const updates = {
        name: body.name,
        description: body.description,
        category: body.category,
        status: body.status,
        tags: body.tags,
        estimated_duration_minutes: body.estimated_duration_minutes,
        difficulty: body.difficulty,
      };

      const playbook = await updatePlaybook(tenantId, playbookId, updates);
      return NextResponse.json({ playbook });
    }

    // Delete playbook
    if (action === 'delete') {
      const playbookId = request.nextUrl.searchParams.get('id') || body.playbook_id;
      if (!playbookId) {
        return NextResponse.json({ error: 'playbook_id is required' }, { status: 400 });
      }

      await deletePlaybook(tenantId, playbookId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('POST /api/synthex/playbooks error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to manage playbooks' },
      { status: 500 }
    );
  }
}
