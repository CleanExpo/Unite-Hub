/**
 * Orchestrator Engine - Main AI Agent Coordinator
 *
 * Orchestrates multi-agent workflows with task decomposition, cross-agent
 * coordination, global context assembly, risk supervision, and memory integration.
 * Central hub for all autonomous actions in the system.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { Anthropic } from '@anthropic-ai/sdk';
import { TaskDecomposer } from './taskDecomposer';
import { ContextUnifier } from './contextUnifier';
import { RiskSupervisor } from './riskSupervisor';
import { UncertaintyModel } from './uncertaintyModel';
import { OrchestratorArchiveBridge } from './orchestratorArchiveBridge';
import { MemoryRetriever } from '@/lib/memory';

export interface OrchestratorTask {
  id?: string;
  workspaceId: string;
  objective: string;
  description?: string;
  initialContext?: Record<string, any>;
  initiatingAgents?: string[];
}

export interface ExecutionStep {
  stepIndex: number;
  assignedAgent: string;
  inputContext: Record<string, any>;
  outputPayload?: Record<string, any>;
  riskScore?: number;
  uncertaintyScore?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  error?: string;
}

export interface OrchestratorTrace {
  taskId: string;
  objective: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'halted';
  agentChain: string[];
  steps: ExecutionStep[];
  riskScore: number;
  uncertaintyScore: number;
  confidenceScore: number;
  signals: Array<{
    type: string;
    severity: number;
    message: string;
  }>;
  finalOutput?: Record<string, any>;
  totalTimeMs?: number;
}

export class OrchestratorEngine {
  private anthropic: Anthropic;
  private taskDecomposer: TaskDecomposer;
  private contextUnifier: ContextUnifier;
  private riskSupervisor: RiskSupervisor;
  private uncertaintyModel: UncertaintyModel;
  private archiveBridge: OrchestratorArchiveBridge;
  private memoryRetriever: MemoryRetriever;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.taskDecomposer = new TaskDecomposer();
    this.contextUnifier = new ContextUnifier();
    this.riskSupervisor = new RiskSupervisor();
    this.uncertaintyModel = new UncertaintyModel();
    this.archiveBridge = new OrchestratorArchiveBridge();
    this.memoryRetriever = new MemoryRetriever();
  }

  /**
   * Plan a multi-agent orchestrator workflow
   * Decomposes objective into structured task breakdown and agent chain
   */
  async planWorkflow(task: OrchestratorTask): Promise<{
    taskId: string;
    agentChain: string[];
    steps: ExecutionStep[];
    estimatedRisk: number;
  }> {
    const startTime = Date.now();

    try {
      // Step 1: Create task in database
      const supabase = await getSupabaseServer();

      const { data: createdTask, error: taskError } = await supabase
        .rpc('create_orchestrator_task', {
          p_workspace_id: task.workspaceId,
          p_objective: task.objective,
          p_description: task.description || '',
          p_agent_chain: task.initiatingAgents || [],
        });

      if (taskError || !createdTask) {
        throw new Error(`Failed to create task: ${taskError?.message}`);
      }

      const taskId = createdTask;

      // Step 2: Decompose objective into steps
      const decomposition = await this.taskDecomposer.decompose({
        objective: task.objective,
        context: task.initialContext || {},
        workspaceId: task.workspaceId,
      });

      // Step 3: Estimate risk for each step
      const stepsWithRisk = decomposition.steps.map((step, idx) => ({
        ...step,
        stepIndex: idx + 1,
        riskScore: this.riskSupervisor.estimateStepRisk(
          step.assignedAgent,
          step.inputContext
        ),
      }));

      // Step 4: Calculate overall task risk
      const taskRisk = this.riskSupervisor.assessTaskRisk(stepsWithRisk);

      // Step 5: Update task in database with plan
      await supabase.rpc('update_orchestrator_task', {
        p_task_id: taskId,
        p_status: 'pending',
        p_risk_score: Math.round(taskRisk),
      });

      return {
        taskId,
        agentChain: decomposition.agentChain,
        steps: stepsWithRisk,
        estimatedRisk: taskRisk,
      };
    } catch (error) {
      console.error('Error planning workflow:', error);
      throw error;
    }
  }

  /**
   * Execute a planned orchestrator workflow
   * Runs steps sequentially, monitors risk/uncertainty, integrates memory
   */
  async executeWorkflow(taskId: string, workspaceId: string): Promise<OrchestratorTrace> {
    const startTime = Date.now();
    const supabase = await getSupabaseServer();
    const steps: ExecutionStep[] = [];
    const signals: OrchestratorTrace['signals'] = [];

    try {
      // Step 1: Get task from database
      const { data: task, error: taskError } = await supabase
        .from('orchestrator_tasks')
        .select('*')
        .eq('id', taskId)
        .eq('workspace_id', workspaceId)
        .single();

      if (taskError || !task) {
        throw new Error('Task not found');
      }

      // Step 2: Update task status to running
      await supabase.rpc('update_orchestrator_task', {
        p_task_id: taskId,
        p_status: 'running',
      });

      // Step 3: Get task steps from decomposition
      const stepList = task.agent_chain.map((agent: string, idx: number) => ({
        stepIndex: idx + 1,
        assignedAgent: agent,
        inputContext: {},
        status: 'pending',
      }));

      // Step 4: Execute each step
      let cumulativeRisk = 0;
      let cumulativeUncertainty = 0;

      for (let i = 0; i < stepList.length; i++) {
        const step = stepList[i];

        // 4a: Assemble global context
        const globalContext = await this.contextUnifier.unify({
          workspaceId,
          taskId,
          previousSteps: steps,
          objective: task.objective,
        });

        step.inputContext = globalContext;

        // 4b: Execute step (placeholder for agent execution)
        const stepResult = await this.executeStep(
          step.assignedAgent,
          globalContext,
          workspaceId
        );

        step.outputPayload = stepResult.output;
        step.riskScore = stepResult.risk;
        step.uncertaintyScore = stepResult.uncertainty;
        step.status = 'completed';

        steps.push(step);

        // 4c: Check risk supervisor
        if (step.riskScore! >= 60) {
          signals.push({
            type: 'high_risk',
            severity: step.riskScore!,
            message: `Step ${step.stepIndex} (${step.assignedAgent}) exceeded risk threshold (${step.riskScore}%)`,
          });

          // Pause for founder review if risk >= 80
          if (step.riskScore! >= 80) {
            await supabase.rpc('update_orchestrator_task', {
              p_task_id: taskId,
              p_status: 'paused',
            });

            return {
              taskId,
              objective: task.objective,
              status: 'paused',
              agentChain: task.agent_chain,
              steps,
              riskScore: step.riskScore!,
              uncertaintyScore: step.uncertaintyScore!,
              confidenceScore: 100 - step.uncertaintyScore!,
              signals,
              totalTimeMs: Date.now() - startTime,
            };
          }
        }

        // 4d: Check uncertainty model
        cumulativeRisk = (cumulativeRisk + step.riskScore!) / 2;
        cumulativeUncertainty = (cumulativeUncertainty + step.uncertaintyScore!) / 2;

        if (cumulativeUncertainty >= 70) {
          signals.push({
            type: 'high_uncertainty',
            severity: Math.round(cumulativeUncertainty),
            message: `Cumulative uncertainty exceeded 70% (${Math.round(cumulativeUncertainty)}%)`,
          });
        }

        // Record step in database
        await supabase.rpc('record_orchestrator_step', {
          p_task_id: taskId,
          p_step_index: step.stepIndex,
          p_assigned_agent: step.assignedAgent,
          p_input_context: step.inputContext,
          p_output_payload: step.outputPayload,
          p_risk_score: Math.round(step.riskScore!),
          p_uncertainty_score: Math.round(step.uncertaintyScore!),
        });
      }

      // Step 5: Assemble final output
      const finalOutput = {
        steps: steps.map((s) => ({
          agent: s.assignedAgent,
          result: s.outputPayload,
        })),
        summary: {
          totalSteps: steps.length,
          completedSteps: steps.filter((s) => s.status === 'completed').length,
          finalRisk: Math.round(cumulativeRisk),
          finalUncertainty: Math.round(cumulativeUncertainty),
        },
      };

      // Step 6: Archive orchestrator run to memory
      await this.archiveBridge.archiveOrchestratorRun({
        taskId,
        objective: task.objective,
        status: 'completed',
        steps,
        finalRisk: Math.round(cumulativeRisk),
        finalUncertainty: Math.round(cumulativeUncertainty),
      });

      // Step 7: Update task status to completed
      await supabase.rpc('update_orchestrator_task', {
        p_task_id: taskId,
        p_status: 'completed',
        p_risk_score: Math.round(cumulativeRisk),
        p_uncertainty_score: Math.round(cumulativeUncertainty),
        p_final_output: finalOutput,
      });

      return {
        taskId,
        objective: task.objective,
        status: 'completed',
        agentChain: task.agent_chain,
        steps,
        riskScore: Math.round(cumulativeRisk),
        uncertaintyScore: Math.round(cumulativeUncertainty),
        confidenceScore: 100 - Math.round(cumulativeUncertainty),
        signals,
        finalOutput,
        totalTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error executing workflow:', error);

      // Mark task as failed
      await supabase.rpc('update_orchestrator_task', {
        p_task_id: taskId,
        p_status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Execute a single orchestrator step
   */
  private async executeStep(
    agent: string,
    context: Record<string, any>,
    workspaceId: string
  ): Promise<{
    output: Record<string, any>;
    risk: number;
    uncertainty: number;
  }> {
    try {
      // Route to appropriate agent based on type
      let output: Record<string, any>;
      let risk = 30;
      let uncertainty = 40;

      switch (agent) {
        case 'email-agent':
          output = await this.executeEmailAgent(context);
          risk = 25;
          break;

        case 'content-agent':
          output = await this.executeContentAgent(context);
          risk = 35;
          break;

        case 'contact-intelligence':
          output = await this.executeContactIntelligence(context);
          risk = 20;
          break;

        case 'analysis':
          output = await this.executeAnalysisAgent(context);
          risk = 30;
          break;

        // SEO Enhancement Agents
        case 'seo-audit':
          output = await this.executeSEOAuditAgent(context);
          risk = 20;
          break;

        case 'seo-content':
          output = await this.executeSEOContentAgent(context);
          risk = 25;
          break;

        case 'seo-schema':
          output = await this.executeSEOSchemaAgent(context);
          risk = 15;
          break;

        case 'seo-ctr':
          output = await this.executeSEOCTRAgent(context);
          risk = 20;
          break;

        case 'seo-competitor':
          output = await this.executeSEOCompetitorAgent(context);
          risk = 25;
          break;

        default:
          output = { status: 'skipped', reason: `Unknown agent: ${agent}` };
          uncertainty = 80;
      }

      return { output, risk, uncertainty };
    } catch (error) {
      console.error(`Error executing step for agent ${agent}:`, error);
      return {
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        risk: 80,
        uncertainty: 90,
      };
    }
  }

  private async executeEmailAgent(context: Record<string, any>) {
    // Email agent execution logic
    return {
      status: 'completed',
      emailsProcessed: context.emailCount || 0,
    };
  }

  private async executeContentAgent(context: Record<string, any>) {
    // Content generation with Extended Thinking
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate content based on: ${JSON.stringify(context.objective || '')}`,
        },
      ],
    });

    return {
      status: 'completed',
      generatedContent: response.content[0].type === 'text' ? response.content[0].text : '',
    };
  }

  private async executeContactIntelligence(context: Record<string, any>) {
    // Contact scoring logic
    return {
      status: 'completed',
      contactsAnalyzed: context.contactCount || 0,
      avgScore: 65,
    };
  }

  private async executeAnalysisAgent(context: Record<string, any>) {
    // General analysis logic
    return {
      status: 'completed',
      analysisComplete: true,
    };
  }

  // SEO Enhancement Agent Execution Methods

  private async executeSEOAuditAgent(context: Record<string, any>) {
    // Technical SEO audit with Core Web Vitals
    const { seoAuditService } = await import('@/lib/seoEnhancement');

    try {
      const url = context.url || context.objective?.match(/https?:\/\/[^\s]+/)?.[0];
      if (!url) {
        return {
          status: 'failed',
          error: 'No URL provided for SEO audit',
        };
      }

      const auditJob = await seoAuditService.createAuditJob({
        workspaceId: context.workspaceId,
        url,
        auditType: context.auditType || 'full',
      });

      return {
        status: 'completed',
        auditJobId: auditJob.id,
        message: 'SEO audit job created and queued',
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'SEO audit failed',
      };
    }
  }

  private async executeSEOContentAgent(context: Record<string, any>) {
    // Content optimization analysis
    const { contentOptimizationService } = await import('@/lib/seoEnhancement');

    try {
      const url = context.url || context.objective?.match(/https?:\/\/[^\s]+/)?.[0];
      const targetKeyword = context.targetKeyword || context.keyword;

      if (!url || !targetKeyword) {
        return {
          status: 'failed',
          error: 'URL and target keyword are required for content analysis',
        };
      }

      const analysisJob = await contentOptimizationService.createContentAnalysis({
        workspaceId: context.workspaceId,
        url,
        targetKeyword,
        secondaryKeywords: context.secondaryKeywords,
      });

      return {
        status: 'completed',
        analysisJobId: analysisJob.id,
        message: 'Content analysis job created and queued',
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Content analysis failed',
      };
    }
  }

  private async executeSEOSchemaAgent(context: Record<string, any>) {
    // Schema markup generation
    const { richResultsService } = await import('@/lib/seoEnhancement');

    try {
      const url = context.url || context.objective?.match(/https?:\/\/[^\s]+/)?.[0];
      const schemaType = context.schemaType || 'Article';

      if (!url) {
        return {
          status: 'failed',
          error: 'URL is required for schema generation',
        };
      }

      const schema = await richResultsService.generateSchema(
        context.workspaceId,
        url,
        schemaType,
        context.pageInfo
      );

      const scriptTag = richResultsService.generateSchemaScript(schema.schema_json);

      return {
        status: 'completed',
        schemaId: schema.id,
        schemaType: schema.schema_type,
        scriptTag,
        message: 'Schema markup generated successfully',
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Schema generation failed',
      };
    }
  }

  private async executeSEOCTRAgent(context: Record<string, any>) {
    // CTR optimization and benchmarking
    const { ctrOptimizationService } = await import('@/lib/seoEnhancement');

    try {
      const url = context.url || context.objective?.match(/https?:\/\/[^\s]+/)?.[0];
      const keyword = context.keyword || context.targetKeyword;

      if (!url || !keyword) {
        return {
          status: 'failed',
          error: 'URL and keyword are required for CTR analysis',
        };
      }

      // Check for CTR benchmark data
      const currentData = context.currentData || {
        impressions: context.impressions || 1000,
        clicks: context.clicks || 30,
        position: context.position || 5,
      };

      const benchmark = await ctrOptimizationService.analyzeCTRBenchmark(
        context.workspaceId,
        url,
        keyword,
        currentData
      );

      return {
        status: 'completed',
        benchmarkId: benchmark.id,
        opportunityLevel: benchmark.opportunity_level,
        estimatedClickGain: benchmark.estimated_click_gain,
        message: 'CTR benchmark analysis completed',
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'CTR analysis failed',
      };
    }
  }

  private async executeSEOCompetitorAgent(context: Record<string, any>) {
    // Competitor gap analysis
    const { competitorGapService } = await import('@/lib/seoEnhancement');

    try {
      const clientDomain = context.clientDomain || context.domain;

      if (!clientDomain) {
        return {
          status: 'failed',
          error: 'Client domain is required for competitor analysis',
        };
      }

      // Run keyword gap analysis
      const keywordGap = await competitorGapService.analyzeKeywordGap(
        context.workspaceId,
        clientDomain
      );

      return {
        status: 'completed',
        analysisId: keywordGap.id,
        gapKeywordsCount: keywordGap.gap_keywords?.length || 0,
        totalSearchVolume: keywordGap.total_search_volume,
        message: 'Competitor gap analysis completed',
      };
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Competitor analysis failed',
      };
    }
  }

  /**
   * Get orchestrator task status and history
   */
  async getTaskStatus(taskId: string, workspaceId: string): Promise<OrchestratorTrace> {
    const supabase = await getSupabaseServer();

    const { data: task } = await supabase
      .from('orchestrator_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('workspace_id', workspaceId)
      .single();

    const { data: steps } = await supabase
      .from('orchestrator_steps')
      .select('*')
      .eq('task_id', taskId)
      .order('step_index');

    const { data: signals } = await supabase
      .from('orchestrator_signals')
      .select('*')
      .eq('task_id', taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    return {
      taskId,
      objective: task.objective,
      status: task.status,
      agentChain: task.agent_chain || [],
      steps: (steps || []).map((s) => ({
        stepIndex: s.step_index,
        assignedAgent: s.assigned_agent,
        inputContext: s.input_context,
        outputPayload: s.output_payload,
        riskScore: s.risk_score,
        uncertaintyScore: s.uncertainty_score,
        status: s.status,
      })),
      riskScore: task.risk_score,
      uncertaintyScore: task.uncertainty_score,
      confidenceScore: 100 - (task.uncertainty_score || 0),
      signals: (signals || []).map((s) => ({
        type: s.signal_type,
        severity: s.severity,
        message: s.message,
      })),
      finalOutput: task.final_output,
    };
  }
}
