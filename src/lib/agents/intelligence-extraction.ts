import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface EmailIntelligence {
  id: string;
  workspace_id: string;
  email_id: string;
  contact_id: string | null;

  // Communication Analysis
  primary_intent: string;
  secondary_intents: string[];
  sentiment: "positive" | "neutral" | "negative";
  urgency_level: "low" | "medium" | "high" | "critical";

  // Content Extraction
  key_topics: string[];
  entities_mentioned: string[];
  pain_points: string[];
  questions_asked: string[];
  action_items: string[];

  // Business Context
  business_opportunity: string | null;
  budget_mentioned: boolean;
  timeline_mentioned: boolean;
  decision_maker: boolean;

  // AI Metadata
  confidence_score: number;
  extraction_model: string;
  extracted_at: Date;
}

interface ExtractionResult {
  processed: number;
  failed: number;
  total: number;
  intelligenceRecords: EmailIntelligence[];
}

/**
 * Extract intelligence from unanalyzed emails
 *
 * @param workspaceId - Workspace ID to process emails for
 * @param batchSize - Number of emails to process (default: 10)
 * @returns Extraction result with processed count and intelligence records
 */
export async function extractEmailIntelligence(
  workspaceId: string,
  batchSize: number = 10
): Promise<ExtractionResult> {
  const supabase = await getSupabaseServer();

  try {
    // Fetch unanalyzed emails
    const { data: emails, error: fetchError } = await supabase
      .from("client_emails")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("intelligence_analyzed", false)
      .order("received_at", { ascending: false })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`);
    }

    if (!emails || emails.length === 0) {
      return {
        processed: 0,
        failed: 0,
        total: 0,
        intelligenceRecords: [],
      };
    }

    const intelligenceRecords: EmailIntelligence[] = [];
    let processed = 0;
    let failed = 0;

    // Process each email
    for (const email of emails) {
      try {
        // Extract intelligence using Claude
        const intelligence = await extractIntelligenceFromEmail(email, workspaceId);

        // Save intelligence record
        const { data: savedIntelligence, error: saveError } = await supabase
          .from("email_intelligence")
          .insert(intelligence)
          .select()
          .single();

        if (saveError) {
          console.error(`Failed to save intelligence for email ${email.id}:`, saveError);
          failed++;
          continue;
        }

        // Update email as analyzed
        const { error: updateError } = await supabase
          .from("client_emails")
          .update({
            intelligence_analyzed: true,
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        if (updateError) {
          console.error(`Failed to update email ${email.id}:`, updateError);
          failed++;
          continue;
        }

        intelligenceRecords.push(savedIntelligence);
        processed++;
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        failed++;
      }
    }

    return {
      processed,
      failed,
      total: emails.length,
      intelligenceRecords,
    };
  } catch (error) {
    console.error("Intelligence extraction error:", error);
    throw error;
  }
}

/**
 * Extract intelligence from a single email using Claude API
 */
async function extractIntelligenceFromEmail(
  email: any,
  workspaceId: string
): Promise<Omit<EmailIntelligence, "id" | "extracted_at">> {
  const emailContent = `
From: ${email.from_email}
To: ${email.to_emails?.join(", ") || ""}
Subject: ${email.subject || ""}
Date: ${email.received_at}

${email.body_text || email.snippet || ""}
  `.trim();

  const systemPrompt = `You are an AI intelligence extraction agent for a CRM system. Your task is to analyze business emails and extract structured intelligence.

Extract the following information from the email:

1. PRIMARY_INTENT (choose one):
   - meeting_request, question, proposal, complaint, feedback, support_request,
   - sales_inquiry, partnership, introduction, follow_up, information_sharing, other

2. SECONDARY_INTENTS (array): Additional intents present in the email

3. SENTIMENT (choose one): positive, neutral, negative

4. URGENCY_LEVEL (choose one): low, medium, high, critical

5. KEY_TOPICS (array): Main topics discussed (max 5)

6. ENTITIES_MENTIONED (array): People, companies, products, technologies mentioned

7. PAIN_POINTS (array): Problems or challenges mentioned by the sender

8. QUESTIONS_ASKED (array): Direct questions asked in the email

9. ACTION_ITEMS (array): Tasks or actions requested

10. BUSINESS_OPPORTUNITY (string or null): Brief description if this represents a business opportunity

11. BUDGET_MENTIONED (boolean): Whether budget/pricing was mentioned

12. TIMELINE_MENTIONED (boolean): Whether timeline/deadlines were mentioned

13. DECISION_MAKER (boolean): Whether sender appears to be a decision maker

14. CONFIDENCE_SCORE (0-100): Your confidence in this analysis

Return ONLY a valid JSON object with these exact keys. No markdown, no explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze this email and return the intelligence JSON:\n\n${emailContent}`,
        },
      ],
    });

    const response = message.content[0];
    if (response.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    // Parse Claude's response
    const intelligence = JSON.parse(response.text);

    // Map to database schema
    return {
      workspace_id: workspaceId,
      email_id: email.id,
      contact_id: email.contact_id || null,

      primary_intent: intelligence.PRIMARY_INTENT || "other",
      secondary_intents: intelligence.SECONDARY_INTENTS || [],
      sentiment: intelligence.SENTIMENT || "neutral",
      urgency_level: intelligence.URGENCY_LEVEL || "low",

      key_topics: intelligence.KEY_TOPICS || [],
      entities_mentioned: intelligence.ENTITIES_MENTIONED || [],
      pain_points: intelligence.PAIN_POINTS || [],
      questions_asked: intelligence.QUESTIONS_ASKED || [],
      action_items: intelligence.ACTION_ITEMS || [],

      business_opportunity: intelligence.BUSINESS_OPPORTUNITY || null,
      budget_mentioned: intelligence.BUDGET_MENTIONED || false,
      timeline_mentioned: intelligence.TIMELINE_MENTIONED || false,
      decision_maker: intelligence.DECISION_MAKER || false,

      confidence_score: intelligence.CONFIDENCE_SCORE || 0,
      extraction_model: "claude-sonnet-4-5-20250929",
      extracted_at: new Date(),
    };
  } catch (error) {
    console.error("Claude API error:", error);

    // Return fallback intelligence with low confidence
    return {
      workspace_id: workspaceId,
      email_id: email.id,
      contact_id: email.contact_id || null,

      primary_intent: "other",
      secondary_intents: [],
      sentiment: "neutral",
      urgency_level: "low",

      key_topics: [],
      entities_mentioned: [],
      pain_points: [],
      questions_asked: [],
      action_items: [],

      business_opportunity: null,
      budget_mentioned: false,
      timeline_mentioned: false,
      decision_maker: false,

      confidence_score: 0,
      extraction_model: "claude-sonnet-4-5-20250929",
      extracted_at: new Date(),
    };
  }
}

/**
 * Get unanalyzed email count for a workspace
 */
export async function getUnanalyzedEmailCount(workspaceId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  const { count, error } = await supabase
    .from("client_emails")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("intelligence_analyzed", false);

  if (error) {
    console.error("Error counting unanalyzed emails:", error);
    return 0;
  }

  return count || 0;
}
