/**
 * WhatsApp Intelligence Agent
 * Uses Claude AI to process incoming WhatsApp messages
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface WhatsAppMessageAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  intent: string;
  confidence_score: number;
  requires_response: boolean;
  suggested_response?: string;
  action_items?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ContactUpdateSuggestion {
  update_score: boolean;
  new_score?: number;
  score_change_reason?: string;
  update_tags?: string[];
  update_status?: string;
  create_task?: {
    title: string;
    description: string;
    priority: string;
  };
}

/**
 * Analyze incoming WhatsApp message with Claude AI
 */
export async function analyzeWhatsAppMessage(
  message: string,
  phoneNumber: string,
  contactId?: string,
  conversationHistory?: Array<{ direction: string; content: string; timestamp: Date }>
): Promise<WhatsAppMessageAnalysis> {
  try {
    // Build context
    let context = `Phone Number: ${phoneNumber}\n`;

    if (conversationHistory && conversationHistory.length > 0) {
      context += '\nRecent Conversation History:\n';
      conversationHistory.slice(-5).forEach(msg => {
        const direction = msg.direction === 'inbound' ? 'Customer' : 'Us';
        context += `[${direction}]: ${msg.content}\n`;
      });
    }

    context += `\nNew Message from Customer:\n${message}`;

    const prompt = `You are an AI assistant analyzing customer messages from WhatsApp Business.

${context}

Analyze this message and provide:
1. A brief summary (1-2 sentences)
2. Sentiment (positive, neutral, negative, or urgent)
3. Primary intent (e.g., question, complaint, request, feedback, info, booking, cancellation, etc.)
4. Confidence score (0.0 to 1.0)
5. Whether it requires a response
6. A suggested response (if it requires one)
7. Any action items
8. Priority level (low, medium, high, urgent)

Respond in JSON format with these exact fields:
{
  "summary": "string",
  "sentiment": "positive|neutral|negative|urgent",
  "intent": "string",
  "confidence_score": 0.95,
  "requires_response": true|false,
  "suggested_response": "string or null",
  "action_items": ["string"] or null,
  "priority": "low|medium|high|urgent"
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const analysisText = content.text.trim();
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const analysis: WhatsAppMessageAnalysis = JSON.parse(jsonMatch[0]);

    return analysis;
  } catch (error) {
    console.error('Error analyzing WhatsApp message:', error);

    // Return basic analysis on error
    return {
      summary: message.substring(0, 100),
      sentiment: 'neutral',
      intent: 'unknown',
      confidence_score: 0.5,
      requires_response: false,
      priority: 'medium'
    };
  }
}

/**
 * Generate automated response for WhatsApp message
 */
export async function generateWhatsAppResponse(
  incomingMessage: string,
  analysis: WhatsAppMessageAnalysis,
  contactName?: string,
  conversationHistory?: Array<{ direction: string; content: string }>
): Promise<string> {
  try {
    let context = '';

    if (contactName) {
      context += `Customer Name: ${contactName}\n`;
    }

    if (conversationHistory && conversationHistory.length > 0) {
      context += '\nRecent Conversation:\n';
      conversationHistory.slice(-5).forEach(msg => {
        const direction = msg.direction === 'inbound' ? 'Customer' : 'Us';
        context += `[${direction}]: ${msg.content}\n`;
      });
    }

    const prompt = `You are a customer service assistant responding to WhatsApp messages.

${context}

Customer's Message: ${incomingMessage}

Analysis:
- Intent: ${analysis.intent}
- Sentiment: ${analysis.sentiment}
- Priority: ${analysis.priority}

Generate a professional, helpful, and concise WhatsApp response. Guidelines:
- Keep it short (2-3 sentences max)
- Be friendly and professional
- Address their specific need
- Use appropriate tone for the sentiment
- Include next steps if applicable
- Do NOT use emojis unless the customer used them first

Response:`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text.trim();
  } catch (error) {
    console.error('Error generating WhatsApp response:', error);
    return 'Thank you for your message. Our team will get back to you shortly.';
  }
}

/**
 * Analyze conversation and suggest contact updates
 */
export async function analyzeConversationForContactUpdate(
  contactId: string,
  workspaceId: string,
  recentMessages: Array<{ direction: string; content: string; sentiment: string; intent: string }>
): Promise<ContactUpdateSuggestion> {
  try {
    // Get current contact data
    const contact = await db.contacts.getById(contactId);

    const conversationSummary = recentMessages.map(msg =>
      `[${msg.direction}] ${msg.content} (${msg.intent}, ${msg.sentiment})`
    ).join('\n');

    const prompt = `You are analyzing a WhatsApp conversation to update contact intelligence.

Current Contact Score: ${contact.ai_score || 0.5}
Current Status: ${contact.status || 'contact'}
Current Tags: ${contact.tags?.join(', ') || 'none'}

Recent WhatsApp Conversation:
${conversationSummary}

Based on this conversation, determine:
1. Should we update the contact's AI score? (0.0 to 1.0)
2. Reason for score change
3. Should we add any tags?
4. Should we update their status? (contact, lead, warm, hot, customer, inactive)
5. Should we create a task/follow-up?

Respond in JSON:
{
  "update_score": true|false,
  "new_score": 0.75,
  "score_change_reason": "string",
  "update_tags": ["tag1", "tag2"],
  "update_status": "lead|warm|hot|customer|null",
  "create_task": {
    "title": "string",
    "description": "string",
    "priority": "low|medium|high"
  } or null
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const suggestion: ContactUpdateSuggestion = JSON.parse(jsonMatch[0]);

    return suggestion;
  } catch (error) {
    console.error('Error analyzing conversation for contact update:', error);
    return {
      update_score: false
    };
  }
}

/**
 * Process incoming WhatsApp message (full pipeline)
 */
export async function processIncomingWhatsAppMessage(
  messageId: string,
  workspaceId: string
): Promise<void> {
  try {
    // Get message from database
    const { data: message } = await db.supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (!message || message.direction !== 'inbound') {
      return;
    }

    // Get conversation history
    const { data: conversationHistory } = await db.supabase
      .from('whatsapp_messages')
      .select('direction, content, created_at')
      .eq('phone_number', message.phone_number)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Analyze message
    const analysis = await analyzeWhatsAppMessage(
      message.content,
      message.phone_number,
      message.contact_id,
      conversationHistory || []
    );

    // Update message with AI insights
    const supabaseServer = db.getSupabaseServer();
    await supabaseServer
      .from('whatsapp_messages')
      .update({
        ai_summary: analysis.summary,
        sentiment: analysis.sentiment,
        intent: analysis.intent,
        confidence_score: analysis.confidence_score,
        requires_response: analysis.requires_response
      })
      .eq('id', messageId);

    // Update conversation
    await supabaseServer
      .from('whatsapp_conversations')
      .upsert({
        workspace_id: workspaceId,
        contact_id: message.contact_id,
        phone_number: message.phone_number,
        last_message_at: new Date(),
        last_message_direction: 'inbound',
        ai_sentiment: analysis.sentiment,
        needs_attention: analysis.requires_response || analysis.priority === 'urgent'
      }, {
        onConflict: 'workspace_id,phone_number'
      });

    // If contact exists, analyze for updates
    if (message.contact_id && conversationHistory && conversationHistory.length >= 3) {
      const recentWithAnalysis = conversationHistory.slice(0, 5).map(msg => ({
        direction: msg.direction,
        content: msg.content,
        sentiment: 'neutral', // Would need to fetch or store
        intent: 'unknown'
      }));

      const contactUpdate = await analyzeConversationForContactUpdate(
        message.contact_id,
        workspaceId,
        recentWithAnalysis
      );

      // Apply contact updates
      if (contactUpdate.update_score && contactUpdate.new_score) {
        await db.contacts.updateScore(message.contact_id, contactUpdate.new_score);
      }

      if (contactUpdate.update_tags && contactUpdate.update_tags.length > 0) {
        await db.contacts.update(message.contact_id, {
          tags: contactUpdate.update_tags
        });
      }

      if (contactUpdate.update_status) {
        await db.contacts.update(message.contact_id, {
          status: contactUpdate.update_status
        });
      }
    }

    console.log(`✅ Processed WhatsApp message ${messageId} with AI intelligence`);
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    throw error;
  }
}
