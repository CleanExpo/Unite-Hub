import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Unite-Hub CRM Database Schema
 *
 * AI-Powered Autonomous Marketing CRM System
 *
 * Features:
 * - Email ingestion & auto-reply
 * - Client management
 * - Asset management
 * - AI persona generation
 * - Mind map auto-expansion
 * - Marketing strategy generation
 * - Social media campaign creation
 * - Hooks & scripts library
 * - DALL-E image generation
 * - Subscription management
 */

export default defineSchema({
  /**
   * ORGANIZATIONS
   * Top-level entity representing a company/business
   */
  organizations: defineTable({
    name: v.string(),
    email: v.string(), // Primary contact email
    websiteUrl: v.optional(v.string()),
    businessDescription: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  /**
   * SUBSCRIPTIONS
   * Stripe subscription management
   */
  subscriptions: defineTable({
    orgId: v.id("organizations"),
    planTier: v.union(v.literal("starter"), v.literal("professional")),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  /**
   * CLIENTS
   * Individual clients within an organization
   */
  clients: defineTable({
    orgId: v.id("organizations"),
    clientName: v.string(),
    businessName: v.string(),
    businessDescription: v.string(),
    packageTier: v.union(v.literal("starter"), v.literal("professional")),
    status: v.union(
      v.literal("active"),
      v.literal("onboarding"),
      v.literal("inactive")
    ),
    portalUrl: v.optional(v.string()), // Unique portal URL slug
    primaryEmail: v.string(),
    phoneNumbers: v.array(v.string()),
    websiteUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_email", ["primaryEmail"])
    .index("by_portal_url", ["portalUrl"]),

  /**
   * CLIENT_EMAILS
   * Multiple email addresses linked to a client account
   */
  clientEmails: defineTable({
    clientId: v.id("clients"),
    emailAddress: v.string(),
    isPrimary: v.boolean(),
    label: v.optional(v.string()), // "work", "personal", "partnership"
    verified: v.boolean(),
    linkedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_email", ["emailAddress"])
    .index("by_email_and_client", ["emailAddress", "clientId"]),

  /**
   * CLIENT_CONTACT_INFO
   * Extended contact information for clients
   */
  clientContactInfo: defineTable({
    clientId: v.id("clients"),
    phoneNumbers: v.array(v.string()),
    emailAddresses: v.array(v.string()),
    websiteUrl: v.optional(v.string()),
    businessName: v.string(),
    businessDescription: v.string(),
    metadata: v.optional(v.any()), // JSON object for additional data
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"]),

  /**
   * CLIENT_ASSETS
   * Uploaded files (logos, photos, documents)
   */
  clientAssets: defineTable({
    clientId: v.id("clients"),
    fileName: v.string(),
    fileUrl: v.string(), // Cloud storage URL
    fileType: v.union(
      v.literal("logo"),
      v.literal("photo"),
      v.literal("business_card"),
      v.literal("marketing_material"),
      v.literal("brand_guidelines"),
      v.literal("document"),
      v.literal("other")
    ),
    category: v.optional(v.string()),
    mimeType: v.string(),
    fileSize: v.number(), // bytes
    uploadedBy: v.string(), // userId or "system"
    metadata: v.optional(v.any()), // Additional file metadata
    uploadedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_type", ["fileType"])
    .index("by_client_and_type", ["clientId", "fileType"]),

  /**
   * EMAIL_THREADS
   * All emails sent to contact@unite-group.in
   */
  emailThreads: defineTable({
    clientId: v.id("clients"),
    senderEmail: v.string(),
    senderName: v.optional(v.string()),
    subject: v.string(),
    messageBody: v.string(), // HTML or plain text
    messageBodyPlain: v.optional(v.string()), // Plain text version
    attachments: v.array(
      v.object({
        fileName: v.string(),
        fileUrl: v.string(),
        mimeType: v.string(),
        fileSize: v.number(),
      })
    ),
    receivedAt: v.number(),
    autoReplySent: v.boolean(),
    autoReplyContent: v.optional(v.string()),
    autoReplySentAt: v.optional(v.number()),
    gmailMessageId: v.optional(v.string()), // Gmail API message ID
    gmailThreadId: v.optional(v.string()), // Gmail API thread ID
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_sender", ["senderEmail"])
    .index("by_received_at", ["receivedAt"])
    .index("by_client_and_received", ["clientId", "receivedAt"])
    .index("by_gmail_message", ["gmailMessageId"]),

  /**
   * AUTO_REPLIES
   * Generated auto-reply details
   */
  autoReplies: defineTable({
    emailThreadId: v.id("emailThreads"),
    clientId: v.id("clients"),
    questionsGenerated: v.array(v.string()),
    autoReplyContent: v.string(),
    sentAt: v.number(),
    responseReceived: v.boolean(),
    responseEmailId: v.optional(v.id("emailThreads")),
    metadata: v.optional(v.any()), // Claude analysis metadata
    createdAt: v.number(),
  })
    .index("by_email_thread", ["emailThreadId"])
    .index("by_client", ["clientId"])
    .index("by_sent_at", ["sentAt"]),

  /**
   * PERSONAS
   * AI-generated customer personas
   */
  personas: defineTable({
    clientId: v.id("clients"),
    personaName: v.string(),
    demographics: v.object({
      ageRange: v.optional(v.string()),
      gender: v.optional(v.string()),
      location: v.optional(v.string()),
      income: v.optional(v.string()),
      education: v.optional(v.string()),
      occupation: v.optional(v.string()),
    }),
    psychographics: v.object({
      values: v.array(v.string()),
      interests: v.array(v.string()),
      lifestyle: v.optional(v.string()),
      personality: v.optional(v.string()),
    }),
    painPoints: v.array(v.string()),
    goals: v.array(v.string()),
    buyingBehavior: v.object({
      motivations: v.array(v.string()),
      barriers: v.array(v.string()),
      decisionFactors: v.array(v.string()),
    }),
    communicationPreferences: v.array(v.string()),
    competitiveAwareness: v.optional(v.string()),
    decisionMakingProcess: v.optional(v.string()),
    generatedFromEmails: v.array(v.id("emailThreads")),
    version: v.number(),
    isActive: v.boolean(),
    isPrimary: v.boolean(), // For multi-persona Professional tier
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_version", ["clientId", "version"])
    .index("by_client_and_active", ["clientId", "isActive"]),

  /**
   * MIND_MAPS
   * Auto-expanding mind maps
   */
  mindMaps: defineTable({
    clientId: v.id("clients"),
    rootNode: v.object({
      id: v.string(),
      label: v.string(),
      type: v.literal("business"),
    }),
    branches: v.array(
      v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        category: v.union(
          v.literal("product"),
          v.literal("audience"),
          v.literal("challenge"),
          v.literal("opportunity"),
          v.literal("competitor"),
          v.literal("expansion")
        ),
        color: v.string(), // Hex color code
        subNodes: v.array(
          v.object({
            id: v.string(),
            label: v.string(),
            details: v.optional(v.string()),
            sourceEmailId: v.optional(v.id("emailThreads")),
            addedAt: v.number(),
          })
        ),
        createdAt: v.number(),
      })
    ),
    autoExpandedFromEmails: v.array(v.id("emailThreads")),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_version", ["version"])
    .index("by_client_and_version", ["clientId", "version"]),

  /**
   * MARKETING_STRATEGIES
   * AI-generated marketing strategies
   */
  marketingStrategies: defineTable({
    clientId: v.id("clients"),
    strategyTitle: v.string(),
    executiveSummary: v.string(),
    marketAnalysis: v.string(),
    targetAudience: v.string(),
    uniqueSellingProposition: v.string(),
    competitorAnalysis: v.optional(v.string()), // Professional tier only
    marketingChannels: v.array(
      v.object({
        channel: v.string(),
        description: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })
    ),
    contentStrategy: v.string(),
    contentPillars: v.array(v.string()),
    campaignCalendar: v.optional(v.any()), // JSON structure
    successMetrics: v.array(
      v.object({
        metric: v.string(),
        target: v.string(),
        timeframe: v.string(),
      })
    ),
    budgetGuidance: v.optional(v.string()),
    platformStrategies: v.array(
      v.object({
        platform: v.union(
          v.literal("facebook"),
          v.literal("instagram"),
          v.literal("tiktok"),
          v.literal("linkedin")
        ),
        strategy: v.string(),
        tactics: v.array(v.string()),
      })
    ),
    version: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_version", ["clientId", "version"])
    .index("by_client_and_active", ["clientId", "isActive"]),

  /**
   * SOCIAL_CAMPAIGNS
   * Platform-specific social media campaigns
   */
  socialCampaigns: defineTable({
    clientId: v.id("clients"),
    strategyId: v.optional(v.id("marketingStrategies")),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin")
    ),
    campaignName: v.string(),
    campaignThemes: v.array(v.string()),
    adCopyVariations: v.array(
      v.object({
        variant: v.string(),
        copy: v.string(),
        cta: v.string(),
      })
    ),
    visualRequirements: v.object({
      imageSpecs: v.optional(v.string()),
      videoSpecs: v.optional(v.string()),
      styleGuidelines: v.optional(v.string()),
    }),
    audienceTargeting: v.optional(v.any()), // JSON structure
    timeline: v.object({
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      milestones: v.array(
        v.object({
          date: v.number(),
          description: v.string(),
        })
      ),
    }),
    contentCalendar: v.array(
      v.object({
        date: v.number(),
        contentType: v.string(),
        description: v.string(),
        status: v.union(
          v.literal("draft"),
          v.literal("scheduled"),
          v.literal("published")
        ),
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_platform", ["platform"])
    .index("by_client_and_platform", ["clientId", "platform"])
    .index("by_status", ["status"]),

  /**
   * HOOKS_SCRIPTS
   * Library of marketing hooks and scripts
   */
  hooksScripts: defineTable({
    clientId: v.id("clients"),
    hookText: v.string(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("email"),
      v.literal("youtube"),
      v.literal("general")
    ),
    category: v.union(
      v.literal("awareness"),
      v.literal("consideration"),
      v.literal("conversion"),
      v.literal("retention")
    ),
    scriptType: v.union(
      v.literal("hook"),
      v.literal("email_subject"),
      v.literal("social_caption"),
      v.literal("ad_copy"),
      v.literal("video_script"),
      v.literal("sales_script"),
      v.literal("cta")
    ),
    effectivenessScore: v.number(), // 1-10
    contextExplanation: v.string(), // Why this hook works
    suggestedUse: v.string(),
    tags: v.array(v.string()),
    isFavorite: v.boolean(),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_platform", ["platform"])
    .index("by_category", ["category"])
    .index("by_type", ["scriptType"])
    .index("by_client_and_platform", ["clientId", "platform"])
    .index("by_client_and_favorite", ["clientId", "isFavorite"]),

  /**
   * IMAGE_CONCEPTS
   * DALL-E generated image concepts
   */
  imageConcepts: defineTable({
    clientId: v.id("clients"),
    campaignId: v.optional(v.id("socialCampaigns")),
    conceptType: v.union(
      v.literal("social_post"),
      v.literal("product_mockup"),
      v.literal("marketing_visual"),
      v.literal("ad_creative"),
      v.literal("brand_concept")
    ),
    platform: v.optional(
      v.union(
        v.literal("facebook"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("linkedin"),
        v.literal("general")
      )
    ),
    prompt: v.string(), // DALL-E prompt used
    imageUrl: v.string(), // Generated image URL
    thumbnailUrl: v.optional(v.string()),
    dalleImageId: v.optional(v.string()),
    style: v.string(), // "modern", "minimalist", "bold", etc.
    colorPalette: v.array(v.string()), // Hex colors
    dimensions: v.object({
      width: v.number(),
      height: v.number(),
    }),
    alternativeConcepts: v.array(
      v.object({
        imageUrl: v.string(),
        prompt: v.string(),
      })
    ),
    usageRecommendations: v.string(),
    technicalSpecs: v.optional(v.string()),
    isUsed: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_campaign", ["campaignId"])
    .index("by_type", ["conceptType"])
    .index("by_client_and_type", ["clientId", "conceptType"])
    .index("by_platform", ["platform"]),

  /**
   * SOCIAL_COPY_TEMPLATES
   * Pre-built and AI-generated social media copy templates
   */
  socialCopyTemplates: defineTable({
    clientId: v.id("clients"),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("twitter")
    ),
    category: v.union(
      v.literal("promotional"),
      v.literal("educational"),
      v.literal("engagement"),
      v.literal("brand_story"),
      v.literal("user_generated"),
      v.literal("behind_scenes"),
      v.literal("product_launch"),
      v.literal("seasonal"),
      v.literal("testimonial"),
      v.literal("how_to")
    ),
    templateName: v.string(),
    copyText: v.string(),
    hashtags: v.array(v.string()),
    emojiSuggestions: v.array(v.string()),
    characterCount: v.number(),
    callToAction: v.optional(v.string()),
    variations: v.array(
      v.object({
        copy: v.string(),
        tone: v.string(),
      })
    ),
    performancePrediction: v.object({
      estimatedReach: v.string(),
      estimatedEngagement: v.string(),
      bestTimeToPost: v.string(),
    }),
    aiGenerated: v.boolean(),
    usageCount: v.number(),
    isFavorite: v.boolean(),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_platform", ["platform"])
    .index("by_category", ["category"])
    .index("by_client_and_platform", ["clientId", "platform"])
    .index("by_favorite", ["isFavorite"]),

  /**
   * LANDING_PAGE_CHECKLISTS
   * DIY landing page builder with AI-generated copy
   */
  landingPageChecklists: defineTable({
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
    completionPercentage: v.number(),
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
    colorScheme: v.optional(
      v.object({
        primary: v.string(),
        secondary: v.string(),
        accent: v.string(),
        background: v.string(),
        text: v.string(),
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_type", ["pageType"])
    .index("by_client_and_type", ["clientId", "pageType"])
    .index("by_status", ["status"]),

  /**
   * USAGE_TRACKING
   * Track usage limits for tier-based features
   */
  usageTracking: defineTable({
    orgId: v.id("organizations"),
    metricType: v.union(
      v.literal("emails_analyzed"),
      v.literal("personas_generated"),
      v.literal("campaigns_created"),
      v.literal("images_generated"),
      v.literal("hooks_generated"),
      v.literal("strategies_generated"),
      v.literal("templates_generated"),
      v.literal("landing_pages_created")
    ),
    count: v.number(),
    limitAmount: v.optional(v.number()), // null for unlimited
    periodStart: v.number(),
    periodEnd: v.number(), // Billing period end
    resetAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_org", ["orgId"])
    .index("by_metric", ["metricType"])
    .index("by_org_and_metric", ["orgId", "metricType"])
    .index("by_period", ["periodStart", "periodEnd"]),

  /**
   * COMPETITORS
   * Competitor information for analysis (Professional tier only)
   */
  competitors: defineTable({
    clientId: v.id("clients"),
    competitorName: v.string(),
    website: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("direct"),
      v.literal("indirect"),
      v.literal("potential")
    ),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    pricing: v.optional(
      v.object({
        model: v.string(),
        range: v.string(),
      })
    ),
    targetAudience: v.array(v.string()),
    marketingChannels: v.array(v.string()),
    contentStrategy: v.optional(v.string()),
    socialPresence: v.object({
      facebook: v.optional(v.string()),
      instagram: v.optional(v.string()),
      linkedin: v.optional(v.string()),
      tiktok: v.optional(v.string()),
      twitter: v.optional(v.string()),
    }),
    logoUrl: v.optional(v.string()),
    screenshots: v.array(v.string()),
    lastAnalyzed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_category", ["category"])
    .index("by_client_and_category", ["clientId", "category"]),

  /**
   * COMPETITOR_ANALYSES
   * AI-generated competitor analysis reports (Professional tier only)
   */
  competitorAnalyses: defineTable({
    clientId: v.id("clients"),
    analysisDate: v.number(),
    competitorsAnalyzed: v.array(v.id("competitors")),
    marketGaps: v.array(
      v.object({
        gap: v.string(),
        opportunity: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })
    ),
    differentiationOpportunities: v.array(
      v.object({
        area: v.string(),
        recommendation: v.string(),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })
    ),
    pricingAnalysis: v.object({
      marketAverage: v.string(),
      yourPosition: v.string(),
      recommendation: v.string(),
    }),
    swotAnalysis: v.object({
      strengths: v.array(v.string()),
      weaknesses: v.array(v.string()),
      opportunities: v.array(v.string()),
      threats: v.array(v.string()),
    }),
    contentGaps: v.array(
      v.object({
        topic: v.string(),
        competitorCoverage: v.string(),
        yourCoverage: v.string(),
        recommendation: v.string(),
      })
    ),
    actionableInsights: v.array(
      v.object({
        insight: v.string(),
        action: v.string(),
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
      })
    ),
    aiSummary: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_date", ["analysisDate"])
    .index("by_client_and_date", ["clientId", "analysisDate"]),

  /**
   * CONTENT_CALENDAR_POSTS
   * AI-generated 30-day content calendar with posting recommendations
   */
  contentCalendarPosts: defineTable({
    clientId: v.id("clients"),
    strategyId: v.optional(v.id("marketingStrategies")),
    scheduledDate: v.number(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("linkedin"),
      v.literal("blog"),
      v.literal("email")
    ),
    postType: v.union(
      v.literal("promotional"),
      v.literal("educational"),
      v.literal("engagement"),
      v.literal("brand_story"),
      v.literal("user_generated")
    ),
    contentPillar: v.string(),
    suggestedCopy: v.string(),
    suggestedHashtags: v.array(v.string()),
    suggestedImagePrompt: v.optional(v.string()),
    imageConceptId: v.optional(v.id("imageConcepts")),
    status: v.union(
      v.literal("suggested"),
      v.literal("approved"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    engagement: v.optional(
      v.object({
        likes: v.number(),
        comments: v.number(),
        shares: v.number(),
      })
    ),
    aiReasoning: v.string(),
    bestTimeToPost: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    callToAction: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_and_date", ["clientId", "scheduledDate"])
    .index("by_platform", ["platform"])
    .index("by_status", ["status"])
    .index("by_client_platform_date", ["clientId", "platform", "scheduledDate"])
    .index("by_strategy", ["strategyId"]),

  /**
   * EMAIL_SEQUENCES
   * Multi-step email sequences (cold outreach, lead nurture, onboarding)
   */
  emailSequences: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    description: v.optional(v.string()),
    sequenceType: v.union(
      v.literal("cold_outreach"),
      v.literal("lead_nurture"),
      v.literal("onboarding"),
      v.literal("re_engagement"),
      v.literal("custom")
    ),
    targetPersona: v.optional(v.id("personas")),
    goal: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("archived")
    ),
    totalSteps: v.number(),
    isTemplate: v.boolean(),
    templateCategory: v.optional(v.string()),
    tags: v.array(v.string()),
    metrics: v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      replied: v.number(),
      converted: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_type", ["sequenceType"])
    .index("by_status", ["status"])
    .index("by_client_and_type", ["clientId", "sequenceType"])
    .index("by_template", ["isTemplate"])
    .index("by_persona", ["targetPersona"]),

  /**
   * EMAIL_SEQUENCE_STEPS
   * Individual steps in an email sequence
   */
  emailSequenceSteps: defineTable({
    sequenceId: v.id("emailSequences"),
    stepNumber: v.number(),
    stepName: v.string(),
    dayDelay: v.number(),
    subjectLine: v.string(),
    preheaderText: v.optional(v.string()),
    emailBody: v.string(),
    emailBodyHtml: v.optional(v.string()),
    cta: v.object({
      text: v.string(),
      url: v.optional(v.string()),
      type: v.union(
        v.literal("button"),
        v.literal("link"),
        v.literal("reply"),
        v.literal("calendar")
      ),
    }),
    aiGenerated: v.boolean(),
    aiReasoning: v.optional(v.string()),
    personalizationTags: v.array(v.string()),
    alternatives: v.array(
      v.object({
        subjectLine: v.string(),
        emailBody: v.string(),
        abTestWeight: v.optional(v.number()),
      })
    ),
    conditionalLogic: v.optional(
      v.object({
        condition: v.string(),
        action: v.string(),
      })
    ),
    metrics: v.object({
      sent: v.number(),
      delivered: v.number(),
      opened: v.number(),
      clicked: v.number(),
      replied: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sequence", ["sequenceId"])
    .index("by_step_number", ["stepNumber"])
    .index("by_sequence_and_step", ["sequenceId", "stepNumber"]),

  /**
   * EMAIL_SEQUENCE_CONTACTS
   * Track which contacts are in which sequences
   */
  emailSequenceContacts: defineTable({
    sequenceId: v.id("emailSequences"),
    contactEmail: v.string(),
    contactName: v.optional(v.string()),
    currentStep: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed"),
      v.literal("unsubscribed"),
      v.literal("bounced")
    ),
    startedAt: v.number(),
    lastEmailSentAt: v.optional(v.number()),
    nextEmailScheduledAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    interactionHistory: v.array(
      v.object({
        stepNumber: v.number(),
        action: v.string(),
        timestamp: v.number(),
        metadata: v.optional(v.any()),
      })
    ),
    personalizationData: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sequence", ["sequenceId"])
    .index("by_email", ["contactEmail"])
    .index("by_status", ["status"])
    .index("by_next_scheduled", ["nextEmailScheduledAt"]),

  /**
   * EMAIL_SEQUENCE_TEMPLATES
   * Pre-built sequence templates
   */
  emailSequenceTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.union(
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
    ),
    sequenceType: v.union(
      v.literal("cold_outreach"),
      v.literal("lead_nurture"),
      v.literal("onboarding"),
      v.literal("re_engagement"),
      v.literal("custom")
    ),
    industry: v.optional(v.string()),
    targetAudience: v.string(),
    goal: v.string(),
    totalSteps: v.number(),
    estimatedConversionRate: v.optional(v.string()),
    recommendedFor: v.array(v.string()),
    isPremium: v.boolean(),
    popularityScore: v.number(),
    stepsPreview: v.array(
      v.object({
        stepNumber: v.number(),
        dayDelay: v.number(),
        subject: v.string(),
        preview: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_type", ["sequenceType"])
    .index("by_premium", ["isPremium"])
    .index("by_popularity", ["popularityScore"]),
});
