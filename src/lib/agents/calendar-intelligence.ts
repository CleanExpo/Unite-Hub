import Anthropic from "@anthropic-ai/sdk";
import { GoogleCalendarService, TimeSlot } from "@/lib/services/google-calendar";
import { db } from "@/lib/db";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31", // Required for prompt caching
  },
});

// Static system prompts for caching (90% cost savings)
const MEETING_SUGGESTION_SYSTEM_PROMPT = `You are an AI scheduling assistant analyzing meeting requests and suggesting optimal times.

Consider:
1. Time of day preferences (avoid early morning/late evening)
2. Meeting type (sales calls better 10am-4pm, quick syncs anytime)
3. Urgency level
4. Avoid back-to-back meetings (prefer slots with buffer time)
5. Day of week patterns (avoid Monday mornings, Friday afternoons)

Respond in JSON format:
{
  "suggestedTimes": [
    {
      "start": "ISO datetime",
      "end": "ISO datetime",
      "reason": "why this time is optimal",
      "confidence": 0-100
    }
  ],
  "reasoning": "overall scheduling strategy explanation"
}`;

const MEETING_DETECTION_SYSTEM_PROMPT = `Analyze email content to determine if it's a meeting request and extract meeting details.

Respond in JSON format:
{
  "isMeetingRequest": true/false,
  "proposedTimes": ["ISO datetime strings if any times mentioned"],
  "duration": estimated_minutes,
  "purpose": "brief meeting purpose",
  "urgency": "low/medium/high",
  "attendees": ["email addresses if mentioned"]
}`;

const MEETING_EMAIL_SYSTEM_PROMPT = `Generate a professional email proposing meeting times.

Write a brief, friendly email (3-4 sentences) suggesting these times. Don't include subject line.`;

const MEETING_PATTERNS_SYSTEM_PROMPT = `Analyze calendar events to identify meeting patterns.

Identify:
1. Most common meeting days (e.g., "Tuesday", "Wednesday")
2. Most common meeting hours (e.g., [10, 14, 15])
3. Average meeting duration in minutes
4. Busy patterns (e.g., "mornings are busy", "Friday afternoons free")

Respond in JSON:
{
  "preferredDays": ["day names"],
  "preferredHours": [hour numbers],
  "averageMeetingDuration": minutes,
  "busyPatterns": "description"
}`;

export interface MeetingSuggestion {
  timeSlots: Array<{
    start: string;
    end: string;
    reason: string;
    confidence: number;
  }>;
  reasoning: string;
  emailDraft?: string;
}

export interface MeetingRequest {
  contactName: string;
  contactEmail: string;
  purpose: string;
  duration: number; // minutes
  preferredTimeframe?: string;
  urgency?: "low" | "medium" | "high";
}

export interface EmailMeetingIntent {
  isMeetingRequest: boolean;
  proposedTimes?: string[];
  duration?: number;
  attendees?: string[];
  purpose?: string;
  urgency?: "low" | "medium" | "high";
}

/**
 * Suggest optimal meeting times using AI analysis
 */
export async function suggestMeetingTimes(
  workspaceId: string,
  request: MeetingRequest
): Promise<MeetingSuggestion> {
  try {
    // Get calendar service
    const calendarService = new GoogleCalendarService(
      "", // Will be populated from integration
      ""
    );

    // Get available slots for the next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const availableSlots = await calendarService.findAvailableSlots(
      startDate,
      endDate,
      request.duration
    );

    // Get contact history to understand meeting patterns
    const contact = await db.contacts.getByEmail(
      request.contactEmail,
      workspaceId
    );

    let previousMeetingPatterns = "";
    if (contact) {
      // Analyze past email interactions
      const emails = await db.emails.listByContact(contact.id);
      previousMeetingPatterns = `Previous interactions: ${emails.length} emails`;
    }

    // Use Claude to analyze and suggest best times
    const userContext = `Meeting Request:
- Contact: ${request.contactName} (${request.contactEmail})
- Purpose: ${request.purpose}
- Duration: ${request.duration} minutes
- Preferred timeframe: ${request.preferredTimeframe || "Next 7 days"}
- Urgency: ${request.urgency || "medium"}

Available Time Slots (first 20):
${availableSlots.slice(0, 20).map((slot, i) =>
  `${i + 1}. ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}`
).join("\n")}

${previousMeetingPatterns}

Suggest the 3-5 best meeting times.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      system: [
        {
          type: "text",
          text: MEETING_SUGGESTION_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Cache static instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: userContext,
        },
      ],
    });

    // Log cache performance
    console.log("Calendar Meeting Suggestion - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse AI response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const aiSuggestion = JSON.parse(jsonMatch[0]);

    // Generate email draft suggesting these times
    const emailDraft = await generateMeetingRequestEmail(
      request.contactName,
      request.purpose,
      aiSuggestion.suggestedTimes,
      request.duration
    );

    return {
      timeSlots: aiSuggestion.suggestedTimes,
      reasoning: aiSuggestion.reasoning,
      emailDraft,
    };
  } catch (error) {
    console.error("Error suggesting meeting times:", error);
    throw error;
  }
}

/**
 * Analyze email content to detect meeting requests
 */
export async function detectMeetingIntent(
  emailBody: string,
  subject: string
): Promise<EmailMeetingIntent> {
  try {
    const userContext = `Subject: ${subject}

