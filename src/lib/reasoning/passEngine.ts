/**
 * Pass Engine - Multi-Pass Reasoning Orchestrator
 *
 * Implements a 5-pass reasoning system:
 * 1. Recall Pass - Retrieve relevant memories from knowledge base
 * 2. Analysis Pass - Synthesize and analyze retrieved information
 * 3. Draft Pass - Generate initial output or solution
 * 4. Refinement Pass - Improve and refine the draft
 * 5. Validation Pass - Verify correctness and safety
 *
 * @module lib/reasoning/passEngine
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryRetriever } from '@/lib/memory';
import { ContextAssembler } from './contextAssembler';
import { RiskModel } from './riskModel';
import { UncertaintyPropagator } from './uncertaintyPropagator';
import { Anthropic } from '@anthropic-ai/sdk';

/**
 * Pass types in the multi-pass reasoning system
 */
export type PassType = 'recall' | 'analysis' | 'draft' | 'refinement' | 'validation';

/**
 * Input to a reasoning pass
 */
export interface PassInput {
  /** Context assembled for this pass */
  context: Record<string, any>;

  /** Memories relevant to this pass */
  memoryIds: string[];

  /** Previous pass output (if applicable) */
  previousOutput?: Record<string, any>;

  /** Current risk score */
  riskScore: number;

  /** Current uncertainty score */
  uncertaintyScore: number;
}

/**
 * Output from a reasoning pass
 */
export interface PassOutput {
  /** UUID of this pass */
  passId: string;

  /** Pass type and number */
  passType: PassType;
  passNumber: number;

  /** Generated content */
  generatedContent: Record<string, any>;

  /** Quality metrics */
  uncertainty: number;
  risk: number;
  confidence: number;

  /** Processing metadata */
  processingTimeMs: number;
  tokenCount: number;

  /** Artifacts produced */
  artifacts: Array<{
    type: string;
    content: Record<string, any>;
    qualityScore: number;
  }>;
}

/**
 * Complete reasoning trace through all passes
 */
export interface ReasoningTrace {
  /** Run UUID */
  runId: string;

  /** Agent performing reasoning */
  agent: string;

  /** Original objective */
  objective: string;

  /** Final decision/output */
  finalDecision: Record<string, any>;

  /** Final risk and uncertainty */
  finalRisk: number;
  finalUncertainty: number;

  /** All passes */
  passes: PassOutput[];

  /** Total execution time */
  totalTimeMs: number;
}

/**
 * PassEngine - Orchestrates multi-pass reasoning
 *
 * Implements the 5-pass reasoning system with memory integration,
 * uncertainty propagation, and risk-aware decision modeling.
 */
export class PassEngine {
  private anthropic: Anthropic;
  private memoryRetriever: MemoryRetriever;
  private contextAssembler: ContextAssembler;
  private riskModel: RiskModel;
  private uncertaintyPropagator: UncertaintyPropagator;

  constructor(
    anthropic?: Anthropic,
    retriever?: MemoryRetriever,
    assembler?: ContextAssembler,
    riskModel?: RiskModel,
    propagator?: UncertaintyPropagator
  ) {
    this.anthropic = anthropic || new Anthropic();
    this.memoryRetriever = retriever || new MemoryRetriever();
    this.contextAssembler = assembler || new ContextAssembler();
    this.riskModel = riskModel || new RiskModel();
    this.uncertaintyPropagator = propagator || new UncertaintyPropagator();
  }

