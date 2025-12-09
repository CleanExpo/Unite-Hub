#!/usr/bin/env node

/**
 * Batch Email Intelligence Analysis - Production Scale
 *
 * Processes all emails in a workspace to extract business intelligence
 * Handles rate limiting, progress tracking, and error recovery
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const WORKSPACE_ID = process.argv[2] || process.env.TEST_WORKSPACE_ID || "YOUR_WORKSPACE_ID";
const BATCH_SIZE = 10; // Process 10 emails at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const DELAY_BETWEEN_EMAILS = 500; // 0.5 seconds between individual emails

console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║           BATCH EMAIL INTELLIGENCE ANALYSIS - PRODUCTION          ║
╚═══════════════════════════════════════════════════════════════════╝

Workspace: ${WORKSPACE_ID}
Batch Size: ${BATCH_SIZE} emails
Processing Speed: ~${BATCH_SIZE} emails per ${DELAY_BETWEEN_BATCHES/1000} seconds

`);

// Track statistics
const stats = {
  total: 0,
  processed: 0,
  alreadyProcessed: 0,
  successful: 0,
  failed: 0,
  totalIdeas: 0,
  totalGoals: 0,
  totalPainPoints: 0,
  totalRequirements: 0,
  costEstimate: 0,
  startTime: Date.now(),
};

async function extractEmailIntelligence(email) {
  const prompt = `Analyze this email conversation and extract business intelligence:

FROM: ${email.from_email}
TO: ${email.to_emails?.join(", ")}
SUBJECT: ${email.subject}
DATE: ${email.received_at}

CONTENT:
${email.snippet}

Extract the following in JSON format:
{
  "ideas": ["business ideas or concepts mentioned"],
  "business_goals": ["stated goals or objectives"],
  "pain_points": ["challenges or problems mentioned"],
  "requirements": ["specific needs or requirements"],
  "questions_asked": ["questions the sender asked"],
  "decisions_made": ["decisions or commitments made"],
  "sentiment": "positive|neutral|negative",
  "energy_level": 1-10,
  "decision_readiness": 1-10
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return null;
  } catch (error) {
    console.error(`   ❌ AI Analysis Error: ${error.message}`);
    throw error;
  }
}

async function processEmail(email, index, total) {
  const progress = `[${index + 1}/${total}]`;

  // Check if already processed
  const { data: existing } = await supabase
    .from("email_intelligence")
    .select("id")
    .eq("email_id", email.id)
    .maybeSingle();

  if (existing) {
    console.log(`${progress} ⏭️  Already processed: "${email.subject?.substring(0, 50)}..."`);
    stats.alreadyProcessed++;
    return true;
  }

  console.log(`${progress} 🤖 Analyzing: "${email.subject?.substring(0, 50)}..."`);

  try {
    const intelligence = await extractEmailIntelligence(email);

    if (!intelligence) {
      console.log(`${progress} ⚠️  No intelligence extracted`);
      stats.failed++;
      return false;
    }

    // Save to database
    const { error: saveError } = await supabase
      .from("email_intelligence")
      .insert({
        email_id: email.id,
        contact_id: email.contact_id,
        workspace_id: WORKSPACE_ID,
        ideas: intelligence.ideas || [],
        business_goals: intelligence.business_goals || [],
        pain_points: intelligence.pain_points || [],
        requirements: intelligence.requirements || [],
        questions_asked: intelligence.questions_asked || [],
        decisions_made: intelligence.decisions_made || [],
        sentiment: intelligence.sentiment,
        energy_level: intelligence.energy_level,
        decision_readiness: intelligence.decision_readiness,
        ai_model: "claude-sonnet-4-5-20250929",
        confidence_score: 0.85,
      });

    if (saveError) {
      console.log(`${progress} ❌ Save error: ${saveError.message}`);
      stats.failed++;
      return false;
    }

    // Update statistics
    stats.successful++;
    stats.totalIdeas += intelligence.ideas?.length || 0;
    stats.totalGoals += intelligence.business_goals?.length || 0;
    stats.totalPainPoints += intelligence.pain_points?.length || 0;
    stats.totalRequirements += intelligence.requirements?.length || 0;

    console.log(`${progress} ✅ ${intelligence.sentiment} | Ideas: ${intelligence.ideas?.length || 0} | Goals: ${intelligence.business_goals?.length || 0} | Pain: ${intelligence.pain_points?.length || 0}`);

    return true;
  } catch (error) {
    console.log(`${progress} ❌ Error: ${error.message}`);
    stats.failed++;
    return false;
  }
}

async function batchAnalyzeEmails() {
  try {
    // 1. Get all unprocessed emails from workspace
    console.log("📊 Fetching emails from workspace...\n");

    const { data: emails, error: emailError } = await supabase
      .from("client_emails")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .not("snippet", "is", null)
      .order("received_at", { ascending: false });

    if (emailError) {
      console.error("❌ Error fetching emails:", emailError.message);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log("⚠️  No emails found in workspace");
      console.log("\nTo add emails:");
      console.log("1. Sync from Gmail integration");
      console.log("2. Run: node scripts/create-sample-data-simple.mjs\n");
      return;
    }

    stats.total = emails.length;

    console.log(`✅ Found ${emails.length} emails to process\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 2. Process emails in batches
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, Math.min(i + BATCH_SIZE, emails.length));
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(emails.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} emails)\n`);

      // Process emails in batch sequentially to avoid rate limits
      for (let j = 0; j < batch.length; j++) {
        await processEmail(batch[j], i + j, emails.length);
        stats.processed++;

        // Small delay between emails
        if (j < batch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS));
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < emails.length) {
        console.log(`\n⏸️  Pausing ${DELAY_BETWEEN_BATCHES/1000}s before next batch...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // 3. Calculate final statistics
    const duration = (Date.now() - stats.startTime) / 1000;
    const estimatedCost = stats.successful * 0.005; // $0.005 per email

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📊 BATCH PROCESSING COMPLETE\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📈 Processing Statistics:");
    console.log(`   Total Emails: ${stats.total}`);
    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Already Processed: ${stats.alreadyProcessed}`);
    console.log(`   Successfully Analyzed: ${stats.successful}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Success Rate: ${((stats.successful / stats.processed) * 100).toFixed(1)}%`);

    console.log("\n🎯 Intelligence Extracted:");
    console.log(`   Ideas: ${stats.totalIdeas}`);
    console.log(`   Business Goals: ${stats.totalGoals}`);
    console.log(`   Pain Points: ${stats.totalPainPoints}`);
    console.log(`   Requirements: ${stats.totalRequirements}`);

    console.log("\n⏱️  Performance:");
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    console.log(`   Speed: ${(stats.processed / duration).toFixed(2)} emails/second`);

    console.log("\n💰 Cost:");
    console.log(`   Estimated: $${estimatedCost.toFixed(2)}`);
    console.log(`   Per Email: $0.005`);

    // 4. Verify data in database
    const { data: intelligenceRecords } = await supabase
      .from("email_intelligence")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID);

    console.log("\n💾 Database Verification:");
    console.log(`   Total Intelligence Records: ${intelligenceRecords?.length || 0}`);

    // 5. Generate summary by contact
    if (intelligenceRecords && intelligenceRecords.length > 0) {
      const contactStats = {};

      for (const record of intelligenceRecords) {
        if (!record.contact_id) continue;

        if (!contactStats[record.contact_id]) {
          contactStats[record.contact_id] = {
            ideas: 0,
            goals: 0,
            painPoints: 0,
            requirements: 0,
            emails: 0,
          };
        }

        contactStats[record.contact_id].ideas += record.ideas?.length || 0;
        contactStats[record.contact_id].goals += record.business_goals?.length || 0;
        contactStats[record.contact_id].painPoints += record.pain_points?.length || 0;
        contactStats[record.contact_id].requirements += record.requirements?.length || 0;
        contactStats[record.contact_id].emails += 1;
      }

      console.log("\n👥 Intelligence by Contact:");

      for (const [contactId, contactStat] of Object.entries(contactStats)) {
        // Get contact name
        const { data: contact } = await supabase
          .from("contacts")
          .select("name, email")
          .eq("id", contactId)
          .maybeSingle();

        if (contact) {
          console.log(`   ${contact.name} (${contact.email}):`);
          console.log(`     - Emails: ${contactStat.emails}`);
          console.log(`     - Ideas: ${contactStat.ideas}`);
          console.log(`     - Goals: ${contactStat.goals}`);
          console.log(`     - Pain Points: ${contactStat.painPoints}`);
          console.log(`     - Requirements: ${contactStat.requirements}`);
        }
      }
    }

    console.log("\n✅ Batch analysis complete!");
    console.log("\n📋 Next Steps:");
    console.log("   1. View intelligence in database: email_intelligence table");
    console.log("   2. Build knowledge graph: Phase 2");
    console.log("   3. Generate questionnaires: Phase 3");
    console.log("   4. Create marketing strategies: Phase 4\n");

  } catch (error) {
    console.error("\n❌ Batch processing failed:", error.message);
    console.error(error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\n\n⚠️  Process interrupted by user");
  console.log("\n📊 Progress so far:");
  console.log(`   Processed: ${stats.processed}/${stats.total}`);
  console.log(`   Successful: ${stats.successful}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log("\n💡 Tip: Already processed emails won't be re-analyzed if you run again\n");
  process.exit(0);
});

// Run batch analysis
batchAnalyzeEmails().catch(console.error);
