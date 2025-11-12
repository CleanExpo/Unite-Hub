#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateContentForHotLeads() {
  console.log("📝 Generating personalized content for hot leads...\n");

  // Get hot leads (AI score > 70)
  const { data: hotLeads } = await supabase
    .from("contacts")
    .select("*")
    .gte("ai_score", 70)
    .limit(10);

  if (!hotLeads || hotLeads.length === 0) {
    console.log("No hot leads found. Run 'npm run analyze-contacts' first.");
    return;
  }

  console.log(`Found ${hotLeads.length} hot leads\n`);

  for (const lead of hotLeads) {
    try {
      const response = await fetch(
        "http://localhost:3007/api/agents/content-personalization",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate",
            contactId: lead.id,
            contentType: determineBestContentType(lead),
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Generated content for ${lead.name}`);
        console.log(`   Score: ${result.content.personalization_score}`);
      } else {
        console.error(`❌ Failed for ${lead.name}:`, result.error);
      }
    } catch (error) {
      console.error(`Error: ${error}`);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n✨ Content generation complete!");
}

function determineBestContentType(lead) {
  if (lead.decision_stage === "decision") return "proposal";
  if (lead.buying_intent === "high") return "followup";
  return "case_study";
}

generateContentForHotLeads().catch(console.error);
