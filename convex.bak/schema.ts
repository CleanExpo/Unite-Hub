import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ ORGANIZATIONS (Multi-Tenant Core) ============
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // unique URL identifier
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    tier: v.string(), // free, starter, pro, enterprise
    status: v.string(), // active, suspended, cancelled
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.any()), // Custom org data
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_tier", ["tier"]),

  // ============ USERS (Team Members) ============
  users: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.string(), // owner, admin, manager, member, viewer
    status: v.string(), // active, invited, inactive
    authId: v.optional(v.string()), // Auth0/Clerk ID
    lastLogin: v.optional(v.number()),
    preferences: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_email", ["email"])
    .index("by_authId", ["authId"]),

  // ============ WORKSPACES (Projects/Campaigns) ============
  workspaces: defineTable({
    orgId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // campaign, project, account, division
    owner: v.id("users"),
    members: v.array(v.id("users")), // Team members with access
    settings: v.optional(v.any()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_owner", ["owner"])
    .index("by_type", ["type"]),

  // ============ CONTACTS (CRM Core) ============
  contacts: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    email: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.string(), // lead, prospect, client, archived
    source: v.string(), // email, website, referral, manual, api
    tags: v.array(v.string()),
    customFields: v.optional(v.any()),
    notes: v.optional(v.string()),
    lastInteraction: v.optional(v.number()),
    nextFollowUp: v.optional(v.number()),
    owner: v.optional(v.id("users")),
    aiScore: v.optional(v.number()), // 0-100 engagement score
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId_workspaceId", ["orgId", "workspaceId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_source", ["source"])
    .index("by_aiScore", ["aiScore"]),

  // ============ EMAILS (Email Integration) ============
  emails: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.optional(v.id("contacts")),
    messageId: v.string(), // Gmail/Outlook message ID
    from: v.string(),
    to: v.string(),
    cc: v.optional(v.array(v.string())),
    bcc: v.optional(v.array(v.string())),
    subject: v.string(),
    body: v.string(),
    htmlBody: v.optional(v.string()),
    timestamp: v.number(),
    threadId: v.optional(v.string()),
    isRead: v.boolean(),
    isProcessed: v.boolean(),
    aiExtractedIntents: v.array(v.string()), // followup, proposal, complaint, question
    aiSentiment: v.optional(v.string()), // positive, neutral, negative
    aiSummary: v.optional(v.string()),
    attachmentCount: v.optional(v.number()),
    campaignId: v.optional(v.id("campaigns")),
    createdAt: v.number(),
  })
    .index("by_orgId_workspaceId", ["orgId", "workspaceId"])
    .index("by_contactId", ["contactId"])
    .index("by_isProcessed", ["isProcessed"])
    .index("by_timestamp", ["timestamp"])
    .index("by_threadId", ["threadId"]),

  // ============ CAMPAIGNS ============
  campaigns: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // email, outreach, nurture, conversion
    status: v.string(), // draft, scheduled, active, paused, completed
    targetContacts: v.array(v.id("contacts")),
    createdBy: v.id("users"),
    scheduledStart: v.optional(v.number()),
    scheduledEnd: v.optional(v.number()),
    settings: v.optional(v.any()),
    metrics: v.optional(v.any()), // opens, clicks, replies, conversions
    aiTemplate: v.optional(v.string()), // AI-generated template ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId_workspaceId", ["orgId", "workspaceId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // ============ GENERATED CONTENT ============
  generatedContent: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.optional(v.id("contacts")),
    campaignId: v.optional(v.id("campaigns")),
    contentType: v.string(), // email, proposal, case_study, outreach, followup
    title: v.string(),
    originalPrompt: v.string(),
    generatedText: v.string(),
    htmlVersion: v.optional(v.string()),
    aiModel: v.string(), // sonnet, opus, haiku
    status: v.string(), // draft, approved, sent, archived
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    performanceMetrics: v.optional(v.any()), // opens, clicks, etc
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_orgId_workspaceId", ["orgId", "workspaceId"])
    .index("by_contactId", ["contactId"])
    .index("by_status", ["status"])
    .index("by_contentType", ["contentType"]),

  // ============ COLLABORATIONS (Network Analysis) ============
  collaborations: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    participantIds: v.array(v.id("contacts")),
    type: v.string(), // email_thread, project, partnership, team
    strength: v.number(), // 0-100 connection strength
    interactionCount: v.number(),
    lastInteraction: v.number(),
    context: v.string(), // Description of collaboration
    tags: v.array(v.string()),
    aiAnalysis: v.optional(v.any()), // AI insights on relationship
    createdAt: v.number(),
  })
    .index("by_orgId_workspaceId", ["orgId", "workspaceId"])
    .index("by_strength", ["strength"]),

  // ============ INTEGRATIONS (API Connections) ============
  integrations: defineTable({
    orgId: v.id("organizations"),
    type: v.string(), // gmail, outlook, slack, salesforce, hubspot
    name: v.string(),
    status: v.string(), // connected, disconnected, error, pending
    credentials: v.optional(v.string()), // Encrypted
    lastSync: v.optional(v.number()),
    syncFrequency: v.optional(v.string()), // realtime, hourly, daily
    settings: v.optional(v.any()),
    connectedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  // ============ SYSTEM STATE ============
  systemState: defineTable({
    orgId: v.id("organizations"),
    key: v.string(), // unique identifier per org
    value: v.string(), // JSON stringified
    expiresAt: v.optional(v.number()),
    lastUpdated: v.number(),
  })
    .index("by_orgId_key", ["orgId", "key"]),

  // ============ AUDIT LOGS ============
  auditLogs: defineTable({
    orgId: v.id("organizations"),
    userId: v.optional(v.id("users")),
    action: v.string(), // email_processed, contact_created, content_approved
    resource: v.string(), // contact, email, campaign, content
    resourceId: v.optional(v.string()),
    agent: v.optional(v.string()), // email-agent, content-agent, etc
    details: v.string(), // JSON stringified
    status: v.string(), // success, error, warning
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_agent", ["agent"]),

  // ============ AI MEMORY (Context Persistence) ============
  aiMemory: defineTable({
    orgId: v.id("organizations"),
    workspaceId: v.optional(v.id("workspaces")),
    agent: v.string(), // orchestrator, email-agent, content-agent
    memoryType: v.string(), // context, state, insights, relationships
    key: v.string(),
    value: v.string(), // JSON stringified
    ttl: v.optional(v.number()), // Time to live in ms
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_orgId_agent", ["orgId", "agent"])
    .index("by_key", ["key"]),
});
