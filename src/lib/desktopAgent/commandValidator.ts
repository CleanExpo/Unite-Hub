/**
 * Command Validator - Security Sandbox
 *
 * Validates desktop agent commands against:
 * - Allowed commands list
 * - Capability matrix
 * - Workspace restrictions
 * - Founder approvals
 * - Rate limiting
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { log } from '@/lib/logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  requiresApproval: boolean;
  riskScore: number;
}

const ALLOWED_COMMANDS = [
  'click',
  'doubleClick',
  'typeText',
  'pressKey',
  'moveMouse',
  'scroll',
  'openApp',
  'focusWindow',
  'navigateUrl',
  'closeApp',
  'getScreenshot',
  'getClipboard',
  'setClipboard',
];

const HIGH_RISK_COMMANDS = [
  'shell_execute',
  'file_write',
  'file_delete',
  'system_settings_change',
];

const COMMAND_RISK_LEVELS: Record<string, number> = {
  click: 5,
  doubleClick: 5,
  typeText: 10,
  pressKey: 5,
  moveMouse: 5,
  scroll: 5,
  openApp: 30,
  focusWindow: 10,
  navigateUrl: 25,
  closeApp: 30,
  getScreenshot: 15,
  getClipboard: 20,
  setClipboard: 20,
};

/**
 * Validate desktop agent command
 */
export async function validateCommand(
  commandName: string,
  parameters: Record<string, any>,
  workspaceId: string,
  userId: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let requiresApproval = false;
  let riskScore = 0;

  // 1. Check if command is in allowed list
  if (!ALLOWED_COMMANDS.includes(commandName)) {
    if (HIGH_RISK_COMMANDS.includes(commandName)) {
      errors.push(`Command '${commandName}' is blocked (high-risk)`);
      riskScore += 100;
    } else {
      errors.push(`Command '${commandName}' is not in allowed list`);
    }
  }

  // 2. Validate parameters
  const paramErrors = validateParameters(commandName, parameters);
  errors.push(...paramErrors);

  // 3. Check capability is enabled for workspace
  try {
    const { data: capability, error: capError } = await supabaseAdmin
      .rpc('get_agent_capabilities', { p_workspace_id: workspaceId })
      .eq('command_name', commandName)
      .maybeSingle();

    if (capError || !capability) {
      warnings.push(`Capability '${commandName}' not found or disabled for this workspace`);
      riskScore += 20;
    } else {
      // Check if approval required
      if (capability.requires_approval) {
        requiresApproval = true;
      }

      // Add risk based on capability level
      if (capability.risk_level === 'high') {
        riskScore += 40;
        requiresApproval = true;
      } else if (capability.risk_level === 'critical') {
        riskScore += 60;
        requiresApproval = true;
        errors.push(`Command '${commandName}' is critical-risk and requires special approval`);
      } else if (capability.risk_level === 'medium') {
        riskScore += 20;
      }
    }
  } catch (error) {
    log.error('Failed to check capability', { error, commandName, workspaceId });
    errors.push('Failed to validate command capability');
  }

  // 4. Check user permissions
  try {
    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq(
        'org_id',
        (
          await supabaseAdmin.from('workspaces').select('org_id').eq('id', workspaceId).maybeSingle()
        ).data?.org_id
      )
      .maybeSingle();

    if (orgError || !userOrg) {
      errors.push('User does not have access to this workspace');
    } else if (userOrg.role !== 'owner') {
      errors.push('Only workspace owners can execute desktop agent commands');
    }
  } catch (error) {
    log.error('Failed to check user permissions', { error, userId, workspaceId });
    errors.push('Failed to validate user permissions');
  }

  // 5. Check rate limiting
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { count: commandCount, error: countError } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .gt('created_at', oneDayAgo.toISOString());

    if (!countError && commandCount && commandCount > 1000) {
      warnings.push('Workspace is approaching daily command limit (1000 commands)');
    }
  } catch (error) {
    log.warn('Failed to check rate limiting', { error, workspaceId });
  }

  // 6. Add base risk from command type
  riskScore += COMMAND_RISK_LEVELS[commandName] || 0;

  // Final validation
  const valid = errors.length === 0;

  if (!valid) {
    log.warn('Command validation failed', {
      commandName,
      errors,
      workspaceId,
      userId,
    });
  }

  return {
    valid,
    errors,
    warnings,
    requiresApproval: valid && requiresApproval,
    riskScore: Math.min(riskScore, 100),
  };
}

/**
 * Validate command parameters
 */
function validateParameters(commandName: string, parameters: Record<string, any>): string[] {
  const errors: string[] = [];

  switch (commandName) {
    case 'click':
    case 'doubleClick':
    case 'moveMouse':
      if (typeof parameters.x !== 'number' || typeof parameters.y !== 'number') {
        errors.push(`Command '${commandName}' requires numeric x and y coordinates`);
      }
      break;

    case 'typeText':
      if (typeof parameters.text !== 'string') {
        errors.push("Command 'typeText' requires text parameter");
      }
      break;

    case 'pressKey':
      if (typeof parameters.key !== 'string') {
        errors.push("Command 'pressKey' requires key parameter");
      }
      break;

    case 'scroll':
      if (!['up', 'down', 'left', 'right'].includes(parameters.direction)) {
        errors.push("Command 'scroll' requires direction (up/down/left/right)");
      }
      if (typeof parameters.amount !== 'number') {
        errors.push("Command 'scroll' requires numeric amount");
      }
      break;

    case 'openApp':
    case 'closeApp':
      if (typeof parameters.appName !== 'string') {
        errors.push(`Command '${commandName}' requires appName parameter`);
      }
      break;

    case 'navigateUrl':
      if (typeof parameters.url !== 'string') {
        errors.push("Command 'navigateUrl' requires url parameter");
      }
      try {
        new URL(parameters.url);
      } catch {
        errors.push('Invalid URL format');
      }
      break;

    case 'focusWindow':
      if (typeof parameters.windowName !== 'string') {
        errors.push("Command 'focusWindow' requires windowName parameter");
      }
      break;

    case 'setClipboard':
      if (typeof parameters.text !== 'string') {
        errors.push("Command 'setClipboard' requires text parameter");
      }
      break;
  }

  return errors;
}

/**
 * Check if command requires founder approval
 */
export async function requiresApproval(
  commandName: string,
  workspaceId: string
): Promise<boolean> {
  try {
    const { data: capability, error } = await supabaseAdmin
      .rpc('get_agent_capabilities', { p_workspace_id: workspaceId })
      .eq('command_name', commandName)
      .maybeSingle();

    if (error || !capability) {
      return true; // Default to requiring approval if capability not found
    }

    return capability.requires_approval || capability.risk_level === 'high' || capability.risk_level === 'critical';
  } catch {
    return true; // Default to requiring approval on error
  }
}

/**
 * Check if approval is granted for a command
 */
export async function isApproved(commandId: string): Promise<boolean> {
  try {
    const { data: command, error } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('approval_status')
      .eq('id', commandId)
      .maybeSingle();

    if (error || !command) {
      return false;
    }

    return command.approval_status === 'approved' || command.approval_status === 'auto_approved';
  } catch {
    return false;
  }
}

/**
 * Get pending approvals for a workspace
 */
export async function getPendingApprovals(workspaceId: string) {
  try {
    const { data: commands, error } = await supabaseAdmin
      .from('desktop_agent_commands')
      .select('id, command_name, parameters, created_at, user_id, risk_score')
      .eq('workspace_id', workspaceId)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

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
