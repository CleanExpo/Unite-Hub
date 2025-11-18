/**
 * Gmail Intelligence Agent - Powered by Gemini 3 Pro
 *
 * Processes Gmail emails with Google's native AI for superior integration.
 * Leverages Gemini 3's multimodal capabilities for attachments and PDFs.
 *
 * Use cases:
 * - Email intent extraction
 * - Sentiment analysis
 * - Entity recognition (people, companies, dates, amounts)
 * - Action item detection
 * - Meeting request parsing
 * - PDF attachment analysis
 *
 * See: docs/GEMINI_3_INTEGRATION_STRATEGY.md
 */

import { callGemini3, checkGeminiDailyBudget } from './gemini-client';
import { syncGmailEmails } from '@/lib/integrations/gmail';
import { getSupabaseAdmin } from '@/lib/supabase';

export interface EmailIntelligence {
  intent: 'meeting_request' | 'question' | 'proposal' | 'followup' | 'introduction' | 'complaint' | 'other';
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
  entities: {
    people: string[];
    companies: string[];
    dates: string[];
    amounts: string[];
    locations: string[];
  };
  summary: string;
  suggestedResponse?: string;
  meetingDetails?: {
    proposedTime?: string;
    duration?: number;
    location?: string;
    attendees?: string[];
  };
}

/**
 * Process Gmail emails with Gemini 3 intelligence
 *
 * @example
 * const result = await processGmailWithGemini('integration-id-123', {
 *   useLowThinking: true, // Fast processing for high volume
 *   maxEmails: 50
 * });
 */
