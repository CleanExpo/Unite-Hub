#!/usr/bin/env node

/**
 * Email Agent CLI
 * Processes unprocessed emails for a given workspace
 */

import { config } from "dotenv";
import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// Load environment variables from .env.local
config({ path: ".env.local" });

const client = new ConvexClient(process.env.CONVEX_URL || "http://127.0.0.1:3210");

// Configuration (from environment variables or defaults)
const ORG_ID = process.env.ORG_ID || "k57akqzf14r07d9q3pbf9kebvn7v7929";
const WORKSPACE_ID = process.env.WORKSPACE_ID || "kh72b1cng9h88691sx4x7krt2h7v7deh";

async function extractIntents(emailBody) {
  const intentMap = {
    inquiry: ["interested", "partnership", "collaboration", "services", "help"],
    proposal: ["proposal", "quote", "pricing", "investment", "deal"],
    complaint: ["issue", "problem", "concerned", "unhappy", "urgent", "error"],
    question: ["?", "how", "what", "when", "where", "why", "can you"],
    followup: ["follow up", "re:", "update", "following up"],
    meeting: ["meeting", "call", "sync", "schedule", "zoom", "teams"],
  };

  const intents = [];
  const lowerBody = emailBody.toLowerCase();

  for (const [intent, keywords] of Object.entries(intentMap)) {
    if (keywords.some((kw) => lowerBody.includes(kw))) {
      intents.push(intent);
    }
  }

  return intents.length > 0 ? intents : ["general"];
}

async function analyzeSentiment(emailBody) {
  const positiveWords = ["excited", "love", "great", "thank", "appreciate", "interested", "wonderful", "excellent"];
  const negativeWords = ["problem", "issue", "concerned", "unhappy", "urgent", "frustrated", "angry"];

  const lowerBody = emailBody.toLowerCase();

  const positiveCount = positiveWords.filter((word) => lowerBody.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerBody.includes(word)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

function generateSummary(from, subject, intents, sentiment) {
  const intentStr = intents.join(", ");
  return `${from} sent email with subject "${subject}". Intents: ${intentStr}. Sentiment: ${sentiment}.`;
}

async function processEmails() {
  try {
    console.log("📧 Email Agent Started");
    console.log(`Organization: ${ORG_ID}`);
    console.log(`Workspace: ${WORKSPACE_ID}\n`);

    // Fetch unprocessed emails
    console.log("🔍 Fetching unprocessed emails...");
    const unprocessedEmails = await client.query(api.emails.getUnprocessed, {
      orgId: ORG_ID,
      workspaceId: WORKSPACE_ID,
      limit: 50,
    });

    console.log(`Found ${unprocessedEmails.length} unprocessed emails\n`);

    if (unprocessedEmails.length === 0) {
      console.log("✅ No emails to process");
      return;
    }

    let processed = 0;
    let created = 0;
    let errors = 0;

    for (const email of unprocessedEmails) {
      try {
        console.log(`\n📨 Processing: "${email.subject}"`);
        console.log(`   From: ${email.from}`);

        // Extract sender email
        const senderEmail = email.from;

        // Try to link to existing contact
        let contactId = email.contactId;
        let isNewContact = false;

        if (!contactId) {
          console.log(`   🔗 Looking up contact...`);
          const existingContact = await client.query(api.contacts.getByEmail, {
            orgId: ORG_ID,
            workspaceId: WORKSPACE_ID,
            email: senderEmail,
          });

          if (existingContact) {
            contactId = existingContact._id;
            console.log(`   ✅ Linked to existing contact`);
          } else {
            // Create new contact
            console.log(`   ➕ Creating new contact...`);
            contactId = await client.mutation(api.contacts.upsert, {
              orgId: ORG_ID,
              workspaceId: WORKSPACE_ID,
              email: senderEmail,
              name: senderEmail.split("@")[0] || "Unknown",
              source: "email",
              tags: ["email-inbound"],
            });
            isNewContact = true;
            created++;
            console.log(`   ✅ New contact created`);
          }
        }

        // Analyze email
        console.log(`   🧠 Analyzing content...`);
        const intents = await extractIntents(email.body);
        const sentiment = await analyzeSentiment(email.body);
        const summary = generateSummary(email.from, email.subject, intents, sentiment);

        console.log(`   Intents: ${intents.join(", ")}`);
        console.log(`   Sentiment: ${sentiment}`);

        // Mark email as processed
        console.log(`   💾 Updating email status...`);
        await client.mutation(api.emails.markProcessed, {
          orgId: ORG_ID,
          emailId: email._id,
          contactId,
          intents,
          sentiment,
          summary,
        });

        // Update contact score based on sentiment
        console.log(`   📊 Updating contact score...`);
        let scoreBoost = 0;
        if (sentiment === "positive") scoreBoost = 15;
        else if (sentiment === "neutral") scoreBoost = 5;

        const newScore = Math.min(100, (email.contactId?.aiScore || 50) + scoreBoost);
        await client.mutation(api.contacts.updateAiScore, {
          orgId: ORG_ID,
          contactId,
          score: newScore,
        });

        // Add note to contact
        console.log(`   📝 Adding interaction note...`);
        await client.mutation(api.contacts.addNote, {
          orgId: ORG_ID,
          contactId,
          note: summary,
        });

        // Log audit event
        await client.mutation(api.system.logAudit, {
          orgId: ORG_ID,
          action: "email_processed",
          resource: "email",
          resourceId: email._id,
          agent: "email-agent",
          details: JSON.stringify({
            from: senderEmail,
            subject: email.subject,
            intents,
            sentiment,
            contactLinked: true,
            newContact: isNewContact,
          }),
          status: "success",
        });

        processed++;
        console.log(`   ✅ Email processed successfully`);
      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing email:`, error.message);

        // Log error
        await client.mutation(api.system.logAudit, {
          orgId: ORG_ID,
          action: "email_processing_error",
          resource: "email",
          resourceId: email._id,
          agent: "email-agent",
          details: JSON.stringify({
            from: email.from,
            subject: email.subject,
            error: error.message,
          }),
          status: "error",
          errorMessage: error.message,
        });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✅ Email Processing Complete");
    console.log("=".repeat(50));
    console.log(`Total processed: ${processed}`);
    console.log(`New contacts created: ${created}`);
    console.log(`Errors: ${errors}`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run agent
processEmails();
