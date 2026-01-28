/**
 * Email Intelligence Agent
 *
 * Purpose: Extract business intelligence from client email conversations
 * Model: Claude Sonnet 4.5 with prompt caching
 * Features: Idea extraction, goal identification, pain point analysis, sentiment detection
 *
 * Part of: Autonomous Client Intelligence System
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { extractCacheStats, logCacheStats } from "@/lib/anthropic/features/prompt-cache";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31",
  },
});

// =====================================================
// TYPES
// =====================================================

export interface EmailIntelligence {
  // Raw Data
  email_thread_id: string;
  from: string;
  to: string;
  subject: string;
  body_text: string;
  sent_at: Date;

  // AI-Extracted Intelligence
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    category: "product" | "service" | "problem" | "opportunity";
    confidence_score: number;
  }>;

  business_goals: Array<{
    goal: string;
    priority: "high" | "medium" | "low";
    timeframe?: string;
  }>;

  pain_points: Array<{
    problem: string;
    impact: string;
    urgency: "urgent" | "important" | "nice-to-have";
  }>;

  requirements: Array<{
    requirement: string;
    type: "technical" | "budget" | "timeline" | "resource";
    must_have: boolean;
  }>;

  questions_asked: string[];
  decisions_made: string[];

  // Metadata
  sentiment: "excited" | "concerned" | "neutral" | "frustrated";
  energy_level: number; // 1-10
  decision_readiness: number; // 1-10
}

export interface IntelligenceExtractionResult {
  success: boolean;
  intelligence: EmailIntelligence;
  cache_stats: {
    input_tokens: number;
    cache_creation_tokens: number;
    cache_read_tokens: number;
    output_tokens: number;
    cache_hit: boolean;
  };
  error?: string;
}

// =====================================================
// SYSTEM PROMPT (CACHED)
// =====================================================

const SYSTEM_PROMPT = `You are an expert business intelligence analyst specializing in extracting actionable insights from client email conversations.

**Your Task:**
Analyze email content from potential clients and extract:
1. Business ideas and concepts they're exploring
2. Stated business goals and objectives
3. Pain points, problems, and frustrations
4. Specific requirements (technical, budget, timeline, resources)
5. Questions they're asking
6. Decisions they've made or are making
7. Overall sentiment and readiness to proceed

**Analysis Guidelines:**
- Look for explicit statements AND implicit signals
- Categorize ideas by type (product, service, problem to solve, opportunity)
- Assess urgency of pain points (urgent = needs immediate solution, important = critical but not time-sensitive, nice-to-have = aspirational)
- Identify MUST-HAVE vs NICE-TO-HAVE requirements
- Gauge sentiment from language, tone, and context
- Score energy level (how excited/enthusiastic are they?) 1-10
- Score decision readiness (how close to making a purchase decision?) 1-10

**Output Format:**
Return ONLY valid JSON with this exact structure:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Brief title of the idea",
      "description": "What they want to build/achieve",
      "category": "product|service|problem|opportunity",
      "confidence_score": 0.0-1.0
    }
  ],
  "business_goals": [
    {
      "goal": "Specific measurable goal",
      "priority": "high|medium|low",
      "timeframe": "Optional: when they want to achieve this"
    }
  ],
  "pain_points": [
    {
      "problem": "What problem they're facing",
      "impact": "How it affects their business",
      "urgency": "urgent|important|nice-to-have"
    }
  ],
  "requirements": [
    {
      "requirement": "Specific requirement",
      "type": "technical|budget|timeline|resource",
      "must_have": true/false
    }
  ],
  "questions_asked": ["Question 1", "Question 2"],
  "decisions_made": ["Decision 1", "Decision 2"],
  "sentiment": "excited|concerned|neutral|frustrated",
  "energy_level": 1-10,
  "decision_readiness": 1-10
}

**Important:**
- If information is unclear, use lower confidence scores
- Empty arrays are OK if no data found
- Be conservative with urgency/priority assessments
- Focus on actionable insights, not vague statements`;

// =====================================================
// MAIN INTELLIGENCE EXTRACTION FUNCTION
// =====================================================

export async function analyzeEmailForIntelligence(
  emailId: string,
  workspaceId: string
): Promise<IntelligenceExtractionResult> {
  try {
    // Fetch email from database
    const email = await db.emails.getById(emailId);

    if (!email) {
      return {
        success: false,
        intelligence: null as any,
        cache_stats: {} as any,
        error: `Email ${emailId} not found`,
      };
    }

    // Check if already analyzed
    const existing = await db.query(
      `SELECT * FROM email_intelligence WHERE email_id = $1`,
      [emailId]
    );

    if (existing.rows.length > 0) {
      console.log(`Email ${emailId} already analyzed, returning cached result`);
      return {
        success: true,
        intelligence: existing.rows[0] as any,
        cache_stats: {
          input_tokens: 0,
          cache_creation_tokens: 0,
          cache_read_tokens: 0,
          output_tokens: 0,
          cache_hit: true,
        },
      };
    }

    // Prepare email content for analysis
    const emailContent = `
**FROM:** ${email.from}
**TO:** ${email.to}
**SUBJECT:** ${email.subject}
**DATE:** ${email.sent_at}

**EMAIL BODY:**
${email.body.substring(0, 4000)} ${email.body.length > 4000 ? "...[truncated]" : ""}

---

Analyze this email and extract business intelligence.
`.trim();

    // Call Claude with prompt caching and retry logic
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" }, // Cache system prompt (90% cost savings on repeat calls)
          },
        ],
        messages: [
          {
            role: "user",
            content: emailContent,
          },
        ],
      });
    });

    const message = result.data;

    // Extract text response
    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response as JSON");
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Build EmailIntelligence object
    const intelligence: EmailIntelligence = {
      email_thread_id: email.thread_id || email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      body_text: email.body,
      sent_at: new Date(email.sent_at),
      ideas: extracted.ideas || [],
      business_goals: extracted.business_goals || [],
      pain_points: extracted.pain_points || [],
      requirements: extracted.requirements || [],
      questions_asked: extracted.questions_asked || [],
      decisions_made: extracted.decisions_made || [],
      sentiment: extracted.sentiment || "neutral",
      energy_level: extracted.energy_level || 5,
      decision_readiness: extracted.decision_readiness || 5,
    };

    // Calculate average confidence score
    const avgConfidence =
      intelligence.ideas.length > 0
        ? intelligence.ideas.reduce((sum, idea) => sum + idea.confidence_score, 0) /
          intelligence.ideas.length
        : 0.5;

    // Store in database
    await db.query(
      `
      INSERT INTO email_intelligence (
        email_id, contact_id, workspace_id,
        ideas, business_goals, pain_points, requirements,
        questions_asked, decisions_made,
        sentiment, energy_level, decision_readiness,
        analyzed_at, ai_model, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), $13, $14)
      `,
      [
        emailId,
        email.contact_id,
        workspaceId,
        JSON.stringify(intelligence.ideas),
        JSON.stringify(intelligence.business_goals),
        JSON.stringify(intelligence.pain_points),
        JSON.stringify(intelligence.requirements),
        intelligence.questions_asked,
        intelligence.decisions_made,
        intelligence.sentiment,
        intelligence.energy_level,
        intelligence.decision_readiness,
        "claude-sonnet-4-5-20250929",
        avgConfidence,
      ]
    );

    // Log cache performance using centralized utilities
    const cacheStats = extractCacheStats(message, "claude-sonnet-4-5-20250929");
    logCacheStats("EmailIntelligence:analyzeEmailForIntelligence", cacheStats);

    // Audit log
    await db.auditLogs.create({
      workspace_id: workspaceId,
      action: "email_intelligence_extraction",
      details: {
        email_id: emailId,
        ideas_count: intelligence.ideas.length,
        goals_count: intelligence.business_goals.length,
        pain_points_count: intelligence.pain_points.length,
        sentiment: intelligence.sentiment,
        cache_stats: cacheStats,
      },
    });

    return {
      success: true,
      intelligence,
      cache_stats,
    };
  } catch (error) {
    console.error("Email intelligence extraction error:", error);
    return {
      success: false,
      intelligence: null as any,
      cache_stats: {} as any,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// =====================================================
// BATCH PROCESSING
// =====================================================

export async function batchAnalyzeContactEmails(
  contactId: string,
  workspaceId: string,
  limit: number = 50
): Promise<{
  processed: number;
  errors: number;
  totalIntelligence: {
    ideas: number;
    goals: number;
    painPoints: number;
    requirements: number;
  };
}> {
  try {
    // Get all emails for contact
    const emails = await db.emails.getByContact(contactId);

    if (emails.length === 0) {
      return {
        processed: 0,
        errors: 0,
        totalIntelligence: { ideas: 0, goals: 0, painPoints: 0, requirements: 0 },
      };
    }

    let processed = 0;
    let errors = 0;
    const intelligence = { ideas: 0, goals: 0, painPoints: 0, requirements: 0 };

    const emailsToProcess = emails.slice(0, limit);

    for (const email of emailsToProcess) {
      try {
        const result = await analyzeEmailForIntelligence(email.id, workspaceId);

        if (result.success) {
          processed++;
          intelligence.ideas += result.intelligence.ideas.length;
          intelligence.goals += result.intelligence.business_goals.length;
          intelligence.painPoints += result.intelligence.pain_points.length;
          intelligence.requirements += result.intelligence.requirements.length;
        } else {
          errors++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        errors++;
      }
    }

    // Update contact with summary
    await db.contacts.update(contactId, {
      last_intelligence_update: new Date(),
    });

    return {
      processed,
      errors,
      totalIntelligence: intelligence,
    };
  } catch (error) {
    console.error("Batch analysis error:", error);
    throw error;
  }
}

// =====================================================
// AGGREGATE INTELLIGENCE FOR CONTACT
// =====================================================

export async function getContactIntelligenceSummary(
  contactId: string
): Promise<{
  totalEmailsAnalyzed: number;
  allIdeas: any[];
  allGoals: any[];
  allPainPoints: any[];
  allRequirements: any[];
  avgSentiment: number;
  avgEnergyLevel: number;
  avgDecisionReadiness: number;
}> {
  try {
    const result = await db.query(
      `
      SELECT
        COUNT(DISTINCT email_id) as total_emails,
        jsonb_agg(ideas) as ideas_collection,
        jsonb_agg(business_goals) as goals_collection,
        jsonb_agg(pain_points) as pain_points_collection,
        jsonb_agg(requirements) as requirements_collection,
        AVG(
          CASE sentiment
            WHEN 'excited' THEN 2
            WHEN 'neutral' THEN 0
            WHEN 'concerned' THEN -1
            WHEN 'frustrated' THEN -2
            ELSE 0
          END
        ) as avg_sentiment,
        AVG(energy_level) as avg_energy,
        AVG(decision_readiness) as avg_readiness
      FROM email_intelligence
      WHERE contact_id = $1
      `,
      [contactId]
    );

    const row = result.rows[0];

    // Flatten and deduplicate
    const allIdeas = flattenAndDeduplicate(row.ideas_collection);
    const allGoals = flattenAndDeduplicate(row.goals_collection);
    const allPainPoints = flattenAndDeduplicate(row.pain_points_collection);
    const allRequirements = flattenAndDeduplicate(row.requirements_collection);

    return {
      totalEmailsAnalyzed: parseInt(row.total_emails || "0"),
      allIdeas,
      allGoals,
      allPainPoints,
      allRequirements,
      avgSentiment: parseFloat(row.avg_sentiment || "0"),
      avgEnergyLevel: parseFloat(row.avg_energy || "5"),
      avgDecisionReadiness: parseFloat(row.avg_readiness || "5"),
    };
  } catch (error) {
    console.error("Error getting intelligence summary:", error);
    throw error;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function flattenAndDeduplicate(jsonbAgg: any[]): any[] {
  if (!jsonbAgg || !Array.isArray(jsonbAgg)) return [];

  const flattened: any[] = [];
  const seen = new Set<string>();

  for (const item of jsonbAgg) {
    if (!Array.isArray(item)) continue;

    for (const subItem of item) {
      const key =
        subItem.title ||
        subItem.goal ||
        subItem.problem ||
        subItem.requirement ||
        JSON.stringify(subItem);

      if (!seen.has(key)) {
        seen.add(key);
        flattened.push(subItem);
      }
    }
  }

  return flattened;
}
