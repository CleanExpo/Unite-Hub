/**
 * H15: AI Model & Prompt Lifecycle Manager
 *
 * Comprehensive system for managing:
 * - Model version tracking
 * - Prompt template library & versioning
 * - Model performance metrics
 * - A/B testing configurations
 * - Cost tracking per model
 * - Token usage optimization
 */

import { Anthropic } from '@anthropic-ai/sdk';

export interface ModelVersion {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'custom';
  modelId: string;
  version: string;
  releaseDate: Date;
  status: 'active' | 'deprecated' | 'experimental';
  maxTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  capabilities: string[];
  metadata?: Record<string, any>;
}

export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  category: string;
  template: string;
  variables: string[];
  exampleInput?: Record<string, any>;
  exampleOutput?: string;
  modelCompatibility: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'testing';
}

export interface PromptVariant {
  id: string;
  templateId: string;
  variantNumber: number;
  modifications: Record<string, string>;
  performanceMetrics?: {
    successRate: number;
    avgLatency: number;
    avgCost: number;
    avgTokens: {
      input: number;
      output: number;
    };
  };
}

export interface ModelPerformanceMetrics {
  modelId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatencyMs: number;
  totalTokensUsed: {
    input: number;
    output: number;
  };
  totalCost: number;
  costBreakdown: Record<string, number>;
}

export interface ABTestConfiguration {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  variants: {
    modelId: string;
    promptVariantId: string;
    weight: number;
  }[];
  metrics: {
    successRate?: number;
    latency?: number;
    cost?: number;
    userSatisfaction?: number;
  };
  startDate: Date;
  endDate?: Date;
}

export class H15ModelLifecycleManager {
  private models: Map<string, ModelVersion> = new Map();
  private prompts: Map<string, PromptTemplate> = new Map();
  private promptVariants: Map<string, PromptVariant> = new Map();
  private abTests: Map<string, ABTestConfiguration> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics[]> = new Map();

  /**
   * Register a new model version
   */
  registerModel(model: ModelVersion): void {
    this.models.set(model.id, model);
  }

  /**
   * Get active model by name
   */
  getActiveModel(name: string): ModelVersion | undefined {
    for (const [, model] of this.models) {
      if (model.name === name && model.status === 'active') {
        return model;
      }
    }
    return undefined;
  }

  /**
   * List all models
   */
  listModels(filter?: { status?: string; provider?: string }): ModelVersion[] {
    return Array.from(this.models.values()).filter(m => {
      if (filter?.status && m.status !== filter.status) {
return false;
}
      if (filter?.provider && m.provider !== filter.provider) {
return false;
}
      return true;
    });
  }

  /**
   * Create a new prompt template
   */
  createPromptTemplate(template: PromptTemplate): void {
    this.prompts.set(template.id, template);
  }

  /**
   * Get prompt template
   */
  getPromptTemplate(id: string): PromptTemplate | undefined {
    return this.prompts.get(id);
  }

  /**
   * Create a variant of a prompt template
   */
  createPromptVariant(variant: PromptVariant): void {
    this.promptVariants.set(variant.id, variant);
  }

  /**
   * Render prompt with variables
   */
  renderPrompt(templateId: string, variables: Record<string, any>): string {
    const template = this.prompts.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(`{{${key}}}`, String(value));
    }

