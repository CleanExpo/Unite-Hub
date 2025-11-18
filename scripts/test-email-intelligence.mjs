#!/usr/bin/env node

/**
 * Test Email Intelligence Extraction
 *
 * Tests the Email Intelligence Agent on existing emails
 * Run after migration 039 is complete
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const WORKSPACE_ID = process.argv[2] || "5a92c7af-5aca-49a7-8866-3bfaa1d04532"; // Phill's workspace

console.log(`\n🧪 Testing Email Intelligence Extraction\n`);
console.log(`Workspace: ${WORKSPACE_ID}\n`);

async function extractEmailIntelligence(email) {
  const prompt = `Analyze this email conversation and extract business intelligence:

FROM: ${email.sender_email}
SUBJECT: ${email.subject}
DATE: ${email.received_at}

CONTENT:
${email.body_text || email.body_html?.replace(/<[^>]*>/g, '')}

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
}

async function testEmailIntelligence() {
  try {
    // 1. Get sample emails from the workspace
    const { data: emails, error: emailError } = await supabase
      .from("client_emails")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .not("body_text", "is", null)
      .order("received_at", { ascending: false })
      .limit(5);

    if (emailError) {
      console.error("❌ Error fetching emails:", emailError.message);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log("⚠️  No emails found in workspace");
      console.log("\nTo test with sample data:");
      console.log("1. Go to your Gmail integration");
      console.log("2. Sync some emails");
      console.log("3. Run this script again\n");
      return;
    }

    console.log(`✅ Found ${emails.length} emails to analyze\n`);

    // 2. Test intelligence extraction on each email
    let totalIdeas = 0;
    let totalGoals = 0;
    let totalPainPoints = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n📧 Email ${i + 1}/${emails.length}`);
      console.log(`   From: ${email.sender_email}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Date: ${new Date(email.received_at).toLocaleDateString()}`);

      try {
        console.log(`   🤖 Analyzing with Claude Sonnet 4.5...`);

        const intelligence = await extractEmailIntelligence(email);

        if (intelligence) {
          console.log(`   ✅ Extracted:`);
          console.log(`      Ideas: ${intelligence.ideas?.length || 0}`);
          console.log(`      Goals: ${intelligence.business_goals?.length || 0}`);
          console.log(`      Pain Points: ${intelligence.pain_points?.length || 0}`);
          console.log(`      Sentiment: ${intelligence.sentiment}`);
          console.log(`      Energy: ${intelligence.energy_level}/10`);
          console.log(`      Decision Readiness: ${intelligence.decision_readiness}/10`);

          totalIdeas += intelligence.ideas?.length || 0;
          totalGoals += intelligence.business_goals?.length || 0;
          totalPainPoints += intelligence.pain_points?.length || 0;

          // 3. Save to email_intelligence table
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
            console.log(`   ⚠️  Save error: ${saveError.message}`);
          } else {
            console.log(`   💾 Saved to database`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Analysis error: ${error.message}`);
      }

      // Small delay to avoid rate limits
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 4. Summary
    console.log(`\n\n📊 Summary Report\n`);
    console.log(`Emails analyzed: ${emails.length}`);
    console.log(`Total ideas extracted: ${totalIdeas}`);
    console.log(`Total goals extracted: ${totalGoals}`);
    console.log(`Total pain points extracted: ${totalPainPoints}`);
    console.log(`\n✅ Email Intelligence extraction test complete!\n`);

    // 5. Verify data in database
    const { data: savedIntelligence, error: verifyError } = await supabase
      .from("email_intelligence")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID);

    if (!verifyError && savedIntelligence) {
      console.log(`💾 Database verification: ${savedIntelligence.length} intelligence records saved\n`);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  }
}

testEmailIntelligence().catch(console.error);