  /**
   * Execute Pass 1: Recall relevant memories
   *
   * Retrieves memories from knowledge base that are relevant to the objective.
   * Sets up context for subsequent passes.
   */
  private async executeRecallPass(
    workspaceId: string,
    objective: string,
    initialMemoryIds?: string[]
  ): Promise<PassOutput> {
    const startTime = Date.now();

    // Retrieve relevant memories
    const retrieval = await this.memoryRetriever.retrieve({
      workspaceId,
      query: objective,
      limit: 15,
      minImportance: 30,
      minConfidence: 40,
      includeRelated: true,
    });

    const memoryIds = [
      ...(initialMemoryIds || []),
      ...retrieval.memories.map(m => m.id),
    ];

    // Deduplicate
    const uniqueMemoryIds = Array.from(new Set(memoryIds));

    // Assess initial risk from memories
    const initialRisk = await this.riskModel.assessMemoryRisk(
      workspaceId,
      uniqueMemoryIds
    );

    const processingTime = Date.now() - startTime;

    return {
      passId: `pass-recall-${Date.now()}`,
      passType: 'recall',
      passNumber: 1,
      generatedContent: {
        objectiveApproach: objective,
        memoryCount: uniqueMemoryIds.length,
        totalRelevance: retrieval.memories.reduce((s, m) => s + m.relevanceScore, 0) / Math.max(1, retrieval.memories.length),
      },
      uncertainty: 40, // Initial uncertainty from limited context
      risk: initialRisk,
      confidence: 60,
      processingTimeMs: processingTime,
      tokenCount: 500, // Estimate
      artifacts: [
        {
          type: 'context_packet',
          content: {
            memories: retrieval.memories.slice(0, 5),
            totalCount: uniqueMemoryIds.length,
          },
          qualityScore: 75,
        },
      ],
    };
  }