    return rendered;
  }

  /**
   * Start an A/B test
   */
  createABTest(test: ABTestConfiguration): void {
    this.abTests.set(test.id, test);
  }

  /**
   * Get A/B test configuration
   */
  getABTest(id: string): ABTestConfiguration | undefined {
    return this.abTests.get(id);
  }

  /**
   * Select variant for A/B test (weighted random)
   */
  selectABTestVariant(testId: string): { modelId: string; promptVariantId: string } | null {
    const test = this.abTests.get(testId);
    if (!test) {
return null;
}

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of test.variants) {
      random -= variant.weight;
      if (random <= 0) {
        return {
          modelId: variant.modelId,
          promptVariantId: variant.promptVariantId,
        };
      }
    }

    return test.variants[0] || null;
  }

  /**
   * Record performance metrics for a model
   */
  recordMetrics(metrics: ModelPerformanceMetrics): void {
    if (!this.performanceMetrics.has(metrics.modelId)) {
      this.performanceMetrics.set(metrics.modelId, []);
    }
    this.performanceMetrics.get(metrics.modelId)!.push(metrics);
  }

  /**
   * Get performance metrics for a model
   */
  getMetrics(modelId: string, limit?: number): ModelPerformanceMetrics[] {
    const metrics = this.performanceMetrics.get(modelId) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Calculate cost optimization recommendations
   */
  getCostOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    // Analyze token usage patterns
    for (const [modelId, metrics] of this.performanceMetrics) {
      if (metrics.length === 0) {
continue;
}

      const latest = metrics[metrics.length - 1];
      const successRate = latest.successfulRequests / latest.totalRequests;

      // Recommendation: Switch to cheaper model if success rate is high
      if (successRate > 0.95) {
        recommendations.push(
          `Model ${modelId} has ${(successRate * 100).toFixed(1)}% success rate - ` +
          `consider switching to a more cost-effective model`
        );
      }

      // Recommendation: Optimize token usage
      const avgInputTokens = latest.totalTokensUsed.input / latest.totalRequests;
      const avgOutputTokens = latest.totalTokensUsed.output / latest.totalRequests;

      if (avgInputTokens > 1000) {
        recommendations.push(
          `Model ${modelId} uses high input tokens (avg ${avgInputTokens.toFixed(0)}) - ` +
          `consider prompt optimization`
        );
      }
    }

    return recommendations;
  }

  /**
   * Get model comparison
   */
  compareModels(modelIds: string[]): Record<string, any> {
    const comparison: Record<string, any> = {};

    for (const modelId of modelIds) {
      const model = this.models.get(modelId);
      const metrics = this.getMetrics(modelId, 1)[0];

      comparison[modelId] = {
        model: model ? {
          name: model.name,
          version: model.version,
          provider: model.provider,
        } : null,
        recentMetrics: metrics || null,
      };
    }

    return comparison;
  }

  /**
   * Export configuration for backup
   */
  exportConfiguration(): {
    models: ModelVersion[];
    prompts: PromptTemplate[];
    abTests: ABTestConfiguration[];
  } {
    return {
      models: Array.from(this.models.values()),
      prompts: Array.from(this.prompts.values()),
      abTests: Array.from(this.abTests.values()),
    };
  }

  /**
   * Import configuration from backup
   */
  importConfiguration(config: {
    models?: ModelVersion[];
    prompts?: PromptTemplate[];
    abTests?: ABTestConfiguration[];
  }): void {
    if (config.models) {
      for (const model of config.models) {
        this.registerModel(model);
      }
    }

    if (config.prompts) {
      for (const prompt of config.prompts) {
        this.createPromptTemplate(prompt);
      }
    }

    if (config.abTests) {
      for (const test of config.abTests) {
        this.createABTest(test);
      }
    }
  }
}

/**
 * Initialize H15 manager with default models
 */
export function createH15Manager(): H15ModelLifecycleManager {
  const manager = new H15ModelLifecycleManager();

  // Register default Anthropic models
  const defaultModels: ModelVersion[] = [
    {
      id: 'claude-opus-4-5',
      name: 'Claude Opus 4.5',
      provider: 'anthropic',
      modelId: 'claude-opus-4-5-20251101',
      version: '4.5.0',
      releaseDate: new Date('2025-11-01'),
      status: 'active',
      maxTokens: 200000,
      costPer1kTokens: {
        input: 0.015,
        output: 0.075,
      },
      capabilities: [
        'extended-thinking',
        'vision',
        'code-generation',
        'reasoning',
        'multi-modal',
      ],
    },
    {
      id: 'claude-sonnet-4-5',
      name: 'Claude Sonnet 4.5',
      provider: 'anthropic',
      modelId: 'claude-sonnet-4-5-20250929',
      version: '4.5.0',
      releaseDate: new Date('2025-09-29'),
      status: 'active',
      maxTokens: 200000,
      costPer1kTokens: {
        input: 0.003,
        output: 0.015,
      },
      capabilities: [
        'vision',
        'code-generation',
        'reasoning',
        'multi-modal',
      ],
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      provider: 'anthropic',
      modelId: 'claude-haiku-4-5-20251001',
      version: '4.5.0',
      releaseDate: new Date('2025-10-01'),
      status: 'active',
      maxTokens: 200000,
      costPer1kTokens: {
        input: 0.0008,
        output: 0.004,
      },
      capabilities: [
        'vision',
        'code-generation',
        'multi-modal',
      ],
    },
  ];

  for (const model of defaultModels) {
    manager.registerModel(model);
  }

  return manager;
}
