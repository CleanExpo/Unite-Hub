import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Seed script to populate Duncan's organization with test data
 * Run once to initialize the system
 */

export const seedDuncan = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🌱 Starting Duncan's organization seed...");

    // 1. Create Duncan's organization
    const orgId = await ctx.db.insert("organizations", {
      name: "Duncan's Marketing Agency",
      slug: "duncans-agency",
      tier: "pro",
      description: "Premium marketing and campaign management",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("✅ Organization created:", orgId);

    // 2. Create Duncan (owner)
    const duncanUserId = await ctx.db.insert("users", {
      orgId,
      email: "duncan@duncansagency.com",
      name: "Duncan",
      role: "owner",
      status: "active",
      createdAt: Date.now(),
    });

    console.log("✅ Duncan user created:", duncanUserId);

    // 3. Create team members
    const teamMemberId1 = await ctx.db.insert("users", {
      orgId,
      email: "sarah@duncansagency.com",
      name: "Sarah - Content Manager",
      role: "manager",
      status: "active",
      createdAt: Date.now(),
    });

    const teamMemberId2 = await ctx.db.insert("users", {
      orgId,
      email: "mike@duncansagency.com",
      name: "Mike - Email Specialist",
      role: "manager",
      status: "active",
      createdAt: Date.now(),
    });

    console.log("✅ Team members created");

    // 4. Create primary workspace (Q4 Campaign)
    const workspaceId = await ctx.db.insert("workspaces", {
      orgId,
      name: "Q4 2024 Campaign",
      description: "Holiday season marketing push",
      type: "campaign",
      owner: duncanUserId,
      members: [duncanUserId, teamMemberId1, teamMemberId2],
      settings: { budget: 50000, target: "ecommerce" },
      isActive: true,
      createdAt: Date.now(),
    });

    console.log("✅ Workspace created:", workspaceId);

    // 5. Create sample contacts (leads/prospects)
    const contacts = [
      {
        email: "john@techstartup.com",
        name: "John Smith",
        company: "TechStartup Inc",
        jobTitle: "CEO",
        industry: "Technology",
        source: "linkedin",
        tags: ["high-value", "tech", "ceo"],
        status: "prospect",
      },
      {
        email: "lisa@ecommerce.com",
        name: "Lisa Johnson",
        company: "eCommerce Solutions",
        jobTitle: "Marketing Director",
        industry: "eCommerce",
        source: "referral",
        tags: ["warm", "ecommerce", "decision-maker"],
        status: "prospect",
      },
      {
        email: "carlos@agency.co",
        name: "Carlos Rodriguez",
        company: "Creative Agency Co",
        jobTitle: "Account Manager",
        industry: "Marketing",
        source: "email",
        tags: ["warm", "agency", "partnership"],
        status: "lead",
      },
      {
        email: "emma@consulting.com",
        name: "Emma Chen",
        company: "Business Consulting Ltd",
        jobTitle: "VP of Strategy",
        industry: "Consulting",
        source: "event",
        tags: ["enterprise", "consulting", "vp"],
        status: "lead",
      },
      {
        email: "david@retail.com",
        name: "David Thompson",
        company: "Retail Plus Group",
        jobTitle: "Digital Marketing Manager",
        industry: "Retail",
        source: "website",
        tags: ["retail", "mid-market", "warm"],
        status: "prospect",
      },
    ];

    const contactIds: any[] = [];
    for (const contact of contacts) {
      const contactId = await ctx.db.insert("contacts", {
        orgId,
        workspaceId,
        email: contact.email,
        name: contact.name,
        company: contact.company,
        jobTitle: contact.jobTitle,
        industry: contact.industry,
        source: contact.source,
        tags: contact.tags,
        status: contact.status,
        customFields: {},
        notes: "",
        lastInteraction: Date.now(),
        nextFollowUp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        owner: duncanUserId,
        aiScore: Math.floor(Math.random() * 100), // Random 0-100
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      contactIds.push(contactId);
    }

    console.log("✅ Created 5 sample contacts");

    // 6. Create sample emails (received)
    const emails = [
      {
        from: "john@techstartup.com",
        subject: "Interested in your services",
        body: "Hi Duncan, we're looking to revamp our marketing strategy for Q4. Would love to chat about partnership opportunities.",
        intents: ["inquiry", "partnership"],
        sentiment: "positive",
      },
      {
        from: "lisa@ecommerce.com",
        subject: "Follow-up: Campaign proposal",
        body: "Thanks for the proposal! Our team loved the creative direction. Can we schedule a call to discuss pricing?",
        intents: ["followup", "proposal"],
        sentiment: "positive",
      },
      {
        from: "carlos@agency.co",
        subject: "Q4 Planning Session",
        body: "Let's sync up on Q4 campaigns. I think there's potential for collaboration between our teams.",
        intents: ["meeting", "collaboration"],
        sentiment: "positive",
      },
    ];

    for (let i = 0; i < emails.length; i++) {
      await ctx.db.insert("emails", {
        orgId,
        workspaceId,
        contactId: contactIds[i],
        messageId: `msg_${Date.now()}_${i}`,
        from: emails[i].from,
        to: "duncan@duncansagency.com",
        subject: emails[i].subject,
        body: emails[i].body,
        timestamp: Date.now() - (i * 60 * 60 * 1000), // Staggered timestamps
        isRead: i === 0, // First one read
        isProcessed: false,
        aiExtractedIntents: emails[i].intents,
        aiSentiment: emails[i].sentiment,
        attachmentCount: 0,
        createdAt: Date.now(),
      });
    }

    console.log("✅ Created 3 sample emails");

    // 7. Create sample campaign
    const campaignId = await ctx.db.insert("campaigns", {
      orgId,
      workspaceId,
      name: "Holiday Email Campaign",
      description: "5-email sequence for Q4 holiday promotion",
      type: "email",
      status: "draft",
      targetContacts: contactIds.slice(0, 3), // First 3 contacts
      createdBy: duncanUserId,
      scheduledStart: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days from now
      scheduledEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
      settings: { frequency: "daily", timezone: "UTC" },
      metrics: { opens: 0, clicks: 0, replies: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log("✅ Campaign created:", campaignId);

    // 8. Create sample generated content drafts
    const contentDrafts = [
      {
        title: "Welcome Email - TechStartup",
        contentType: "email",
        prompt: "Generate a professional welcome email for a CEO of a tech startup, highlighting our services",
        text: "Hi John,\n\nWe're excited to help TechStartup Inc. scale your marketing efforts for Q4. Our proven strategies have helped 50+ tech companies increase their revenue by an average of 35%.\n\nWould love to chat about how we can support your growth.\n\nBest regards,\nDuncan",
      },
      {
        title: "Follow-up Proposal - eCommerce Solutions",
        contentType: "proposal",
        prompt: "Create a follow-up email for eCommerce director after proposal sent",
        text: "Hi Lisa,\n\nThank you for your interest in our campaign proposal. Here are the key highlights:\n\n• Estimated reach: 100k customers\n• Expected ROI: 4.2x\n• Timeline: 60 days\n\nLet's schedule a call to discuss next steps.\n\nBest,\nDuncan",
      },
    ];

    for (const draft of contentDrafts) {
      await ctx.db.insert("generatedContent", {
        orgId,
        workspaceId,
        contactId: contactIds[0],
        contentType: draft.contentType,
        title: draft.title,
        originalPrompt: draft.prompt,
        generatedText: draft.text,
        aiModel: "sonnet",
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    console.log("✅ Created 2 content drafts");

    // 9. Log seed completion
    await ctx.db.insert("auditLogs", {
      orgId,
      action: "system_seed",
      resource: "organization",
      agent: "seed-script",
      details: JSON.stringify({
        users: 3,
        contacts: 5,
        emails: 3,
        campaigns: 1,
        contentDrafts: 2,
      }),
      status: "success",
      timestamp: Date.now(),
    });

    console.log("✅ Audit logged");

    return {
      success: true,
      data: {
        orgId,
        workspaceId,
        contactIds,
        campaignId,
        message: "Duncan's organization seeded successfully!",
      },
    };
  },
});