Body:
${emailBody}

Analyze this email.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: [
        {
          type: "text",
          text: MEETING_DETECTION_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Cache static instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: userContext,
        },
      ],
    });

    // Log cache performance
    console.log("Calendar Meeting Detection - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { isMeetingRequest: false };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error detecting meeting intent:", error);
    return { isMeetingRequest: false };
  }
}

/**
 * Generate a professional email with meeting time suggestions
 */
async function generateMeetingRequestEmail(
  recipientName: string,
  purpose: string,
  suggestedTimes: Array<{ start: string; end: string; reason: string }>,
  duration: number
): Promise<string> {
  try {
    const userContext = `Recipient: ${recipientName}
Purpose: ${purpose}
Duration: ${duration} minutes

Suggested Times:
${suggestedTimes.map((slot, i) =>
  `${i + 1}. ${new Date(slot.start).toLocaleString()}`
).join("\n")}

Generate the email.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      system: [
        {
          type: "text",
          text: MEETING_EMAIL_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Cache static instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: userContext,
        },
      ],
    });

    // Log cache performance
    console.log("Calendar Email Generation - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    return message.content[0].type === "text" ? message.content[0].text : "";
  } catch (error) {
    console.error("Error generating email:", error);
    return "";
  }
}

/**
 * Analyze calendar patterns to suggest optimal meeting times
 */
export async function analyzeMeetingPatterns(
  workspaceId: string,
  calendarService: GoogleCalendarService
): Promise<{
  preferredDays: string[];
  preferredHours: number[];
  averageMeetingDuration: number;
  busyPatterns: string;
}> {
  try {
    // Get last 30 days of calendar events
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const events = await calendarService.listEvents(
      startDate.toISOString(),
      endDate.toISOString(),
      1000
    );

    // Analyze patterns with AI
    const eventsData = events.map((e) => ({
      summary: e.summary,
      start: e.start?.dateTime,
      end: e.end?.dateTime,
      attendees: e.attendees?.length || 0,
    }));

    const userContext = `Calendar events to analyze:

${JSON.stringify(eventsData.slice(0, 100), null, 2)}

Identify meeting patterns.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1000,
      system: [
        {
          type: "text",
          text: MEETING_PATTERNS_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Cache static instructions
        },
      ],
      messages: [
        {
          role: "user",
          content: userContext,
        },
      ],
    });

    // Log cache performance
    console.log("Calendar Pattern Analysis - Cache Stats:", {
      input_tokens: message.usage.input_tokens,
      cache_creation_tokens: message.usage.cache_creation_input_tokens || 0,
      cache_read_tokens: message.usage.cache_read_input_tokens || 0,
      output_tokens: message.usage.output_tokens,
      cache_hit: (message.usage.cache_read_input_tokens || 0) > 0,
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error analyzing meeting patterns:", error);
    return {
      preferredDays: [],
      preferredHours: [],
      averageMeetingDuration: 30,
      busyPatterns: "",
    };
  }
}

/**
 * Automatically respond to meeting requests with availability
 */
export async function autoRespondToMeetingRequest(
  workspaceId: string,
  emailId: string,
  meetingIntent: EmailMeetingIntent
): Promise<string> {
  try {
    // Get email details
    const email = await db.emails.getById(emailId);
    if (!email) throw new Error("Email not found");

    // Get contact
    const contact = await db.contacts.getById(email.contact_id);
    if (!contact) throw new Error("Contact not found");

    // Suggest meeting times
    const suggestion = await suggestMeetingTimes(workspaceId, {
      contactName: contact.name || "there",
      contactEmail: contact.email,
      purpose: meetingIntent.purpose || "discussion",
      duration: meetingIntent.duration || 30,
      urgency: meetingIntent.urgency,
    });

    return suggestion.emailDraft || "";
  } catch (error) {
    console.error("Error auto-responding to meeting request:", error);
    throw error;
  }
}
