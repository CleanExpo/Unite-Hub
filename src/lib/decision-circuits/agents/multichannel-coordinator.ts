/**
 * Multi-Channel Coordinator Agent (AGENT_MULTICHANNEL_COORDINATOR)
 * Orchestration-only agent for coordinating Email and Social execution agents
 * v1.5.0: Unified workflow orchestration with circuit binding, suppression logic, and metrics aggregation
 */

import { getSupabaseServer } from '@/lib/supabase';
import { executeCircuit, CircuitExecutionContext } from '../executor';
import { executeAutoCorrection } from '../autonomy';
import {
  executeEmailSending,
  validateCircuitBinding,
  type EmailExecutorInput,
  type EmailExecutorOutput,
} from './email-executor';
import {
  executeSocialPublishing,
  type SocialExecutorInput,
  type SocialExecutorOutput,
} from './social-executor';

/**
 * Input to multi-channel orchestration
 */
export interface MultiChannelInput {
  circuit_execution_id: string; // MANDATORY - shared across all agents in workflow
  workspace_id: string; // Multi-tenant isolation
  client_id: string; // Links to contacts
  flow_id: 'EMAIL_THEN_SOCIAL' | 'SOCIAL_THEN_EMAIL' | 'EMAIL_ONLY' | 'SOCIAL_ONLY'; // Orchestration flow
  email?: {
    recipient: string; // Email address (from CRM or override)
    final_asset: EmailExecutorInput['final_asset'];
  };
  social?: {
    platform: 'facebook' | 'instagram' | 'linkedin'; // Single platform per execution
    final_asset: SocialExecutorInput['final_asset'];
  };
}

/**
 * Output from multi-channel orchestration
 */
export interface MultiChannelOutput {
  success: boolean;
  flow_id: string;
  email_result?: EmailExecutorOutput;
  social_result?: SocialExecutorOutput;
  metrics_summary?: {
    email_sent: boolean;
    social_published: boolean;
    total_reach: number; // Placeholder for aggregated metrics
  };
  error?: string;
}

/**
 * Check if recipient is suppressed across unified suppression list
 */
