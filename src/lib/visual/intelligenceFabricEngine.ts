/**
 * Visual Intelligence Fabric Engine
 * Phase 68: Core orchestration for multimodal visual generation
 */

import { VISUAL_METHODS, VisualMethod, getMethodById } from './methods';

export type ProviderType =
  | 'nano_banana'
  | 'dalle'
  | 'gemini'
  | 'veo3'
  | 'perplexity'
  | 'jina'
  | 'elevenlabs';

export type FabricStatus = 'idle' | 'processing' | 'awaiting_approval' | 'completed' | 'failed';

export interface FabricJob {
  id: string;
  method_id: string;
  method_name: string;
  workspace_id: string;
  client_id?: string;
  params: Record<string, unknown>;
  status: FabricStatus;
  providers_used: ProviderType[];
  outputs: FabricOutput[];
  cost_estimate: number;
  actual_cost?: number;
  created_at: Date;
  completed_at?: Date;
  requires_approval: boolean;
  approved_by?: string;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface FabricOutput {
  id: string;
  type: 'image' | 'video' | 'svg' | 'json' | 'pdf' | 'css' | 'lottie';
  url?: string;
  data?: unknown;
  filename: string;
  size_bytes?: number;
  dimensions?: { width: number; height: number };
  duration_seconds?: number;
}

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  api_key_env: string;
  enabled: boolean;
  rate_limit_per_minute: number;
  cost_per_request: number;
  capabilities: string[];
  priority: number;
}

export interface FabricPipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  total_estimated_time: number;
  total_estimated_cost: number;
}

export interface PipelineStep {
  step_number: number;
  method_id: string;
  depends_on: number[];
  params: Record<string, unknown>;
  output_mapping: Record<string, string>;
}

// Provider configurations
const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'nano_banana',
    name: 'Nano Banana 2',
    api_key_env: 'NANO_BANANA_API_KEY',
    enabled: true,
    rate_limit_per_minute: 10,
    cost_per_request: 0.02,
    capabilities: ['image_generation', 'style_transfer', 'upscaling'],
    priority: 1,
  },
  {
    id: 'dalle',
    name: 'DALL-E 3',
    api_key_env: 'OPENAI_API_KEY',
    enabled: true,
    rate_limit_per_minute: 50,
    cost_per_request: 0.04,
    capabilities: ['image_generation', 'editing', 'variations'],
    priority: 2,
  },
  {
    id: 'gemini',
    name: 'Gemini 2.0 Flash',
    api_key_env: 'GEMINI_API_KEY',
    enabled: true,
    rate_limit_per_minute: 60,
    cost_per_request: 0.001,
    capabilities: ['image_understanding', 'generation', 'multimodal'],
    priority: 3,
  },
  {
    id: 'veo3',
    name: 'Veo 3',
    api_key_env: 'VEO3_API_KEY',
    enabled: true,
    rate_limit_per_minute: 5,
    cost_per_request: 0.10,
    capabilities: ['video_generation', 'animation', 'motion'],
    priority: 4,
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar',
    api_key_env: 'PERPLEXITY_API_KEY',
    enabled: true,
    rate_limit_per_minute: 20,
    cost_per_request: 0.005,
    capabilities: ['research', 'trend_analysis', 'inspiration'],
    priority: 5,
  },
  {
    id: 'jina',
    name: 'Jina AI',
    api_key_env: 'JINA_API_KEY',
    enabled: true,
    rate_limit_per_minute: 30,
    cost_per_request: 0.001,
    capabilities: ['image_search', 'similarity', 'embedding'],
    priority: 6,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    api_key_env: 'ELEVENLABS_API_KEY',
    enabled: true,
    rate_limit_per_minute: 10,
    cost_per_request: 0.30,
    capabilities: ['voice', 'sound_effects', 'audio'],
    priority: 7,
  },
];

export class IntelligenceFabricEngine {
  private jobs: Map<string, FabricJob> = new Map();
  private providerConfigs: ProviderConfig[] = PROVIDER_CONFIGS;

