/**
 * Agent Reliability Module
 * Phase 10: Pre-Hard-Launch Tuning
 *
 * Features:
 * - Chain-of-thought structured prompting
 * - Loop detection and prevention
 * - Response stabilizers
 * - Execution guards
 */

import { createApiLogger } from '@/lib/logger';

const logger = createApiLogger({ context: 'AgentReliability' });

// ============================================================================
// Chain-of-Thought Prompting
// ============================================================================

export interface ChainOfThoughtConfig {
  steps?: string[];
  requireVerification?: boolean;
  maxSteps?: number;
}

/**
 * Wrap a prompt with chain-of-thought structure
 */
export function wrapWithChainOfThought(
  prompt: string,
  config?: ChainOfThoughtConfig
): string {
  const steps = config?.steps || [
    'Understand the task and identify key requirements',
    'Break down the problem into smaller parts',
    'Consider edge cases and potential issues',
    'Formulate a solution step by step',
    'Verify the solution meets all requirements',
  ];

  const maxSteps = config?.maxSteps || 5;
  const requireVerification = config?.requireVerification ?? true;

  const cotPrefix = `Before responding, think through this step by step:

${steps.slice(0, maxSteps).map((step, i) => `${i + 1}. ${step}`).join('\n')}

${requireVerification ? 'After completing your analysis, verify your response is correct before presenting it.\n\n' : ''}`;

  return `${cotPrefix}Now, address the following:\n\n${prompt}`;
}

/**
 * Create a structured reasoning prompt for complex decisions
 */
export function createReasoningPrompt(
  question: string,
  context: Record<string, unknown>,
  options?: { pros?: boolean; cons?: boolean; recommendation?: boolean }
): string {
  const opts = { pros: true, cons: true, recommendation: true, ...options };

  let prompt = `Question: ${question}\n\nContext:\n${JSON.stringify(context, null, 2)}\n\n`;

  prompt += `Please analyze this systematically:\n\n`;

  if (opts.pros && opts.cons) {
    prompt += `1. **Analysis**: What are the key factors to consider?\n`;
    prompt += `2. **Pros**: What are the benefits or advantages?\n`;
    prompt += `3. **Cons**: What are the risks or disadvantages?\n`;
  }

  if (opts.recommendation) {
    prompt += `4. **Recommendation**: Based on your analysis, what do you recommend and why?\n`;
  }

  return prompt;
}

// ============================================================================
// Loop Detection
// ============================================================================

interface ExecutionRecord {
  hash: string;
  timestamp: number;
  count: number;
}

const executionCache: Map<string, ExecutionRecord[]> = new Map();
const LOOP_DETECTION_WINDOW_MS = 60000; // 1 minute
const LOOP_DETECTION_THRESHOLD = 3; // Max same execution in window

/**
 * Generate a hash for execution parameters
 */
