/**
 * Client Agent Scheduler Service
 * Phase 83: Autonomous scheduled agent runs
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  AgentOverview,
  ActionSummary,
} from './clientAgentTypes';
import { buildClientContext } from './clientAgentContextService';
import { getPolicy } from './clientAgentPolicyService';
import { planAgentResponse } from './clientAgentPlannerService';
import { checkGuardrails, assessRisk } from './clientAgentGuardrailsService';
import { executeAction, recordExecution } from './clientAgentExecutorService';
import {
  createSession,
  logAction,
  endSession,
  addMessage,
} from './clientAgentLogService';
import { canAutoExecute } from './clientAgentPolicyService';

/**
 * Run scheduled agent evaluation for a workspace
 */
export async function runScheduledEvaluation(
  workspaceId: string
): Promise<{
  clients_evaluated: number;
  actions_proposed: number;
  actions_executed: number;
  errors: string[];
}> {
  const supabase = await getSupabaseServer();
  const errors: string[] = [];
  let clients_evaluated = 0;
  let actions_proposed = 0;
  let actions_executed = 0;

  try {
    // Get clients to evaluate
    const { data: clients } = await supabase
      .from('contacts')
      .select('id, name, ai_score')
      .eq('workspace_id', workspaceId)
      .gte('ai_score', 50) // Focus on warm/hot leads
      .order('ai_score', { ascending: false })
      .limit(20);

    if (!clients || clients.length === 0) {
      return { clients_evaluated: 0, actions_proposed: 0, actions_executed: 0, errors: [] };
    }

    for (const client of clients) {
      try {
        const result = await evaluateClientProactively(
          workspaceId,
          client.id,
          client.name
        );

        clients_evaluated++;
        actions_proposed += result.proposed;
        actions_executed += result.executed;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Client ${client.id}: ${msg}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Workspace evaluation failed: ${msg}`);
  }

  return {
    clients_evaluated,
    actions_proposed,
    actions_executed,
    errors,
  };
}

/**
 * Evaluate a single client proactively
 */
async function evaluateClientProactively(
  workspaceId: string,
  clientId: string,
  clientName: string
): Promise<{ proposed: number; executed: number }> {
  // Build context
  const context = await buildClientContext(clientId, workspaceId);
  const policy = await getPolicy(workspaceId, clientId);

  if (!policy || !policy.agent_enabled) {
    return { proposed: 0, executed: 0 };
  }

  // Create session
  const session = await createSession(workspaceId, clientId, undefined, context);

  try {
    // Generate proactive suggestions
    const plannerInput = {
      user_message: `Review ${clientName}'s status and suggest any appropriate follow-up actions. Consider their engagement level, recent interactions, and any warnings.`,
      context,
      policy,
      session_history: [],
    };

    const response = await planAgentResponse(plannerInput);

    // Add agent response as message
    await addMessage(session.id, {
      role: 'system',
      content: 'Scheduled proactive evaluation',
      timestamp: new Date().toISOString(),
    });

    await addMessage(session.id, {
      role: 'agent',
      content: response.response_message,
      timestamp: new Date().toISOString(),
    });

    let proposed = 0;
    let executed = 0;

    // Process proposed actions
    for (const proposal of response.proposed_actions) {
      // Check guardrails
      const guardrails = await checkGuardrails(
        proposal,
        policy,
        context,
        workspaceId,
        clientId
      );

      if (!guardrails.allowed) {
        continue;
      }

      const riskAssessment = assessRisk(proposal, context);

      // Determine if auto-execute
      const shouldAutoExecute = canAutoExecute(policy, riskAssessment.level);
      const status = shouldAutoExecute ? 'auto_executed' : 'awaiting_approval';

      // Log action
      const action = await logAction(
        session.id,
        clientId,
        workspaceId,
        proposal,
        context,
        status
      );

      proposed++;

      // Execute if auto-approved
      if (shouldAutoExecute) {
        const result = await executeAction(action);
        await recordExecution(action.id, result);

        if (result.success) {
          executed++;
        }
      }
    }

    await endSession(session.id, 'completed');

    return { proposed, executed };
  } catch (error) {
    await endSession(session.id, 'error', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Get agent overview statistics
 */
export async function getAgentOverview(
  workspaceId: string
): Promise<AgentOverview> {
  const supabase = await getSupabaseServer();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get session counts
  const { count: totalSessions } = await supabase
    .from('client_agent_sessions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId);

  const { count: activeSessions } = await supabase
    .from('client_agent_sessions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('status', 'active');

  // Get action counts for today
  const { count: actionsToday } = await supabase
    .from('client_agent_actions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .gte('created_at', today.toISOString());

  const { count: autoExecutedToday } = await supabase
    .from('client_agent_actions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('approval_status', 'auto_executed')
    .gte('created_at', today.toISOString());

  const { count: awaitingApproval } = await supabase
    .from('client_agent_actions')
    .select('id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .eq('approval_status', 'awaiting_approval');

  // Get rejection rate
  const { data: recentActions } = await supabase
    .from('client_agent_actions')
    .select('approval_status')
    .eq('workspace_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const rejected = recentActions?.filter(a => a.approval_status === 'rejected').length || 0;
  const total = recentActions?.length || 1;
  const rejectionRate = rejected / total;

  // Get average risk score
  const { data: riskData } = await supabase
    .from('client_agent_actions')
    .select('risk_score')
    .eq('workspace_id', workspaceId)
    .gte('created_at', today.toISOString());

  const avgRiskScore = riskData && riskData.length > 0
    ? riskData.reduce((sum, a) => sum + Number(a.risk_score), 0) / riskData.length
    : 0;

  // Get truth compliance
  const { data: truthData } = await supabase
    .from('client_agent_sessions')
    .select('truth_compliance_score')
    .eq('workspace_id', workspaceId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const truthComplianceAvg = truthData && truthData.length > 0
    ? truthData.reduce((sum, s) => sum + Number(s.truth_compliance_score), 0) / truthData.length
    : 1;

  // Get clients with warnings
  const { count: clientsWithWarnings } = await supabase
    .from('early_warning_events')
    .select('client_id', { count: 'exact' })
    .eq('workspace_id', workspaceId)
    .in('status', ['open', 'acknowledged'])
    .not('client_id', 'is', null);

  return {
    total_sessions: totalSessions || 0,
    active_sessions: activeSessions || 0,
    actions_today: actionsToday || 0,
    auto_executed_today: autoExecutedToday || 0,
    awaiting_approval: awaitingApproval || 0,
    rejection_rate: rejectionRate,
    avg_risk_score: avgRiskScore,
    truth_compliance_avg: truthComplianceAvg,
    clients_with_warnings: clientsWithWarnings || 0,
  };
}

/**
 * Get action breakdown by type
 */
export async function getActionSummary(
  workspaceId: string,
  days = 7
): Promise<ActionSummary[]> {
  const supabase = await getSupabaseServer();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('client_agent_actions')
    .select('action_type, approval_status, risk_score')
    .eq('workspace_id', workspaceId)
    .gte('created_at', since);

  if (!data || data.length === 0) {
    return [];
  }

  // Group by action type
  const grouped = new Map<string, { count: number; autoExec: number; totalRisk: number }>();

  for (const action of data) {
    const current = grouped.get(action.action_type) || { count: 0, autoExec: 0, totalRisk: 0 };
    current.count++;
    if (action.approval_status === 'auto_executed') {
      current.autoExec++;
    }
    current.totalRisk += Number(action.risk_score);
    grouped.set(action.action_type, current);
  }

  return Array.from(grouped.entries()).map(([action_type, stats]) => ({
    action_type: action_type as ActionSummary['action_type'],
    count: stats.count,
    auto_exec_count: stats.autoExec,
    avg_risk: stats.totalRisk / stats.count,
  }));
}

/**
 * Check for overdue pending actions
 */
export async function getOverdueActions(
  workspaceId: string,
  hoursOld = 24
): Promise<string[]> {
  const supabase = await getSupabaseServer();

  const cutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('client_agent_actions')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('approval_status', 'awaiting_approval')
    .lt('created_at', cutoff);

  return data?.map(a => a.id) || [];
}
