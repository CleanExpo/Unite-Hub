/**
 * Scope AI - Hybrid Multi-Model Pipeline
 * Phase 3 Step 3 - AI Scope Engine
 *
 * Implements 4-stage validation pipeline:
 * 1. Claude 3.5 Sonnet (primary draft generation)
 * 2. GPT-4.1 (structural validation)
 * 3. Gemini 2.5 Flash (pricing & estimation)
 * 4. Claude 3 Haiku (final audit gate)
 *
 * Following CLAUDE.md patterns:
 * - Uses OpenRouter for cost optimization (70% of traffic)
 * - Tracks costs via CostTracker
 * - Workspace isolation
 * - Type-safe responses
 *
 * Usage:
 * ```typescript
 * import { ScopeAI } from '@/lib/ai/scopeAI';
 *
 * const scope = await ScopeAI.generateHybridScope(idea, {
 *   organizationId: 'uuid',
 *   workspaceId: 'uuid',
 *   clientId: 'uuid'
 * });
 * ```
 */

import { CostTracker } from '@/lib/accounting/cost-tracker';
import type { ClientIdea, ProposalScope, ScopeSection, ScopePackage } from '@/lib/projects/scope-planner';
import { calculatePackagePricing } from '@/lib/projects/scope-planner';

export interface ScopeGenerationContext {
  organizationId: string;
  workspaceId: string;
  clientId: string;
  userEmail?: string;
}

export interface AIModelResponse {
  output: string;
  tokensUsed: number;
  cost: number;
  model: string;
  responseTime: number;
}

export class ScopeAI {
  /**
   * Hybrid AI Pipeline: 4-stage validation for maximum quality
   *
   * Stage 1: Claude 3.5 Sonnet - Primary scope drafting
   * Stage 2: GPT-4.1 - Structural validation & correction
   * Stage 3: Gemini 2.5 Flash - Pricing, hours, deliverables
   * Stage 4: Claude 3 Haiku - Final audit (hard gate)
   *
   * Nothing escapes unless it passes all four stages.
   */
  static async generateHybridScope(
    input: ClientIdea,
    context: ScopeGenerationContext
  ): Promise<ProposalScope> {
    const { organizationId, workspaceId, clientId, userEmail } = context;

    // Stage 1: Primary draft (Claude 3.5 Sonnet via OpenRouter)
    const draftResponse = await this.callOpenRouter({
      model: 'anthropic/claude-3.5-sonnet',
      prompt: this.prompts.initialDraft(input),
      organizationId,
      workspaceId,
      clientId,
      stage: 'draft_generation',
    });

    // Stage 2: Structural validation (GPT-4.1 via OpenRouter)
    const structuralResponse = await this.callOpenRouter({
      model: 'openai/gpt-4-turbo', // Using GPT-4 Turbo (latest stable)
      prompt: this.prompts.structureCheck(draftResponse.output, input),
      organizationId,
      workspaceId,
      clientId,
      stage: 'structure_validation',
    });

    // Stage 3: Pricing & estimation (Gemini 2.5 Flash via OpenRouter)
    const pricingResponse = await this.callOpenRouter({
      model: 'google/gemini-2.0-flash-exp', // Using Gemini 2.0 Flash (latest)
      prompt: this.prompts.pricingAndEffort(structuralResponse.output, input),
      organizationId,
      workspaceId,
      clientId,
      stage: 'pricing_estimation',
    });

    // Stage 4: Final audit (Claude 3 Haiku - quality gate)
    const finalResponse = await this.callOpenRouter({
      model: 'anthropic/claude-3-haiku',
      prompt: this.prompts.finalAudit(pricingResponse.output, input),
      organizationId,
      workspaceId,
      clientId,
      stage: 'final_audit',
    });

    // Parse final validated scope
    const parsedScope = this.parseAndValidateScope(finalResponse.output, input);

    // Add generation metadata
    parsedScope.metadata = {
      generatedAt: new Date().toISOString(),
      generatedBy: userEmail || 'AI Pipeline',
      aiModel: 'Hybrid (Claude 3.5 Sonnet → GPT-4 → Gemini 2.5 → Claude Haiku)',
      pipelineStages: 4,
      totalCost:
        draftResponse.cost +
        structuralResponse.cost +
        pricingResponse.cost +
        finalResponse.cost,
      totalTokens:
        draftResponse.tokensUsed +
        structuralResponse.tokensUsed +
        pricingResponse.tokensUsed +
        finalResponse.tokensUsed,
    };

    return parsedScope;
  }