  /**
   * Create a new visual generation job
   */
  createJob(
    methodId: string,
    params: Record<string, unknown>,
    workspaceId: string,
    clientId?: string
  ): FabricJob {
    const method = getMethodById(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }

    // Validate required params
    for (const param of method.params) {
      if (param.required && !(param.name in params)) {
        throw new Error(`Missing required parameter: ${param.name}`);
      }
    }

    const job: FabricJob = {
      id: `vif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      method_id: methodId,
      method_name: method.name,
      workspace_id: workspaceId,
      client_id: clientId,
      params,
      status: method.requires_approval ? 'awaiting_approval' : 'idle',
      providers_used: method.providers as ProviderType[],
      outputs: [],
      cost_estimate: this.estimateCost(method),
      created_at: new Date(),
      requires_approval: method.requires_approval,
      metadata: {},
    };

    this.jobs.set(job.id, job);
    return job;
  }

  /**
   * Estimate cost for a method
   */
  private estimateCost(method: VisualMethod): number {
    let cost = 0;
    for (const providerId of method.providers) {
      const config = this.providerConfigs.find(p => p.id === providerId);
      if (config) {
        cost += config.cost_per_request;
      }
    }
    return Math.round(cost * 100) / 100;
  }

  /**
   * Execute a job
   */
  async executeJob(jobId: string): Promise<FabricJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.requires_approval && job.status === 'awaiting_approval') {
      throw new Error('Job requires approval before execution');
    }

    job.status = 'processing';

    try {
      // Get method
      const method = getMethodById(job.method_id);
      if (!method) {
        throw new Error(`Method not found: ${job.method_id}`);
      }

      // Execute with each provider
      const outputs: FabricOutput[] = [];
      let totalCost = 0;

      for (const providerId of method.providers) {
        const config = this.providerConfigs.find(p => p.id === providerId);
        if (!config || !config.enabled) {
continue;
}

        // Mock execution - in production, call actual provider APIs
        const output = await this.executeWithProvider(config, method, job.params);
        if (output) {
          outputs.push(output);
          totalCost += config.cost_per_request;
        }
      }

      job.outputs = outputs;
      job.actual_cost = Math.round(totalCost * 100) / 100;
      job.status = 'completed';
      job.completed_at = new Date();

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return job;
  }

  /**
   * Execute with a specific provider
   */
  private async executeWithProvider(
    config: ProviderConfig,
    method: VisualMethod,
    params: Record<string, unknown>
  ): Promise<FabricOutput | null> {
    // This is a mock implementation
    // In production, this would call actual provider APIs

    const outputType = this.inferOutputType(method);

    return {
      id: `out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: outputType,
      filename: `${method.id}_${config.id}_${Date.now()}.${outputType}`,
      data: {
        provider: config.id,
        method: method.id,
        params,
        generated: new Date().toISOString(),
      },
    };
  }

  /**
   * Infer output type from method
   */
  private inferOutputType(method: VisualMethod): FabricOutput['type'] {
    if (method.category === 'motion') {
return 'video';
}
    if (method.outputs.some(o => o.includes('svg'))) {
return 'svg';
}
    if (method.outputs.some(o => o.includes('pdf'))) {
return 'pdf';
}
    if (method.outputs.some(o => o.includes('lottie'))) {
return 'lottie';
}
    if (method.outputs.some(o => o.includes('css'))) {
return 'css';
}
    return 'image';
  }

  /**
   * Approve a job
   */
  approveJob(jobId: string, approvedBy: string): FabricJob {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'awaiting_approval') {
      throw new Error('Job is not awaiting approval');
    }

    job.approved_by = approvedBy;
    job.status = 'idle';
    return job;
  }

  /**
   * Create a multi-step pipeline
   */
  createPipeline(name: string, steps: PipelineStep[]): FabricPipeline {
    let totalTime = 0;
    let totalCost = 0;

    for (const step of steps) {
      const method = getMethodById(step.method_id);
      if (method) {
        totalTime += method.estimated_time_seconds;
        totalCost += this.estimateCost(method);
      }
    }

    return {
      id: `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      steps,
      total_estimated_time: totalTime,
      total_estimated_cost: Math.round(totalCost * 100) / 100,
    };
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): FabricJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for workspace
   */
  getJobsByWorkspace(workspaceId: string): FabricJob[] {
    return Array.from(this.jobs.values())
      .filter(j => j.workspace_id === workspaceId)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * Get provider status
   */
  getProviderStatus(): ProviderConfig[] {
    return this.providerConfigs;
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(providerId: ProviderType, enabled: boolean): void {
    const config = this.providerConfigs.find(p => p.id === providerId);
    if (config) {
      config.enabled = enabled;
    }
  }

  /**
   * Get method recommendations based on task
   */
  recommendMethods(task: string): VisualMethod[] {
    const taskLower = task.toLowerCase();

    return VISUAL_METHODS.filter(method => {
      const nameMatch = method.name.toLowerCase().includes(taskLower);
      const descMatch = method.description.toLowerCase().includes(taskLower);
      const categoryMatch = method.category.includes(taskLower);

      return nameMatch || descMatch || categoryMatch;
    }).slice(0, 5);
  }

  /**
   * Calculate optimal provider routing
   */
  routeToOptimalProvider(methodId: string): ProviderType | null {
    const method = getMethodById(methodId);
    if (!method) {
return null;
}

    // Find enabled providers that support this method
    const availableProviders = this.providerConfigs
      .filter(p => p.enabled && method.providers.includes(p.id))
      .sort((a, b) => a.priority - b.priority);

    return availableProviders.length > 0 ? availableProviders[0].id : null;
  }

  /**
   * Get usage statistics
   */
  getUsageStats(workspaceId: string): {
    total_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    total_cost: number;
    by_method: Record<string, number>;
    by_provider: Record<string, number>;
  } {
    const jobs = this.getJobsByWorkspace(workspaceId);

    const byMethod: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    let totalCost = 0;

    for (const job of jobs) {
      byMethod[job.method_id] = (byMethod[job.method_id] || 0) + 1;

      for (const provider of job.providers_used) {
        byProvider[provider] = (byProvider[provider] || 0) + 1;
      }

      if (job.actual_cost) {
        totalCost += job.actual_cost;
      }
    }

    return {
      total_jobs: jobs.length,
      completed_jobs: jobs.filter(j => j.status === 'completed').length,
      failed_jobs: jobs.filter(j => j.status === 'failed').length,
      total_cost: Math.round(totalCost * 100) / 100,
      by_method: byMethod,
      by_provider: byProvider,
    };
  }
}

export default IntelligenceFabricEngine;
