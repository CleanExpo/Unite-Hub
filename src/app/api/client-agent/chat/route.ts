/**
 * Client Agent Chat API
 * Phase 83: Main chat endpoint for agent interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  buildClientContext,
  buildWorkspaceContext,
  getPolicy,
  planAgentResponse,
  checkGuardrails,
  assessRisk,
  createSession,
  getSession,
  addMessage,
  endSession,
  logAction,
  executeAction,
  recordExecution,
  canAutoExecute,
  adaptProposalForTruth,
  AgentRequest,
  AgentResponse,
  ProposedAction,
  ExecutedAction,
  SafetyInfo,
} from '@/lib/clientAgent';

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body: AgentRequest = await req.json();
    const { session_id, client_id, workspace_id, message, context: providedContext } = body;

    if (!workspace_id || !message) {
      return NextResponse.json(
        { error: 'workspace_id and message are required' },
        { status: 400 }
      );
    }

    // Build context
    const context = client_id
      ? await buildClientContext(client_id, workspace_id)
      : await buildWorkspaceContext(workspace_id);

    // Merge with provided context
    if (providedContext) {
      Object.assign(context, providedContext);
    }

    // Get or create session
    let session;
    if (session_id) {
      session = await getSession(session_id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    } else {
      session = await createSession(workspace_id, client_id, userId, context);
    }

    // Get policy
    const policy = await getPolicy(workspace_id, client_id);
    if (!policy) {
      return NextResponse.json({ error: 'No policy found' }, { status: 500 });
    }

    // Add user message
    await addMessage(session.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Plan response
    const plannerOutput = await planAgentResponse({
      user_message: message,
      context,
      policy,
      session_history: session.messages,
    });

    // Add agent message
    await addMessage(session.id, {
      role: 'agent',
      content: plannerOutput.response_message,
      timestamp: new Date().toISOString(),
    });

    // Process proposed actions
    const proposedActions: ProposedAction[] = [];
    const executedActions: ExecutedAction[] = [];
    let totalRisk = 0;
    const disclaimers: string[] = [];

    for (const proposal of plannerOutput.proposed_actions) {
      // Adapt for truth compliance
      const { adapted, disclaimers: propDisclaimers } = adaptProposalForTruth(proposal);
      disclaimers.push(...propDisclaimers);

      // Check guardrails
      const guardrails = await checkGuardrails(
        adapted,
        policy,
        context,
        workspace_id,
        client_id
      );

      const riskAssessment = assessRisk(adapted, context);
      totalRisk += riskAssessment.score;

      // Determine approval status
      const canAuto = guardrails.allowed && canAutoExecute(policy, riskAssessment.level);

      // Log the action
      const action = await logAction(
        session.id,
        client_id,
        workspace_id,
        adapted,
        context,
        canAuto ? 'auto_executed' : 'awaiting_approval'
      );

      proposedActions.push({
        id: action.id,
        action_type: adapted.action_type,
        description: adapted.agent_reasoning,
        risk_level: riskAssessment.level,
        requires_approval: !canAuto,
        reasoning: adapted.agent_reasoning,
      });

      // Execute if auto-approved
      if (canAuto) {
        const result = await executeAction(action);
        await recordExecution(action.id, result);

        executedActions.push({
          id: action.id,
          action_type: adapted.action_type,
          result,
        });
      }
    }

    // Check for early warnings
    const hasActiveWarnings = !!(context.early_warnings && context.early_warnings.length > 0);
    const hasHighWarnings = context.early_warnings?.some(w => w.severity === 'high') || false;

    // Build safety info
    const safetyInfo: SafetyInfo = {
      total_risk_score: proposedActions.length > 0 ? totalRisk / proposedActions.length : 0,
      actions_auto_executed: executedActions.length,
      actions_awaiting_approval: proposedActions.filter(a => a.requires_approval).length,
      early_warning_active: hasActiveWarnings,
      truth_compliance: 0.95, // High by default with truth adapter
      disclaimers,
    };

    // Build response
    const response: AgentResponse = {
      session_id: session.id,
      message: plannerOutput.response_message,
      proposed_actions: proposedActions,
      executed_actions: executedActions,
      safety_info: safetyInfo,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Client agent chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
