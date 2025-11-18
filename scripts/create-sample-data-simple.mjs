#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKSPACE_ID = "5a92c7af-5aca-49a7-8866-3bfaa1d04532";
const ORG_ID = "adedf006-ca69-47d4-adbf-fc91bd7f225d";

console.log(`\n📝 Creating Sample Email Data\n`);

async function createSamples() {
  // Get Duncan contact
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("email", "duncan@techinnov.com")
    .maybeSingle();

  if (!contact) {
    console.log("❌ Duncan contact not found. Run create-sample-email-data.mjs first");
    return;
  }

  console.log(`✅ Using contact: ${contact.name} (${contact.id})\n`);

  // Create 3 sample emails with business intelligence content
  const emails = [
    {
      subject: "Marketing Strategy Discussion - Q1 2025",
      snippet: `I've been thinking about our marketing approach for Q1. IDEAS: 1) Launch content marketing campaign focused on thought leadership 2) Create podcast series with industry experts 3) Interactive product demo tool 4) YouTube channel. GOALS: Increase brand awareness by 40%, Generate 500 qualified leads/month, Establish thought leadership. CHALLENGES: Limited $50K/month budget, Need credibility in competitive market, Content consistency issues, ROI measurement difficulties, Small 3-person team overwhelmed. REQUIREMENTS: 6-month content calendar, Marketing automation tools (HubSpot vs ActiveCampaign), Analytics tracking with attribution modeling. I'm really excited! The energy is incredible. Ready to start with podcast - first episode in 3 weeks!`
    },
    {
      subject: "Budget Concerns for Marketing Campaign",
      snippet: `Thanks for the proposal but I have concerns. BUDGET ISSUES: $150K proposal way over what we can afford, Already struggling to justify $50K/month to board, Cash flow tight until Series A closes (2 months). RESOURCE CONSTRAINTS: Team overwhelmed working 60+ hours/week, Can't hire until next quarter, Worried about burnout. MARKET CHALLENGES: Competitor launched similar product at 40% lower price, Feedback says our messaging too technical, Conversion rates dropped from 3.5% to 2.1%. I'm feeling frustrated - need to invest but must be realistic about resources. Can we scale back to top 2-3 highest ROI activities?`
    },
    {
      subject: "Product Launch Timeline - Need Marketing Support",
      snippet: `Product launch update. PRODUCT GOALS: Launch AI-powered analytics platform March 15th, Target 100 beta users first month, Achieve 90% satisfaction score, Build Salesforce/HubSpot/Stripe integrations. MARKETING NEEDS: Landing page ready Feb 28th, Email drip campaign for beta signups, Press release and media outreach, Social content calendar for launch week, 3-5 min product demo video. BLOCKERS: Finalizing pricing ($99/mo vs $149/mo), Positioning decision needed (Analytics for Everyone vs Enterprise Analytics Made Simple), Legal review of ToS delayed. Tight timeline but opportunity cost of delay is significant - $80K potential revenue/month lost. Can we schedule kickoff meeting this week?`
    }
  ];

  let created = 0;

  for (const email of emails) {
    const { data, error } = await supabase
      .from("client_emails")
      .insert({
        workspace_id: WORKSPACE_ID,
        org_id: ORG_ID,
        contact_id: contact.id,
        provider_message_id: `sample-${Date.now()}-${Math.random()}`,
        from_email: "duncan@techinnov.com",
        to_emails: ["contact@unite-group.in"],
        subject: email.subject,
        snippet: email.snippet,
        direction: "inbound",
        is_read: false,
        received_at: new Date(Date.now() - created * 86400000).toISOString()
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ Error: ${email.subject} - ${error.message}`);
    } else {
      console.log(`✅ Created: "${email.subject}"`);
      created++;
    }
  }

  console.log(`\n📊 Created ${created}/3 sample emails`);
  console.log(`\n✅ Ready to test! Run: node scripts/test-email-intelligence.mjs\n`);
}

createSamples().catch(console.error);
