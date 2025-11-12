import { NextRequest, NextResponse } from 'next/server';
import { createMessage, parseJSONResponse, rateLimiter } from '@/lib/claude/client';
import { AUTO_REPLY_SYSTEM_PROMPT, buildAutoReplyUserPrompt } from '@/lib/claude/prompts';
import { ConversationContext } from '@/lib/claude/context';

export const runtime = 'edge';

interface AutoReplyRequest {
  from: string;
  subject: string;
  body: string;
  context?: string;
  contactId?: string;
  sessionId?: string;
}

interface AutoReplyResponse {
  analysis: {
    intent: string;
    needs: string[];
    gaps: string[];
    urgency: 'low' | 'medium' | 'high';
  };
  questions: Array<{
    question: string;
    purpose: string;
    category: 'pain_point' | 'goal' | 'budget' | 'timeline' | 'context';
  }>;
  emailTemplate: {
    greeting: string;
    acknowledgment: string;
    body: string;
    closing: string;
    signature: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    await rateLimiter.checkLimit();

    const body: AutoReplyRequest = await req.json();

    // Validate input
    if (!body.from || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'Missing required fields: from, subject, body' },
        { status: 400 }
      );
    }

    // Build user prompt
    const userPrompt = buildAutoReplyUserPrompt({
      from: body.from,
      subject: body.subject,
      body: body.body,
      context: body.context,
    });

    // Create conversation context
    const context = new ConversationContext('email');
    context.addUserMessage(userPrompt);

    // Call Claude API
    const message = await createMessage(
      context.getMessages(),
      AUTO_REPLY_SYSTEM_PROMPT,
      {
        temperature: 0.7,
        max_tokens: 3000,
      }
    );

    // Parse response
    const response = parseJSONResponse<AutoReplyResponse>(message);

    // Add assistant response to context
    context.addAssistantMessage(JSON.stringify(response));

    // Return auto-reply data
    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        contactId: body.contactId,
        sessionId: body.sessionId,
        generatedAt: new Date().toISOString(),
        model: 'claude-sonnet-4-5-20250929',
      },
    });
  } catch (error: any) {
    console.error('Auto-reply generation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate auto-reply',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/auto-reply',
    method: 'POST',
    description: 'Generate auto-reply emails with qualifying questions',
    requiredFields: ['from', 'subject', 'body'],
    optionalFields: ['context', 'contactId', 'sessionId'],
    example: {
      from: 'client@example.com',
      subject: 'Interested in your marketing services',
      body: 'Hi, I saw your website and I\'m interested in learning more about your marketing services.',
      context: 'First-time inquiry from website contact form',
    },
  });
}