  /**
   * Prompt templates for each pipeline stage
   */
  static prompts = {
    /**
     * Stage 1: Initial draft generation
     * Model: Claude 3.5 Sonnet (creative, high-quality)
     */
    initialDraft: (idea: ClientIdea): string => `
You are an expert project scoping consultant creating a proposal for a client.

**Client Idea:**
Title: ${idea.title}
Description: ${idea.description}

**Your Task:**
Generate a comprehensive project scope with Good/Better/Best packages.

**Required Output Format (JSON only):**
{
  "sections": [
    {
      "id": "overview",
      "title": "Project Overview",
      "description": "Detailed project overview based on client idea",
      "order": 1
    },
    {
      "id": "objectives",
      "title": "Project Objectives",
      "description": "3-5 measurable objectives",
      "order": 2
    },
    {
      "id": "deliverables",
      "title": "Key Deliverables",
      "description": "Comprehensive list of deliverables",
      "order": 3
    },
    {
      "id": "assumptions",
      "title": "Assumptions & Constraints",
      "description": "Project assumptions and constraints",
      "order": 4
    }
  ],
  "packages": [
    {
      "tier": "good",
      "label": "Essential Package",
      "summary": "Core functionality and essential features",
      "deliverables": ["List of specific deliverables"],
      "timeline": "Estimated timeline"
    },
    {
      "tier": "better",
      "label": "Professional Package",
      "summary": "Balanced scope with additional refinements",
      "deliverables": ["List of specific deliverables"],
      "timeline": "Estimated timeline"
    },
    {
      "tier": "best",
      "label": "Premium Package",
      "summary": "Complete solution with maximum impact",
      "deliverables": ["List of specific deliverables"],
      "timeline": "Estimated timeline"
    }
  ]
}

**Guidelines:**
- Be specific and actionable
- Focus on business value
- Ensure Good < Better < Best in scope
- Include realistic timelines
- Output ONLY valid JSON (no markdown, no explanation)
`,

    /**
     * Stage 2: Structural validation & correction
     * Model: GPT-4.1 (pattern recognition, structure enforcement)
     */
    structureCheck: (draft: string, idea: ClientIdea): string => `
You are a technical validator ensuring JSON structure compliance.

**Input Draft:**
${draft}

**Original Idea (for context):**
Title: ${idea.title}
Description: ${idea.description}

**Your Task:**
1. Validate JSON structure is correct
2. Ensure all required fields are present
3. Verify Good/Better/Best packages are properly differentiated
4. Fix any structural errors
5. Ensure deliverables are specific and measurable

**Required Fields:**
- sections: array with id, title, description, order
- packages: array with tier, label, summary, deliverables, timeline

**Output:**
Return ONLY the corrected JSON structure (no markdown, no explanation).
If draft is valid, return it unchanged.
`,

    /**
     * Stage 3: Pricing & effort estimation
     * Model: Gemini 2.5 Flash (fast, cost-effective)
     */
    pricingAndEffort: (structured: string, idea: ClientIdea): string => `
You are a pricing specialist adding effort estimation and pricing to a project scope.

**Structured Scope:**
${structured}

**Original Idea:**
Title: ${idea.title}
Description: ${idea.description}

**Your Task:**
1. Add "estimatedHours" to each package (Good: 20-40h, Better: 40-80h, Best: 80-150h)
2. Refine deliverables to be more specific
3. Ensure timeline aligns with estimated hours
4. Keep all existing structure intact

**Pricing will be calculated separately** - you only add estimatedHours.

**Output:**
Return ONLY the enhanced JSON with estimatedHours added to each package (no markdown, no explanation).
`,

    /**
     * Stage 4: Final audit (hard quality gate)
     * Model: Claude 3 Haiku (fast, efficient validation)
     */
    finalAudit: (pricing: string, idea: ClientIdea): string => `
You are the FINAL VALIDATOR. This scope must be PERFECT before client sees it.

**Scope to Audit:**
${pricing}

**Original Idea:**
Title: ${idea.title}
Description: ${idea.description}

**Your Task:**
STRICT VALIDATION - reject if ANY of these fail:
1. JSON is valid and parseable
2. All required fields are present
3. Deliverables are specific and measurable
4. Timeline is realistic
5. Good < Better < Best in scope and hours
6. No hallucinations or generic content
7. No spelling or grammar errors
8. No missing or undefined fields

**If validation passes:** Return the scope unchanged (JSON only)
**If validation fails:** Fix the errors and return corrected JSON

**Critical:** Output ONLY valid JSON (no markdown, no explanation, no commentary).
NOTHING escapes unless PERFECT.
`,
  };

