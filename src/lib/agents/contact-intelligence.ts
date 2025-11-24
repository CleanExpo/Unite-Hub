import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31", // Required for prompt caching
  },
});

interface ContactIntelligence {
  engagement_score: number;
  buying_intent: "high" | "medium" | "low" | "unknown";
  decision_stage: "awareness" | "consideration" | "decision" | "unknown";
  role_type: "decision_maker" | "influencer" | "end_user" | "unknown";
  next_best_action: string;
  risk_signals: string[];
  opportunity_signals: string[];
  engagement_velocity: number;
  sentiment_score: number;
}

export async function analyzeContactIntelligence(
  contactId: string,
  workspaceId: string
): Promise<ContactIntelligence> {
  try {
    // Get contact with full history
    const contact = await db.contacts.getById(contactId);
    const emails = await db.emails.getByContact(contactId);
    const interactions = await db.interactions.getByContact(contactId);

    if (!contact) {
      throw new Error(`Contact ${contactId} not found`);
    }

    // Calculate engagement velocity (how active recently)
    const last7Days = emails.filter(
      (e) =>
        new Date(e.created_at).getTime() >
        Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    const last30Days = emails.length;
    const engagementVelocity = last7Days > 0 ? Math.ceil(last7Days / 3) : 0;

    // Build email summary for Claude
    const emailSummary = emails
      .slice(0, 10)
      .map(
        (e) =>
          `[${new Date(e.created_at).toLocaleDateString()}] ${e.subject}: ${e.body.substring(0, 150)}...`
      )
      .join("\n");

    // Static system instructions with prompt caching (90% cost savings)
    const systemPrompt = `You are an expert B2B sales intelligence analyst specializing in contact scoring and engagement analysis.

Your task is to analyze contact engagement patterns, buying intent, and decision-making stage to help sales teams prioritize their outreach.

Return ONLY valid JSON with these exact fields:
{
  "engagement_score": <number 0-100>,
  "buying_intent": <"high" | "medium" | "low" | "unknown">,
  "decision_stage": <"awareness" | "consideration" | "decision" | "unknown">,
  "role_type": <"decision_maker" | "influencer" | "end_user" | "unknown">,
  "next_best_action": "<actionable next step>",
  "risk_signals": [<array of potential objections or risks>],
  "opportunity_signals": [<array of positive signals and opportunities>],
  "engagement_velocity": <-2 to 2, negative means declining, positive means increasing>,
  "sentiment_score": <-50 to 100, sentiment of recent communications>
}`;

    const contactData = `CONTACT DATA:
Name: ${contact.name}
Company: ${contact.company}
Job Title: ${contact.job_title}
Email: ${contact.email}
Current AI Score: ${contact.ai_score}
Status: ${contact.status}

ENGAGEMENT HISTORY:
Total Emails: ${last30Days}
Last 7 Days: ${last7Days}
Last Interaction: ${contact.last_interaction}

RECENT COMMUNICATIONS:
${emailSummary || "No emails yet"}

INTERACTION HISTORY:
${interactions
  .slice(0, 5)
  .map((i) => `- ${i.interaction_type}: ${JSON.stringify(i.details)}`)
  .join("\n") || "No interactions yet"}

Analyze this contact and return your assessment as JSON.`;

    // Call Claude with extended thinking + prompt caching
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-opus-4-1-20250805",
      max_tokens: 16000,
      thinking: {
        type: "enabled",
        budget_tokens: 10000,
      },
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" }, // Cache static instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: contactData,
        },
      ],
    })
    });

    const message = result.data;;

    // Log cache performance for cost monitoring
    console.log("Contact Intelligence - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    // Extract the JSON response
    let jsonText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        jsonText = block.text;
        break;
      }
    }

    // Parse JSON - handle potential markdown wrapping
    let analysis: ContactIntelligence;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch =
        jsonText.match(/```json\n?([\s\S]*?)\n?```/) ||
        jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;
      analysis = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response:", jsonText);
      throw new Error(`Invalid JSON from Claude: ${jsonText}`);
    }

    // Update contact with new intelligence
    await db.contacts.updateIntelligence(contactId, {
      ai_score: analysis.engagement_score,
      buying_intent: analysis.buying_intent,
      decision_stage: analysis.decision_stage,
      role_type: analysis.role_type,
      engagement_velocity: analysis.engagement_velocity,
      sentiment_score: analysis.sentiment_score,
      risk_signals: analysis.risk_signals,
      opportunity_signals: analysis.opportunity_signals,
      ai_analysis: {
        analysis_date: new Date().toISOString(),
        next_best_action: analysis.next_best_action,
        ...analysis,
      },
    });

    // Log the analysis with cache stats
    await db.auditLogs.logAgentRun(
      "system", // org_id - will need to update this
      "contact_intelligence",
      {
        contact_id: contactId,
        analysis_result: analysis,
        status: "success",
        cacheStats: {
          input_tokens: message.usage.input_tokens,
          cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
          cache_read_tokens: message.usage.cache_read_input_tokens || 0,
          output_tokens: message.usage.output_tokens,
          cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
        },
      }
    );

    return analysis;
  } catch (error) {
    console.error("Contact intelligence analysis failed:", error);
    throw error;
  }
}

export async function analyzeWorkspaceContacts(workspaceId: string) {
  try {
    // Get all contacts in workspace
    const contacts = await db.contacts.listByWorkspace(workspaceId);

    if (contacts.length === 0) {
      console.log("No contacts to analyze");
      return { analyzed: 0, errors: 0 };
    }

    let analyzed = 0;
    let errors = 0;

    // Analyze top contacts first (those with most emails)
    const sortedContacts = [...contacts].sort(
      (a, b) =>
        (b.last_interaction ? new Date(b.last_interaction).getTime() : 0) -
        (a.last_interaction ? new Date(a.last_interaction).getTime() : 0)
    );

    // Analyze in batches to avoid rate limiting
    for (let i = 0; i < Math.min(sortedContacts.length, 10); i++) {
      try {
        await analyzeContactIntelligence(sortedContacts[i].id, workspaceId);
        analyzed++;
        // Small delay between analyses
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `Failed to analyze contact ${sortedContacts[i].id}:`,
          error
        );
        errors++;
      }
    }

    return { analyzed, errors };
  } catch (error) {
    console.error("Workspace analysis failed:", error);
    throw error;
  }
}

// Score by multiple factors for ranking
export function calculateCompositeScore(contact: any): number {
  let score = contact.ai_score || 0;

  // Boost for high engagement
  if (contact.engagement_velocity > 0) {
    score += contact.engagement_velocity * 5;
  }

  // Boost for decision makers
  if (contact.role_type === "decision_maker") {
    score += 15;
  } else if (contact.role_type === "influencer") {
    score += 10;
  }

  // Boost for high intent
  if (contact.buying_intent === "high") {
    score += 20;
  } else if (contact.buying_intent === "medium") {
    score += 10;
  }

  // Boost if in decision stage
  if (contact.decision_stage === "decision") {
    score += 25;
  } else if (contact.decision_stage === "consideration") {
    score += 15;
  }

  // Cap at 100
  return Math.min(score, 100);
}

export async function getHotLeads(workspaceId: string, limit = 10) {
  const contacts = await db.contacts.listByWorkspace(workspaceId);

  const scored = contacts
    .map((c) => ({
      ...c,
      compositeScore: calculateCompositeScore(c),
    }))
    .filter((c) => c.compositeScore >= 70)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, limit);

  return scored;
}
