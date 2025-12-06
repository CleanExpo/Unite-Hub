/**
 * Safety Middleware
 *
 * Higher-order function that wraps AI service calls with safety guardrails,
 * audit logging, and incident reporting.
 *
 * Phase: B28 - AI Compliance, Audit, Guardrails & Safety Engine
 */

import {
  applyGuardrails,
  sanitizeOutput,
  classifyRisk,
  logAuditEvent,
  createIncident,
  type GuardrailResult,
  type RiskAssessment,
} from './safetyService';

// ============================================================================
// Types
// ============================================================================

export interface SafetyContext {
  tenantId: string;
  userId: string;
  serviceName: string;
  route?: string;
}

export interface SafetyResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  guardrail_result?: GuardrailResult;
  risk_assessment?: RiskAssessment;
  flagged: boolean;
  violations: string[];
}

export type AIServiceFunction<TInput, TOutput> = (
  input: TInput,
  context: SafetyContext
) => Promise<TOutput>;

export interface WrappedAIResult<TOutput> {
  result: TOutput;
  input_tokens: number;
  output_tokens: number;
  response_time_ms: number;
}

// ============================================================================
// Safety Middleware
// ============================================================================

/**
 * Wrap an AI service function with safety guardrails and audit logging
 *
 * @example
 * const safeAssistant = wrapWithSafety(
 *   async (input, context) => {
 *     return await runChatCompletion({ messages: input.messages });
 *   },
 *   {
 *     enforceGuardrails: true,
 *     riskThreshold: 70,
 *     autoIncident: true,
 *   }
 * );
 *
 * const result = await safeAssistant(
 *   { messages: [...] },
 *   { tenantId, userId, serviceName: 'assistant' }
 * );
 */
