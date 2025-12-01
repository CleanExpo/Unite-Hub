/**
 * POST /api/desktop/command
 *
 * Dispatch a desktop agent command
 * Rate limited: 5 requests per minute
 * Requires founder/owner permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';
import { apiRateLimit } from '@/lib/rate-limit';
import { validateCommand, requiresApproval, isApproved } from '@/lib/desktopAgent/commandValidator';
import { createDesktopAgentClient } from '@/lib/desktopAgent/desktopAgentClient';
import { logCommandExecution, logCommandError } from '@/lib/desktopAgent/agentArchiveBridge';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Get auth header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { supabaseBrowser } = await import('@/lib/supabase');
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

    // Parse request body
    const { workspaceId, commandName, parameters } = await req.json();

    if (!workspaceId || !commandName || !parameters) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, commandName, parameters' },
        { status: 400 }
      );
    }

    // Verify founder/owner access
    // First get the org_id from the workspace
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('org_id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!workspace?.org_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: userOrg, error: orgError } = await supabaseAdmin
      .from('user_organizations')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', workspace.org_id)
      .maybeSingle();

    if (orgError || !userOrg || userOrg.role !== 'owner') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate command
    const validation = await validateCommand(commandName, parameters, workspaceId, userId);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Command validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Create command record
    const { data: commandData, error: commandError } = await supabaseAdmin
      .from('desktop_agent_commands')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        command_name: commandName,
        parameters,
        requires_approval: validation.requiresApproval,
        approval_status: validation.requiresApproval ? 'pending' : 'auto_approved',
        status: validation.requiresApproval ? 'queued' : 'queued',
        validation_passed: true,
        risk_score: validation.riskScore,
      })
      .select('id')
      .single();

    if (commandError || !commandData) {
      log.error('Failed to create command record', { commandError, commandName, workspaceId });
      return NextResponse.json({ error: 'Failed to create command' }, { status: 500 });
    }

    const commandId = commandData.id;

    // If approval required, return pending state
    if (validation.requiresApproval) {
      return NextResponse.json(
        {
          success: true,
          commandId,
          status: 'pending_approval',
          message: `Command requires founder approval. Risk score: ${validation.riskScore}/100`,
          requiresApproval: true,
          warnings: validation.warnings,
        },
        { status: 202 } // 202 Accepted (pending)
      );
    }

    // Execute command if no approval needed
    try {
      const startTime = Date.now();

      // Create agent client
      const agentClient = await createDesktopAgentClient({
        workspaceId,
        userId,
        sessionId: crypto.randomUUID(),
        apiKey: process.env.SYNTHEX_AGENT_API_KEY || '',
        agentVersion: '1.0.0',
      });

      // Execute command
      const result = await agentClient.executeCommand({
        commandName,
        parameters,
        timeout: 30000,
      });

      const executionTime = Date.now() - startTime;

      if (result.success) {
        // Log successful execution
        await logCommandExecution(commandId, workspaceId, userId, commandName, parameters, result.result || {}, executionTime);

        return NextResponse.json({
          success: true,
          commandId,
          status: 'completed',
          result: result.result,
          executionTimeMs: executionTime,
        });
      } else {
        // Log error
        await logCommandError(commandId, workspaceId, userId, commandName, result.error || 'Unknown error');

        return NextResponse.json(
          {
            success: false,
            commandId,
            status: 'failed',
            error: result.error,
            executionTimeMs: executionTime,
          },
          { status: 400 }
        );
      }
    } catch (execError) {
      await logCommandError(commandId, workspaceId, userId, commandName, (execError as Error).message, (execError as Error).stack);

      return NextResponse.json(
        {
          success: false,
          commandId,
          status: 'failed',
          error: 'Command execution failed',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    log.error('[/api/desktop/command] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
