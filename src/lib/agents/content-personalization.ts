import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PersonalizedContent {
  subject_lines: string[];
  body: string;
  cta: string;
  tone: "professional" | "consultative" | "friendly";
  personalization_score: number;
  key_talking_points: string[];
  social_proof: string[];
}

export async function generatePersonalizedContent(
  contactId: string,
  contentType: "followup" | "proposal" | "case_study",
  caseStudies: any[] = []
): Promise<PersonalizedContent> {
  try {
    // Get contact with full intelligence
    const contact = await db.contacts.getById(contactId);
    if (!contact) throw new Error(`Contact ${contactId} not found`);

    // Get contact interaction history
    const emails = await db.emails.getByContact(contactId);
    const interactions = await db.interactions.getByContact(contactId);

    // Build context
    const recentActivity = emails
      .slice(0, 3)
      .map(
        (e) =>
          `${new Date(e.created_at).toLocaleDateString()}: ${e.subject}`
      )
      .join("\n");

    const opportunitySignals = contact.opportunity_signals || [];
    const riskSignals = contact.risk_signals || [];

    // Industry and role-specific prompt
    const roleGuidance = getRoleGuidance(contact.role_type);
    const industryGuidance = getIndustryGuidance(contact.industry || "general");
    const stageGuidance = getStageGuidance(contact.decision_stage);

    // Static system instructions with caching
    const systemPrompt = `You are an expert B2B sales copywriter specializing in hyper-personalized email outreach.

Your task is to generate compelling, personalized sales content that resonates with specific buyer personas, industries, and decision stages.

Always return ONLY valid JSON with this exact structure:
{
  "subject_lines": ["subject_option_A", "subject_option_B", "subject_option_C"],
  "body": "<email body - 150-200 words, highly personalized>",
  "cta": "<specific, action-oriented call to action>",
  "tone": "professional|consultative|friendly",
  "personalization_score": <0-100>,
  "key_talking_points": ["point1", "point2", "point3"],
  "social_proof": ["proof1", "proof2"]
}

Guidelines:
- Use the prospect's specific context (signals, risks, stage)
- Reference relevant case studies when available
- Match tone to role type (formal for C-level, consultative for technical)
- Include measurable outcomes when possible
- Keep body concise but impactful (150-200 words)`;

    const prospectData = `PROSPECT PROFILE:
- Name: ${contact.name}
- Company: ${contact.company}
- Job Title: ${contact.job_title}
- Industry: ${contact.industry || "General"}
- AI Intelligence Score: ${contact.ai_score}/100
- Buying Intent: ${contact.buying_intent}
- Decision Stage: ${contact.decision_stage}
- Role Type: ${contact.role_type}
- Engagement Velocity: ${contact.engagement_velocity}

INTERACTION HISTORY:
${recentActivity || "First outreach"}

POSITIVE SIGNALS:
${opportunitySignals.slice(0, 3).join("\n") || "New prospect"}

CHALLENGES/RISKS:
${riskSignals.slice(0, 2).join("\n") || "None detected"}

CONTEXT GUIDELINES:
Role: ${roleGuidance}
Industry: ${industryGuidance}
Stage: ${stageGuidance}

RELEVANT CASE STUDIES:
${caseStudies
  .slice(0, 2)
  .map(
    (cs) =>
      `- ${cs.company}: ${cs.industry}, Results: ${cs.results.join(", ")}`
  )
  .join("\n") || "Generic case study available"}

Content Type: ${contentType}
${
  contentType === "followup"
    ? "- Reference their previous interaction"
    : contentType === "proposal"
    ? "- Include specific deliverables and timeline"
    : "- Include specific results and metrics"
}

Generate hyper-personalized ${contentType} email for this prospect.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 2000,
      thinking: {
        type: "enabled",
        budget_tokens: 5000,
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
          content: prospectData,
        },
      ],
    });

    // Extract and parse response
    let jsonText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        jsonText = block.text;
        break;
      }
    }

    let content: PersonalizedContent;
    try {
      const jsonMatch =
        jsonText.match(/```json\n?([\s\S]*?)\n?```/) ||
        jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;
      content = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse response:", jsonText);
      throw new Error(`Invalid JSON: ${jsonText.substring(0, 100)}`);
    }

    // Store in database
    const storedContent = await db.content.create({
      workspace_id: contact.workspace_id,
      contact_id: contactId,
      title: `${contentType.charAt(0).toUpperCase() + contentType.slice(1)} - ${contact.name}`,
      content_type: contentType,
      generated_text: content.body,
      ai_model: "opus-4",
      status: "draft",
      subject_lines: content.subject_lines,
      personalization_score: content.personalization_score,
      industry_context: { industry: contact.industry },
      role_context: { role_type: contact.role_type, buying_intent: contact.buying_intent },
    });

    // Store A/B test variants
    for (let i = 0; i < content.subject_lines.length; i++) {
      const variant = String.fromCharCode(65 + i); // A, B, C
      await db.emailVariants.create({
        content_id: storedContent.id,
        variant_letter: variant,
        subject_line: content.subject_lines[i],
        body: content.body,
      });
    }

    // Log to audit
    await db.auditLogs.logAgentRun(
      contact.workspace_id,
      "content_personalization",
      {
        contact_id: contactId,
        content_type: contentType,
        personalization_score: content.personalization_score,
        status: "success",
      }
    );

    return content;
  } catch (error) {
    console.error("Content personalization failed:", error);
    throw error;
  }
}

export async function generateBulkContent(
  hotLeads: any[],
  contentType: "followup" | "proposal" | "case_study"
) {
  let generated = 0;
  let errors = 0;

  for (const lead of hotLeads) {
    try {
      await generatePersonalizedContent(lead.id, contentType);
      generated++;
      console.log(`✅ Generated ${contentType} for ${lead.name}`);
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      errors++;
      console.error(`❌ Failed for ${lead.name}:`, error);
    }
  }

  return { generated, errors };
}

// Helper functions for context-aware generation
function getRoleGuidance(roleType: string): string {
  const guidance: Record<string, string> = {
    decision_maker:
      "Focus on ROI, risk mitigation, and strategic impact. Be direct and data-driven.",
    influencer:
      "Build consensus support. Highlight team benefits and ease of adoption.",
    end_user:
      "Focus on workflow improvement and time savings. Be practical and specific.",
    unknown:
      "Use balanced approach combining strategic value with practical benefits.",
  };
  return guidance[roleType] || guidance.unknown;
}

function getIndustryGuidance(industry: string): string {
  const guidance: Record<string, string> = {
    technology:
      "Emphasize innovation, scalability, and competitive advantage. Use technical credibility.",
    healthcare:
      "Emphasize compliance, patient outcomes, and operational efficiency.",
    finance:
      "Emphasize security, risk management, and regulatory compliance.",
    ecommerce:
      "Emphasize revenue impact, customer experience, and conversion optimization.",
    saas: "Emphasize integration, user adoption, and metric improvements.",
    general:
      "Use universally appealing benefits like time savings and revenue growth.",
  };
  return guidance[industry.toLowerCase()] || guidance.general;
}

function getStageGuidance(stage: string): string {
  const guidance: Record<string, string> = {
    awareness:
      "Educate about the problem and why it matters. Build credibility with insights.",
    consideration:
      "Compare approaches and demonstrate unique value. Share case studies.",
    decision:
      "Address final concerns, provide pricing clarity, and facilitate next steps quickly.",
    unknown:
      "Use balanced approach appropriate for early-stage conversations.",
  };
  return guidance[stage] || guidance.unknown;
}

export interface PersonalizationMetrics {
  avgPersonalizationScore: number;
  contentByType: Record<string, number>;
  abTestVariants: number;
  topPerformingTone: string;
}

export async function getPersonalizationMetrics(
  workspaceId: string
): Promise<PersonalizationMetrics> {
  const content = await db.content.listByWorkspace(workspaceId);

  const scores = content
    .filter((c) => c.personalization_score)
    .map((c) => c.personalization_score);

  const byType = {
    followup: content.filter((c) => c.content_type === "followup").length,
    proposal: content.filter((c) => c.content_type === "proposal").length,
    case_study: content.filter((c) => c.content_type === "case_study").length,
  };

  return {
    avgPersonalizationScore:
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0,
    contentByType: byType,
    abTestVariants: content.reduce((sum, c) => sum + (c.subject_lines?.length || 0), 0),
    topPerformingTone: "professional", // Calculate from analytics
  };
}
