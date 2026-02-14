/**
 * Enhanced Workforce Hooks
 *
 * Adds PII redaction, critic review, brand voice validation, proactive
 * monitoring, and draft-state tracking hooks on top of the 5 built-in hooks.
 *
 * These hooks close the remaining capability gaps:
 * - PII Redaction (pre-execution): Strips PII before external API calls
 * - Brand Voice (pre-execution): Enriches prompts with brand voice context
 * - Critic Review (post-execution): Auto-reviews AI-generated content
 * - Draft Tracking (post-execution): Routes content through draft pipeline
 * - Health Monitor (post-execution): Records metrics for anomaly detection
 *
 * @module lib/agents/workforce/enhanced-hooks
 */

import type { HookDefinition, HookContext, HookResult } from './types';

// ---------------------------------------------------------------------------
// 6. PII Redaction Hook (pre-execution)
// ---------------------------------------------------------------------------

/**
 * Automatically redacts PII from inputs before they're sent to external APIs.
 * Uses reversible tokenization so originals can be restored in post-execution.
 */
export function createPIIRedactionHook(): HookDefinition {
  return {
    id: 'enhanced:pii-redaction',
    name: 'PII Redactor',
    phase: 'pre-execution',
    agentIds: ['*'],
    priority: 5, // After permission check (2), before brand voice (6)
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const { piiRedactor } = await import('../../security/pii-redactor');

      const { redacted, tokenMap, totalDetections } = piiRedactor.redactObject(
        ctx.inputs,
        `agent:${ctx.agentId}`
      );

      if (totalDetections > 0) {
        return {
          hookId: 'enhanced:pii-redaction',
          action: 'modify',
          modifiedInputs: {
            ...redacted,
            __piiTokenMap: Object.fromEntries(tokenMap),
            __piiDetections: totalDetections,
          },
          reason: `Redacted ${totalDetections} PII instance(s)`,
          executionTimeMs: 0,
          metadata: { totalDetections, source: ctx.agentId },
        };
      }

      return {
        hookId: 'enhanced:pii-redaction',
        action: 'allow',
        executionTimeMs: 0,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 7. Brand Voice Enrichment Hook (pre-execution)
// ---------------------------------------------------------------------------

/**
 * Injects brand voice context into execution inputs for content-generating agents.
 * Only triggers when inputs contain a brandSlug field.
 */
export function createBrandVoiceHook(): HookDefinition {
  const CONTENT_AGENTS = [
    'content-agent',
    'social-inbox',
    'email-agent',
    'ai-phill',
    'orchestrator',
  ];

  return {
    id: 'enhanced:brand-voice',
    name: 'Brand Voice Enricher',
    phase: 'pre-execution',
    agentIds: CONTENT_AGENTS,
    priority: 6, // After PII redaction
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const brandSlug = ctx.inputs.brandSlug as string | undefined;
      if (!brandSlug) {
        return {
          hookId: 'enhanced:brand-voice',
          action: 'allow',
          executionTimeMs: 0,
        };
      }

      const { brandVoiceEngine } = await import('../../brands/brand-voice-engine');

      const enrichment = brandVoiceEngine.enrichPrompt(
        brandSlug,
        ctx.inputs.contentType as string | undefined
      );

      return {
        hookId: 'enhanced:brand-voice',
        action: 'modify',
        modifiedInputs: {
          __brandVoice: enrichment,
        },
        reason: `Enriched with brand voice for "${brandSlug}"`,
        executionTimeMs: 0,
        metadata: {
          brandSlug,
          exampleCount: enrichment.exampleContent.length,
          avoidTerms: enrichment.vocabulary.avoid.length,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 8. Critic Review Hook (post-execution)
// ---------------------------------------------------------------------------

/**
 * Automatically reviews AI-generated content through the critic agent.
 * Only triggers when the output contains textual content fields.
 */
export function createCriticReviewHook(): HookDefinition {
  const CONTENT_AGENTS = [
    'content-agent',
    'email-agent',
    'social-inbox',
    'ai-phill',
  ];

  return {
    id: 'enhanced:critic-review',
    name: 'Critic Reviewer',
    phase: 'post-execution',
    agentIds: CONTENT_AGENTS,
    priority: 10, // Early in post-execution, before audit
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      // Only review if there's content in the output
      const content =
        (ctx.inputs.generatedContent as string) ??
        (ctx.inputs.content as string) ??
        (ctx.inputs.body as string);

      if (!content || typeof content !== 'string' || content.length < 50) {
        return {
          hookId: 'enhanced:critic-review',
          action: 'allow',
          executionTimeMs: 0,
        };
      }

      const { criticAgent } = await import('../critic-agent');

      try {
        const review = await criticAgent.review({
          content,
          contentType:
            (ctx.inputs.contentType as string as any) ?? 'general',
          brandGuidelines: ctx.inputs.__brandVoice
            ? {
                voiceDescriptors: [],
                avoidWords:
                  (ctx.inputs.__brandVoice as any)?.vocabulary?.avoid ?? [],
              }
            : undefined,
        });

        return {
          hookId: 'enhanced:critic-review',
          action: 'audit',
          reason: `Critic verdict: ${review.verdict} (score: ${review.overallScore}/100)`,
          executionTimeMs: review.reviewTimeMs,
          metadata: {
            verdict: review.verdict,
            overallScore: review.overallScore,
            escalated: review.escalated,
            suggestions: review.suggestions,
          },
        };
      } catch (error) {
        return {
          hookId: 'enhanced:critic-review',
          action: 'audit',
          reason: `Critic review failed: ${error instanceof Error ? error.message : 'unknown'}`,
          executionTimeMs: 0,
          metadata: { error: true },
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 9. Draft Tracking Hook (post-execution)
// ---------------------------------------------------------------------------

/**
 * Automatically creates drafts for AI-generated content and routes
 * through the draft pipeline (draft → critic_review → pending_review).
 */
export function createDraftTrackingHook(): HookDefinition {
  const CONTENT_AGENTS = [
    'content-agent',
    'email-agent',
    'social-inbox',
    'ai-phill',
  ];

  return {
    id: 'enhanced:draft-tracking',
    name: 'Draft Tracker',
    phase: 'post-execution',
    agentIds: CONTENT_AGENTS,
    priority: 15, // After critic review
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const content =
        (ctx.inputs.generatedContent as string) ??
        (ctx.inputs.content as string) ??
        (ctx.inputs.body as string);

      if (!content || typeof content !== 'string' || content.length < 50) {
        return {
          hookId: 'enhanced:draft-tracking',
          action: 'allow',
          executionTimeMs: 0,
        };
      }

      const { draftTracker } = await import('../draft-tracker');

      const draft = draftTracker.create({
        workspaceId: ctx.workspaceId,
        agentId: ctx.agentId,
        contentType: (ctx.inputs.contentType as string) ?? 'general',
        title: (ctx.inputs.title as string) ?? `${ctx.agentId} output`,
        content,
      });

      // If critic review results are in the hook chain, apply them
      const criticResult = ctx.hookChain.find(
        (r) => r.hookId === 'enhanced:critic-review'
      );
      if (criticResult?.metadata) {
        draftTracker.recordCriticReview(draft.id, {
          score: (criticResult.metadata.overallScore as number) ?? 50,
          verdict: (criticResult.metadata.verdict as string) ?? 'flag',
          feedback: (criticResult.metadata.suggestions as string[]) ?? [],
        });

        // Auto-submit for review if critic approved
        if (criticResult.metadata.verdict === 'approve') {
          draftTracker.submitForReview(draft.id);
        }
      }

      return {
        hookId: 'enhanced:draft-tracking',
        action: 'audit',
        reason: `Draft created: ${draft.id} (state: ${draft.state})`,
        executionTimeMs: 0,
        metadata: {
          draftId: draft.id,
          state: draft.state,
          version: draft.version,
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// 10. Health Monitor Hook (post-execution)
// ---------------------------------------------------------------------------

/**
 * Records execution metrics for the proactive monitor's anomaly detection.
 */
export function createHealthMonitorHook(): HookDefinition {
  return {
    id: 'enhanced:health-monitor',
    name: 'Health Monitor',
    phase: 'post-execution',
    agentIds: ['*'],
    priority: 90, // Near-last, before audit (100)
    enabled: true,
    handler: async (ctx: HookContext): Promise<HookResult> => {
      const { proactiveMonitor } = await import('../proactive-monitor');

      // Record execution time metric
      const executionTime = ctx.inputs.__executionTimeMs as number;
      if (typeof executionTime === 'number') {
        proactiveMonitor.recordMetric(
          `agent.${ctx.agentId}.executionTimeMs`,
          executionTime
        );

        // Check for anomalous execution time
        const anomaly = proactiveMonitor.detectAnomaly(
          `agent.${ctx.agentId}.executionTimeMs`,
          executionTime
        );

        if (anomaly.isAnomaly) {
          return {
            hookId: 'enhanced:health-monitor',
            action: 'audit',
            reason: `Anomalous execution time: ${executionTime}ms (${anomaly.deviation}σ from mean)`,
            executionTimeMs: 0,
            metadata: {
              agentId: ctx.agentId,
              anomaly,
            },
          };
        }
      }

      return {
        hookId: 'enhanced:health-monitor',
        action: 'allow',
        executionTimeMs: 0,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// All Enhanced Hooks
// ---------------------------------------------------------------------------

/**
 * Create all enhanced hooks. Call this during workforce initialization.
 */
export function createAllEnhancedHooks(): HookDefinition[] {
  return [
    createPIIRedactionHook(),
    createBrandVoiceHook(),
    createCriticReviewHook(),
    createDraftTrackingHook(),
    createHealthMonitorHook(),
  ];
}
