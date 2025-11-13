import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getCurrentTimestamp } from "./lib/utils";
import { api } from "./_generated/api";

/**
 * LANDING PAGE CHECKLISTS
 * DIY landing page builder with AI-generated copy
 */

// Section templates for different page types
const PAGE_TYPE_SECTIONS: Record<string, string[]> = {
  homepage: [
    "Hero Section",
    "Value Proposition",
    "Key Features",
    "How It Works",
    "Social Proof",
    "Trust Indicators",
    "Final CTA",
  ],
  product: [
    "Product Hero",
    "Key Benefits",
    "Features Overview",
    "Product Specs",
    "Pricing",
    "FAQs",
    "Customer Testimonials",
    "Purchase CTA",
  ],
  service: [
    "Service Overview",
    "Problem Statement",
    "Solution & Process",
    "Service Benefits",
    "Pricing Options",
    "Case Studies",
    "Team/About",
    "Contact CTA",
  ],
  lead_capture: [
    "Compelling Headline",
    "Pain Point Description",
    "Solution Preview",
    "Lead Magnet Description",
    "Form Section",
    "Privacy & Trust",
    "Thank You Preview",
  ],
  sales: [
    "Sales Hero",
    "Value Proposition",
    "Urgency Element",
    "Product Benefits",
    "Pricing & Offer",
    "Social Proof",
    "Risk Reversal",
    "Strong CTA",
  ],
  event: [
    "Event Hero",
    "Event Details",
    "Why Attend",
    "Speakers/Agenda",
    "Past Success",
    "Registration Form",
    "Location/Logistics",
    "Final Reminder",
  ],
};

// Generate checklist with AI
export const generateChecklist = action({
  args: {
    clientId: v.id("clients"),
    pageType: v.union(
      v.literal("homepage"),
      v.literal("product"),
      v.literal("service"),
      v.literal("lead_capture"),
      v.literal("sales"),
      v.literal("event")
    ),
    title: v.string(),
    personaId: v.optional(v.id("personas")),
  },
  handler: async (ctx, args) => {
    // Get client data
    const client = await ctx.runQuery(api.clients.get, {
      clientId: args.clientId,
    });
    if (!client) throw new Error("Client not found");

    // Get persona if provided
    let persona = null;
    if (args.personaId) {
      persona = await ctx.runQuery(api.personas.get, {
        personaId: args.personaId,
      });
    }

    // Get active marketing strategy
    const strategy = await ctx.runQuery(api.strategies.getActive, {
      clientId: args.clientId,
    });

    // Get sections for this page type
    const sectionNames = PAGE_TYPE_SECTIONS[args.pageType] || [];

    // Generate AI copy for each section
    const sections = [];
    for (let i = 0; i < sectionNames.length; i++) {
      const sectionName = sectionNames[i];

      // Call Claude API to generate copy
      const aiCopy = await generateSectionCopy({
        sectionName,
        pageType: args.pageType,
        businessName: client.businessName,
        businessDescription: client.businessDescription,
        persona,
        strategy,
      });

      sections.push({
        sectionName,
        completed: false,
        headline: aiCopy.headline,
        subheadline: aiCopy.subheadline,
        bodyCopy: aiCopy.bodyCopy,
        cta: aiCopy.cta,
        imagePrompt: aiCopy.imagePrompt,
        aiGenerated: true,
        alternatives: aiCopy.alternatives || [],
        notes: "",
        order: i,
      });
    }

    // Generate SEO metadata
    const seoData = await generateSEOMetadata({
      title: args.title,
      pageType: args.pageType,
      businessName: client.businessName,
      businessDescription: client.businessDescription,
      persona,
    });

    // Generate tips
    const tips = await generateCopyTips(args.pageType, persona);

    // Create the checklist
    const checklistId = await ctx.runMutation(api.landingPages.create, {
      clientId: args.clientId,
      pageType: args.pageType,
      title: args.title,
      targetPersona: args.personaId,
      sections,
      seoChecklist: seoData,
      copyTips: tips.copyTips,
      designTips: tips.designTips,
    });

    return checklistId;
  },
});

