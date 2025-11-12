#!/usr/bin/env node

/**
 * Content Generation Agent CLI
 * Generates personalized marketing content using Claude AI
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = new ConvexClient(process.env.CONVEX_URL || "http://127.0.0.1:3210");

// Configuration
const ORG_ID = process.env.ORG_ID || "k57akqzf14r07d9q3pbf9kebvn7v7929";
const WORKSPACE_ID = process.env.WORKSPACE_ID || "kh72b1cng9h88691sx4x7krt2h7v7deh";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("❌ Error: ANTHROPIC_API_KEY not set in .env.local");
  process.exit(1);
}

// Claude API call
async function callClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: `You are an expert B2B marketing copywriter for a full-service marketing agency.
You create personalized, professional, and high-converting marketing emails.
Your tone is warm but professional. You focus on the recipient's specific business challenges.
Always include a clear call-to-action. Keep content concise and impactful.`,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Determine content type
function determineContentType(contact, previousEmails) {
  if (contact.aiScore > 80 && previousEmails.length > 1) {
    return "proposal";
  } else if (contact.aiScore > 60) {
    return "followup";
  } else {
    return "general_followup";
  }
}

// Build Claude prompt
function buildPrompt(contact, contentType, lastInteractionNote) {
  const typeSpecificGuidance = {
    proposal: `This is a proposal email. Include:
- 2-3 specific services we'd recommend
- Expected ROI or key metrics (e.g., "35% increase in conversions")
- Investment range or next step (e.g., "60-day engagement")
- Request a strategy call to discuss`,

    followup: `This is a professional followup. Include:
- Reference their previous interest
- A specific, relevant success story or insight
- A soft call-to-action (e.g., "Would love to chat more about...")
- Keep it concise (under 120 words)`,

    general_followup: `This is a general followup email. Include:
- Value proposition relevant to their industry
- One key insight about trends in their space
- A low-pressure CTA (e.g., "Happy to discuss further if helpful")
- Professional but personable tone`,
  };

  return `Generate a ${contentType} email for:

Name: ${contact.name}
Company: ${contact.company || "Unknown"}
Job Title: ${contact.jobTitle || "Professional"}
Industry: ${contact.industry || "General"}
AI Engagement Score: ${contact.aiScore}/100
Last Interaction: ${lastInteractionNote}

${typeSpecificGuidance[contentType] || ""}

Requirements:
1. Personalized to their company/situation when possible
2. Professional but warm tone
3. Clear and specific
4. No generic templates or platitudes
5. Include their name in the greeting
6. Sign off professionally

Generate ONLY the email body (no "Subject:" line, no signature block - just the message itself).`;
}

async function generateContent() {
  try {
    console.log("📝 Content Generation Agent Started");
    console.log(`Organization: ${ORG_ID}`);
    console.log(`Workspace: ${WORKSPACE_ID}\n`);

    // Fetch high-value contacts (AI score > 60, prospect/lead status)
    console.log("🔍 Identifying target contacts for content generation...");

    const prospectContacts = await client.query(api.contacts.listByStatus, {
      orgId: ORG_ID,
      workspaceId: WORKSPACE_ID,
      status: "prospect",
      limit: 100,
    });

    const leadContacts = await client.query(api.contacts.listByStatus, {
      orgId: ORG_ID,
      workspaceId: WORKSPACE_ID,
      status: "lead",
      limit: 100,
    });

    const allContacts = [...prospectContacts, ...leadContacts];
    const targetContacts = allContacts.filter((c) => (c.aiScore || 0) >= 60);

    console.log(`Found ${targetContacts.length} target contacts for content generation\n`);

    if (targetContacts.length === 0) {
      console.log("ℹ️  No contacts meeting engagement threshold (>60 AI score)");
      return;
    }

    let generated = 0;
    let errors = 0;

    for (const contact of targetContacts) {
      try {
        console.log(`\n✍️  Generating content for: ${contact.name} (${contact.company})`);
        console.log(`   AI Score: ${contact.aiScore}/100`);
        console.log(`   Status: ${contact.status}`);

        // Get contact's email history
        console.log(`   📧 Loading interaction history...`);
        const contactEmails = await client.query(api.emails.getByContact, {
          orgId: ORG_ID,
          contactId: contact._id,
        });

        const lastInteractionNote =
          contactEmails.length > 0
            ? contactEmails[0].aiSummary || contactEmails[0].subject
            : "Initial outreach";

        // Determine content type
        const contentType = determineContentType(contact, contactEmails);
        console.log(`   📋 Content type: ${contentType}`);

        // Build prompt
        const prompt = buildPrompt(contact, contentType, lastInteractionNote);

        // Call Claude
        console.log(`   🤖 Calling Claude API for content generation...`);
        const generatedText = await callClaude(prompt);

        // Create title
        const titleMap = {
          proposal: `Proposal: ${contact.name} - ${contact.company}`,
          followup: `Followup: ${contact.name}`,
          general_followup: `Outreach: ${contact.name}`,
        };
        const title = titleMap[contentType];

        // Store in Convex
        console.log(`   💾 Storing draft content...`);
        const contentId = await client.mutation(api.content.store, {
          orgId: ORG_ID,
          workspaceId: WORKSPACE_ID,
          contactId: contact._id,
          contentType,
          title,
          prompt,
          text: generatedText,
          aiModel: "sonnet",
        });

        // Log audit
        await client.mutation(api.system.logAudit, {
          orgId: ORG_ID,
          action: "content_generated",
          resource: "generatedContent",
          resourceId: contentId,
          agent: "content-agent",
          details: JSON.stringify({
            contactId: contact._id,
            contactName: contact.name,
            company: contact.company,
            contentType,
            aiScore: contact.aiScore,
          }),
          status: "success",
        });

        generated++;
        console.log(`   ✅ Content generated and stored`);
        console.log(`   Preview: ${generatedText.substring(0, 100)}...`);
      } catch (error) {
        errors++;
        console.error(`   ❌ Error generating content:`, error.message);

        await client.mutation(api.system.logAudit, {
          orgId: ORG_ID,
          action: "content_generation_error",
          resource: "contact",
          resourceId: contact._id,
          agent: "content-agent",
          details: JSON.stringify({
            contactName: contact.name,
            error: error.message,
          }),
          status: "error",
          errorMessage: error.message,
        });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Content Generation Complete");
    console.log("=".repeat(60));
    console.log(`Total generated: ${generated}`);
    console.log(`Errors: ${errors}`);
    console.log(`Target contacts: ${targetContacts.length}`);
    console.log("=".repeat(60));
    console.log("\n📋 Next steps:");
    console.log("1. Review generated content in Convex dashboard");
    console.log("2. Approve/edit drafts");
    console.log("3. Schedule for sending");
    console.log("4. Track performance metrics");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

generateContent();
