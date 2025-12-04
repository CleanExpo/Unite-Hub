/**
 * Content Generation Module
 *
 * Exports the Content Pipeline for generating SEO-optimized pages
 * using the LLM Orchestrator.
 *
 * @example
 * import { ContentPipeline, SECTION_PROMPTS } from '@/lib/content';
 * import { executeTask } from '@/lib/llm';
 *
 * const pipeline = new ContentPipeline(
 *   { brand: 'synthex', dry_run: false },
 *   async (taskType, prompt, options) => {
 *     const result = await executeTask({
 *       task_type: taskType,
 *       content: prompt,
 *       system_prompt: options?.systemPrompt,
 *     });
 *     return {
 *       content: result.response,
 *       input_tokens: result.usage.input_tokens,
 *       output_tokens: result.usage.output_tokens,
 *       cost_usd: result.cost_usd,
 *       model_used: result.model_id,
 *     };
 *   }
 * );
 *
 * const result = await pipeline.generatePage(pageSpec);
 */

export {
  ContentPipeline,
  SECTION_PROMPTS,
} from './pipeline';

export type {
  PageType,
  PageSpec,
  SectionContent,
  GeneratedPage,
  PipelineConfig,
  PipelineResult,
} from './pipeline';
