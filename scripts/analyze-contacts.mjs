#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function analyzeAllContacts() {
  console.log("🤖 Starting Contact Intelligence Analysis...\n");

  // Get all contacts
  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .limit(100);

  if (contactError) {
    console.error("Error fetching contacts:", contactError);
    return;
  }

  console.log(`📊 Found ${contacts.length} contacts to analyze\n`);

  let analyzed = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      // Get emails for this contact
      const { data: emails } = await supabase
        .from("emails")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const emailSummary = (emails || [])
        .map((e) => `${e.subject}: ${e.body.substring(0, 100)}`)
        .join("\n");

      const prompt = `Analyze contact engagement and return JSON:
Name: ${contact.name}
Company: ${contact.company}
Title: ${contact.job_title}
Emails: ${emails?.length || 0}

Recent: ${emailSummary || "None"}

Return only JSON with: engagement_score, buying_intent, decision_stage, role_type, next_best_action, risk_signals[], opportunity_signals[], engagement_velocity, sentiment_score`;

      const message = await anthropic.messages.create({
        model: "claude-opus-4-1-20250805",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const response = message.content[0];
      if (response.type === "text") {
        const jsonMatch = response.text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);

          // Update contact
          await supabase
            .from("contacts")
            .update({
              ai_score: analysis.engagement_score,
              buying_intent: analysis.buying_intent,
              decision_stage: analysis.decision_stage,
              role_type: analysis.role_type,
              engagement_velocity: analysis.engagement_velocity,
              sentiment_score: analysis.sentiment_score,
              risk_signals: analysis.risk_signals,
              opportunity_signals: analysis.opportunity_signals,
              ai_analysis: {
                next_best_action: analysis.next_best_action,
                analysis_date: new Date().toISOString(),
              },
              last_analysis_at: new Date().toISOString(),
            })
            .eq("id", contact.id);

          analyzed++;
          console.log(
            `✅ ${contact.name} - Score: ${analysis.engagement_score}`
          );
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      errors++;
      console.error(`❌ Error analyzing ${contact.name}:`, error.message);
    }
  }

  console.log(
    `\n✨ Analysis complete! Analyzed: ${analyzed}, Errors: ${errors}`
  );
}

analyzeAllContacts().catch(console.error);