export async function checkUnifiedSuppression(
  recipient: string,
  platform: string,
  workspaceId: string
): Promise<{ suppressed: boolean; reason?: string }> {
  const supabase = getSupabaseServer();

  try {
    // Check email suppression list (bounced, complained, unsubscribed)
    const { data: emailSuppression, error: emailSuppressionError } = await supabase
      .from('email_suppression_list')
      .select('reason')
      .eq('workspace_id', workspaceId)
      .eq('email', recipient.toLowerCase())
      .single();

    if (emailSuppressionError && emailSuppressionError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable)
      console.warn('Email suppression check failed:', emailSuppressionError);
    }

    if (emailSuppression) {
      return {
        suppressed: true,
        reason: `email_${emailSuppression.reason}`,
      };
    }

    // Check social platform blocks (future: synthex_social_accounts.blocked_users)
    // For now, platform suppression not implemented
    // return { suppressed: false };

    return { suppressed: false };
  } catch (error) {
    throw new Error(
      `Failed to check unified suppression: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Aggregate engagement metrics from both email and social agents
 */
export async function aggregateMetrics(
  circuitExecutionId: string,
  workspaceId: string
): Promise<{
  email_metrics?: EmailExecutorOutput['engagement_metrics'];
  social_metrics?: SocialExecutorOutput['engagement_metrics'];
  cross_channel_engagement_rate: number;
}> {
  const supabase = getSupabaseServer();

  try {
    // Query email metrics
    const { data: emailMetrics, error: emailMetricsError } = await supabase
      .from('email_agent_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('circuit_execution_id', circuitExecutionId)
      .single();

    if (emailMetricsError && emailMetricsError.code !== 'PGRST116') {
      console.warn('Email metrics query failed:', emailMetricsError);
    }

    // Query social metrics
    const { data: socialMetrics, error: socialMetricsError } = await supabase
      .from('social_agent_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('circuit_execution_id', circuitExecutionId)
      .single();

    if (socialMetricsError && socialMetricsError.code !== 'PGRST116') {
      console.warn('Social metrics query failed:', socialMetricsError);
    }

    // Calculate cross-channel engagement rate (placeholder logic)
    // Future: Implement sophisticated cross-channel scoring
    const crossChannelRate = 0;

    return {
      email_metrics: emailMetrics
        ? {
            delivered: emailMetrics.delivered || false,
            bounced: emailMetrics.bounced || false,
            opened: emailMetrics.opened || false,
            clicked: emailMetrics.clicked || false,
            unsubscribed: emailMetrics.unsubscribed || false,
            complained: emailMetrics.complained || false,
          }
        : undefined,
      social_metrics: socialMetrics
        ? {
            impressions: socialMetrics.impressions || 0,
            likes: socialMetrics.likes || 0,
            shares: socialMetrics.shares || 0,
            comments: socialMetrics.comments || 0,
            clicks: socialMetrics.clicks || 0,
          }
        : undefined,
      cross_channel_engagement_rate: crossChannelRate,
    };
  } catch (error) {
    throw new Error(
      `Failed to aggregate metrics: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Execute multi-channel workflow orchestration
 */
export async function executeMultiChannelWorkflow(
  inputs: MultiChannelInput,
  context: CircuitExecutionContext
): Promise<MultiChannelOutput> {
  const supabase = getSupabaseServer();

  // STEP 1: Validate circuit binding (hard fail)
  try {
    const circuitValidation = await validateCircuitBinding(
      inputs.circuit_execution_id,
      inputs.workspace_id
    );

    if (!circuitValidation.valid) {
      throw new Error(
        `Circuit validation failed. Missing circuits: ${circuitValidation.missing.join(', ')}`
      );
    }
  } catch (error) {
    throw new Error(
      `Circuit binding validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // STEP 2: Log orchestration start
  const orchestrationLog = {
    workspace_id: inputs.workspace_id,
    circuit_execution_id: inputs.circuit_execution_id,
    client_id: inputs.client_id,
    flow_id: inputs.flow_id,
    agent_sequence: [] as string[],
    execution_status: 'in_progress',
    started_at: new Date().toISOString(),
  };

  const { data: orchestrationRecord, error: orchestrationInsertError } = await supabase
    .from('multichannel_executions')
    .insert([orchestrationLog])
    .select()
    .single();

  if (orchestrationInsertError) {
    throw new Error(`Failed to log orchestration start: ${orchestrationInsertError.message}`);
  }

  // STEP 3: Check unified suppression (if email provided)
  if (inputs.email && inputs.email.recipient) {
    try {
      const suppression = await checkUnifiedSuppression(
        inputs.email.recipient,
        inputs.social?.platform || 'none',
        inputs.workspace_id
      );

      if (suppression.suppressed) {
        // Update orchestration log with failure
        await supabase
          .from('multichannel_executions')
          .update({
            execution_status: 'failed',
            failure_reason: `Unified suppression: ${suppression.reason}`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', orchestrationRecord.id);

        return {
          success: false,
          flow_id: inputs.flow_id,
          error: `Unified suppression: ${suppression.reason}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      await supabase
        .from('multichannel_executions')
        .update({
          execution_status: 'failed',
          failure_reason: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', orchestrationRecord.id);

      throw new Error(`Suppression check failed: ${errorMessage}`);
    }
  }

  // STEP 4: Execute flow based on flow_id
  let emailResult: EmailExecutorOutput | undefined;
  let socialResult: SocialExecutorOutput | undefined;
  const agentSequence: string[] = [];

  try {
    if (inputs.flow_id === 'EMAIL_THEN_SOCIAL') {
      // Email first
      if (inputs.email) {
        agentSequence.push('AGENT_EMAIL_EXECUTOR');
        emailResult = await executeEmailSending(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            workspace_id: inputs.workspace_id,
            client_id: inputs.client_id,
            recipient: inputs.email.recipient,
            final_asset: inputs.email.final_asset,
          },
          context
        );

        // Conditional: Only run social if email succeeded
        if (!emailResult.sent) {
          throw new Error(`Email failed: ${emailResult.error}`);
        }
      }

      // Social second (conditional on email success)
      if (inputs.social) {
        agentSequence.push('AGENT_SOCIAL_EXECUTOR');
        socialResult = await executeSocialPublishing(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            client_id: inputs.client_id,
            platform: inputs.social.platform,
            final_asset: inputs.social.final_asset,
            publish_time: 'immediate',
          },
          context
        );
      }
    } else if (inputs.flow_id === 'SOCIAL_THEN_EMAIL') {
      // Social first
      if (inputs.social) {
        agentSequence.push('AGENT_SOCIAL_EXECUTOR');
        socialResult = await executeSocialPublishing(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            client_id: inputs.client_id,
            platform: inputs.social.platform,
            final_asset: inputs.social.final_asset,
            publish_time: 'immediate',
          },
          context
        );

        // Conditional: Only run email if social succeeded
        if (!socialResult.published) {
          throw new Error(`Social failed: ${socialResult.error}`);
        }
      }

      // Email second (conditional on social success)
      if (inputs.email) {
        agentSequence.push('AGENT_EMAIL_EXECUTOR');
        emailResult = await executeEmailSending(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            workspace_id: inputs.workspace_id,
            client_id: inputs.client_id,
            recipient: inputs.email.recipient,
            final_asset: inputs.email.final_asset,
          },
          context
        );
      }
    } else if (inputs.flow_id === 'EMAIL_ONLY') {
      // Email only
      if (inputs.email) {
        agentSequence.push('AGENT_EMAIL_EXECUTOR');
        emailResult = await executeEmailSending(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            workspace_id: inputs.workspace_id,
            client_id: inputs.client_id,
            recipient: inputs.email.recipient,
            final_asset: inputs.email.final_asset,
          },
          context
        );
      }
    } else if (inputs.flow_id === 'SOCIAL_ONLY') {
      // Social only
      if (inputs.social) {
        agentSequence.push('AGENT_SOCIAL_EXECUTOR');
        socialResult = await executeSocialPublishing(
          {
            circuit_execution_id: inputs.circuit_execution_id,
            client_id: inputs.client_id,
            platform: inputs.social.platform,
            final_asset: inputs.social.final_asset,
            publish_time: 'immediate',
          },
          context
        );
      }
    }

    // STEP 5: Update orchestration log with success
    await supabase
      .from('multichannel_executions')
      .update({
        agent_sequence: agentSequence,
        execution_status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', orchestrationRecord.id);

    // STEP 6: Aggregate metrics (fetched separately via API endpoint)
    await aggregateMetrics(inputs.circuit_execution_id, inputs.workspace_id);

    return {
      success: true,
      flow_id: inputs.flow_id,
      email_result: emailResult,
      social_result: socialResult,
      metrics_summary: {
        email_sent: emailResult?.sent || false,
        social_published: socialResult?.published || false,
        total_reach: 0, // Placeholder
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // STEP 7: Update orchestration log with failure
    await supabase
      .from('multichannel_executions')
      .update({
        agent_sequence: agentSequence,
        execution_status: 'failed',
        failure_reason: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', orchestrationRecord.id);

    // STEP 8: Trigger CX08_SELF_CORRECTION on failure
    try {
      await executeCircuit(
        'CX08_SELF_CORRECTION',
        {
          circuit_id: 'AGENT_MULTICHANNEL_COORDINATOR',
          failure_reason: errorMessage,
          current_strategy: inputs.flow_id,
          performance_metrics: {
            success_rate: 0,
            agents_executed: agentSequence,
          },
        },
        context,
        executeAutoCorrection
      );
    } catch (correctionError) {
      console.error('Failed to trigger self-correction:', correctionError);
    }

    return {
      success: false,
      flow_id: inputs.flow_id,
      email_result: emailResult,
      social_result: socialResult,
      error: errorMessage,
    };
  }
}
