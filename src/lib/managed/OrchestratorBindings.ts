/**
 * Orchestrator Bindings
 *
 * Direct bindings to Claude Orchestrator for executing managed service tasks.
 * Routes task execution to specialized agent profiles.
 *
 * Agent Profiles:
 * - ServiceOrchestratorAgent: Master coordinator
 * - SeoExecutionAgent: SEO operations
 * - ContentAndSocialAgent: Content creation
 * - ReportingAgent: Report generation
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import { createApiLogger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const logger = createApiLogger({ context: 'OrchestratorBindings' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'thinking-2025-11-15,prompt-caching-2024-07-31',
  },
});

interface TaskExecutionRequest {
  projectId: string;
  taskId: string;
  taskName: string;
  taskType: string;
  description: string;
  requiredInputs: Record<string, any>;
  expectedOutputs: Record<string, any>;
}

interface TaskExecutionResult {
  taskId: string;
  status: 'completed' | 'failed' | 'blocked';
  output: Record<string, any>;
  error?: string;
  executionTime: number;
}

/**
 * Route task to appropriate agent based on task type
 */
function selectAgentForTask(taskType: string): string {
  switch (taskType) {
    case 'analysis':
    case 'optimization':
      return 'SeoExecutionAgent';
    case 'content_creation':
      return 'ContentAndSocialAgent';
    case 'reporting':
      return 'ReportingAgent';
    case 'monitoring':
      return 'ServiceOrchestratorAgent';
    default:
      return 'ServiceOrchestratorAgent';
  }
}

/**
 * Build system prompt for task execution
 */
function buildSystemPrompt(task: TaskExecutionRequest, agent: string): string {
  const baseContext = `You are a ${agent} specialized in autonomous task execution for managed services.

Your role is to execute this task autonomously:
- Task: ${task.taskName}
- Description: ${task.description}
- Type: ${task.taskType}

You MUST:
1. Complete the task fully
2. Output results in the expected format
3. Report any blockers or issues
4. Take actions autonomously when possible
5. Log all decisions to the managed service system

You CANNOT:
- Request user confirmation
- Leave tasks incomplete
- Ignore errors silently
- Exceed safety constraints
`;

  if (agent === 'SeoExecutionAgent') {
    return baseContext + `
Additional Context (SEO Agent):
- You have access to DataForSEO and SEMrush APIs
- You can query GSC and GA4 data
- You can recommend optimizations
- You should perform keyword research and ranking tracking
`;
  } else if (agent === 'ContentAndSocialAgent') {
    return baseContext + `
Additional Context (Content Agent):
- You can generate long-form content using Extended Thinking
- You can create social media posts for 8 platforms
- You can coordinate with Gemini 3 for visual generation
- You should ensure content is optimized and on-brand
`;
  } else if (agent === 'ReportingAgent') {
    return baseContext + `
Additional Context (Reporting Agent):
- You compile metrics from GA4, GSC, and project data
- You generate weekly/monthly reports with insights
- You create actionable recommendations
- You should identify trends and patterns
`;
  }

  return baseContext;
}

/**
 * Execute task using Orchestrator agent
 */