// Helper function to generate copy for a section
// NOTE: This is a placeholder - actual Claude API calls should be made from the action
async function generateSectionCopy(params: {
  sectionName: string;
  pageType: string;
  businessName: string;
  businessDescription: string;
  persona: any;
  strategy: any;
}) {
  const { sectionName, pageType, businessName, businessDescription, persona, strategy } = params;

  // Generate contextual copy based on section type
  // In production, this would call the Claude API via the action
  const baseHeadline = generateContextualHeadline(sectionName, businessName, pageType);
  const bodyCopy = generateContextualBody(sectionName, businessDescription, persona);
  const cta = generateContextualCTA(sectionName, pageType);

  return {
    headline: baseHeadline,
    subheadline: `Discover how ${businessName} can help you achieve your goals`,
    bodyCopy: bodyCopy,
    cta: cta,
    imagePrompt: `Professional ${sectionName.toLowerCase()} image for ${businessName}, modern and clean design`,
    alternatives: [
      {
        headline: generateAlternativeHeadline(sectionName, businessName),
        subheadline: "A different approach to engage your audience",
        bodyCopy: bodyCopy,
        cta: "Learn More",
      },
    ],
  };
}

function generateContextualHeadline(sectionName: string, businessName: string, pageType: string): string {
  const templates: Record<string, string> = {
    "Hero Section": `Transform Your Business with ${businessName}`,
    "Value Proposition": `Why Choose ${businessName}?`,
    "Key Features": "Everything You Need to Succeed",
    "Product Hero": `Introducing ${businessName} - Your Solution`,
    "Service Overview": `Professional Services from ${businessName}`,
    "Compelling Headline": "Get Instant Access to Exclusive Resources",
    "Sales Hero": "Limited Time Offer - Don't Miss Out",
    "Event Hero": "Join Us for an Unforgettable Experience",
  };
  return templates[sectionName] || `${sectionName} - ${businessName}`;
}

function generateContextualBody(sectionName: string, description: string, persona: any): string {
  if (persona && persona.painPoints && persona.painPoints.length > 0) {
    return `${description}\n\nWe understand that ${persona.painPoints[0].toLowerCase()}. That's why we've created a solution that helps you ${persona.goals?.[0]?.toLowerCase() || "achieve your goals"}.`;
  }
  return description;
}

function generateContextualCTA(sectionName: string, pageType: string): string {
  const ctas: Record<string, string> = {
    "lead_capture": "Download Now",
    "sales": "Buy Now",
    "event": "Register Today",
    "product": "Shop Now",
    "service": "Get Started",
    "homepage": "Learn More",
  };
  return ctas[pageType] || "Get Started";
}

function generateAlternativeHeadline(sectionName: string, businessName: string): string {
  const alternatives: Record<string, string> = {
    "Hero Section": `Welcome to ${businessName} - Where Excellence Meets Innovation`,
    "Value Proposition": `The ${businessName} Advantage`,
    "Key Features": "Powerful Features Built for You",
    "Product Hero": `${businessName}: The Smart Choice`,
    "Service Overview": `Expert Solutions by ${businessName}`,
    "Compelling Headline": "Unlock Your Free Download Today",
    "Sales Hero": "Special Offer - Act Now",
    "Event Hero": "Reserve Your Spot Today",
  };
  return alternatives[sectionName] || `${sectionName}`;
}

// Helper function to generate SEO metadata
async function generateSEOMetadata(params: any) {
  const { title, businessName, businessDescription, pageType } = params;

  const keywords = [
    businessName.toLowerCase(),
    pageType.replace("_", " "),
    "business",
    "services",
    "professional",
  ];

  return {
    metaTitle: `${title} | ${businessName}`,
    metaDescription: businessDescription.substring(0, 155) + "...",
    keywords: keywords,
    ogTitle: `${title} - ${businessName}`,
    ogDescription: businessDescription.substring(0, 155) + "...",
  };
}

