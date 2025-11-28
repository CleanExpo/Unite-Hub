/**
 * Task Decomposer - Breaks objectives into structured subtasks
 *
 * Uses Claude Extended Thinking to analyze objectives and generate
 * multi-agent execution chains with detailed step specifications.
 */

import { Anthropic } from '@anthropic-ai/sdk';

export interface DecompositionRequest {
  objective: string;
  context: Record<string, any>;
  workspaceId: string;
}

export interface DecomposedTask {
  agentChain: string[];
  steps: Array<{
    stepIndex: number;
    assignedAgent: string;
    inputContext: Record<string, any>;
    expectedOutput: string;
    dependencies: number[];
  }>;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedSteps: number;
  reasoning: string;
}

export class TaskDecomposer {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Decompose an objective into structured steps and agent chain
   */
  async decompose(request: DecompositionRequest): Promise<DecomposedTask> {
    const systemPrompt = `You are an expert task decomposer for multi-agent orchestration.

Your role is to break down complex objectives into structured, executable subtasks.

Available agents:
- email-agent: Processes emails, extracts intents, analyzes sentiment
- content-agent: Generates personalized marketing content with Extended Thinking
- contact-intelligence: AI-powered lead scoring and contact analysis
- analysis: General data analysis and pattern recognition
- reasoning: Multi-pass autonomous reasoning with uncertainty tracking
- orchestrator: Coordinates other agents (meta-level)
- seo-audit: Technical SEO audits, Core Web Vitals, mobile-friendliness
- seo-content: Content optimization, keyword analysis, readability scoring
- seo-schema: Schema markup generation, rich results optimization
- seo-ctr: CTR benchmarking, title/meta A/B testing, click optimization
- seo-competitor: Competitor gap analysis, keyword/content/backlink gaps

Rules:
1. Assign one agent per step
2. Order steps logically (dependencies first)
3. Keep steps focused and atomic
4. Consider risk and uncertainty in ordering
5. Use reasoning for complex analysis
6. Use content-agent for generation tasks
7. Use contact-intelligence for scoring/classification
8. Use seo-audit for technical SEO analysis and Core Web Vitals
9. Use seo-content for content optimization and keyword analysis
10. Use seo-schema for structured data and rich results
11. Use seo-ctr for CTR benchmarking and A/B testing
12. Use seo-competitor for competitive gap analysis

Output ONLY valid JSON with this structure:
{
  "agentChain": ["agent1", "agent2", ...],
  "steps": [
    {
      "stepIndex": 1,
      "assignedAgent": "agent-name",
      "inputContext": { /* required inputs */ },
      "expectedOutput": "description of expected output",
      "dependencies": [/* array of step indices this depends on */]
    }
  ],
  "complexity": "simple|moderate|complex",
  "estimatedSteps": number,
  "reasoning": "brief explanation of decomposition"
}`;

    const userPrompt = `Decompose this objective into an executable multi-agent plan:

Objective: ${request.objective}

Context: ${JSON.stringify(request.context, null, 2)}

Provide a structured task breakdown that can be executed sequentially by the available agents.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const responseText =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse decomposition response');
      }

      const decomposition = JSON.parse(jsonMatch[0]) as DecomposedTask;

      // Validate decomposition
      this.validateDecomposition(decomposition);

      return decomposition;
    } catch (error) {
      console.error('Error decomposing task:', error);

      // Fallback decomposition for simple tasks
      return this.fallbackDecompose(request);
    }
  }

  /**
   * Validate decomposition structure
   */
  private validateDecomposition(decomposition: DecomposedTask): void {
    if (!decomposition.agentChain || !Array.isArray(decomposition.agentChain)) {
      throw new Error('Invalid agentChain structure');
    }

    if (!decomposition.steps || !Array.isArray(decomposition.steps)) {
      throw new Error('Invalid steps structure');
    }

    if (decomposition.steps.length === 0) {
      throw new Error('Decomposition must have at least one step');
    }

    // Validate each step
    decomposition.steps.forEach((step, idx) => {
      if (step.stepIndex !== idx + 1) {
        throw new Error(`Step indices must be sequential (step ${idx + 1} has index ${step.stepIndex})`);
      }

      if (!step.assignedAgent) {
        throw new Error(`Step ${idx + 1} missing assignedAgent`);
      }

      if (!decomposition.agentChain.includes(step.assignedAgent)) {
        throw new Error(
          `Step ${idx + 1} references unknown agent: ${step.assignedAgent}`
        );
      }

      // Validate dependencies
      if (step.dependencies && step.dependencies.length > 0) {
        step.dependencies.forEach((dep) => {
          if (dep >= step.stepIndex) {
            throw new Error(
              `Step ${idx + 1} has invalid dependency on future step ${dep}`
            );
          }
        });
      }
    });
  }

  /**
   * Fallback decomposition for when AI decomposition fails
   */
  private fallbackDecompose(request: DecompositionRequest): DecomposedTask {
    // Simple heuristic decomposition
    const objective = request.objective.toLowerCase();

    // Detect action type
    if (
      objective.includes('email') ||
      objective.includes('process') ||
      objective.includes('sync')
    ) {
      return {
        agentChain: ['email-agent'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'email-agent',
            inputContext: { objective: request.objective },
            expectedOutput: 'Processed emails with intents and sentiment',
            dependencies: [],
          },
        ],
        complexity: 'simple',
        estimatedSteps: 1,
        reasoning: 'Single email processing step',
      };
    }

    if (objective.includes('content') || objective.includes('generate')) {
      return {
        agentChain: ['reasoning', 'content-agent'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'reasoning',
            inputContext: { objective: request.objective },
            expectedOutput: 'Reasoning output and recommendations',
            dependencies: [],
          },
          {
            stepIndex: 2,
            assignedAgent: 'content-agent',
            inputContext: { reasoning: 'from-step-1' },
            expectedOutput: 'Generated content based on reasoning',
            dependencies: [1],
          },
        ],
        complexity: 'moderate',
        estimatedSteps: 2,
        reasoning: 'Reasoning followed by content generation',
      };
    }

    if (objective.includes('score') || objective.includes('analyze')) {
      return {
        agentChain: ['contact-intelligence', 'analysis'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'contact-intelligence',
            inputContext: { objective: request.objective },
            expectedOutput: 'Contact scores and classifications',
            dependencies: [],
          },
          {
            stepIndex: 2,
            assignedAgent: 'analysis',
            inputContext: { scores: 'from-step-1' },
            expectedOutput: 'Analyzed patterns and insights',
            dependencies: [1],
          },
        ],
        complexity: 'moderate',
        estimatedSteps: 2,
        reasoning: 'Scoring followed by pattern analysis',
      };
    }

    // SEO-related objectives
    if (
      objective.includes('seo') ||
      objective.includes('audit') ||
      objective.includes('technical audit')
    ) {
      return {
        agentChain: ['seo-audit', 'analysis'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'seo-audit',
            inputContext: { objective: request.objective },
            expectedOutput: 'Technical SEO audit with Core Web Vitals',
            dependencies: [],
          },
          {
            stepIndex: 2,
            assignedAgent: 'analysis',
            inputContext: { auditResults: 'from-step-1' },
            expectedOutput: 'Analyzed SEO insights and recommendations',
            dependencies: [1],
          },
        ],
        complexity: 'moderate',
        estimatedSteps: 2,
        reasoning: 'SEO audit followed by analysis',
      };
    }

    if (
      objective.includes('keyword') ||
      objective.includes('content optim') ||
      objective.includes('readability')
    ) {
      return {
        agentChain: ['seo-content'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'seo-content',
            inputContext: { objective: request.objective },
            expectedOutput: 'Content optimization analysis with keyword insights',
            dependencies: [],
          },
        ],
        complexity: 'simple',
        estimatedSteps: 1,
        reasoning: 'Single content optimization step',
      };
    }

    if (
      objective.includes('schema') ||
      objective.includes('structured data') ||
      objective.includes('rich result') ||
      objective.includes('markup')
    ) {
      return {
        agentChain: ['seo-schema'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'seo-schema',
            inputContext: { objective: request.objective },
            expectedOutput: 'Generated schema markup for rich results',
            dependencies: [],
          },
        ],
        complexity: 'simple',
        estimatedSteps: 1,
        reasoning: 'Schema generation step',
      };
    }

    if (
      objective.includes('ctr') ||
      objective.includes('click-through') ||
      objective.includes('title test') ||
      objective.includes('meta test')
    ) {
      return {
        agentChain: ['seo-ctr'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'seo-ctr',
            inputContext: { objective: request.objective },
            expectedOutput: 'CTR analysis and optimization recommendations',
            dependencies: [],
          },
        ],
        complexity: 'simple',
        estimatedSteps: 1,
        reasoning: 'CTR optimization step',
      };
    }

    if (
      objective.includes('competitor') ||
      objective.includes('gap analysis') ||
      objective.includes('backlink')
    ) {
      return {
        agentChain: ['seo-competitor', 'analysis'],
        steps: [
          {
            stepIndex: 1,
            assignedAgent: 'seo-competitor',
            inputContext: { objective: request.objective },
            expectedOutput: 'Competitor gap analysis results',
            dependencies: [],
          },
          {
            stepIndex: 2,
            assignedAgent: 'analysis',
            inputContext: { gapAnalysis: 'from-step-1' },
            expectedOutput: 'Strategic recommendations from gap analysis',
            dependencies: [1],
          },
        ],
        complexity: 'moderate',
        estimatedSteps: 2,
        reasoning: 'Competitor analysis followed by strategic insights',
      };
    }

    // Default fallback
    return {
      agentChain: ['reasoning'],
      steps: [
        {
          stepIndex: 1,
          assignedAgent: 'reasoning',
          inputContext: { objective: request.objective },
          expectedOutput: 'Reasoning output and decisions',
          dependencies: [],
        },
      ],
      complexity: 'simple',
      estimatedSteps: 1,
      reasoning: 'General reasoning for objective',
    };
  }

  /**
   * Estimate task complexity
   */
  estimateComplexity(decomposition: DecomposedTask): 'simple' | 'moderate' | 'complex' {
    const stepCount = decomposition.steps.length;
    const hasDependencies = decomposition.steps.some((s) => s.dependencies.length > 0);
    const agentCount = new Set(decomposition.steps.map((s) => s.assignedAgent)).size;

    if (stepCount === 1) return 'simple';
    if (stepCount <= 3 && !hasDependencies && agentCount <= 2) return 'moderate';
    return 'complex';
  }

  /**
   * Suggest optimizations for decomposition
   */
  suggestOptimizations(decomposition: DecomposedTask): string[] {
    const suggestions: string[] = [];

    // Check for sequential bottlenecks
    const parallelizable = decomposition.steps.filter(
      (s) => s.dependencies.length === 0
    );
    if (parallelizable.length > 1) {
      suggestions.push('Consider parallelizing independent steps');
    }

    // Check for unused agents in chain
    const usedAgents = new Set(decomposition.steps.map((s) => s.assignedAgent));
    const unusedAgents = decomposition.agentChain.filter((a) => !usedAgents.has(a));
    if (unusedAgents.length > 0) {
      suggestions.push(`Remove unused agents: ${unusedAgents.join(', ')}`);
    }

    // Check for missing reasoning
    if (
      decomposition.complexity === 'complex' &&
      !decomposition.agentChain.includes('reasoning')
    ) {
      suggestions.push('Consider adding reasoning step for complex workflows');
    }

    return suggestions;
  }
}
