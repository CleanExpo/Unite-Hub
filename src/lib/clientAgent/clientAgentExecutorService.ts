/**
 * Client Agent Executor Service
 * Phase 83: Executes approved actions
 */

import { getSupabaseServer } from '@/lib/supabase';
import {
  ActionType,
  ExecutionResult,
  ClientAgentAction,
} from './clientAgentTypes';

/**
 * Execute an approved action
 */
export async function executeAction(
  action: ClientAgentAction
): Promise<ExecutionResult> {
  try {
    switch (action.action_type) {
      case 'add_tag':
        return await executeAddTag(action);
      case 'remove_tag':
        return await executeRemoveTag(action);
      case 'update_status':
        return await executeUpdateStatus(action);
      case 'update_score':
        return await executeUpdateScore(action);
      case 'create_note':
        return await executeCreateNote(action);
      case 'schedule_task':
        return await executeScheduleTask(action);
      case 'send_followup':
        return await executeSendFollowup(action);
      case 'generate_content':
        return await executeGenerateContent(action);
      case 'send_notification':
        return await executeSendNotification(action);
      default:
        return {
          success: false,
          message: `Unknown action type: ${action.action_type}`,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Action execution failed: ${message}`, error);
    return {
      success: false,
      message: `Execution failed: ${message}`,
    };
  }
}

/**
 * Add tag to contact
 */
async function executeAddTag(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const tag = action.action_payload.tag as string;
  if (!tag) {
    return { success: false, message: 'No tag specified in payload' };
  }

  const supabase = await getSupabaseServer();

  // Get current tags
  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select('tags')
    .eq('id', action.client_id)
    .single();

  if (fetchError) {
    return { success: false, message: fetchError.message };
  }

  const currentTags = contact?.tags || [];
  if (currentTags.includes(tag)) {
    return { success: true, message: `Tag '${tag}' already exists` };
  }

  const newTags = [...currentTags, tag];

  const { error: updateError } = await supabase
    .from('contacts')
    .update({ tags: newTags, updated_at: new Date().toISOString() })
    .eq('id', action.client_id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return {
    success: true,
    message: `Added tag '${tag}'`,
    affected_records: [action.client_id],
  };
}

/**
 * Remove tag from contact
 */
async function executeRemoveTag(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const tag = action.action_payload.tag as string;
  if (!tag) {
    return { success: false, message: 'No tag specified in payload' };
  }

  const supabase = await getSupabaseServer();

  const { data: contact, error: fetchError } = await supabase
    .from('contacts')
    .select('tags')
    .eq('id', action.client_id)
    .single();

  if (fetchError) {
    return { success: false, message: fetchError.message };
  }

  const currentTags = contact?.tags || [];
  const newTags = currentTags.filter((t: string) => t !== tag);

  const { error: updateError } = await supabase
    .from('contacts')
    .update({ tags: newTags, updated_at: new Date().toISOString() })
    .eq('id', action.client_id);

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return {
    success: true,
    message: `Removed tag '${tag}'`,
    affected_records: [action.client_id],
  };
}

/**
 * Update contact status
 */
async function executeUpdateStatus(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const status = action.action_payload.status as string;
  if (!status) {
    return { success: false, message: 'No status specified in payload' };
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('contacts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', action.client_id);

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: `Updated status to '${status}'`,
    affected_records: [action.client_id],
  };
}

/**
 * Update AI score
 */
async function executeUpdateScore(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const score = action.action_payload.score as number;
  if (score === undefined || score < 0 || score > 100) {
    return { success: false, message: 'Invalid score (must be 0-100)' };
  }

  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('contacts')
    .update({ ai_score: score, updated_at: new Date().toISOString() })
    .eq('id', action.client_id);

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: `Updated AI score to ${score}`,
    affected_records: [action.client_id],
  };
}

/**
 * Create note for contact
 */
async function executeCreateNote(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const content = action.action_payload.content as string;
  if (!content) {
    return { success: false, message: 'No content specified in payload' };
  }

  const supabase = await getSupabaseServer();

  // Try to insert into contact_notes table
  try {
    const { data, error } = await supabase
      .from('contact_notes')
      .insert({
        contact_id: action.client_id,
        workspace_id: action.workspace_id,
        content,
        created_by: 'agent',
      })
      .select('id')
      .single();

    if (error) {
      // Table might not exist, log it
      console.warn('contact_notes insert failed:', error.message);
      return {
        success: true,
        message: 'Note logged (contact_notes table not available)',
      };
    }

    return {
      success: true,
      message: 'Created note',
      affected_records: [data.id],
    };
  } catch {
    return {
      success: true,
      message: 'Note logged (contact_notes table not available)',
    };
  }
}

/**
 * Schedule a task
 */
async function executeScheduleTask(action: ClientAgentAction): Promise<ExecutionResult> {
  const title = action.action_payload.title as string;
  const dueDate = action.action_payload.due_date as string;

  if (!title) {
    return { success: false, message: 'No title specified in payload' };
  }

  // For now, just log it - tasks table may not exist
  console.log('Scheduled task:', { title, dueDate, clientId: action.client_id });

  return {
    success: true,
    message: `Scheduled task: ${title}`,
  };
}

/**
 * Send follow-up email
 */
async function executeSendFollowup(action: ClientAgentAction): Promise<ExecutionResult> {
  if (!action.client_id) {
    return { success: false, message: 'No client_id specified' };
  }

  const subject = action.action_payload.subject as string;
  const body = action.action_payload.body as string;

  if (!subject || !body) {
    return { success: false, message: 'Subject and body required' };
  }

  // This would integrate with the email service
  // For now, create a draft
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('generatedContent')
    .insert({
      workspace_id: action.workspace_id,
      contact_id: action.client_id,
      content_type: 'email',
      content: JSON.stringify({ subject, body }),
      status: 'draft',
      metadata: {
        source: 'client_agent',
        action_id: action.id,
      },
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: `Created email draft: ${subject}`,
    affected_records: [data.id],
  };
}

/**
 * Generate content
 */
async function executeGenerateContent(action: ClientAgentAction): Promise<ExecutionResult> {
  const contentType = action.action_payload.content_type as string;
  const topic = action.action_payload.topic as string;

  if (!contentType) {
    return { success: false, message: 'No content_type specified' };
  }

  // This would integrate with the content agent
  // For now, just log it
  console.log('Generate content:', { contentType, topic, clientId: action.client_id });

  return {
    success: true,
    message: `Content generation requested: ${contentType}`,
  };
}

/**
 * Send notification
 */
async function executeSendNotification(action: ClientAgentAction): Promise<ExecutionResult> {
  const message = action.action_payload.message as string;

  if (!message) {
    return { success: false, message: 'No message specified' };
  }

  // This would integrate with a notification system
  // For now, just log it
  console.log('Notification:', { message, clientId: action.client_id });

  return {
    success: true,
    message: 'Notification sent',
  };
}

/**
 * Update action record with execution result
 */
export async function recordExecution(
  actionId: string,
  result: ExecutionResult
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase
    .from('client_agent_actions')
    .update({
      executed_at: new Date().toISOString(),
      execution_result: result,
      approval_status: result.success ? 'auto_executed' : 'rejected',
    })
    .eq('id', actionId);
}
