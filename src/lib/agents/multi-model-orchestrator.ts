/**
 * Multi-Model Orchestrator
 * Coordinates between Claude Sonnet 4.5 (200k context) and Sherlock Think Alpha (1.84M context)
 */

import Anthropic from "@anthropic-ai/sdk";
import { getOpenRouterClient } from "../openrouter";
import { glob } from "glob";
import { readFile } from "fs/promises";
import { join } from "path";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ModelCapabilities {
  name: string;
  contextWindow: number;
  strengths: string[];
  costPerMToken: { input: number; output: number };
}

const MODELS: Record<string, ModelCapabilities> = {
  claude: {
    name: "claude-sonnet-4-5-20250929",
    contextWindow: 200_000,
    strengths: [
      "code generation",
      "file editing",
      "tool use",
      "quick reasoning",
      "api integration",
    ],
    costPerMToken: { input: 3, output: 15 },
  },
  sherlock: {
    name: "openrouter/sherlock-think-alpha",
    contextWindow: 1_840_000,
    strengths: [
      "deep analysis",
      "large codebase understanding",
      "architectural planning",
      "security audits",
      "complex reasoning",
    ],
    costPerMToken: { input: 1, output: 5 }, // Approximate OpenRouter pricing
  },
};

export interface OrchestrationResult {
  model: string;
  response: string;
  reasoning?: string;
  contextUsed: number;
  costEstimate: number;
}

export class MultiModelOrchestrator {
  private openRouter = getOpenRouterClient();

  /**
   * Route task to the appropriate model based on requirements
   */
  async route(
    task: string,
    context: string,
    options?: {
      forceModel?: "claude" | "sherlock";
      requiresTools?: boolean;
      requiresDeepThinking?: boolean;
    }
  ): Promise<OrchestrationResult> {
    const contextSize = context.length;
    const tokenEstimate = Math.ceil(contextSize / 4); // Rough estimate

    // Force specific model if requested
    if (options?.forceModel === "claude") {
      return await this.callClaude(task, context);
    }
    if (options?.forceModel === "sherlock") {
      return await this.callSherlock(task, context);
    }

    // Auto-route based on task requirements
    const needsLargeContext = tokenEstimate > 150_000;
    const needsDeepAnalysis =
      task.toLowerCase().includes("analyze") ||
      task.toLowerCase().includes("audit") ||
      task.toLowerCase().includes("review entire") ||
      task.toLowerCase().includes("full codebase") ||
      options?.requiresDeepThinking;

    const needsTools =
      task.toLowerCase().includes("edit") ||
      task.toLowerCase().includes("create") ||
      task.toLowerCase().includes("fix") ||
      options?.requiresTools;

    console.log("🎯 Routing decision:", {
      contextSize: tokenEstimate,
      needsLargeContext,
      needsDeepAnalysis,
      needsTools,
    });

    // Sherlock for large context + deep analysis
    if ((needsLargeContext || needsDeepAnalysis) && !needsTools) {
      console.log("→ Routing to Sherlock Think Alpha");
      return await this.callSherlock(task, context);
    }

    // Claude for everything else (especially tool use)
    console.log("→ Routing to Claude Sonnet 4.5");
    return await this.callClaude(task, context);
  }

  /**
   * Collaborative reasoning: Sherlock analyzes → Claude implements
   */
  async collaborate(
    task: string,
    codebaseFiles: Record<string, string>
  ): Promise<{
    analysis: OrchestrationResult;
    implementation: OrchestrationResult;
    totalCost: number;
  }> {
    console.log("🤝 Starting collaborative reasoning...");

    // Step 1: Sherlock analyzes entire codebase
    console.log("📊 Phase 1: Sherlock Think Alpha - Deep Analysis");
    const fullContext = this.formatCodebase(codebaseFiles);

    const analysisPrompt = `Analyze this entire codebase and provide:
1. Architecture overview
2. Key patterns and design decisions
3. Potential improvements for: ${task}
4. Specific recommendations with file locations
5. Risk assessment

Be detailed and reference specific files and lines.`;

    const analysis = await this.callSherlock(analysisPrompt, fullContext);

    // Step 2: Claude uses analysis to generate actionable code
    console.log("⚙️  Phase 2: Claude Sonnet 4.5 - Implementation");
    const implementationPrompt = `Based on this analysis, implement the following task:

Task: ${task}

Analysis from Sherlock Think Alpha:
${analysis.response}

Generate specific code changes, file edits, and implementation steps.`;

    const relevantContext = this.extractRelevantContext(
      codebaseFiles,
      analysis.response
    );

    const implementation = await this.callClaude(
      implementationPrompt,
      relevantContext
    );

    return {
      analysis,
      implementation,
      totalCost: analysis.costEstimate + implementation.costEstimate,
    };
  }