export async function executeTaskWithOrchestrator(
  request: TaskExecutionRequest
): Promise<TaskExecutionResult> {
  const startTime = Date.now();

  try {
    logger.info('🤖 Executing task with orchestrator', {
      taskId: request.taskId,
      taskName: request.taskName,
      taskType: request.taskType,
    });

    const agent = selectAgentForTask(request.taskType);
    const systemPrompt = buildSystemPrompt(request, agent);

    // Prepare task details for the AI
    const userPrompt = `
Execute this task:

Task Name: ${request.taskName}
Task Type: ${request.taskType}
Description: ${request.description}

Required Inputs Available:
${Object.entries(request.requiredInputs)
  .map(([key, value]) => `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
  .join('\n')}

Expected Outputs:
${Object.entries(request.expectedOutputs)
  .map(([key, _]) => `- ${key}: (required)`)
  .join('\n')}

Please execute this task fully and provide output in JSON format matching the expected outputs above.
`;

    // Call Claude with Extended Thinking for complex tasks
    const useExtendedThinking = ['analysis', 'optimization', 'content_creation'].includes(
      request.taskType
    );

    const messageParams: any = {
      model: 'claude-opus-4-5-20251101',
      max_tokens: useExtendedThinking ? 16000 : 4096,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };

    // Use Extended Thinking for complex reasoning tasks
    if (useExtendedThinking) {
      messageParams.thinking = {
        type: 'enabled',
        budget_tokens: 10000,
      };
    }

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create(messageParams);
    });

    const response = result.data;

    // Log cache performance
    const cacheStats = extractCacheStats(response, 'claude-opus-4-5-20251101');
    logCacheStats(`OrchestratorBindings:executeTask:${agent}`, cacheStats);

    // Extract output from response
    let taskOutput: Record<string, any> = {};
    let responseText = '';

    for (const block of response.content) {
      if (block.type === 'text') {
        responseText = block.text;
      }
    }

    // Try to parse JSON from response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        taskOutput = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, store raw response
      taskOutput = { raw_response: responseText };
    }

    const executionTime = Date.now() - startTime;

    logger.info('✅ Task execution successful', {
      taskId: request.taskId,
      agent,
      executionTime,
    });

    // Store result in database
    await storeTaskResult(request.projectId, request.taskId, 'completed', taskOutput);

    return {
      taskId: request.taskId,
      status: 'completed',
      output: taskOutput,
      executionTime,
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error('❌ Task execution failed', {
      taskId: request.taskId,
      error,
      executionTime,
    });

    // Store error result
    await storeTaskResult(
      request.projectId,
      request.taskId,
      'failed',
      {},
      error instanceof Error ? error.message : 'Unknown error'
    );

    return {
      taskId: request.taskId,
      status: 'failed',
      output: {},
      error: error instanceof Error ? error.message : 'Task execution failed',
      executionTime,
    };
  }
}

/**
 * Store task result in database
 */
async function storeTaskResult(
  projectId: string,
  taskId: string,
  status: 'completed' | 'failed' | 'blocked',
  output: Record<string, any>,
  errorMessage?: string
) {
  const supabase = getSupabaseAdmin();

  try {
    await supabase
      .from('managed_service_tasks')
      .update({
        status,
        output_data: output,
        error_message: errorMessage,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    logger.info('✅ Task result stored', { taskId, status });

  } catch (error) {
    logger.error('⚠️ Failed to store task result', { taskId, error });
  }
}

/**
 * Execute all pending tasks for a project
 */
export async function executePendingTasks(projectId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  try {
    // Get pending tasks
    const { data: tasks, error } = await supabase
      .from('managed_service_tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .order('priority DESC, due_date ASC');

    if (error || !tasks || tasks.length === 0) {
      logger.info('ℹ️ No pending tasks', { projectId });
      return;
    }

    logger.info('🔄 Executing pending tasks', {
      projectId,
      taskCount: tasks.length,
    });

    // Execute tasks in priority order
    for (const task of tasks) {
      const result = await executeTaskWithOrchestrator({
        projectId,
        taskId: task.id,
        taskName: task.task_name,
        taskType: task.task_type,
        description: task.description,
        requiredInputs: task.required_inputs || {},
        expectedOutputs: task.expected_outputs || {},
      });

      if (result.status === 'completed') {
        logger.info('✅ Task completed', { taskId: task.id });
      } else {
        logger.warn('⚠️ Task failed', { taskId: task.id, error: result.error });
      }

      // Small delay between tasks to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('✅ All pending tasks processed', { projectId });

  } catch (error) {
    logger.error('❌ Error executing pending tasks', { projectId, error });
  }
}

/**
 * Get task execution status
 */
export async function getTaskStatus(taskId: string) {
  const supabase = getSupabaseAdmin();

  const { data: task, error } = await supabase
    .from('managed_service_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    logger.error('❌ Failed to get task status', { taskId, error });
    return null;
  }

  return {
    id: task.id,
    name: task.task_name,
    status: task.status,
    type: task.task_type,
    priority: task.priority,
    dueDate: task.due_date,
    completedAt: task.completed_at,
    output: task.output_data,
    error: task.error_message,
  };
}

/**
 * Sync task status with orchestrator
 */
export async function syncTaskWithOrchestrator(taskId: string) {
  const status = await getTaskStatus(taskId);

  if (!status) {
    logger.warn('⚠️ Task not found for sync', { taskId });
    return null;
  }

  logger.info('📡 Syncing task with orchestrator', {
    taskId,
    status: status.status,
  });

  // Log to audit trail
  const supabase = getSupabaseAdmin();
  await supabase
    .from('auditLogs')
    .insert({
      event: 'task_status_sync',
      details: status,
      timestamp: new Date().toISOString(),
    })
    .catch(err => logger.warn('⚠️ Could not log sync', { err }));

  return status;
}

/**
 * Execute ProjectCreationEngine from orchestrator
 */
export async function orchestrateProjectCreation(input: any) {
  try {
    const { createManagedServiceProject } = await import('./ProjectCreationEngine');

    logger.info('🔨 Orchestrator calling ProjectCreationEngine', {
      projectName: input.clientName,
      serviceType: input.serviceType,
    });

    const result = await createManagedServiceProject(input);

    return {
      success: result.success,
      projectId: result.projectId,
      message: result.message,
      error: result.error,
    };
  } catch (error) {
    logger.error('❌ ProjectCreationEngine execution failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute SEOBaselineEngine from orchestrator
 */
export async function orchestrateSEOBaseline(input: any) {
  try {
    const { runSEOBaseline } = await import('./SEOBaselineEngine');

    logger.info('🔍 Orchestrator calling SEOBaselineEngine', {
      projectId: input.projectId,
      websiteUrl: input.websiteUrl,
    });

    const result = await runSEOBaseline(input);

    return {
      success: result.success,
      metrics: result.metrics,
      rankings: result.rankings,
      domainMetrics: result.domainMetrics,
      competitors: result.competitors,
      error: result.error,
    };
  } catch (error) {
    logger.error('❌ SEOBaselineEngine execution failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute ReportGenerationEngine from orchestrator
 */
export async function orchestrateReportGeneration(input: any) {
  try {
    const { generateWeeklyReport } = await import('./ReportGenerationEngine');

    logger.info('📊 Orchestrator calling ReportGenerationEngine', {
      projectId: input.projectId,
      reportType: input.reportType,
    });

    const result = await generateWeeklyReport(
      input.projectId,
      input.startDate,
      input.endDate
    );

    return {
      success: result.success,
      reportId: result.reportId,
      reportUrl: result.reportUrl,
      metricsCount: result.metricsCount,
      error: result.error,
    };
  } catch (error) {
    logger.error('❌ ReportGenerationEngine execution failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute No Bluff Protocol SEO/GEO Engine from orchestrator
 */
export async function orchestrateNoBluffAnalysis(input: any) {
  try {
    const { runNoBluffAnalysis, generateNoBluffReport, generateImplementationRoadmap } = await import('./NoBluffProtocolEngine');

    logger.info('🔥 Orchestrator calling No Bluff Protocol Engine', {
      projectId: input.projectId,
      websiteUrl: input.websiteUrl,
      geoTargets: input.targetGeography?.length || 0,
    });

    const analysis = await runNoBluffAnalysis(
      input.projectId,
      input.websiteUrl,
      input.targetGeography || [],
      input.competitors || [],
      input.depth || 'standard'
    );

    if (!analysis.success || !analysis.analysis) {
      return {
        success: false,
        error: analysis.error,
      };
    }

    // Generate report
    const reportResult = await generateNoBluffReport(analysis.analysis);

    // Generate roadmap
    const roadmap = generateImplementationRoadmap(analysis.analysis);

    return {
      success: reportResult.success,
      reportId: reportResult.reportId,
      analysisData: {
        keywords: analysis.analysis.keywords,
        contentGaps: analysis.analysis.contentGaps.length,
        quickWins: analysis.analysis.quickWins.length,
        recommendations: analysis.analysis.recommendations.length,
        metrics: analysis.analysis.metrics,
      },
      roadmap,
      error: reportResult.error,
    };
  } catch (error) {
    logger.error('❌ No Bluff Protocol execution failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute Blue Ocean Strategy Engine from orchestrator
 */
export async function orchestrateBlueOceanStrategy(input: any) {
  try {
    const { generateBlueOceanStrategy, saveBlueOceanStrategy } = await import('./BlueOceanStrategyEngine');

    logger.info('🌊 Orchestrator calling Blue Ocean Strategy Engine', {
      projectId: input.projectId,
      businessName: input.businessName,
      industry: input.industry,
    });

    const strategy = await generateBlueOceanStrategy({
      businessName: input.businessName,
      industry: input.industry,
      targetAudience: input.targetAudience,
      currentChallenges: input.currentChallenges || [],
      existingCompetitors: input.existingCompetitors || [],
      desiredOutcome: input.desiredOutcome,
      budgetRange: input.budgetRange,
    });

    if (!strategy.success || !strategy.strategy) {
      return {
        success: false,
        error: strategy.error,
      };
    }

    // Attach projectId for database persistence
    const strategyWithProject = {
      ...strategy.strategy,
      projectId: input.projectId,
    };

    // Save strategy
    const saveResult = await saveBlueOceanStrategy(strategyWithProject);

    return {
      success: saveResult.success,
      strategyId: saveResult.strategyId,
      strategyData: {
        businessName: strategy.strategy.businessName,
        newCategoryName: strategy.strategy.newCategoryName,
        categoryDescription: strategy.strategy.categoryDescription,
        defensibilityScore: strategy.strategy.defensibilityScore,
        marketOpportunitySizeEstimate: strategy.strategy.marketOpportunitySizeEstimate,
        executionPhases: strategy.strategy.executionSteps.length,
        strategicAdvantages: strategy.strategy.strategicAdvantages.length,
      },
      subAgentRouting: strategy.strategy.subAgentRouting,
      error: saveResult.error,
    };
  } catch (error) {
    logger.error('❌ Blue Ocean Strategy execution failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