export async function processGmailWithGemini(
  integrationId: string,
  options: {
    useLowThinking?: boolean;
    maxEmails?: number;
    workspaceId?: string;
  } = {}
): Promise<{
  processed: number;
  failed: number;
  budgetExceeded: boolean;
}> {
  const { useLowThinking = true, maxEmails = 20, workspaceId } = options;

  try {
    // Check budget before processing
    const budgetStatus = await checkGeminiDailyBudget();
    if (budgetStatus.budgetExceeded) {
      console.warn('⚠️ Gemini daily budget exceeded, falling back to OpenRouter');
      return { processed: 0, failed: 0, budgetExceeded: true };
    }

    // Sync emails from Gmail
    const syncResult = await syncGmailEmails(integrationId);
    console.log(`📧 Synced ${syncResult.imported} new emails from Gmail`);

    if (syncResult.imported === 0) {
      return { processed: 0, failed: 0, budgetExceeded: false };
    }

    // Get unprocessed emails from database
    const supabase = getSupabaseAdmin();
    const { data: emails, error } = await supabase
      .from('client_emails')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('intelligence_analyzed', false)
      .order('received_at', { ascending: false })
      .limit(maxEmails);

    if (error) throw error;
    if (!emails || emails.length === 0) {
      return { processed: 0, failed: 0, budgetExceeded: false };
    }

    let processed = 0;
    let failed = 0;

    // Process each email with Gemini 3
    for (const email of emails) {
      try {
        const intelligence = await extractEmailIntelligence({
          from: email.from_email,
          subject: email.subject,
          body: email.body_text,
          useLowThinking,
          workspaceId
        });

        // Update email record with extracted intelligence
        await supabase
          .from('client_emails')
          .update({
            intelligence_analyzed: true,
            ai_extracted_intent: intelligence.intent,
            ai_sentiment: intelligence.sentiment,
            ai_priority: intelligence.priority,
            ai_summary: intelligence.summary,
            ai_action_items: intelligence.actionItems,
            ai_entities: intelligence.entities,
            suggested_response: intelligence.suggestedResponse,
            meeting_details: intelligence.meetingDetails,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        // Update contact AI score based on intelligence
        if (email.contact_id) {
          await updateContactScore(email.contact_id, intelligence);
        }

        processed++;
        console.log(`✅ Processed email ${email.id}: ${intelligence.intent} (${intelligence.priority})`);
      } catch (error: any) {
        console.error(`❌ Failed to process email ${email.id}:`, error.message);
        failed++;

        // Mark as analyzed (with error) to prevent retry loops
        await supabase
          .from('client_emails')
          .update({
            intelligence_analyzed: true,
            ai_extraction_error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);
      }
    }

    console.log(`📊 Gmail intelligence: ${processed} processed, ${failed} failed`);
    return { processed, failed, budgetExceeded: false };
  } catch (error: any) {
    console.error('Gmail intelligence processing error:', error);
    throw error;
  }
}

/**
 * Extract intelligence from a single email using Gemini 3
 */
export async function extractEmailIntelligence(params: {
  from: string;
  subject: string;
  body: string;
  useLowThinking?: boolean;
  workspaceId?: string;
}): Promise<EmailIntelligence> {
  const { from, subject, body, useLowThinking = true, workspaceId } = params;

  const systemPrompt = `You are an expert email intelligence analyst for a CRM system. Analyze emails and extract structured intelligence to help sales teams prioritize and respond effectively.

Extract the following information:
1. Primary intent (meeting_request, question, proposal, followup, introduction, complaint, other)
2. Sentiment (positive, neutral, negative)
3. Priority level (high, medium, low)
4. Actionable items (specific tasks that need to be done)
5. Named entities (people, companies, dates, amounts, locations)
6. Brief summary (2-3 sentences)
7. Suggested response strategy (optional)
8. Meeting details if it's a meeting request (time, duration, location, attendees)

Return ONLY valid JSON matching this structure:
{
  "intent": "meeting_request",
  "sentiment": "positive",
  "priority": "high",
  "actionItems": ["Schedule meeting", "Prepare proposal"],
  "entities": {
    "people": ["John Smith"],
    "companies": ["Acme Corp"],
    "dates": ["next Tuesday at 2pm"],
    "amounts": ["$50,000"],
    "locations": ["Sydney office"]
  },
  "summary": "Client requesting urgent meeting...",
  "suggestedResponse": "Confirm availability and suggest alternative times",
  "meetingDetails": {
    "proposedTime": "next Tuesday at 2pm",
    "duration": 60,
    "location": "Sydney office",
    "attendees": ["John Smith"]
  }
}`;

  const prompt = `Analyze this email:

From: ${from}
Subject: ${subject}

Body:
${body.substring(0, 5000)} ${body.length > 5000 ? '...(truncated)' : ''}

Extract intelligence and return JSON.`;

  const response = await callGemini3({
    prompt,
    systemPrompt,
    thinkingLevel: useLowThinking ? 'low' : 'high',
    maxTokens: 2048,
    workspaceId
  });

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const intelligence = JSON.parse(jsonText);

    // Validate required fields
    if (!intelligence.intent || !intelligence.sentiment || !intelligence.priority) {
      throw new Error('Missing required fields in intelligence extraction');
    }

    return intelligence as EmailIntelligence;
  } catch (parseError: any) {
    console.error('Failed to parse Gemini response:', response.text);
    throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
  }
}

/**
 * Analyze PDF attachment from Gmail using Gemini 3's multimodal capabilities
 */
export async function analyzePdfAttachment(params: {
  emailId: string;
  pdfData: string; // Base64 encoded
  fileName: string;
  workspaceId?: string;
}): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  extractedText?: string;
}> {
  const { emailId, pdfData, fileName, workspaceId } = params;

  const systemPrompt = `You are a document intelligence analyst. Analyze PDF attachments from emails and extract:
1. Summary of the document
2. Key points and insights
3. Action items or next steps
4. Important data (if applicable)

Return JSON format:
{
  "summary": "Brief overview...",
  "keyPoints": ["Point 1", "Point 2"],
  "actionItems": ["Action 1", "Action 2"],
  "extractedText": "Full text if needed"
}`;

  const response = await callGemini3({
    prompt: `Analyze this PDF document attached to email ${emailId}:

File: ${fileName}

Extract key information and return JSON.`,
    systemPrompt,
    thinkingLevel: 'high', // Use deep thinking for document analysis
    mediaResolution: 'media_resolution_medium', // Optimal for PDFs (560 tokens)
    attachments: [{
      mimeType: 'application/pdf',
      data: pdfData
    }],
    maxTokens: 4096,
    workspaceId
  });

  // Parse JSON response
  try {
    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (parseError) {
    console.error('Failed to parse PDF analysis:', response.text);
    throw new Error('Invalid JSON response from PDF analysis');
  }
}

/**
 * Update contact AI score based on email intelligence
 */
async function updateContactScore(contactId: string, intelligence: EmailIntelligence) {
  const supabase = getSupabaseAdmin();

  // Fetch current contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('ai_score, tags')
    .eq('id', contactId)
    .single();

  if (!contact) return;

  // Calculate score adjustment
  let scoreAdjustment = 0;

  // Intent-based scoring
  if (intelligence.intent === 'meeting_request') scoreAdjustment += 10;
  if (intelligence.intent === 'proposal') scoreAdjustment += 15;
  if (intelligence.intent === 'question') scoreAdjustment += 5;

  // Sentiment-based scoring
  if (intelligence.sentiment === 'positive') scoreAdjustment += 5;
  if (intelligence.sentiment === 'negative') scoreAdjustment -= 10;

  // Priority-based scoring
  if (intelligence.priority === 'high') scoreAdjustment += 10;
  if (intelligence.priority === 'low') scoreAdjustment -= 5;

  // Calculate new score (0-100 range)
  const newScore = Math.max(0, Math.min(100, contact.ai_score + scoreAdjustment));

  // Update tags based on intelligence
  const newTags = [...(contact.tags || [])];
  if (intelligence.intent === 'meeting_request' && !newTags.includes('meeting-interested')) {
    newTags.push('meeting-interested');
  }
  if (intelligence.priority === 'high' && !newTags.includes('high-priority')) {
    newTags.push('high-priority');
  }

  // Update contact
  await supabase
    .from('contacts')
    .update({
      ai_score: newScore,
      tags: newTags,
      last_interaction: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', contactId);

  console.log(`📈 Updated contact ${contactId} score: ${contact.ai_score} → ${newScore}`);
}

/**
 * Batch process emails for cost efficiency
 * Processes up to 100 emails at once with rate limiting
 */
export async function batchProcessGmailEmails(
  integrationId: string,
  options: {
    batchSize?: number;
    workspaceId?: string;
  } = {}
): Promise<{
  totalProcessed: number;
  totalFailed: number;
  batches: number;
}> {
  const { batchSize = 50, workspaceId } = options;

  let totalProcessed = 0;
  let totalFailed = 0;
  let batches = 0;

  // Process in batches to manage budget
  while (true) {
    const result = await processGmailWithGemini(integrationId, {
      useLowThinking: true,
      maxEmails: batchSize,
      workspaceId
    });

    totalProcessed += result.processed;
    totalFailed += result.failed;
    batches++;

    // Stop if budget exceeded or no more emails
    if (result.budgetExceeded || result.processed === 0) {
      break;
    }

    // Rate limiting between batches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`🎯 Batch processing complete: ${totalProcessed} emails, ${batches} batches`);
  return { totalProcessed, totalFailed, batches };
}

export default {
  processGmailWithGemini,
  extractEmailIntelligence,
  analyzePdfAttachment,
  batchProcessGmailEmails
};