export function wrapWithSafety<TInput extends { prompt?: string; messages?: any[] }, TOutput>(
  serviceFn: AIServiceFunction<TInput, WrappedAIResult<TOutput>>,
  options: {
    enforceGuardrails?: boolean;
    riskThreshold?: number; // 0-100, create incident above this score
    autoIncident?: boolean;
    extractPrompt?: (input: TInput) => string;
  } = {}
): AIServiceFunction<TInput, SafetyResult<TOutput>> {
  const {
    enforceGuardrails = true,
    riskThreshold = 70,
    autoIncident = true,
    extractPrompt = defaultPromptExtractor,
  } = options;

  return async (input: TInput, context: SafetyContext): Promise<SafetyResult<TOutput>> => {
    const startTime = Date.now();
    const violations: string[] = [];
    let flagged = false;

    try {
      // Extract prompt from input
      const promptText = extractPrompt(input);

      // Step 1: Apply guardrails to input
      let guardrailResult: GuardrailResult | undefined;
      if (enforceGuardrails) {
        guardrailResult = await applyGuardrails(context.tenantId, promptText);

        if (!guardrailResult.allowed) {
          violations.push(...guardrailResult.violations);
          flagged = true;

          // Log blocked request
          await logAuditEvent({
            tenant_id: context.tenantId,
            user_id: context.userId,
            service_name: context.serviceName,
            route: context.route,
            input_preview: promptText.substring(0, 500),
            output_preview: null,
            input_tokens: guardrailResult.token_count || 0,
            output_tokens: 0,
            risk_score: 100,
            flagged: true,
            flag_reason: violations.join('; '),
            response_time_ms: Date.now() - startTime,
          });

          // Create incident for blocked content
          if (autoIncident && guardrailResult.blocked_phrases_found.length > 0) {
            await createIncident({
              tenant_id: context.tenantId,
              type: 'blocked_phrase',
              severity: 'high',
              details: {
                service: context.serviceName,
                blocked_phrases: guardrailResult.blocked_phrases_found,
                input_preview: promptText.substring(0, 200),
              },
              resolved: false,
            });
          }

          if (autoIncident && guardrailResult.pii_detected.length > 0) {
            await createIncident({
              tenant_id: context.tenantId,
              type: 'pii_detected',
              severity: 'medium',
              details: {
                service: context.serviceName,
                pii_count: guardrailResult.pii_detected.length,
                pii_types: [...new Set(guardrailResult.pii_detected.map((p) => p.type))],
              },
              resolved: false,
            });
          }

          return {
            success: false,
            error: 'Request blocked by safety guardrails',
            guardrail_result: guardrailResult,
            flagged: true,
            violations,
          };
        }

        // Use sanitized text if PII was masked
        if (guardrailResult.pii_detected.length > 0) {
          // Modify input to use sanitized text
          input = {
            ...input,
            prompt: guardrailResult.sanitized_text,
          } as TInput;
        }
      }

      // Step 2: Call the AI service
      const serviceResult = await serviceFn(input, context);

      // Step 3: Classify risk of the response
      const outputText = extractOutputText(serviceResult.result);
      const riskAssessment = await classifyRisk(outputText);

      if (riskAssessment.score >= riskThreshold) {
        flagged = true;
        violations.push(`High risk score: ${riskAssessment.score}`);
        violations.push(...riskAssessment.flags);

        // Create high-risk incident
        if (autoIncident) {
          await createIncident({
            tenant_id: context.tenantId,
            type: 'high_risk',
            severity: riskAssessment.level === 'critical' ? 'critical' : 'high',
            details: {
              service: context.serviceName,
              risk_score: riskAssessment.score,
              reasoning: riskAssessment.reasoning,
              flags: riskAssessment.flags,
              output_preview: outputText.substring(0, 200),
            },
            resolved: false,
          });
        }
      }

      // Step 4: Sanitize output
      const sanitizedOutput = await sanitizeOutput(context.tenantId, outputText);

      // Step 5: Log audit event
      await logAuditEvent({
        tenant_id: context.tenantId,
        user_id: context.userId,
        service_name: context.serviceName,
        route: context.route,
        input_preview: promptText.substring(0, 500),
        output_preview: outputText.substring(0, 500),
        input_tokens: serviceResult.input_tokens,
        output_tokens: serviceResult.output_tokens,
        risk_score: riskAssessment.score,
        flagged,
        flag_reason: flagged ? violations.join('; ') : undefined,
        response_time_ms: serviceResult.response_time_ms,
      });

      return {
        success: true,
        data: (sanitizedOutput !== outputText
          ? { ...serviceResult.result, content: sanitizedOutput }
          : serviceResult.result) as TOutput,
        guardrail_result: guardrailResult,
        risk_assessment: riskAssessment,
        flagged,
        violations,
      };
    } catch (error) {
      // Log error
      console.error('[safetyMiddleware] Error in wrapped service:', error);

      // Log failed audit event
      await logAuditEvent({
        tenant_id: context.tenantId,
        user_id: context.userId,
        service_name: context.serviceName,
        route: context.route,
        input_preview: extractPrompt(input).substring(0, 500),
        output_preview: null,
        input_tokens: 0,
        output_tokens: 0,
        risk_score: 0,
        flagged: true,
        flag_reason: error instanceof Error ? error.message : 'Unknown error',
        response_time_ms: Date.now() - startTime,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        flagged: true,
        violations: ['Service error'],
      };
    }
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Default prompt extractor - tries to find prompt text in input
 */
function defaultPromptExtractor<TInput>(input: TInput): string {
  // Handle direct prompt field
  if (typeof input === 'object' && input !== null) {
    const obj = input as any;

    if (obj.prompt && typeof obj.prompt === 'string') {
      return obj.prompt;
    }

    if (obj.messages && Array.isArray(obj.messages)) {
      // Extract last user message
      const lastUserMsg = obj.messages
        .filter((m: any) => m.role === 'user')
        .pop();
      return lastUserMsg?.content || '';
    }

    if (obj.content && typeof obj.content === 'string') {
      return obj.content;
    }
  }

  // Fallback to string representation
  return String(input);
}

/**
 * Extract text from AI service output
 */
function extractOutputText<TOutput>(output: TOutput): string {
  if (typeof output === 'string') {
    return output;
  }

  if (typeof output === 'object' && output !== null) {
    const obj = output as any;

    if (obj.content && typeof obj.content === 'string') {
      return obj.content;
    }

    if (obj.text && typeof obj.text === 'string') {
      return obj.text;
    }

    if (obj.message && typeof obj.message === 'string') {
      return obj.message;
    }
  }

  // Fallback to JSON string
  return JSON.stringify(output);
}

// ============================================================================
// Pre-configured Wrappers
// ============================================================================

/**
 * Strict mode wrapper - blocks all violations
 */
export function wrapWithStrictSafety<TInput extends { prompt?: string; messages?: any[] }, TOutput>(
  serviceFn: AIServiceFunction<TInput, WrappedAIResult<TOutput>>
): AIServiceFunction<TInput, SafetyResult<TOutput>> {
  return wrapWithSafety(serviceFn, {
    enforceGuardrails: true,
    riskThreshold: 50, // Lower threshold
    autoIncident: true,
  });
}

/**
 * Moderate mode wrapper - logs but allows most content
 */
export function wrapWithModerateSafety<TInput extends { prompt?: string; messages?: any[] }, TOutput>(
  serviceFn: AIServiceFunction<TInput, WrappedAIResult<TOutput>>
): AIServiceFunction<TInput, SafetyResult<TOutput>> {
  return wrapWithSafety(serviceFn, {
    enforceGuardrails: true,
    riskThreshold: 80,
    autoIncident: true,
  });
}

/**
 * Audit-only wrapper - logs but doesn't block
 */
export function wrapWithAuditOnly<TInput extends { prompt?: string; messages?: any[] }, TOutput>(
  serviceFn: AIServiceFunction<TInput, WrappedAIResult<TOutput>>
): AIServiceFunction<TInput, SafetyResult<TOutput>> {
  return wrapWithSafety(serviceFn, {
    enforceGuardrails: false,
    riskThreshold: 100, // Never block
    autoIncident: false,
  });
}
