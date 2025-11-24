import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import { db } from "@/lib/db";
import { detectMeetingIntent } from "./calendar-intelligence";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31", // Required for prompt caching
  },
});

export interface EmailIntent {
  primary_intent:
    | "meeting_request"
    | "question"
    | "complaint"
    | "feature_request"
    | "pricing_inquiry"
    | "general"
    | "follow_up";
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  requires_response: boolean;
  suggested_response_time: string;
  key_topics: string[];
  action_items: string[];
}

/**
 * Process an email with comprehensive AI analysis
 */
export async function processEmail(
  emailId: string,
  workspaceId: string
): Promise<{
  intent: EmailIntent;
  meetingDetected: boolean;
  meetingIntent?: any;
}> {
  try {
    const email = await db.emails.getById(emailId);

    if (!email) {
      throw new Error("Email not found");
    }

    // Run intent extraction in parallel with meeting detection
    const [{ intent: intentResult, cacheStats }, meetingResult] = await Promise.all([
      extractEmailIntent(email.subject, email.body),
      detectMeetingIntent(email.body, email.subject),
    ]);

    // Update email with analysis
    await db.emails.updateSentiment(emailId, {
      ai_intent: intentResult.primary_intent,
      ai_sentiment: intentResult.sentiment,
      ai_urgency: intentResult.urgency,
      ai_topics: intentResult.key_topics,
      ai_action_items: intentResult.action_items,
      is_meeting_request: meetingResult.isMeetingRequest,
      meeting_intent: meetingResult.isMeetingRequest ? meetingResult : null,
      is_processed: true,
    });

    // Log to audit with cache stats
    await db.auditLogs.create({
      workspace_id: workspaceId,
      action: "email_intent_extraction",
      details: {
        email_id: emailId,
        intent: intentResult.primary_intent,
        sentiment: intentResult.sentiment,
        cacheStats,
      },
    });

    // If it's a meeting request, update contact with meeting metadata
    if (meetingResult.isMeetingRequest) {
      const contact = await db.contacts.getById(email.contact_id);
      if (contact) {
        await db.contacts.update(email.contact_id, {
          last_meeting_request: new Date(),
          meeting_requests_count: (contact.meeting_requests_count || 0) + 1,
        });
      }
    }

    // Update contact sentiment based on email
    const contact = await db.contacts.getById(email.contact_id);
    if (contact) {
      // Calculate rolling sentiment score
      const sentimentValue =
        intentResult.sentiment === "positive"
          ? 20
          : intentResult.sentiment === "negative"
          ? -20
          : 0;

      const currentSentiment = contact.sentiment_score || 0;
      const newSentiment = Math.max(
        -50,
        Math.min(100, currentSentiment + sentimentValue)
      );

      await db.contacts.update(email.contact_id, {
        sentiment_score: newSentiment,
        last_interaction: new Date(),
      });
    }

    return {
      intent: intentResult,
      meetingDetected: meetingResult.isMeetingRequest,
      meetingIntent: meetingResult.isMeetingRequest ? meetingResult : undefined,
    };
  } catch (error) {
    console.error("Error processing email:", error);
    throw error;
  }
}

/**
 * Extract intent and key information from email content
 */
async function extractEmailIntent(
  subject: string,
  body: string
): Promise<{ intent: EmailIntent; cacheStats: any }> {
  try {
    // Static system instructions with prompt caching
    const systemPrompt = `You are an expert email analysis system specializing in B2B communication intent detection.

Your task is to analyze incoming emails and extract:
- Primary intent (meeting, question, complaint, feature request, pricing, etc.)
- Sentiment and urgency
- Action items and key topics

Always return ONLY valid JSON with this exact structure:
{
  "primary_intent": "meeting_request" | "question" | "complaint" | "feature_request" | "pricing_inquiry" | "general" | "follow_up",
  "sentiment": "positive" | "neutral" | "negative",
  "urgency": "low" | "medium" | "high",
  "requires_response": true/false,
  "suggested_response_time": "immediate" | "within_24h" | "within_week" | "no_rush",
  "key_topics": [array of main topics],
  "action_items": [array of actionable items]
}`;

    const emailContent = `Subject: ${subject}

Body:
${body.substring(0, 2000)}

Analyze this email and extract intent and key information.`;

    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
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
          content: emailContent,
        },
      ],
    })
    });

    const message = result.data;;

    // Log cache performance for cost monitoring
    console.log("Email Processor - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON
    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    return {
      intent: JSON.parse(cleanJson),
      cacheStats: {
        input_tokens: message.usage.input_tokens,
        cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
        cache_read_tokens: message.usage.cache_read_input_tokens || 0,
        output_tokens: message.usage.output_tokens,
        cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
      },
    };
  } catch (error) {
    console.error("Error extracting email intent:", error);
    // Return default values on error
    return {
      intent: {
        primary_intent: "general",
        sentiment: "neutral",
        urgency: "medium",
        requires_response: false,
        suggested_response_time: "within_week",
        key_topics: [],
        action_items: [],
      },
      cacheStats: {
        input_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        output_tokens: 0,
        cache_hit: false,
      },
    };
  }
}

/**
 * Batch process unprocessed emails
 */
export async function batchProcessEmails(
  workspaceId: string,
  limit: number = 20
): Promise<{
  processed: number;
  meetingRequestsFound: number;
  errors: number;
}> {
  try {
    const unprocessedEmails = await db.emails.getUnprocessed(workspaceId);

    let processed = 0;
    let meetingRequestsFound = 0;
    let errors = 0;

    const emailsToProcess = unprocessedEmails.slice(0, limit);

    for (const email of emailsToProcess) {
      try {
        const result = await processEmail(email.id, workspaceId);

        processed++;

        if (result.meetingDetected) {
          meetingRequestsFound++;
        }
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        errors++;
      }
    }

    // Log batch processing (cache stats logged per email in processEmail)
    await db.auditLogs.create({
      workspace_id: workspaceId,
      action: "email_batch_processing",
      details: {
        processed,
        meetingRequestsFound,
        errors,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      processed,
      meetingRequestsFound,
      errors,
    };
  } catch (error) {
    console.error("Error in batch processing:", error);
    throw error;
  }
}
