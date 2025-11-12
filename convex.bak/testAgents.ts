import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Test suite for AI agents
 * Demonstrates all three agents working with seeded data
 */

export const testAll = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { orgId, workspaceId }) => {
    console.log("🧪 Starting AI Agent Test Suite...\n");

    const results: any = {
      emailProcessor: null,
      contentGenerator: null,
      contactIntelligence: null,
    };

    try {
      // ========== TEST 1: Email Processing Agent ==========
      console.log("📧 TEST 1: Email Processing Agent");
      console.log("Processing unprocessed emails...\n");

      const emailResults = await ctx.runAction(
        api.agents.emailProcessor.processBatch,
        {
          orgId,
          workspaceId,
          limit: 5,
        }
      );

      results.emailProcessor = emailResults;
      console.log(
        `✅ Processed ${emailResults.processed} emails, ${emailResults.errors} errors\n`
      );
    } catch (error) {
      console.error("❌ Email processor test failed:", error);
      results.emailProcessor = { error: String(error) };
    }

    try {
      // ========== TEST 2: Content Generation Agent ==========
      console.log("✍️ TEST 2: Content Generation Agent");
      console.log("Generating personalized outreach...\n");

      // Get first contact
      const contacts = await ctx.runQuery(api.contacts.listByStatus, {
        orgId,
        workspaceId,
        status: "prospect",
        limit: 1,
      });

      if (contacts.length > 0) {
        const contentResult = await ctx.runAction(
          api.agents.contentGenerator.generateOutreach,
          {
            orgId,
            workspaceId,
            contactId: contacts[0]._id,
            objective: "introduce_services",
          }
        );

        results.contentGenerator = contentResult;
        console.log(`✅ Generated content: ${contentResult.content.title}\n`);
      } else {
        console.log("⚠️ No contacts found for content generation\n");
        results.contentGenerator = { status: "skipped", reason: "no contacts" };
      }
    } catch (error) {
      console.error("❌ Content generator test failed:", error);
      results.contentGenerator = { error: String(error) };
    }

    try {
      // ========== TEST 3: Contact Intelligence Agent ==========
      console.log("🧠 TEST 3: Contact Intelligence Agent");
      console.log("Scoring contacts...\n");

      const intelligenceResults = await ctx.runAction(
        api.agents.contactIntelligence.scoreBatch,
        {
          orgId,
          workspaceId,
        }
      );

      results.contactIntelligence = intelligenceResults;
      console.log(
        `✅ Scored ${intelligenceResults.scored} contacts, ${intelligenceResults.highValue} high-value\n`
      );

      // Get high-value contacts
      const highValue = await ctx.runAction(
        api.agents.contactIntelligence.findHighValue,
        {
          orgId,
          workspaceId,
          threshold: 60,
        }
      );

      console.log(`📊 High-value contacts (score ≥ 60): ${highValue.count}`);
      highValue.contacts.forEach((c: any) => {
        console.log(
          `   - ${c.name} (${c.company}) - Score: ${c.score}/100`
        );
      });
    } catch (error) {
      console.error("❌ Contact intelligence test failed:", error);
      results.contactIntelligence = { error: String(error) };
    }

    console.log("\n🎉 AI Agent Test Suite Complete!");

    return {
      success: true,
      results,
      summary: {
        emailsProcessed: results.emailProcessor?.processed || 0,
        contentGenerated: results.contentGenerator?.contentId ? 1 : 0,
        contactsScored: results.contactIntelligence?.scored || 0,
      },
    };
  },
});

/**
 * Quick test: Process one email
 */
export const testEmailProcessor = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { orgId, workspaceId }) => {
    console.log("📧 Testing Email Processor...");

    const result = await ctx.runAction(api.agents.emailProcessor.processBatch, {
      orgId,
      workspaceId,
      limit: 1,
    });

    return result;
  },
});

/**
 * Quick test: Generate one piece of content
 */
export const testContentGenerator = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { orgId, workspaceId, contactId }) => {
    console.log("✍️ Testing Content Generator...");

    const result = await ctx.runAction(
      api.agents.contentGenerator.generateOutreach,
      {
        orgId,
        workspaceId,
        contactId,
        objective: "introduce_services",
      }
    );

    return result;
  },
});

/**
 * Quick test: Score one contact
 */
export const testContactIntelligence = action({
  args: {
    orgId: v.id("organizations"),
    contactId: v.id("contacts"),
  },
  handler: async (ctx, { orgId, contactId }) => {
    console.log("🧠 Testing Contact Intelligence...");

    const result = await ctx.runAction(
      api.agents.contactIntelligence.scoreContact,
      {
        orgId,
        contactId,
      }
    );

    return result;
  },
});
