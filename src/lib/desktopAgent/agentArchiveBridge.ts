/**
 * Agent Archive Bridge - Living Intelligence Archive Integration
 *
 * Logs all desktop agent activities to the Living Intelligence Archive
 * for complete audit trail and compliance tracking.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { log } from '@/lib/logger';

export interface AgentEventLog {
  eventType: 'command_executed' | 'command_approved' | 'command_rejected' | 'session_created' | 'session_ended' | 'error';
  workspaceId: string;
  userId: string;
  details: Record<string, any>;
}

/**
 * Log command execution to Living Intelligence Archive
 */
export async function logCommandExecution(
  commandId: string,
  workspaceId: string,
  userId: string,
  commandName: string,
  parameters: Record<string, any>,
  result: Record<string, any>,
  executionTime: number
): Promise<void> {
  try {
    const eventLog: AgentEventLog = {
      eventType: 'command_executed',
      workspaceId,
      userId,
      details: {
        commandId,
        commandName,
        parameters,
        result,
        executionTime,
        timestamp: new Date().toISOString(),
      },
    };

    // Log to audit logs
    await supabaseAdmin.from('auditLogs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'desktop_agent_command',
      resource_type: 'desktop_command',
      resource_id: commandId,
      details: eventLog.details,
      created_at: new Date().toISOString(),
    });

    // Update command record with result
    await supabaseAdmin
      .from('desktop_agent_commands')
      .update({
        status: 'completed',
        result,
        execution_time_ms: executionTime,
        completed_at: new Date().toISOString(),
      })
      .eq('id', commandId);

    log.info('Command logged to archive', {
      commandId,
      commandName,
      executionTime,
      workspaceId,
    });
  } catch (error) {
    log.error('Failed to log command execution', {
      error,
      commandId,
      commandName,
      workspaceId,
    });
  }
}

/**
 * Log command approval decision
 */
export async function logCommandApproval(
  commandId: string,
  workspaceId: string,
  userId: string,
  approved: boolean,
  founderNotes?: string
): Promise<void> {
  try {
    const eventLog: AgentEventLog = {
      eventType: approved ? 'command_approved' : 'command_rejected',
      workspaceId,
      userId,
      details: {
        commandId,
        approved,
        founderNotes,
        timestamp: new Date().toISOString(),
      },
    };

    // Log to audit logs
    await supabaseAdmin.from('auditLogs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'desktop_agent_approval',
      resource_type: 'desktop_command',
      resource_id: commandId,
      details: eventLog.details,
      created_at: new Date().toISOString(),
    });

    // Record approval in desktop_agent_approvals
    await supabaseAdmin.from('desktop_agent_approvals').insert({
      workspace_id: workspaceId,
      command_id: commandId,
      approved,
      founder_notes: founderNotes,
      approved_by: userId,
    });

    // Update command approval status
    await supabaseAdmin
      .from('desktop_agent_commands')
      .update({
        approval_status: approved ? 'approved' : 'rejected',
        approved_by: userId,
        approval_reason: founderNotes,
        approved_at: new Date().toISOString(),
      })
      .eq('id', commandId);

    log.info('Command approval logged', {
      commandId,
      approved,
      workspaceId,
    });
  } catch (error) {
    log.error('Failed to log command approval', {
      error,
      commandId,
      approved,
      workspaceId,
    });
  }
}

/**
 * Log session creation
 */
export async function logSessionCreated(
  sessionId: string,
  workspaceId: string,
  userId: string,
  agentVersion: string
): Promise<void> {
  try {
    const eventLog: AgentEventLog = {
      eventType: 'session_created',
      workspaceId,
      userId,
      details: {
        sessionId,
        agentVersion,
        timestamp: new Date().toISOString(),
      },
    };

    await supabaseAdmin.from('auditLogs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'desktop_agent_session_start',
      resource_type: 'desktop_session',
      resource_id: sessionId,
      details: eventLog.details,
      created_at: new Date().toISOString(),
    });

    log.info('Agent session created', {
      sessionId,
      agentVersion,
      workspaceId,
    });
  } catch (error) {
    log.error('Failed to log session creation', {
      error,
      sessionId,
      workspaceId,
    });
  }
}

/**
 * Log session ended
 */
export async function logSessionEnded(
  sessionId: string,
  workspaceId: string,
  userId: string,
  commandCount: number,
  errorCount: number
): Promise<void> {
  try {
    const eventLog: AgentEventLog = {
      eventType: 'session_ended',
      workspaceId,
      userId,
      details: {
        sessionId,
        commandCount,
        errorCount,
        timestamp: new Date().toISOString(),
      },
    };

    await supabaseAdmin.from('auditLogs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'desktop_agent_session_end',
      resource_type: 'desktop_session',
      resource_id: sessionId,
      details: eventLog.details,
      created_at: new Date().toISOString(),
    });

    // Update session record
    await supabaseAdmin
      .from('desktop_agent_sessions')
      .update({
        status: 'closed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    log.info('Agent session ended', {
      sessionId,
      commandCount,
      errorCount,
      workspaceId,
    });
  } catch (error) {
    log.error('Failed to log session ended', {
      error,
      sessionId,
      workspaceId,
    });
  }
}

/**
 * Log command error
 */
export async function logCommandError(
  commandId: string,
  workspaceId: string,
  userId: string,
  commandName: string,
  errorMessage: string,
  errorStack?: string
): Promise<void> {
  try {
    const eventLog: AgentEventLog = {
      eventType: 'error',
      workspaceId,
      userId,
      details: {
        commandId,
        commandName,
        errorMessage,
        errorStack,
        timestamp: new Date().toISOString(),
      },
    };

    // Log to audit logs
    await supabaseAdmin.from('auditLogs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      action: 'desktop_agent_error',
      resource_type: 'desktop_command',
      resource_id: commandId,
      details: eventLog.details,
      created_at: new Date().toISOString(),
    });

    // Update command with error
    await supabaseAdmin
      .from('desktop_agent_commands')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', commandId);

    log.error('Command error logged', {
      commandId,
      commandName,
      errorMessage,
      workspaceId,
    });
  } catch (error) {
    log.error('Failed to log command error', {
      error,
      commandId,
      commandName,
      workspaceId,
    });
  }
}

/**
 * Get activity log for workspace
 */
export async function getActivityLog(
  workspaceId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('auditLogs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .filter('action', 'like', 'desktop_agent%')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      log.error('Failed to get activity log', { error, workspaceId });
      return [];
    }

    return logs || [];
  } catch (error) {
    log.error('Exception getting activity log', { error, workspaceId });
    return [];
  }
}

/**
 * Get command history for workspace
 */
export async function getCommandHistory(workspaceId: string, limit: number = 50) {
  try {
    const { data: commands, error } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      log.error('Failed to get command history', { error, workspaceId });
      return [];
    }

    return commands || [];
  } catch (error) {
    log.error('Exception getting command history', { error, workspaceId });
    return [];
  }
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(workspaceId: string) {
  try {
    const { data: commands, error } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      log.error('Failed to get pending approvals', { error, workspaceId });
      return [];
    }

    return commands || [];
  } catch (error) {
    log.error('Exception getting pending approvals', { error, workspaceId });
    return [];
  }
}
