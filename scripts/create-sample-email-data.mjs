#!/usr/bin/env node

/**
 * Create Sample Email Data for Testing
 *
 * Creates sample contacts and emails for testing the Email Intelligence Agent
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORKSPACE_ID = process.argv[2] || "process.env.TEST_WORKSPACE_ID || "YOUR_WORKSPACE_ID"";
const ORG_ID = "adedf006-ca69-47d4-adbf-fc91bd7f225d";

console.log(`\n📝 Creating Sample Data for Email Intelligence Testing\n`);
console.log(`Workspace: ${WORKSPACE_ID}`);
console.log(`Organization: ${ORG_ID}\n`);

async function createSampleData() {
  try {
    // 1. Create or find Duncan contact
    let { data: existingContact } = await supabase
      .from("contacts")
      .select("*")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("email", "duncan@techinnov.com")
      .maybeSingle();

    let contactId;

    if (!existingContact) {
      console.log("📧 Creating Duncan Smith contact...");

      const { data: newContact, error: contactError} = await supabase
        .from("contacts")
        .insert({
          workspace_id: WORKSPACE_ID,
          name: "Duncan Smith",
          email: "duncan@techinnov.com",
          company: "Tech Innovations Ltd",
          phone: "+1-555-0123",
          job_title: "CEO",
          status: "lead"
        })
        .select()
        .single();

      if (contactError) {
        console.error("❌ Error creating contact:", contactError.message);
        return;
      }

      contactId = newContact.id;
      console.log(`✅ Created contact: Duncan Smith (ID: ${contactId})`);
    } else {
      contactId = existingContact.id;
      console.log(`✅ Using existing contact: ${existingContact.name} (ID: ${contactId})`);
    }

    // 2. Create sample emails with business intelligence
    console.log(`\n📧 Creating sample emails with business intelligence...\n`);

    const sampleEmails = [
      {
        subject: "Marketing Strategy Discussion - Q1 2025",
        body_html: `
<p>Hi there,</p>

<p>I've been thinking about our marketing approach for Q1 and wanted to share some <strong>ideas</strong> I'm excited about:</p>

<ol>
  <li><strong>Launch a content marketing campaign</strong> focused on thought leadership in the AI space</li>
  <li><strong>Create a podcast series</strong> interviewing industry experts and showcasing our tech</li>
  <li><strong>Develop an interactive product demo tool</strong> that prospects can use on our website</li>
  <li><strong>Start a YouTube channel</strong> with technical tutorials and case studies</li>
</ol>

<p><strong>Our main goals for Q1:</strong></p>
<ul>
  <li>Increase brand awareness by 40% in the enterprise tech sector</li>
  <li>Generate 500 qualified leads per month</li>
  <li>Establish ourselves as thought leaders in AI innovation</li>
  <li>Improve customer engagement score from 6.5 to 8.0</li>
</ul>

<p><strong>Current challenges we're facing:</strong></p>
<ul>
  <li>Limited budget for paid advertising ($50K/month max)</li>
  <li>Need to build credibility in a very competitive market</li>
  <li>Struggling with content creation consistency - only publishing 2x/week</li>
  <li>Difficulty measuring ROI on current campaigns accurately</li>
  <li>Small marketing team (just 3 people) handling too many initiatives</li>
</ul>

<p><strong>What we need help with:</strong></p>
<ul>
  <li>A comprehensive content calendar for 6 months</li>
  <li>Marketing automation tools (looking at HubSpot vs ActiveCampaign)</li>
  <li>Analytics tracking setup - we need proper attribution modeling</li>
  <li>Social media management platform</li>
</ul>

<p>I'm really excited about these possibilities! The energy around our new product launch is incredible, and I feel like we're ready to make a big push.</p>

<p>What do you think about starting with the podcast idea? I believe we could get the first episode out within 3 weeks. Let's move forward on this!</p>

<p>Best regards,<br>
Duncan Smith<br>
CEO, Tech Innovations Ltd</p>
        `,
        body_text: `Hi there,

I've been thinking about our marketing approach for Q1 and wanted to share some ideas I'm excited about:

1. Launch a content marketing campaign focused on thought leadership in the AI space
2. Create a podcast series interviewing industry experts and showcasing our tech
3. Develop an interactive product demo tool that prospects can use on our website
4. Start a YouTube channel with technical tutorials and case studies

Our main goals for Q1:
- Increase brand awareness by 40% in the enterprise tech sector
- Generate 500 qualified leads per month
- Establish ourselves as thought leaders in AI innovation
- Improve customer engagement score from 6.5 to 8.0

Current challenges we're facing:
- Limited budget for paid advertising ($50K/month max)
- Need to build credibility in a very competitive market
- Struggling with content creation consistency - only publishing 2x/week
- Difficulty measuring ROI on current campaigns accurately
- Small marketing team (just 3 people) handling too many initiatives

What we need help with:
- A comprehensive content calendar for 6 months
- Marketing automation tools (looking at HubSpot vs ActiveCampaign)
- Analytics tracking setup - we need proper attribution modeling
- Social media management platform

I'm really excited about these possibilities! The energy around our new product launch is incredible, and I feel like we're ready to make a big push.

What do you think about starting with the podcast idea? I believe we could get the first episode out within 3 weeks. Let's move forward on this!

Best regards,
Duncan Smith
CEO, Tech Innovations Ltd`,
        snippet: "I've been thinking about our marketing approach for Q1 and wanted to share some ideas...",
        ai_sentiment: "positive"
      },
      {
        subject: "Re: Budget Concerns for Marketing Campaign",
        body_html: `
<p>Hi,</p>

<p>Thanks for the proposal. I reviewed the marketing plan but I have some concerns:</p>

<p><strong>Budget Issues:</strong></p>
<ul>
  <li>The proposed $150K budget is way over what we can afford right now</li>
  <li>We're already struggling to justify our current $50K/month spend to the board</li>
  <li>Cash flow is tight until we close the Series A round (hopefully in 2 months)</li>
</ul>

<p><strong>Resource Constraints:</strong></p>
<ul>
  <li>Our team is already overwhelmed - everyone's working 60+ hour weeks</li>
  <li>We can't hire anyone new until next quarter</li>
  <li>I'm worried about burnout if we take on more initiatives</li>
</ul>

<p><strong>Market Challenges:</strong></p>
<ul>
  <li>Our main competitor just launched a similar product at 40% lower price</li>
  <li>We're getting feedback that our messaging is too technical</li>
  <li>Conversion rates have dropped from 3.5% to 2.1% in the last month</li>
</ul>

<p>I'm feeling frustrated because I know we need to invest in marketing, but I also need to be realistic about what we can execute with our current resources.</p>

<p>Can we scale back the plan to focus on just the top 2-3 highest ROI activities?</p>

<p>Duncan</p>
        `,
        body_text: `Hi,

Thanks for the proposal. I reviewed the marketing plan but I have some concerns:

Budget Issues:
- The proposed $150K budget is way over what we can afford right now
- We're already struggling to justify our current $50K/month spend to the board
- Cash flow is tight until we close the Series A round (hopefully in 2 months)

Resource Constraints:
- Our team is already overwhelmed - everyone's working 60+ hour weeks
- We can't hire anyone new until next quarter
- I'm worried about burnout if we take on more initiatives

Market Challenges:
- Our main competitor just launched a similar product at 40% lower price
- We're getting feedback that our messaging is too technical
- Conversion rates have dropped from 3.5% to 2.1% in the last month

I'm feeling frustrated because I know we need to invest in marketing, but I also need to be realistic about what we can execute with our current resources.

Can we scale back the plan to focus on just the top 2-3 highest ROI activities?

Duncan`,
        snippet: "Thanks for the proposal. I reviewed the marketing plan but I have some concerns...",
        ai_sentiment: "negative"
      },
      {
        subject: "Product Launch Timeline - Need Marketing Support",
        body_html: `
<p>Hi team,</p>

<p>Quick update on the product launch:</p>

<p><strong>Product Development Goals:</strong></p>
<ul>
  <li>Launch our AI-powered analytics platform by March 15th</li>
  <li>Target 100 beta users in the first month</li>
  <li>Achieve 90% user satisfaction score</li>
  <li>Build integrations with Salesforce, HubSpot, and Stripe</li>
</ul>

<p><strong>Marketing Needs for Launch:</strong></p>
<ul>
  <li>Need a landing page ready by Feb 28th</li>
  <li>Email drip campaign for beta signups</li>
  <li>Press release and media outreach strategy</li>
  <li>Social media content calendar for launch week</li>
  <li>Product demo video (3-5 minutes)</li>
</ul>

<p><strong>Current Blockers:</strong></p>
<ul>
  <li>Still finalizing the pricing model - debating between $99/mo and $149/mo</li>
  <li>Need to decide on positioning: "Analytics for Everyone" vs "Enterprise Analytics Made Simple"</li>
  <li>Legal review of terms of service is taking longer than expected</li>
</ul>

<p>I know this is a tight timeline, but the opportunity cost of delaying is significant. Every month we delay costs us ~$80K in potential revenue.</p>

<p>Can we schedule a kickoff meeting this week to align on the launch plan?</p>

<p>Thanks,<br>Duncan</p>
        `,
        body_text: `Hi team,

Quick update on the product launch:

Product Development Goals:
- Launch our AI-powered analytics platform by March 15th
- Target 100 beta users in the first month
- Achieve 90% user satisfaction score
- Build integrations with Salesforce, HubSpot, and Stripe

Marketing Needs for Launch:
- Need a landing page ready by Feb 28th
- Email drip campaign for beta signups
- Press release and media outreach strategy
- Social media content calendar for launch week
- Product demo video (3-5 minutes)

Current Blockers:
- Still finalizing the pricing model - debating between $99/mo and $149/mo
- Need to decide on positioning: "Analytics for Everyone" vs "Enterprise Analytics Made Simple"
- Legal review of terms of service is taking longer than expected

I know this is a tight timeline, but the opportunity cost of delaying is significant. Every month we delay costs us ~$80K in potential revenue.

Can we schedule a kickoff meeting this week to align on the launch plan?

Thanks,
Duncan`,
        snippet: "Quick update on the product launch...",
        ai_sentiment: "neutral"
      }
    ];

    let createdCount = 0;

    for (const emailData of sampleEmails) {
      const { data: email, error: emailError } = await supabase
        .from("client_emails")
        .insert({
          workspace_id: WORKSPACE_ID,
          org_id: ORG_ID,
          contact_id: contactId,
          provider_message_id: `sample-msg-${Date.now()}-${Math.random()}`,
          from_email: "duncan@techinnov.com",
          from_name: "Duncan Smith",
          to_emails: ["contact@unite-group.in"],
          subject: emailData.subject,
          body_html: emailData.body_html,
          body_text: emailData.body_text,
          snippet: emailData.snippet,
          direction: "inbound",
          is_read: false,
          ai_sentiment: emailData.ai_sentiment,
          received_at: new Date(Date.now() - createdCount * 86400000).toISOString(), // Stagger by days
        })
        .select()
        .single();

      if (emailError) {
        console.error(`❌ Error creating email "${emailData.subject}":`, emailError.message);
      } else {
        console.log(`✅ Created email: "${email.subject}"`);
        createdCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Contact: Duncan Smith`);
    console.log(`   Emails created: ${createdCount}/3`);
    console.log(`\n✅ Sample data creation complete!`);
    console.log(`\nNext: Run email intelligence extraction:`);
    console.log(`   node scripts/test-email-intelligence.mjs\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

createSampleData().catch(console.error);
