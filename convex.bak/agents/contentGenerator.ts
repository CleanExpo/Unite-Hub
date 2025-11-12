import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * AI Content Generation Agent
 * Uses Claude to generate personalized content:
 * - Outreach emails
 * - Follow-up messages
 * - Proposals
 * - Case studies
 */

export const generateContent = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.optional(v.id("contacts")),
    contentType: v.string(), // email, proposal, case_study, outreach, followup
    prompt: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`🤖 Generating ${args.contentType} content...`);

    // 1. Get contact details for personalization (if provided)
    let contactContext = "";
    if (args.contactId) {
      const contact = await ctx.runQuery(api.contacts.get, {
        contactId: args.contactId,
      });
      if (contact) {
        contactContext = `
Contact: ${contact.name}
Company: ${contact.company || "N/A"}
Job Title: ${contact.jobTitle || "N/A"}
Industry: ${contact.industry || "N/A"}
Tags: ${contact.tags.join(", ")}
Status: ${contact.status}
`;
      }
    }

    // 2. Generate content with Claude
    const generated = await generateWithClaude({
      contentType: args.contentType,
      prompt: args.prompt,
      contactContext,
      additionalContext: args.context || "",
    });

    // 3. Store generated content
    const contentId = await ctx.runMutation(api.content.store, {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      contactId: args.contactId,
      contentType: args.contentType,
      title: generated.title,
      prompt: args.prompt,
      text: generated.text,
      htmlVersion: generated.html,
      aiModel: "sonnet",
    });

    // 4. Log audit
    await ctx.runMutation(api.system.logAudit, {
      orgId: args.orgId,
      action: "content_generated",
      resource: "content",
      resourceId: contentId,
      agent: "content-generator",
      details: JSON.stringify({
        contentType: args.contentType,
        contactId: args.contactId,
      }),
      status: "success",
    });

    console.log(`✅ Content generated: ${generated.title}`);

    return {
      status: "success",
      contentId,
      content: generated,
    };
  },
});

/**
 * Generate personalized email outreach for a contact
 */
export const generateOutreach = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactId: v.id("contacts"),
    objective: v.string(), // "introduce_services", "follow_up", "proposal", "meeting_request"
  },
  handler: async (ctx, args) => {
    const contact = await ctx.runQuery(api.contacts.get, {
      contactId: args.contactId,
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Build context-aware prompt
    const prompts: Record<string, string> = {
      introduce_services: `Write a professional introduction email to ${contact.name} at ${contact.company}. Introduce our marketing services and express interest in partnership. Keep it brief and personalized.`,
      follow_up: `Write a friendly follow-up email to ${contact.name}. Reference previous conversations and gently inquire about next steps. Be helpful and not pushy.`,
      proposal: `Write a proposal email to ${contact.name} outlining our campaign services. Include value propositions and a soft call-to-action.`,
      meeting_request: `Write an email requesting a brief 15-minute call with ${contact.name} to discuss marketing opportunities. Be respectful of their time.`,
    };

    const prompt = prompts[args.objective] || prompts.introduce_services;

    return await ctx.runAction(api.agents.contentGenerator.generateContent, {
      orgId: args.orgId,
      workspaceId: args.workspaceId,
      contactId: args.contactId,
      contentType: "outreach",
      prompt,
    });
  },
});

/**
 * Generate bulk outreach for multiple contacts
 */
export const generateBulkOutreach = action({
  args: {
    orgId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    contactIds: v.array(v.id("contacts")),
    objective: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Generating outreach for ${args.contactIds.length} contacts...`);

    const results = [];
    for (const contactId of args.contactIds) {
      try {
        const result = await ctx.runAction(
          api.agents.contentGenerator.generateOutreach,
          {
            orgId: args.orgId,
            workspaceId: args.workspaceId,
            contactId,
            objective: args.objective,
          }
        );
        results.push({ contactId, status: "success", contentId: result.contentId });
      } catch (error) {
        console.error(`❌ Error generating for contact ${contactId}:`, error);
        results.push({ contactId, status: "error", error: String(error) });
      }
    }

    return {
      total: args.contactIds.length,
      successful: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "error").length,
      results,
    };
  },
});

// ============ HELPER FUNCTIONS ============

/**
 * Generate content with Claude API
 * TODO: Replace with actual Anthropic API call
 */
async function generateWithClaude(params: {
  contentType: string;
  prompt: string;
  contactContext: string;
  additionalContext: string;
}): Promise<{ title: string; text: string; html?: string }> {
  // Simulated content generation
  // In production, call Anthropic API:
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const message = await anthropic.messages.create({
  //   model: "claude-sonnet-4-5-20250929",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: systemPrompt + userPrompt }]
  // });

  const contentTemplates: Record<
    string,
    { title: string; text: (context: string) => string }
  > = {
    email: {
      title: "Personalized Email",
      text: (ctx) => `Subject: Partnership Opportunity

Hi there,

${params.prompt}

${ctx ? `\nPersonalized for:\n${ctx}` : ""}

I'd love to discuss how we can work together to achieve your goals.

Best regards,
Duncan`,
    },
    outreach: {
      title: "Outreach Email",
      text: (ctx) => `Subject: Let's Connect

Hello,

${params.prompt}

${ctx ? `Based on your background:\n${ctx}` : ""}

Looking forward to connecting!

Best,
Duncan`,
    },
    proposal: {
      title: "Campaign Proposal",
      text: (ctx) => `Subject: Campaign Proposal

Dear Client,

${params.prompt}

${ctx ? `\nTailored for:\n${ctx}` : ""}

We're confident this approach will deliver exceptional results.

Best regards,
Duncan's Marketing Agency`,
    },
    followup: {
      title: "Follow-up Email",
      text: (ctx) => `Subject: Following Up

Hi,

${params.prompt}

${ctx ? `\nContext:\n${ctx}` : ""}

Let me know if you have any questions!

Regards,
Duncan`,
    },
  };

  const template =
    contentTemplates[params.contentType] || contentTemplates.email;
  const text = template.text(params.contactContext + params.additionalContext);

  return {
    title: template.title,
    text,
    html: convertToHtml(text),
  };
}

/**
 * Convert plain text to basic HTML
 */
function convertToHtml(text: string): string {
  return text
    .split("\n\n")
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}