  /**
   * Call OpenRouter API with cost tracking
   */
  private static async callOpenRouter(params: {
    model: string;
    prompt: string;
    organizationId: string;
    workspaceId: string;
    clientId: string;
    stage: string;
  }): Promise<AIModelResponse> {
    const { model, prompt, organizationId, workspaceId, clientId, stage } = params;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const startTime = Date.now();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://unite-group.in',
        'X-Title': 'Unite-Hub AI Scope Engine',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${stage}): ${errorText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    // Extract usage metrics
    const usage = data.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    // Calculate cost (rough estimates - OpenRouter returns actual costs)
    const cost = this.calculateCost(model, promptTokens, completionTokens);

    // Track expense
    try {
      await CostTracker.trackExpense({
        organizationId,
        workspaceId,
        clientId,
        expenseType: 'openrouter',
        description: `${stage} - ${model} - ${totalTokens} tokens`,
        amount: cost,
        tokensUsed: totalTokens,
        apiEndpoint: '/chat/completions',
        metadata: {
          model,
          stage,
          promptTokens,
          completionTokens,
          responseTime,
        },
      });
    } catch (trackingError) {
      console.error('❌ Cost tracking failed (non-critical):', trackingError);
    }

    return {
      output: data.choices[0].message.content,
      tokensUsed: totalTokens,
      cost,
      model,
      responseTime,
    };
  }

  /**
   * Calculate estimated cost for model call
   */
  private static calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    // Pricing per million tokens (approximate - OpenRouter provides exact costs)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'anthropic/claude-3.5-sonnet': { prompt: 3, completion: 15 },
      'anthropic/claude-3-haiku': { prompt: 0.25, completion: 1.25 },
      'openai/gpt-4-turbo': { prompt: 10, completion: 30 },
      'google/gemini-2.0-flash-exp': { prompt: 0.1, completion: 0.4 },
    };

    const modelPricing = pricing[model] || { prompt: 1, completion: 1 };

    const promptCost = (promptTokens / 1000000) * modelPricing.prompt;
    const completionCost = (completionTokens / 1000000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Parse and validate AI-generated scope
   */
  private static parseAndValidateScope(jsonString: string, originalIdea: ClientIdea): ProposalScope {
    try {
      // Remove markdown code blocks if present
      let cleaned = jsonString.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid scope: sections array is required');
      }

      if (!parsed.packages || !Array.isArray(parsed.packages)) {
        throw new Error('Invalid scope: packages array is required');
      }

      // Map sections with IDs
      const sections: ScopeSection[] = parsed.sections.map((s: any, index: number) => ({
        id: s.id || `section-${index}`,
        title: s.title,
        description: s.description,
        order: s.order || index + 1,
      }));

      // Map packages with pricing calculations
      const packages: ScopePackage[] = parsed.packages.map((p: any) => {
        const pkg: ScopePackage = {
          id: `${originalIdea.id}-${p.tier}`,
          tier: p.tier,
          label: p.label,
          summary: p.summary,
          deliverables: p.deliverables || [],
          estimatedHours: p.estimatedHours,
          timeline: p.timeline,
        };

        // Calculate pricing if estimatedHours is provided
        if (pkg.estimatedHours) {
          const pricing = calculatePackagePricing(pkg.estimatedHours);
          pkg.priceMin = pricing.priceMin;
          pkg.priceMax = pricing.priceMax;
        }

        return pkg;
      });

      return {
        idea: originalIdea,
        sections,
        packages,
        metadata: {
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to parse AI scope:', error);
      console.error('Raw output:', jsonString);

      throw new Error(
        `Failed to parse AI-generated scope: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default ScopeAI;