  /**
   * Execute Pass 2: Analyze and synthesize
   *
   * Uses Claude to analyze retrieved information and synthesize insights.
   */
  private async executeAnalysisPass(
    objective: string,
    recallPass: PassOutput,
    workspaceId: string
  ): Promise<PassOutput> {
    const startTime = Date.now();

    const analysisPrompt = `
Given the objective: "${objective}"

And the retrieved context:
${JSON.stringify(recallPass.generatedContent, null, 2)}

Analyze and synthesize insights:
1. Key patterns in the information
2. Critical gaps or unknowns
3. Potential approaches to the objective
4. Risk factors to consider
5. Uncertainty level in your analysis

Provide structured analysis.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      thinking: {
        type: 'enabled',
        budget_tokens: 2000,
      },
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    });

    const analysis = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    // Extract uncertainty from analysis
    const uncertaintyMatch = analysis.match(/uncertainty[:\s]+(\d+)/i);
    const analysisUncertainty = uncertaintyMatch ? parseInt(uncertaintyMatch[1]) : 50;

    const processingTime = Date.now() - startTime;

    return {
      passId: `pass-analysis-${Date.now()}`,
      passType: 'analysis',
      passNumber: 2,
      generatedContent: {
        analysis,
        keyPatterns: [], // Would extract from analysis
        gaps: [],
        approaches: [],
      },
      uncertainty: analysisUncertainty,
      risk: recallPass.risk,
      confidence: 70,
      processingTimeMs: processingTime,
      tokenCount: 1500,
      artifacts: [
        {
          type: 'analysis',
          content: { analysis },
          qualityScore: 80,
        },
      ],
    };
  }

  /**
   * Execute Pass 3: Generate initial draft
   *
   * Creates initial output/solution based on analysis.
   */
  private async executeDraftPass(
    objective: string,
    analysisPass: PassOutput
  ): Promise<PassOutput> {
    const startTime = Date.now();

    const draftPrompt = `
Based on the analysis, generate an initial draft solution for: "${objective}"

Analysis summary:
${JSON.stringify(analysisPass.generatedContent, null, 2)}

Create a detailed, structured draft with:
1. Main approach
2. Key steps
3. Expected outcomes
4. Confidence level
5. Known uncertainties
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      thinking: {
        type: 'enabled',
        budget_tokens: 1500,
      },
      messages: [
        {
          role: 'user',
          content: draftPrompt,
        },
      ],
    });

    const draft = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    const processingTime = Date.now() - startTime;

    return {
      passId: `pass-draft-${Date.now()}`,
      passType: 'draft',
      passNumber: 3,
      generatedContent: {
        draft,
        mainApproach: '',
        expectedOutcomes: [],
      },
      uncertainty: analysisPass.uncertainty,
      risk: analysisPass.risk,
      confidence: 75,
      processingTimeMs: processingTime,
      tokenCount: 1500,
      artifacts: [
        {
          type: 'decision_tree',
          content: { draft },
          qualityScore: 75,
        },
      ],
    };
  }

  /**
   * Execute Pass 4: Refinement
   *
   * Improves and refines the draft solution.
   */
  private async executeRefinementPass(
    objective: string,
    draftPass: PassOutput
  ): Promise<PassOutput> {
    const startTime = Date.now();

    const refinementPrompt = `
Refine and improve the following draft for: "${objective}"

Current draft:
${JSON.stringify(draftPass.generatedContent, null, 2)}

Provide refinements in these areas:
1. Clarity and completeness
2. Risk mitigation
3. Efficiency improvements
4. Alternative approaches
5. Final confidence assessment
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      thinking: {
        type: 'enabled',
        budget_tokens: 1500,
      },
      messages: [
        {
          role: 'user',
          content: refinementPrompt,
        },
      ],
    });

    const refinement = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    const processingTime = Date.now() - startTime;

    return {
      passId: `pass-refinement-${Date.now()}`,
      passType: 'refinement',
      passNumber: 4,
      generatedContent: {
        refinedDraft: refinement,
        improvements: [],
        alternatives: [],
      },
      uncertainty: Math.max(0, draftPass.uncertainty - 10), // Reduce uncertainty through refinement
      risk: draftPass.risk,
      confidence: 85,
      processingTimeMs: processingTime,
      tokenCount: 1500,
      artifacts: [
        {
          type: 'refinement',
          content: { refinement },
          qualityScore: 85,
        },
      ],
    };
  }

  /**
   * Execute Pass 5: Validation
   *
   * Verifies correctness and safety of the solution.
   */
  private async executeValidationPass(
    objective: string,
    refinementPass: PassOutput
  ): Promise<PassOutput> {
    const startTime = Date.now();

    const validationPrompt = `
Validate the following solution for: "${objective}"

Refined solution:
${JSON.stringify(refinementPass.generatedContent, null, 2)}

Perform validation checks:
1. Correctness and logical soundness
2. Safety considerations
3. Feasibility assessment
4. Edge cases and exceptions
5. Final approval rating (0-100)

Provide structured validation results.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      thinking: {
        type: 'enabled',
        budget_tokens: 1500,
      },
      messages: [
        {
          role: 'user',
          content: validationPrompt,
        },
      ],
    });

    const validation = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');

    // Extract approval rating
    const ratingMatch = validation.match(/approval[:\s]+(\d+)/i);
    const finalConfidence = ratingMatch ? parseInt(ratingMatch[1]) : 80;

    const processingTime = Date.now() - startTime;

    return {
      passId: `pass-validation-${Date.now()}`,
      passType: 'validation',
      passNumber: 5,
      generatedContent: {
        validationResults: validation,
        checks: [],
        approvalRating: finalConfidence,
      },
      uncertainty: Math.max(0, refinementPass.uncertainty - 5),
      risk: refinementPass.risk,
      confidence: finalConfidence,
      processingTimeMs: processingTime,
      tokenCount: 1500,
      artifacts: [
        {
          type: 'validation_check',
          content: { validation },
          qualityScore: 90,
        },
      ],
    };
  }

  /**
   * Execute complete 5-pass reasoning for an objective
   *
   * Orchestrates all passes with memory integration and uncertainty propagation.
   *
   * @example
   * ```typescript
   * const engine = new PassEngine();
   * const trace = await engine.executeReasoning({
   *   workspaceId: 'ws-123',
   *   agent: 'content-agent',
   *   objective: 'Generate personalized email for high-value prospect',
   *   initialMemoryIds: ['mem-456']
   * });
   * ```
   */
  async executeReasoning(request: {
    workspaceId: string;
    agent: string;
    objective: string;
    initialMemoryIds?: string[];
  }): Promise<ReasoningTrace> {
    const supabase = await getSupabaseServer();
    const globalStartTime = Date.now();

    try {
      // Start reasoning run in database
      const { data: runId, error: startError } = await supabase.rpc(
        'start_reasoning_run',
        {
          p_workspace_id: request.workspaceId,
          p_agent: request.agent,
          p_objective: request.objective,
          p_initial_memory_ids: request.initialMemoryIds || [],
        }
      );

      if (startError) {
        throw new Error(`Failed to start reasoning run: ${startError.message}`);
      }

      const passes: PassOutput[] = [];
      let currentRisk = 50;
      let currentUncertainty = 70;

      // Pass 1: Recall
      console.log('🔍 Pass 1: Recall - Retrieving relevant memories...');
      const recallPass = await this.executeRecallPass(
        request.workspaceId,
        request.objective,
        request.initialMemoryIds
      );
      passes.push(recallPass);
      currentRisk = recallPass.risk;
      currentUncertainty = recallPass.uncertainty;

      // Check if risk is too high
      if (currentRisk >= 80) {
        console.warn('⚠️ Risk too high, halting reasoning');
        await supabase.rpc('finalize_reasoning_run', {
          p_run_id: runId,
          p_final_memory_id: null,
          p_risk_score: currentRisk,
          p_uncertainty_score: currentUncertainty,
          p_status: 'halted',
        });

        return {
          runId,
          agent: request.agent,
          objective: request.objective,
          finalDecision: { halted: true, reason: 'Risk threshold exceeded' },
          finalRisk: currentRisk,
          finalUncertainty: currentUncertainty,
          passes,
          totalTimeMs: Date.now() - globalStartTime,
        };
      }

      // Pass 2: Analysis
      console.log('📊 Pass 2: Analysis - Synthesizing information...');
      const analysisPass = await this.executeAnalysisPass(
        request.objective,
        recallPass,
        request.workspaceId
      );
      passes.push(analysisPass);
      currentUncertainty = analysisPass.uncertainty;

      // Pass 3: Draft
      console.log('✍️  Pass 3: Draft - Generating initial solution...');
      const draftPass = await this.executeDraftPass(request.objective, analysisPass);
      passes.push(draftPass);

      // Pass 4: Refinement
      console.log('🔧 Pass 4: Refinement - Improving solution...');
      const refinementPass = await this.executeRefinementPass(
        request.objective,
        draftPass
      );
      passes.push(refinementPass);
      currentUncertainty = refinementPass.uncertainty;

      // Pass 5: Validation
      console.log('✅ Pass 5: Validation - Verifying correctness...');
      const validationPass = await this.executeValidationPass(
        request.objective,
        refinementPass
      );
      passes.push(validationPass);
      currentUncertainty = validationPass.uncertainty;

      // Propagate uncertainties across all passes
      const propagatedUncertainty = await this.uncertaintyPropagator.propagateUncertainties(
        passes
      );

      // Build final decision from validation pass
      const finalDecision = {
        solution: validationPass.generatedContent.validationResults,
        confidence: validationPass.confidence,
        uncertainty: propagatedUncertainty,
        riskLevel: currentRisk,
      };

      // Store final memory
      const { data: finalMemoryId, error: memError } = await supabase.rpc(
        'store_agent_memory',
        {
          p_workspace_id: request.workspaceId,
          p_agent: request.agent,
          p_memory_type: 'reasoning_trace',
          p_content: finalDecision,
          p_importance: 85,
          p_confidence: validationPass.confidence,
          p_source: 'pass_engine',
        }
      );

      if (!memError) {
        // Finalize reasoning run
        await supabase.rpc('finalize_reasoning_run', {
          p_run_id: runId,
          p_final_memory_id: finalMemoryId,
          p_risk_score: currentRisk,
          p_uncertainty_score: propagatedUncertainty,
          p_status: 'completed',
        });
      }

      const totalTime = Date.now() - globalStartTime;
      console.log(`✨ Reasoning complete in ${totalTime}ms`);

      return {
        runId,
        agent: request.agent,
        objective: request.objective,
        finalDecision,
        finalRisk: currentRisk,
        finalUncertainty: propagatedUncertainty,
        passes,
        totalTimeMs: totalTime,
      };
    } catch (error) {
      console.error('❌ Reasoning execution failed:', error);
      throw error;
    }
  }
}

/**
 * Factory to create a PassEngine instance
 */
export function createPassEngine(
  anthropic?: Anthropic,
  retriever?: MemoryRetriever,
  assembler?: ContextAssembler,
  riskModel?: RiskModel,
  propagator?: UncertaintyPropagator
): PassEngine {
  return new PassEngine(anthropic, retriever, assembler, riskModel, propagator);
}

/**
 * Singleton instance for direct imports
 */
export const passEngine = createPassEngine();
