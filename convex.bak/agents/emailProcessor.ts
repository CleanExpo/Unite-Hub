import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * AI Email Processing Agent
 * Uses Claude to analyze incoming emails and extract:
 * - Intents (inquiry, followup, complaint, question, etc.)
 * - Sentiment (positive, neutral, negative)
 * - Summary
 * - Contact association
 */

export const processEmail = action({
  args: {
    orgId: v.id("organizations"),
    emailId: v.id("emails"),
  },
  handler: async (ctx, { orgId, emailId }) => {
    // 1. Get the email
    const email = await ctx.runQuery(api.emails.getById, { emailId });
    if (!email || email.orgId !== orgId) {
      throw new Error("Email not found or access denied");
    }

    if (email.isProcessed) {
      return { status: "already_processed", emailId };
    }

    console.log(`🤖 Processing email: ${email.subject}`);

    // 2. Analyze with Claude (simulated - replace with actual API call)
    const analysis = await analyzeEmailWithClaude({
      from: email.from,
      subject: email.subject,
      body: email.body,
    });

    // 3. Find or create contact
    let contactId = email.contactId;
    if (!contactId) {
      // Extract email address
      const fromEmail = extractEmail(email.from);
      const fromName = extractName(email.from);

      // Check if contact exists
      const existingContact = await ctx.runQuery(api.contacts.getByEmail, {
        orgId: email.orgId,
        workspaceId: email.workspaceId,
        email: fromEmail,
      });

      if (existingContact) {
        contactId = existingContact._id;
      } else {
        // Create new contact
        contactId = await ctx.runMutation(api.contacts.upsert, {
          orgId: email.orgId,
          workspaceId: email.workspaceId,
          email: fromEmail,
          name: fromName || fromEmail,
          source: "email",
          tags: ["email-import"],
        });
      }
    }

    // 4. Mark email as processed with AI insights
    await ctx.runMutation(api.emails.markProcessed, {
      orgId,
      emailId,
      contactId,
      intents: analysis.intents,
      sentiment: analysis.sentiment,
      summary: analysis.summary,
    });

    // 5. Update contact AI score based on email engagement
    if (contactId) {
      const scoreAdjustment = calculateEngagementScore(analysis);
      await ctx.runMutation(api.contacts.updateAiScore, {
        orgId,
        contactId,
        score: scoreAdjustment,
      });
    }

    // 6. Log audit
    await ctx.runMutation(api.system.logAudit, {
      orgId,
      action: "email_processed",
      resource: "email",
      resourceId: emailId,
      agent: "email-processor",
      details: JSON.stringify({
        intents: analysis.intents,
        sentiment: analysis.sentiment,
        contactId,
      }),
      status: "success",
    });

    console.log(`✅ Email processed: ${analysis.intents.join(", ")}`);

    return {
      status: "processed",
      emailId,
      contactId,
      analysis,
    };
  },
});

/**
 * Process all unprocessed emails in a workspace
 */
export const processBatch = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { orgId, workspaceId, limit = 10 }) => {
    const unprocessedEmails = await ctx.runQuery(api.emails.getUnprocessed, {
      orgId,
      workspaceId,
      limit,
    });

    console.log(`📧 Processing ${unprocessedEmails.length} emails...`);

    const results = [];
    for (const email of unprocessedEmails) {
      try {
        const result = await ctx.runAction(api.agents.emailProcessor.processEmail, {
          orgId,
          emailId: email._id,
        });
        results.push(result);
      } catch (error) {
        console.error(`❌ Error processing email ${email._id}:`, error);
        results.push({ status: "error", emailId: email._id, error: String(error) });
      }
    }

    return {
      processed: results.filter((r) => r.status === "processed").length,
      errors: results.filter((r) => r.status === "error").length,
      results,
    };
  },
});

// ============ HELPER FUNCTIONS ============

/**
 * Analyze email with Claude API
 * TODO: Replace with actual Anthropic API call
 */
async function analyzeEmailWithClaude(email: {
  from: string;
  subject: string;
  body: string;
}) {
  // Simulated AI analysis
  // In production, call Anthropic API:
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const message = await anthropic.messages.create({ ... });

  const intents: string[] = [];
  const body = email.body.toLowerCase();
  const subject = email.subject.toLowerCase();

  // Intent detection (simple keyword matching - replace with Claude)
  if (
    body.includes("interested") ||
    body.includes("inquiry") ||
    subject.includes("interested")
  ) {
    intents.push("inquiry");
  }
  if (
    body.includes("follow") ||
    body.includes("checking in") ||
    subject.includes("follow")
  ) {
    intents.push("followup");
  }
  if (
    body.includes("proposal") ||
    body.includes("quote") ||
    subject.includes("proposal")
  ) {
    intents.push("proposal");
  }
  if (body.includes("meeting") || body.includes("schedule") || body.includes("call")) {
    intents.push("meeting");
  }
  if (body.includes("question") || body.includes("wondering") || body.includes("?")) {
    intents.push("question");
  }

  // Sentiment detection (simple - replace with Claude)
  let sentiment = "neutral";
  if (
    body.includes("love") ||
    body.includes("excited") ||
    body.includes("great") ||
    body.includes("thank")
  ) {
    sentiment = "positive";
  } else if (
    body.includes("disappoint") ||
    body.includes("concern") ||
    body.includes("issue")
  ) {
    sentiment = "negative";
  }

  // Generate summary (truncate - replace with Claude)
  const summary = email.body.substring(0, 150) + (email.body.length > 150 ? "..." : "");

  return {
    intents: intents.length > 0 ? intents : ["general"],
    sentiment,
    summary,
  };
}

/**
 * Extract email address from "Name <email@domain.com>" format
 */
function extractEmail(from: string): string {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from;
}

/**
 * Extract name from "Name <email@domain.com>" format
 */
function extractName(from: string): string | null {
  const match = from.match(/^(.+?)\s*</);
  return match ? match[1].trim() : null;
}

/**
 * Calculate engagement score based on email analysis
 */
function calculateEngagementScore(analysis: {
  intents: string[];
  sentiment: string;
}): number {
  let score = 50; // Base score

  // Positive sentiment boost
  if (analysis.sentiment === "positive") score += 15;
  if (analysis.sentiment === "negative") score -= 10;

  // Intent-based scoring
  if (analysis.intents.includes("proposal")) score += 20;
  if (analysis.intents.includes("inquiry")) score += 15;
  if (analysis.intents.includes("meeting")) score += 10;
  if (analysis.intents.includes("followup")) score += 5;

  return Math.min(100, Math.max(0, score));
}
