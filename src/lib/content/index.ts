// src/lib/content/index.ts
// Unified Content Generation Module Exports

// ============================================
// PIPELINE EXPORTS
// ============================================

export {
  // Class
  ContentPipeline,
  // Templates
  SECTION_PROMPTS,
} from './pipeline';

export type {
  // Types
  PageType,
  PageSpec,
  SectionContent,
  GeneratedPage,
  PipelineConfig,
  PipelineResult,
} from './pipeline';

// ============================================
// PAGE LOADER EXPORTS
// ============================================

export {
  // Classes
  PageLoader,
  BatchProcessor,
  ContentQueue,
} from './page-loader';

export type {
  // Types
  SiteArchitecture,
  BrandConfig,
  LandingPageConfig,
  PillarPageConfig,
  SubpillarPageConfig,
  ServicePageConfig,
  LocationPageTemplate,
  BatchConfig,
  BatchResult,
  QueuedPage,
} from './page-loader';

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

import { ContentPipeline, type PageSpec, type PipelineResult, type PipelineConfig } from './pipeline';
import { PageLoader, BatchProcessor, type SiteArchitecture, type BatchResult } from './page-loader';
import { executeTask, type TaskType, type ExecutionResult } from '../llm';

/**
 * Adapter to convert LLM executeTask to ContentPipeline format
 */
async function executeTaskAdapter(
  taskType: TaskType,
  prompt: string,
  options?: { systemPrompt?: string }
): Promise<{
  content: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  model_used: string;
}> {
  const result: ExecutionResult = await executeTask({
    task_type: taskType,
    content: prompt,
    system_prompt: options?.systemPrompt,
  });

  return {
    content: result.response,
    input_tokens: result.usage.input_tokens,
    output_tokens: result.usage.output_tokens,
    cost_usd: result.cost_usd,
    model_used: result.model_id,
  };
}

/**
 * Create a content pipeline with default configuration
 */
export function createPipeline(config: Partial<PipelineConfig> = {}): ContentPipeline {
  return new ContentPipeline(config, executeTaskAdapter);
}

/**
 * Generate a single page from spec
 */
export async function generatePage(
  spec: PageSpec,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const pipeline = createPipeline(config);
  return pipeline.generatePage(spec);
}

/**
 * Generate all pages from site architecture
 */
export async function generateAllPages(
  architecture: SiteArchitecture,
  config: Partial<PipelineConfig> = {}
): Promise<BatchResult> {
  const pipeline = createPipeline(config);
  const loader = new PageLoader(architecture);
  const processor = new BatchProcessor(pipeline);

  return processor.processAllInPriority(loader);
}

/**
 * Generate pages of a specific type
 */
export async function generatePagesByType(
  architecture: SiteArchitecture,
  pageType: 'landing' | 'pillar' | 'subpillar' | 'service',
  config: Partial<PipelineConfig> = {}
): Promise<BatchResult> {
  const pipeline = createPipeline(config);
  const loader = new PageLoader(architecture);
  const processor = new BatchProcessor(pipeline);

  return processor.processPageType(loader, pageType);
}

/**
 * Dry run to estimate costs without generating content
 */
export function estimateGenerationCost(architecture: SiteArchitecture): {
  total_pages: number;
  estimated_cost_usd: number;
  breakdown: Record<string, number>;
} {
  const loader = new PageLoader(architecture);
  const pages = loader.getAllPages();

  // Estimate based on average tokens per section type
  const avgTokensPerSection: Record<string, number> = {
    hero: 800,
    problem: 1200,
    features: 1500,
    process: 800,
    testimonials: 400,
    results: 600,
    cta: 400,
    faq: 2000,
    industry_intro: 1500,
    service_detail: 3000,
  };

  // Cost per 1k tokens (using DeepSeek V3 as default)
  const costPer1kInput = 0.00027;
  const costPer1kOutput = 0.0011;
  const avgCostPer1k = (costPer1kInput + costPer1kOutput) / 2;

  let totalTokens = 0;
  const breakdown: Record<string, number> = {
    landing: 0,
    pillar: 0,
    subpillar: 0,
    service: 0,
  };

  for (const page of pages) {
    let pageTokens = 0;
    for (const section of page.sections) {
      pageTokens += avgTokensPerSection[section] || 1000;
    }
    totalTokens += pageTokens;
    breakdown[page.type] += (pageTokens / 1000) * avgCostPer1k;
  }

  return {
    total_pages: pages.length,
    estimated_cost_usd: (totalTokens / 1000) * avgCostPer1k,
    breakdown,
  };
}