// Helper function to generate tips
async function generateCopyTips(pageType: string, persona: any) {
  const copyTips = [
    "Focus on benefits, not features - show how you solve problems",
    "Use active voice and strong verbs for more engaging copy",
    "Keep headlines under 10 words for maximum impact",
    "Include social proof early to build trust immediately",
    "Make CTAs specific and action-oriented",
    "Address customer pain points directly",
    "Use 'you' language to speak directly to your audience",
    "Break up text with bullet points for easy scanning",
    "Create urgency without being pushy",
    "End with a clear, compelling call-to-action",
  ];

  const designTips = [
    "Use whitespace effectively to improve readability",
    "Maintain clear visual hierarchy with typography",
    "Ensure mobile responsiveness on all devices",
    "Use high-quality, relevant images",
    "Keep consistent branding throughout",
    "Make CTAs stand out with contrasting colors",
    "Optimize page load speed for better conversions",
    "Use directional cues to guide visitor attention",
    "Implement F-pattern or Z-pattern layouts",
    "Test on multiple browsers and devices",
  ];

  return { copyTips, designTips };
}

// Create checklist (internal mutation)
export const create = mutation({
  args: {
    clientId: v.id("clients"),
    pageType: v.union(
      v.literal("homepage"),
      v.literal("product"),
      v.literal("service"),
      v.literal("lead_capture"),
      v.literal("sales"),
      v.literal("event")
    ),
    title: v.string(),
    targetPersona: v.optional(v.id("personas")),
    sections: v.array(
      v.object({
        sectionName: v.string(),
        completed: v.boolean(),
        headline: v.optional(v.string()),
        subheadline: v.optional(v.string()),
        bodyCopy: v.optional(v.string()),
        cta: v.optional(v.string()),
        imagePrompt: v.optional(v.string()),
        aiGenerated: v.boolean(),
        alternatives: v.array(
          v.object({
            headline: v.string(),
            subheadline: v.string(),
            bodyCopy: v.optional(v.string()),
            cta: v.optional(v.string()),
          })
        ),
        notes: v.optional(v.string()),
        order: v.number(),
      })
    ),
    seoChecklist: v.object({
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      keywords: v.array(v.string()),
      ogImage: v.optional(v.string()),
      ogTitle: v.optional(v.string()),
      ogDescription: v.optional(v.string()),
    }),
    copyTips: v.array(v.string()),
    designTips: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    const now = getCurrentTimestamp();

    const checklistId = await ctx.db.insert("landingPageChecklists", {
      clientId: args.clientId,
      pageType: args.pageType,
      title: args.title.trim(),
      targetPersona: args.targetPersona,
      sections: args.sections,
      completionPercentage: 0,
      seoChecklist: args.seoChecklist,
      copyTips: args.copyTips,
      designTips: args.designTips,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    return checklistId;
  },
});

// Get checklist by ID
export const get = query({
  args: { checklistId: v.id("landingPageChecklists") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");
    return checklist;
  },
});

// List checklists for client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    pageType: v.optional(
      v.union(
        v.literal("homepage"),
        v.literal("product"),
        v.literal("service"),
        v.literal("lead_capture"),
        v.literal("sales"),
        v.literal("event")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let checklists = await ctx.db
      .query("landingPageChecklists")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.pageType) {
      checklists = checklists.filter((c) => c.pageType === args.pageType);
    }

    return checklists
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

// Update section
export const updateSection = mutation({
  args: {
    checklistId: v.id("landingPageChecklists"),
    sectionName: v.string(),
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
    bodyCopy: v.optional(v.string()),
    cta: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    notes: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const sections = checklist.sections.map((section) => {
      if (section.sectionName === args.sectionName) {
        return {
          ...section,
          headline: args.headline ?? section.headline,
          subheadline: args.subheadline ?? section.subheadline,
          bodyCopy: args.bodyCopy ?? section.bodyCopy,
          cta: args.cta ?? section.cta,
          imagePrompt: args.imagePrompt ?? section.imagePrompt,
          notes: args.notes ?? section.notes,
          completed: args.completed ?? section.completed,
        };
      }
      return section;
    });

    // Calculate completion percentage
    const completedCount = sections.filter((s) => s.completed).length;
    const completionPercentage = Math.round(
      (completedCount / sections.length) * 100
    );

    await ctx.db.patch(args.checklistId, {
      sections,
      completionPercentage,
      status:
        completionPercentage === 100
          ? "completed"
          : completionPercentage > 0
          ? "in_progress"
          : "draft",
      updatedAt: getCurrentTimestamp(),
    });

    return args.checklistId;
  },
});

// Mark section complete
export const markComplete = mutation({
  args: {
    checklistId: v.id("landingPageChecklists"),
    sectionName: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(api.landingPages.updateSection, {
      checklistId: args.checklistId,
      sectionName: args.sectionName,
      completed: args.completed,
    });
  },
});

// Regenerate section copy
export const regenerateSection = action({
  args: {
    checklistId: v.id("landingPageChecklists"),
    sectionName: v.string(),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.runQuery(api.landingPages.get, {
      checklistId: args.checklistId,
    });
    if (!checklist) throw new Error("Checklist not found");

    const client = await ctx.runQuery(api.clients.get, {
      clientId: checklist.clientId,
    });
    if (!client) throw new Error("Client not found");

    // Get persona if set
    let persona = null;
    if (checklist.targetPersona) {
      persona = await ctx.runQuery(api.personas.get, {
        personaId: checklist.targetPersona,
      });
    }

    // Get strategy
    const strategy = await ctx.runQuery(api.strategies.getActive, {
      clientId: checklist.clientId,
    });

    // Generate new copy
    const aiCopy = await generateSectionCopy({
      sectionName: args.sectionName,
      pageType: checklist.pageType,
      businessName: client.businessName,
      businessDescription: client.businessDescription,
      persona,
      strategy,
    });

    // Update section
    await ctx.runMutation(api.landingPages.updateSection, {
      checklistId: args.checklistId,
      sectionName: args.sectionName,
      headline: aiCopy.headline,
      subheadline: aiCopy.subheadline,
      bodyCopy: aiCopy.bodyCopy,
      cta: aiCopy.cta,
      imagePrompt: aiCopy.imagePrompt,
    });

    return { success: true };
  },
});

// Generate alternative variations
export const generateAlternatives = action({
  args: {
    checklistId: v.id("landingPageChecklists"),
    sectionName: v.string(),
    count: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.runQuery(api.landingPages.get, {
      checklistId: args.checklistId,
    });
    if (!checklist) throw new Error("Checklist not found");

    const section = checklist.sections.find(
      (s) => s.sectionName === args.sectionName
    );
    if (!section) throw new Error("Section not found");

    const client = await ctx.runQuery(api.clients.get, {
      clientId: checklist.clientId,
    });

    // Generate variations (simplified - would use Claude API)
    const variations = [];
    const count = args.count ?? 3;

    for (let i = 0; i < count; i++) {
      variations.push({
        headline: `Alternative ${i + 1}: ${section.headline}`,
        subheadline: `Different approach #${i + 1}`,
        bodyCopy: section.bodyCopy,
        cta: section.cta,
      });
    }

    // Update section with alternatives
    const sections = checklist.sections.map((s) => {
      if (s.sectionName === args.sectionName) {
        return {
          ...s,
          alternatives: variations,
        };
      }
      return s;
    });

    await ctx.runMutation(api.landingPages.update, {
      checklistId: args.checklistId,
      sections,
    });

    return variations;
  },
});

// Update checklist
export const update = mutation({
  args: {
    checklistId: v.id("landingPageChecklists"),
    title: v.optional(v.string()),
    targetPersona: v.optional(v.id("personas")),
    sections: v.optional(
      v.array(
        v.object({
          sectionName: v.string(),
          completed: v.boolean(),
          headline: v.optional(v.string()),
          subheadline: v.optional(v.string()),
          bodyCopy: v.optional(v.string()),
          cta: v.optional(v.string()),
          imagePrompt: v.optional(v.string()),
          aiGenerated: v.boolean(),
          alternatives: v.array(
            v.object({
              headline: v.string(),
              subheadline: v.string(),
              bodyCopy: v.optional(v.string()),
              cta: v.optional(v.string()),
            })
          ),
          notes: v.optional(v.string()),
          order: v.number(),
        })
      )
    ),
    seoChecklist: v.optional(
      v.object({
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        keywords: v.array(v.string()),
        ogImage: v.optional(v.string()),
        ogTitle: v.optional(v.string()),
        ogDescription: v.optional(v.string()),
      })
    ),
    colorScheme: v.optional(
      v.object({
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        background: v.string(),
        text: v.string(),
      })
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("in_progress"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const updates: Partial<Doc<"landingPageChecklists">> = {
      updatedAt: getCurrentTimestamp(),
    };

    if (args.title) updates.title = args.title.trim();
    if (args.targetPersona !== undefined)
      updates.targetPersona = args.targetPersona;
    if (args.sections) updates.sections = args.sections;
    if (args.seoChecklist) updates.seoChecklist = args.seoChecklist;
    if (args.colorScheme) updates.colorScheme = args.colorScheme;
    if (args.status) updates.status = args.status;

    await ctx.db.patch(args.checklistId, updates);
    return args.checklistId;
  },
});

// Update SEO
export const updateSEO = mutation({
  args: {
    checklistId: v.id("landingPageChecklists"),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    ogImage: v.optional(v.string()),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const seoChecklist = {
      ...checklist.seoChecklist,
      metaTitle: args.metaTitle ?? checklist.seoChecklist.metaTitle,
      metaDescription:
        args.metaDescription ?? checklist.seoChecklist.metaDescription,
      keywords: args.keywords ?? checklist.seoChecklist.keywords,
      ogImage: args.ogImage ?? checklist.seoChecklist.ogImage,
      ogTitle: args.ogTitle ?? checklist.seoChecklist.ogTitle,
      ogDescription: args.ogDescription ?? checklist.seoChecklist.ogDescription,
    };

    await ctx.db.patch(args.checklistId, {
      seoChecklist,
      updatedAt: getCurrentTimestamp(),
    });

    return args.checklistId;
  },
});

// Delete checklist
export const remove = mutation({
  args: { checklistId: v.id("landingPageChecklists") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");

    await ctx.db.delete(args.checklistId);
    return { success: true };
  },
});

// Calculate completion
export const calculateCompletion = query({
  args: { checklistId: v.id("landingPageChecklists") },
  handler: async (ctx, args) => {
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) throw new Error("Checklist not found");

    const total = checklist.sections.length;
    const completed = checklist.sections.filter((s) => s.completed).length;
    const percentage = Math.round((completed / total) * 100);

    return {
      total,
      completed,
      percentage,
      remaining: total - completed,
    };
  },
});

// Get stats
export const getStats = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const checklists = await ctx.db
      .query("landingPageChecklists")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const byType = {
      homepage: checklists.filter((c) => c.pageType === "homepage").length,
      product: checklists.filter((c) => c.pageType === "product").length,
      service: checklists.filter((c) => c.pageType === "service").length,
      lead_capture: checklists.filter((c) => c.pageType === "lead_capture")
        .length,
      sales: checklists.filter((c) => c.pageType === "sales").length,
      event: checklists.filter((c) => c.pageType === "event").length,
    };

    const byStatus = {
      draft: checklists.filter((c) => c.status === "draft").length,
      in_progress: checklists.filter((c) => c.status === "in_progress").length,
      completed: checklists.filter((c) => c.status === "completed").length,
    };

    const avgCompletion =
      checklists.reduce((sum, c) => sum + c.completionPercentage, 0) /
        checklists.length || 0;

    return {
      total: checklists.length,
      byType,
      byStatus,
      avgCompletion: Math.round(avgCompletion),
    };
  },
});
