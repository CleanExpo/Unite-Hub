/**
 * AI Content Personalization Service
 *
 * Uses Claude AI to personalize email content based on contact data
 * and workflow variables. Lightweight wrapper for workflow executors.
 *
 * @module ai/personalization
 */

import { anthropic } from '@/lib/anthropic/client';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

export interface PersonalizationInput {
  subject: string;
  body: string;
  contact: {
    id?: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    job_title?: string | null;
    industry?: string | null;
    [key: string]: any;
  };
  variables?: Record<string, any>;
}

export interface PersonalizationOutput {
  subject: string;
  body: string;
}

/**
 * Generate personalized email content using AI
 *
 * Takes a template email (subject + body) and personalizes it based on
 * contact information and workflow variables using Claude AI.
 *
 * @param input Personalization input with template and contact data
 * @returns Personalized subject and body
 *
 * @example
 * ```typescript
 * const personalized = await generatePersonalizedContent({
 *   subject: 'Following up on our conversation',
 *   body: 'Hi {{first_name}}, I wanted to reach out about...',
 *   contact: {
 *     email: 'john@example.com',
 *     first_name: 'John',
 *     last_name: 'Doe',
 *     company_name: 'Acme Corp',
 *   },
 * });
 * ```
 */
export async function generatePersonalizedContent(
  input: PersonalizationInput
): Promise<PersonalizationOutput> {
  const { subject, body, contact, variables = {} } = input;

  try {
    // Build contact context for AI
    const contactContext = buildContactContext(contact);
    const variableContext = buildVariableContext(variables);

    // System prompt for personalization
    const systemPrompt = `You are an expert email personalization assistant. Your task is to enhance email templates by:

1. Making them more personal and engaging based on contact information
2. Ensuring proper tone and professionalism
3. Keeping the core message intact while improving delivery
4. Using natural, conversational language

Return ONLY a JSON object with this structure:
{
  "subject": "<personalized subject line>",
  "body": "<personalized email body>"
}

Guidelines:
- Maintain the original message intent and key points
- Use contact's name naturally (not excessively)
- Reference company/role if relevant
- Keep subject concise (50-70 characters)
- Ensure body is professional yet warm
- Do not add new claims or promises not in original
- Keep length similar to original`;

    const userPrompt = `Personalize this email template:

CONTACT INFORMATION:
${contactContext}

WORKFLOW VARIABLES:
${variableContext}

ORIGINAL EMAIL:
Subject: ${subject}

Body:
${body}

Please personalize this email for maximum engagement while maintaining professionalism.`;

    // Call Claude with retry logic
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929', // Use Sonnet for speed/cost balance
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    const message = result.data;

    // Extract JSON from response
    let jsonText = '';
    for (const block of message.content) {
      if (block.type === 'text') {
        jsonText = block.text;
        break;
      }
    }

    // Parse response
    let personalized: PersonalizationOutput;
    try {
      // Try to extract JSON from markdown code blocks or direct JSON
      const jsonMatch =
        jsonText.match(/```json\n?([\s\S]*?)\n?```/) ||
        jsonText.match(/({[\s\S]*})/);
      const cleanJson = jsonMatch ? jsonMatch[1] : jsonText;
      personalized = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[AI Personalization] Failed to parse response:', jsonText);
      // Fallback: return original content
      return { subject, body };
    }

    // Validate output has required fields
    if (!personalized.subject || !personalized.body) {
      console.warn('[AI Personalization] Invalid response structure, using original');
      return { subject, body };
    }

    console.log('[AI Personalization] Content personalized successfully', {
      contact_id: contact.id,
      original_subject_length: subject.length,
      personalized_subject_length: personalized.subject.length,
      input_tokens: message.usage.input_tokens,
      output_tokens: message.usage.output_tokens,
    });

    return personalized;
  } catch (error) {
    console.error('[AI Personalization] Error:', error);
    // Fallback: return original content unchanged
    return { subject, body };
  }
}

/**
 * Build contact context string for AI prompt
 */
function buildContactContext(contact: PersonalizationInput['contact']): string {
  const parts: string[] = [];

  if (contact.first_name) parts.push(`First Name: ${contact.first_name}`);
  if (contact.last_name) parts.push(`Last Name: ${contact.last_name}`);
  parts.push(`Email: ${contact.email}`);
  if (contact.company_name) parts.push(`Company: ${contact.company_name}`);
  if (contact.job_title) parts.push(`Job Title: ${contact.job_title}`);
  if (contact.industry) parts.push(`Industry: ${contact.industry}`);

  return parts.length > 0 ? parts.join('\n') : 'Limited contact information available';
}

/**
 * Build workflow variables context string for AI prompt
 */
function buildVariableContext(variables: Record<string, any>): string {
  if (Object.keys(variables).length === 0) {
    return 'No workflow variables provided';
  }

  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
}

/**
 * Simple variable replacement without AI (for testing)
 *
 * This can be used as a lightweight fallback when AI personalization
 * is not needed or unavailable.
 */
export function replaceVariables(
  text: string,
  contact: PersonalizationInput['contact'],
  variables: Record<string, any> = {}
): string {
  let result = text;

  // Replace contact fields
  result = result.replace(/\{\{first_name\}\}/gi, contact.first_name || '');
  result = result.replace(/\{\{last_name\}\}/gi, contact.last_name || '');
  result = result.replace(/\{\{email\}\}/gi, contact.email || '');
  result = result.replace(/\{\{company_name\}\}/gi, contact.company_name || '');
  result = result.replace(/\{\{job_title\}\}/gi, contact.job_title || '');

  // Replace workflow variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, String(value));
  });

  return result;
}
