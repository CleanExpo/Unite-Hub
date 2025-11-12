import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * AI Contact Intelligence Agent
 * Analyzes contacts and updates engagement scores based on:
 * - Email interaction history
 * - Response patterns
 * - Sentiment analysis
 * - Industry and role data
 */

export const scoreContact = action({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { orgId, contactId }) => {
    console.log(`🧠 Analyzing contact: ${contactId}`);

    // 1. Get contact data
    const contact = await ctx.runQuery(api.contacts.get, { contactId });
    if (!contact || contact.orgId !== orgId) {
      throw new Error("Contact not found or access denied");
    }

    // 2. Get email history for this contact
    const emails = await ctx.runQuery(api.emails.getByContact, {
      orgId,
      contactId,
    });

    // 3. Calculate AI score based on multiple factors
    const score = calculateIntelligenceScore({
      contact,
      emails,
    });

    // 4. Update contact AI score
    await ctx.runMutation(api.contacts.updateAiScore, {
      orgId,
      contactId,
      score,
    });

    // 5. Generate insights
    const insights = generateContactInsights({ contact, emails, score });

    // 6. Add note with AI insights
    if (insights.length > 0) {
      await ctx.runMutation(api.contacts.addNote, {
        orgId,
        contactId,
        note: `AI Analysis:\n${insights.join("\n")}`,
      });
    }

    // 7. Log audit
    await ctx.runMutation(api.system.logAudit, {
      orgId,
      action: "contact_scored",
      resource: "contact",
      resourceId: contactId,
      agent: "contact-intelligence",
      details: JSON.stringify({
        score,
        emailCount: emails.length,
        insights: insights.length,
      }),
      status: "success",
    });

    console.log(`✅ Contact scored: ${score}/100`);

    return {
      status: "success",
      contactId,
      score,
      insights,
    };
  },
});

/**
 * Score all contacts in a workspace
 */
export const scoreBatch: any = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, minScore = 0 }) => {
    // Get all contacts in workspace
    const contacts = await ctx.runQuery(api.contacts.listByStatus, {
      orgId,
      workspaceId,
      status: "prospect",
      limit: 100,
    });

    console.log(`🧠 Scoring ${contacts.length} contacts...`);

    const results = [];
    for (const contact of contacts) {
      try {
        const result = await ctx.runAction(
          api.agents.contactIntelligence.scoreContact,
          {
            orgId,
            contactId: contact._id,
          }
        );

        if (result.score >= minScore) {
          results.push(result);
        }
      } catch (error) {
        console.error(`❌ Error scoring contact ${contact._id}:`, error);
        results.push({
          status: "error",
          contactId: contact._id,
          error: String(error),
        });
      }
    }

    return {
      total: contacts.length,
      scored: results.filter((r) => r.status === "success").length,
      highValue: results.filter((r) => r.score && r.score >= 70).length,
      results,
    };
  },
});

/**
 * Find high-value contacts based on AI scoring
 */
export const findHighValue: any = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, threshold = 70 }) => {
    const highValueContacts = await ctx.runQuery(api.contacts.listByAiScore, {
      orgId,
      workspaceId,
      minScore: threshold,
    });

    console.log(`📊 Found ${highValueContacts.length} high-value contacts`);

    return {
      count: highValueContacts.length,
      contacts: highValueContacts.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        company: c.company,
        score: c.aiScore,
        status: c.status,
      })),
    };
  },
});

// ============ HELPER FUNCTIONS ============

/**
 * Calculate intelligence score for a contact
 */
function calculateIntelligenceScore(data: {
  contact: any;
  emails: any[];
}): number {
  let score = 50; // Base score

  const { contact, emails } = data;

  // Email engagement (0-30 points)
  const emailCount = emails.length;
  if (emailCount > 0) score += Math.min(10, emailCount * 2);

  const recentEmails = emails.filter(
    (e) => Date.now() - e.timestamp < 30 * 24 * 60 * 60 * 1000
  ); // Last 30 days
  if (recentEmails.length > 0) score += Math.min(10, recentEmails.length * 3);

  // Sentiment analysis (0-20 points)
  const positiveEmails = emails.filter((e) => e.aiSentiment === "positive");
  if (positiveEmails.length > 0) {
    score += Math.min(20, (positiveEmails.length / emails.length) * 20);
  }

  // Intent quality (0-20 points)
  const highValueIntents = ["proposal", "inquiry", "meeting"];
  const hasHighValueIntent = emails.some((e) =>
    e.aiExtractedIntents.some((intent: string) => highValueIntents.includes(intent))
  );
  if (hasHighValueIntent) score += 15;

  // Contact quality (0-15 points)
  if (contact.company) score += 5;
  if (contact.jobTitle) {
    const seniorTitles = ["ceo", "cto", "vp", "director", "manager", "head"];
    if (
      seniorTitles.some((title) =>
        contact.jobTitle.toLowerCase().includes(title)
      )
    ) {
      score += 10;
    }
  }

  // Status progression (0-10 points)
  if (contact.status === "prospect") score += 10;
  if (contact.status === "client") score += 15;

  // Tags (0-5 points)
  const valueTags = ["high-value", "enterprise", "warm", "decision-maker"];
  const hasValueTag = contact.tags.some((tag: string) =>
    valueTags.includes(tag)
  );
  if (hasValueTag) score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Generate insights about a contact
 */
function generateContactInsights(data: {
  contact: any;
  emails: any[];
  score: number;
}): string[] {
  const insights: string[] = [];
  const { contact, emails, score } = data;

  // Score tier
  if (score >= 80) {
    insights.push("🔥 High-priority contact - Excellent engagement");
  } else if (score >= 60) {
    insights.push("⭐ Moderate engagement - Good potential");
  } else if (score < 40) {
    insights.push("💤 Low engagement - Consider re-engagement campaign");
  }

  // Email activity
  if (emails.length > 0) {
    const recentEmails = emails.filter(
      (e) => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
    );
    if (recentEmails.length > 0) {
      insights.push(`📧 ${recentEmails.length} emails in last 7 days - Active engagement`);
    }

    const positiveCount = emails.filter((e) => e.aiSentiment === "positive").length;
    if (positiveCount > emails.length * 0.7) {
      insights.push("😊 Predominantly positive sentiment");
    }
  }

  // Intent analysis
  const proposalIntents = emails.filter((e) =>
    e.aiExtractedIntents.includes("proposal")
  );
  if (proposalIntents.length > 0) {
    insights.push("💼 Has shown interest in proposals");
  }

  const meetingIntents = emails.filter((e) =>
    e.aiExtractedIntents.includes("meeting")
  );
  if (meetingIntents.length > 0) {
    insights.push("📅 Expressed interest in meetings");
  }

  // Contact quality
  if (contact.jobTitle) {
    const decisionMaker = ["ceo", "cto", "vp", "director"];
    if (
      decisionMaker.some((title) =>
        contact.jobTitle.toLowerCase().includes(title)
      )
    ) {
      insights.push("👔 Decision-maker role");
    }
  }

  // Follow-up recommendation
  if (contact.nextFollowUp && contact.nextFollowUp < Date.now()) {
    insights.push("⏰ Follow-up overdue - Action recommended");
  }

  return insights;
}