  /**
   * Call Claude Sonnet 4.5
   */
  private async callClaude(
    task: string,
    context: string
  ): Promise<OrchestrationResult> {
    const tokenEstimate = Math.ceil((task.length + context.length) / 4);

    const message = await anthropic.messages.create({
      model: MODELS.claude.name,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${task}\n\n---\n\nContext:\n${context.slice(0, 150_000)}`,
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    const costEstimate =
      (message.usage.input_tokens / 1_000_000) * MODELS.claude.costPerMToken.input +
      (message.usage.output_tokens / 1_000_000) * MODELS.claude.costPerMToken.output;

    return {
      model: "claude-sonnet-4-5",
      response,
      contextUsed: message.usage.input_tokens,
      costEstimate,
    };
  }

  /**
   * Call Sherlock Think Alpha via OpenRouter
   */
  private async callSherlock(
    task: string,
    context: string
  ): Promise<OrchestrationResult> {
    if (!this.openRouter.isAvailable()) {
      console.warn("⚠️  Sherlock Think Alpha not available, falling back to Claude");
      return await this.callClaude(task, context);
    }

    const tokenEstimate = Math.ceil((task.length + context.length) / 4);

    const response = await this.openRouter.thinkDeep(task, context, {
      maxTokens: 16000,
      temperature: 0.5,
      systemPrompt: `You are Sherlock Think Alpha with 1.84M context window.
Provide deep, thorough analysis with specific references to code locations.
Think step-by-step and show your reasoning process.`,
    });

    const costEstimate =
      (tokenEstimate / 1_000_000) * MODELS.sherlock.costPerMToken.input +
      (8000 / 1_000_000) * MODELS.sherlock.costPerMToken.output; // Estimate

    return {
      model: "sherlock-think-alpha",
      response,
      contextUsed: tokenEstimate,
      costEstimate,
    };
  }

  /**
   * Format codebase files into context string
   */
  private formatCodebase(files: Record<string, string>): string {
    return Object.entries(files)
      .map(([path, content]) => `\n${"=".repeat(60)}\nFile: ${path}\n${"=".repeat(60)}\n${content}`)
      .join("\n\n");
  }

  /**
   * Extract relevant files mentioned in analysis
   */
  private extractRelevantContext(
    files: Record<string, string>,
    analysis: string
  ): string {
    const mentionedFiles = Object.keys(files).filter((path) =>
      analysis.includes(path)
    );

    const relevant: Record<string, string> = {};
    for (const file of mentionedFiles) {
      relevant[file] = files[file];
    }

    // If no specific files mentioned, include all
    if (Object.keys(relevant).length === 0) {
      return this.formatCodebase(files);
    }

    return this.formatCodebase(relevant);
  }

  /**
   * Load entire codebase for large context analysis
   */
  async loadCodebase(
    patterns: string[] = ["src/**/*.{ts,tsx,js,jsx}", "!src/**/*.test.*", "!**/node_modules/**"]
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    for (const pattern of patterns) {
      const matches = await glob(pattern, { cwd: process.cwd() });

      for (const file of matches) {
        try {
          const content = await readFile(join(process.cwd(), file), "utf-8");
          files[file] = content;
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
        }
      }
    }

    console.log(`📁 Loaded ${Object.keys(files).length} files for analysis`);
    return files;
  }
}

// Singleton instance
let orchestrator: MultiModelOrchestrator | null = null;

export function getOrchestrator(): MultiModelOrchestrator {
  if (!orchestrator) {
    orchestrator = new MultiModelOrchestrator();
  }
  return orchestrator;
}
