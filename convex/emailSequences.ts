/**
 * Email Sequences Convex Functions
 *
 * Manages multi-step email sequences including:
 * - Cold outreach sequences
 * - Lead nurture campaigns
 * - Onboarding flows
 * - Re-engagement sequences
 * - Custom sequences
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Generate a new email sequence using AI
 */
export const generateSequence = mutation({
  args: {
    clientId: v.id("clients"),
    sequenceType: v.union(
      v.literal("cold_outreach"),
      v.literal("lead_nurture"),
      v.literal("onboarding"),
      v.literal("re_engagement"),
      v.literal("custom")
    ),
    personaId: v.optional(v.id("personas")),
    name: v.string(),
    goal: v.string(),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get persona if provided
    let persona = null;
    if (args.personaId) {
      persona = await ctx.db.get(args.personaId);
    }

    // Get client details
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Determine number of steps based on sequence type
    const stepCounts: Record<string, number> = {
      cold_outreach: 5,
      lead_nurture: 7,
      onboarding: 4,
      re_engagement: 3,
      custom: 5,
    };

    const totalSteps = stepCounts[args.sequenceType];

    // Create the sequence
    const sequenceId = await ctx.db.insert("emailSequences", {
      clientId: args.clientId,
      name: args.name,
      description: `AI-generated ${args.sequenceType.replace('_', ' ')} sequence`,
      sequenceType: args.sequenceType,
      targetPersona: args.personaId,
      goal: args.goal,
      status: "draft",
      totalSteps,
      isTemplate: false,
      templateCategory: undefined,
      tags: [args.sequenceType],
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        converted: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Generate steps using AI prompt
    // This would call Claude API in production
    const steps = await generateSequenceSteps(
      args.sequenceType,
      totalSteps,
      client,
      persona,
      args.goal,
      args.customInstructions
    );

    // Insert each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await ctx.db.insert("emailSequenceSteps", {
        sequenceId,
        stepNumber: i + 1,
        stepName: step.stepName,
        dayDelay: step.dayDelay,
        subjectLine: step.subjectLine,
        preheaderText: step.preheaderText,
        emailBody: step.emailBody,
        emailBodyHtml: step.emailBodyHtml,
        cta: step.cta,
        aiGenerated: true,
        aiReasoning: step.aiReasoning,
        personalizationTags: step.personalizationTags,
        alternatives: step.alternatives || [],
        conditionalLogic: undefined,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return sequenceId;
  },
});

/**
 * Get all sequences for a client
 */
export const getSequences = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailSequences")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single sequence with all steps
 */
export const getSequenceWithSteps = query({
  args: { sequenceId: v.id("emailSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) return null;

    const steps = await ctx.db
      .query("emailSequenceSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .order("asc")
      .collect();

    return { sequence, steps };
  },
});

/**
 * Get all steps for a sequence
 */
export const getSequenceSteps = query({
  args: { sequenceId: v.id("emailSequences") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailSequenceSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .order("asc")
      .collect();
  },
});

/**
 * Update a sequence step
 */
export const updateStep = mutation({
  args: {
    stepId: v.id("emailSequenceSteps"),
    subjectLine: v.optional(v.string()),
    preheaderText: v.optional(v.string()),
    emailBody: v.optional(v.string()),
    emailBodyHtml: v.optional(v.string()),
    cta: v.optional(
      v.object({
        text: v.string(),
        url: v.optional(v.string()),
        type: v.union(
          v.literal("button"),
          v.literal("link"),
          v.literal("reply"),
          v.literal("calendar")
        ),
      })
    ),
    dayDelay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { stepId, ...updates } = args;

    await ctx.db.patch(stepId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return stepId;
  },
});

/**
 * Regenerate a step using AI
 */
export const regenerateStep = mutation({
  args: {
    stepId: v.id("emailSequenceSteps"),
    instructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const step = await ctx.db.get(args.stepId);
    if (!step) throw new Error("Step not found");

    const sequence = await ctx.db.get(step.sequenceId);
    if (!sequence) throw new Error("Sequence not found");

    const client = await ctx.db.get(sequence.clientId);
    if (!client) throw new Error("Client not found");

    // Get persona if available
    let persona = null;
    if (sequence.targetPersona) {
      persona = await ctx.db.get(sequence.targetPersona);
    }

    // Regenerate this step using AI
    const regenerated = await regenerateStepContent(
      sequence.sequenceType,
      step.stepNumber,
      client,
      persona,
      sequence.goal,
      args.instructions
    );

    await ctx.db.patch(args.stepId, {
      subjectLine: regenerated.subjectLine,
      emailBody: regenerated.emailBody,
      emailBodyHtml: regenerated.emailBodyHtml,
      preheaderText: regenerated.preheaderText,
      cta: regenerated.cta,
      alternatives: regenerated.alternatives || [],
      aiReasoning: regenerated.aiReasoning,
      updatedAt: Date.now(),
    });

    return args.stepId;
  },
});

/**
 * Duplicate a sequence
 */
export const duplicateSequence = mutation({
  args: {
    sequenceId: v.id("emailSequences"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.sequenceId);
    if (!original) throw new Error("Sequence not found");

    const now = Date.now();

    // Create new sequence
    const newSequenceId = await ctx.db.insert("emailSequences", {
      ...original,
      name: args.newName,
      status: "draft",
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        converted: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Copy all steps
    const steps = await ctx.db
      .query("emailSequenceSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();

    for (const step of steps) {
      await ctx.db.insert("emailSequenceSteps", {
        ...step,
        sequenceId: newSequenceId,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return newSequenceId;
  },
});

/**
 * Update sequence status
 */
export const updateSequenceStatus = mutation({
  args: {
    sequenceId: v.id("emailSequences"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sequenceId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.sequenceId;
  },
});

/**
 * Delete a sequence and all its steps
 */
export const deleteSequence = mutation({
  args: { sequenceId: v.id("emailSequences") },
  handler: async (ctx, args) => {
    // Delete all steps
    const steps = await ctx.db
      .query("emailSequenceSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();

    for (const step of steps) {
      await ctx.db.delete(step._id);
    }

    // Delete sequence
    await ctx.db.delete(args.sequenceId);
    return true;
  },
});

/**
 * Analyze sequence performance
 */
export const analyzeSequence = query({
  args: { sequenceId: v.id("emailSequences") },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) return null;

    const steps = await ctx.db
      .query("emailSequenceSteps")
      .withIndex("by_sequence", (q) => q.eq("sequenceId", args.sequenceId))
      .collect();

    // Calculate overall metrics
    const totalSent = sequence.metrics.sent;
    const openRate = totalSent > 0 ? (sequence.metrics.opened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (sequence.metrics.clicked / totalSent) * 100 : 0;
    const replyRate = totalSent > 0 ? (sequence.metrics.replied / totalSent) * 100 : 0;
    const conversionRate = totalSent > 0 ? (sequence.metrics.converted / totalSent) * 100 : 0;

    // Calculate step-by-step metrics
    const stepMetrics = steps.map((step) => {
      const stepSent = step.metrics.sent;
      return {
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        sent: stepSent,
        openRate: stepSent > 0 ? (step.metrics.opened / stepSent) * 100 : 0,
        clickRate: stepSent > 0 ? (step.metrics.clicked / stepSent) * 100 : 0,
        replyRate: stepSent > 0 ? (step.metrics.replied / stepSent) * 100 : 0,
      };
    });

    return {
      sequence,
      overallMetrics: {
        totalSent,
        openRate: openRate.toFixed(2),
        clickRate: clickRate.toFixed(2),
        replyRate: replyRate.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
      },
      stepMetrics,
      recommendations: generateRecommendations(stepMetrics),
    };
  },
});

/**
 * Get pre-built templates
 */
export const getTemplates = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("saas"),
        v.literal("ecommerce"),
        v.literal("service_business"),
        v.literal("product_launch"),
        v.literal("event_promotion"),
        v.literal("customer_retention"),
        v.literal("partner_outreach"),
        v.literal("referral"),
        v.literal("upsell"),
        v.literal("win_back"),
        v.literal("newsletter"),
        v.literal("trial_conversion")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("emailSequenceTemplates");

    if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    }

    return await query.order("desc").collect();
  },
});

/**
 * Create sequence from template
 */
export const createFromTemplate = mutation({
  args: {
    templateId: v.id("emailSequenceTemplates"),
    clientId: v.id("clients"),
    customName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    const now = Date.now();

    // Create sequence from template
    const sequenceId = await ctx.db.insert("emailSequences", {
      clientId: args.clientId,
      name: args.customName || template.name,
      description: template.description,
      sequenceType: template.sequenceType,
      targetPersona: undefined,
      goal: template.goal,
      status: "draft",
      totalSteps: template.totalSteps,
      isTemplate: false,
      templateCategory: template.category,
      tags: [template.category],
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        converted: 0,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Generate steps for this template
    // In production, this would fetch pre-defined step content
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const steps = await generateTemplateSteps(template, client);

    for (let i = 0; i < steps.length; i++) {
      await ctx.db.insert("emailSequenceSteps", {
        sequenceId,
        ...steps[i],
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return sequenceId;
  },
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate sequence steps using AI
 */
async function generateSequenceSteps(
  sequenceType: string,
  totalSteps: number,
  client: any,
  persona: any,
  goal: string,
  customInstructions?: string
) {
  // This would call Claude API in production
  // For now, return template-based steps

  const templates: Record<string, any[]> = {
    cold_outreach: [
      {
        stepNumber: 1,
        stepName: "Initial Contact",
        dayDelay: 0,
        subjectLine: `Quick question about ${client.businessName}`,
        preheaderText: "I noticed something interesting...",
        emailBody: `Hi {firstName},\n\nI came across ${client.businessName} and was impressed by {specific_detail}.\n\nI work with businesses like yours to {value_proposition}, and I thought you might be interested in learning how we've helped similar companies achieve {specific_result}.\n\nWould you be open to a quick 15-minute call next week?\n\nBest regards,\n{senderName}`,
        emailBodyHtml: undefined,
        cta: { text: "Schedule a call", url: "{calendar_link}", type: "calendar" as const },
        aiReasoning: "Initial contact focuses on personalization and value proposition",
        personalizationTags: ["firstName", "company", "specific_detail"],
        alternatives: [],
      },
      {
        stepNumber: 2,
        stepName: "Value Addition",
        dayDelay: 3,
        subjectLine: "Resource for {company}",
        preheaderText: "Thought this might help...",
        emailBody: `Hi {firstName},\n\nI wanted to follow up and share a resource that might be valuable for ${client.businessName}.\n\n{resource_link}\n\nThis has helped companies in your industry achieve {benefit}. No strings attached - just thought you'd find it useful.\n\nLet me know what you think!\n\nBest,\n{senderName}`,
        emailBodyHtml: undefined,
        cta: { text: "Download resource", url: "{resource_link}", type: "link" as const },
        aiReasoning: "Provide value before asking again, build trust",
        personalizationTags: ["firstName", "company", "benefit"],
        alternatives: [],
      },
      {
        stepNumber: 3,
        stepName: "Social Proof",
        dayDelay: 4,
        subjectLine: "How {competitor} achieved {result}",
        preheaderText: "Case study inside...",
        emailBody: `Hi {firstName},\n\nQuick follow-up - I thought you'd appreciate seeing how {competitor_or_peer} used our approach to {specific_achievement}.\n\nThe results:\n- {metric_1}\n- {metric_2}\n- {metric_3}\n\nWould love to explore if we could help ${client.businessName} achieve similar results.\n\nInterested in learning more?\n\nBest,\n{senderName}`,
        emailBodyHtml: undefined,
        cta: { text: "See case study", url: "{case_study_link}", type: "link" as const },
        aiReasoning: "Use social proof and specific results to build credibility",
        personalizationTags: ["firstName", "competitor_or_peer", "specific_achievement"],
        alternatives: [],
      },
      {
        stepNumber: 4,
        stepName: "Direct Ask",
        dayDelay: 5,
        subjectLine: "Should I close your file?",
        preheaderText: "Last check-in...",
        emailBody: `Hi {firstName},\n\nI haven't heard back from you, so I wanted to check one last time.\n\nAre you:\na) Interested but timing isn't right?\nb) Not the right person (if so, who should I talk to?)\nc) Not interested at all?\n\nEither way, I'd appreciate knowing so I don't keep bothering you.\n\nThanks for your time!\n\nBest,\n{senderName}`,
        emailBodyHtml: undefined,
        cta: { text: "Reply", url: undefined, type: "reply" as const },
        aiReasoning: "Permission-based breakup email that often gets responses",
        personalizationTags: ["firstName"],
        alternatives: [],
      },
      {
        stepNumber: 5,
        stepName: "Final Value",
        dayDelay: 7,
        subjectLine: "One last thing for {company}",
        preheaderText: "Final resource...",
        emailBody: `Hi {firstName},\n\nI'll stop reaching out after this, but I wanted to share one final resource that's specifically relevant to ${client.businessName}:\n\n{final_resource}\n\nIf your situation changes or you'd like to discuss this in the future, just reply to this email.\n\nWishing you and ${client.businessName} all the best!\n\n{senderName}`,
        emailBodyHtml: undefined,
        cta: { text: "View resource", url: "{final_resource_link}", type: "link" as const },
        aiReasoning: "Leave door open while providing final value",
        personalizationTags: ["firstName", "company"],
        alternatives: [],
      },
    ],
  };

  const baseSteps = templates[sequenceType] || templates.cold_outreach;
  return baseSteps.slice(0, totalSteps);
}

/**
 * Regenerate a single step
 */
async function regenerateStepContent(
  sequenceType: string,
  stepNumber: number,
  client: any,
  persona: any,
  goal: string,
  instructions?: string
) {
  // This would call Claude API in production
  return {
    subjectLine: `Regenerated: Question about ${client.businessName}`,
    emailBody: `This is regenerated content for step ${stepNumber}`,
    emailBodyHtml: undefined,
    preheaderText: "Custom regenerated...",
    cta: { text: "Learn more", url: "{link}", type: "link" as const },
    aiReasoning: "Regenerated based on custom instructions",
    alternatives: [],
  };
}

/**
 * Generate steps from template
 */
async function generateTemplateSteps(template: any, client: any) {
  // This would fetch pre-defined template steps
  // For now, use preview data to create steps
  return template.stepsPreview.map((preview: any, index: number) => ({
    stepNumber: preview.stepNumber,
    stepName: `Step ${preview.stepNumber}`,
    dayDelay: preview.dayDelay,
    subjectLine: preview.subject,
    preheaderText: undefined,
    emailBody: preview.preview,
    emailBodyHtml: undefined,
    cta: { text: "Learn more", url: undefined, type: "link" as const },
    aiGenerated: true,
    aiReasoning: "Generated from template",
    personalizationTags: ["firstName", "company"],
    alternatives: [],
    conditionalLogic: undefined,
  }));
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(stepMetrics: any[]) {
  const recommendations = [];

  // Find steps with low open rates
  const lowOpenSteps = stepMetrics.filter((s) => s.openRate < 20 && s.sent > 10);
  if (lowOpenSteps.length > 0) {
    recommendations.push({
      type: "subject_line",
      message: `Steps ${lowOpenSteps.map(s => s.stepNumber).join(', ')} have low open rates. Consider A/B testing different subject lines.`,
    });
  }

  // Find steps with low click rates
  const lowClickSteps = stepMetrics.filter((s) => s.clickRate < 5 && s.sent > 10);
  if (lowClickSteps.length > 0) {
    recommendations.push({
      type: "cta",
      message: `Steps ${lowClickSteps.map(s => s.stepNumber).join(', ')} have low click rates. Consider making your CTA more prominent or changing the offer.`,
    });
  }

  // Find drop-off points
  for (let i = 0; i < stepMetrics.length - 1; i++) {
    const current = stepMetrics[i];
    const next = stepMetrics[i + 1];
    if (next.sent < current.sent * 0.5) {
      recommendations.push({
        type: "timing",
        message: `Large drop-off between steps ${current.stepNumber} and ${next.stepNumber}. Consider adjusting the delay or improving engagement.`,
      });
    }
  }

  return recommendations;
}