function hashExecution(agentId: string, params: Record<string, unknown>): string {
  const str = `${agentId}:${JSON.stringify(params)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Check if execution is in a loop
 */
export function detectLoop(
  agentId: string,
  params: Record<string, unknown>
): { isLoop: boolean; count: number; message?: string } {
  const now = Date.now();
  const hash = hashExecution(agentId, params);

  // Get or create execution records for this agent
  let records = executionCache.get(agentId) || [];

  // Clean old records outside the window
  records = records.filter((r) => now - r.timestamp < LOOP_DETECTION_WINDOW_MS);

  // Find matching execution
  const existing = records.find((r) => r.hash === hash);

  if (existing) {
    existing.count++;
    existing.timestamp = now;

    if (existing.count >= LOOP_DETECTION_THRESHOLD) {
      logger.warn('Loop detected', {
        agentId,
        hash,
        count: existing.count,
        threshold: LOOP_DETECTION_THRESHOLD,
      });

      return {
        isLoop: true,
        count: existing.count,
        message: `Execution loop detected: Same parameters executed ${existing.count} times in ${LOOP_DETECTION_WINDOW_MS / 1000}s`,
      };
    }
  } else {
    records.push({ hash, timestamp: now, count: 1 });
  }

  executionCache.set(agentId, records);

  return { isLoop: false, count: existing?.count || 1 };
}

/**
 * Clear loop detection cache for an agent
 */
export function clearLoopCache(agentId: string): void {
  executionCache.delete(agentId);
}

/**
 * Get loop detection stats
 */
export function getLoopStats(): { agents: number; totalRecords: number } {
  let totalRecords = 0;
  executionCache.forEach((records) => {
    totalRecords += records.length;
  });

  return {
    agents: executionCache.size,
    totalRecords,
  };
}

// ============================================================================
// Response Stabilizers
// ============================================================================

export interface StabilizerConfig {
  maxLength?: number;
  trimWhitespace?: boolean;
  removeEmptyLines?: boolean;
  validateJson?: boolean;
  sanitizeHtml?: boolean;
  fallbackValue?: string;
}

/**
 * Stabilize AI response output
 */
export function stabilizeResponse(
  response: string,
  config?: StabilizerConfig
): { value: string; stabilized: boolean; issues: string[] } {
  const opts: StabilizerConfig = {
    maxLength: 50000,
    trimWhitespace: true,
    removeEmptyLines: false,
    validateJson: false,
    sanitizeHtml: true,
    fallbackValue: '',
    ...config,
  };

  const issues: string[] = [];
  let value = response;
  let stabilized = false;

  // Handle null/undefined
  if (value == null) {
    issues.push('Response was null/undefined');
    return { value: opts.fallbackValue || '', stabilized: true, issues };
  }

  // Trim whitespace
  if (opts.trimWhitespace) {
    const original = value;
    value = value.trim();
    if (value !== original) {
      stabilized = true;
    }
  }

  // Remove excessive empty lines
  if (opts.removeEmptyLines) {
    const original = value;
    value = value.replace(/\n{3,}/g, '\n\n');
    if (value !== original) {
      stabilized = true;
      issues.push('Removed excessive empty lines');
    }
  }

  // Enforce max length
  if (opts.maxLength && value.length > opts.maxLength) {
    value = value.slice(0, opts.maxLength);
    stabilized = true;
    issues.push(`Truncated to ${opts.maxLength} characters`);
  }

  // Validate JSON if required
  if (opts.validateJson) {
    try {
      JSON.parse(value);
    } catch {
      issues.push('Invalid JSON response');
      // Try to extract JSON from markdown code blocks
      const jsonMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[1].trim());
          value = jsonMatch[1].trim();
          stabilized = true;
          issues.push('Extracted JSON from code block');
        } catch {
          // JSON still invalid
          if (opts.fallbackValue) {
            value = opts.fallbackValue;
            stabilized = true;
          }
        }
      } else if (opts.fallbackValue) {
        value = opts.fallbackValue;
        stabilized = true;
      }
    }
  }

  // Basic HTML sanitization (remove script tags)
  if (opts.sanitizeHtml) {
    const original = value;
    value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    if (value !== original) {
      stabilized = true;
      issues.push('Removed script tags');
    }
  }

  return { value, stabilized, issues };
}

/**
 * Extract structured data from AI response
 */
export function extractStructuredData<T>(
  response: string,
  schema: { required?: string[]; defaults?: Partial<T> }
): { data: T | null; valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Try to parse JSON directly
  let parsed: T | null = null;

  try {
    parsed = JSON.parse(response);
  } catch {
    // Try to extract from code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch {
        errors.push('Failed to parse JSON from code block');
      }
    } else {
      errors.push('Response is not valid JSON');
    }
  }

  if (!parsed) {
    return { data: null, valid: false, errors };
  }

  // Apply defaults
  if (schema.defaults) {
    parsed = { ...schema.defaults, ...parsed };
  }

  // Validate required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in (parsed as Record<string, unknown>))) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return {
    data: parsed,
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Execution Guards
// ============================================================================

export interface ExecutionGuardConfig {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Execute function with timeout, retries, and error handling
 */
export async function guardedExecution<T>(
  fn: () => Promise<T>,
  config?: ExecutionGuardConfig
): Promise<{ success: boolean; data?: T; error?: Error; attempts: number }> {
  const opts: ExecutionGuardConfig = {
    timeoutMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    shouldRetry: () => true,
    ...config,
  };

  let lastError: Error | undefined;
  let attempts = 0;

  for (let attempt = 0; attempt < (opts.maxRetries || 3); attempt++) {
    attempts = attempt + 1;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), opts.timeoutMs);
      });

      // Race between execution and timeout
      const result = await Promise.race([fn(), timeoutPromise]);

      return { success: true, data: result, attempts };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      logger.warn('Execution attempt failed', {
        attempt: attempts,
        maxRetries: opts.maxRetries,
        error: lastError.message,
      });

      // Check if we should retry
      if (attempt < (opts.maxRetries || 3) - 1) {
        if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
          break; // Don't retry
        }

        if (opts.onRetry) {
          opts.onRetry(attempts, lastError);
        }

        // Wait before retry with exponential backoff
        const delay = (opts.retryDelayMs || 1000) * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { success: false, error: lastError, attempts };
}

// ============================================================================
// Agent Execution Wrapper
// ============================================================================

export interface AgentExecutionOptions {
  agentId: string;
  params: Record<string, unknown>;
  enableLoopDetection?: boolean;
  enableChainOfThought?: boolean;
  cotConfig?: ChainOfThoughtConfig;
  guardConfig?: ExecutionGuardConfig;
  stabilizerConfig?: StabilizerConfig;
}

/**
 * Wrap agent execution with all reliability features
 */
export async function reliableAgentExecution<T>(
  fn: () => Promise<T>,
  options: AgentExecutionOptions
): Promise<{
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    loopDetected: boolean;
    attempts: number;
    stabilized: boolean;
  };
}> {
  const {
    agentId,
    params,
    enableLoopDetection = true,
    guardConfig,
  } = options;

  // Check for loops
  if (enableLoopDetection) {
    const loopResult = detectLoop(agentId, params);
    if (loopResult.isLoop) {
      logger.error('Execution blocked due to loop', { agentId, ...loopResult });
      return {
        success: false,
        error: loopResult.message,
        metadata: {
          loopDetected: true,
          attempts: 0,
          stabilized: false,
        },
      };
    }
  }

  // Execute with guards
  const result = await guardedExecution(fn, guardConfig);

  if (!result.success) {
    return {
      success: false,
      error: result.error?.message || 'Unknown error',
      metadata: {
        loopDetected: false,
        attempts: result.attempts,
        stabilized: false,
      },
    };
  }

  return {
    success: true,
    data: result.data,
    metadata: {
      loopDetected: false,
      attempts: result.attempts,
      stabilized: false,
    },
  };
}

// ============================================================================
// Prompt Validation
// ============================================================================

export interface PromptValidationResult {
  valid: boolean;
  issues: string[];
  sanitized: string;
}

/**
 * Validate and sanitize prompts before sending to AI
 */
export function validatePrompt(prompt: string): PromptValidationResult {
  const issues: string[] = [];
  let sanitized = prompt;

  // Check for empty prompt
  if (!prompt || prompt.trim().length === 0) {
    issues.push('Prompt is empty');
    return { valid: false, issues, sanitized: '' };
  }

  // Check for excessive length
  if (prompt.length > 100000) {
    issues.push('Prompt exceeds maximum length (100k characters)');
    sanitized = prompt.slice(0, 100000);
  }

  // Check for potential injection patterns
  const injectionPatterns = [
    /ignore (?:all )?(?:previous )?instructions/i,
    /disregard (?:all )?(?:previous )?instructions/i,
    /forget (?:all )?(?:previous )?instructions/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(prompt)) {
      issues.push('Potential prompt injection detected');
      // Don't modify, just flag
    }
  }

  // Check for excessive repetition (potential attack)
  const words = prompt.split(/\s+/);
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    const lower = word.toLowerCase();
    wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
  }

  for (const [word, count] of wordCounts) {
    if (word.length > 3 && count > words.length * 0.3) {
      issues.push(`Excessive repetition of "${word}" (${count} times)`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    sanitized,
  };
}

// ============================================================================
// Export all utilities
// ============================================================================

export const AgentReliability = {
  // Chain of thought
  wrapWithChainOfThought,
  createReasoningPrompt,

  // Loop detection
  detectLoop,
  clearLoopCache,
  getLoopStats,

  // Stabilizers
  stabilizeResponse,
  extractStructuredData,

  // Guards
  guardedExecution,
  reliableAgentExecution,

  // Validation
  validatePrompt,
};

export default AgentReliability;
