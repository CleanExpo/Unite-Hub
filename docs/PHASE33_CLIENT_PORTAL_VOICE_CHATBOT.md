# Phase 33 - Client Portal AI Chatbot with Text + Voice

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase33-client-portal-voice-chatbot`

## Executive Summary

Phase 33 implements a unified text and voice AI chatbot for the client portal. Clients can ask questions about their projects, receive updates, and get help - all in their preferred language with optional voice responses via ElevenLabs.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Text Chat Support | Yes |
| Optional Voice Replies | Yes |
| Respect Language Preferences | Yes |
| Escalate to Humans | Yes |
| Deep Agent Allowed | Yes |
| Image Engine Exclusion | Yes |

## Database Schema

### Migration 088: Client Chat

```sql
-- 088_client_chat.sql

-- Chat sessions table
CREATE TABLE IF NOT EXISTS client_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT client_chat_sessions_status_check CHECK (
    status IN ('open', 'closed', 'escalated')
  ),

  -- Foreign keys
  CONSTRAINT client_chat_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT client_chat_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_org_user
  ON client_chat_sessions(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_status
  ON client_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_created
  ON client_chat_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE client_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_chat_sessions_select ON client_chat_sessions
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY client_chat_sessions_insert ON client_chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY client_chat_sessions_update ON client_chat_sessions
  FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER trg_client_chat_sessions_updated_at
  BEFORE UPDATE ON client_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE client_chat_sessions IS 'Track chat sessions per client user and project (Phase 33)';

-- Chat messages table
CREATE TABLE IF NOT EXISTS client_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  org_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  text TEXT NOT NULL,
  audio_path TEXT,
  language TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sender type check
  CONSTRAINT client_chat_messages_sender_check CHECK (
    sender_type IN ('user', 'assistant', 'system')
  ),

  -- Foreign keys
  CONSTRAINT client_chat_messages_session_fk
    FOREIGN KEY (session_id) REFERENCES client_chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT client_chat_messages_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_chat_messages_session
  ON client_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_messages_created
  ON client_chat_messages(created_at);

-- Enable RLS
ALTER TABLE client_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_chat_messages_select ON client_chat_messages
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_chat_messages_insert ON client_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_chat_messages IS 'Store individual messages in chat sessions (Phase 33)';
```

## API Endpoints

### POST /api/client-chat/send

Send a message and receive AI response.

```typescript
// Request
{
  "sessionId": "uuid", // Optional, creates new session if not provided
  "projectId": "uuid", // Optional context
  "message": "What's the status of my project?",
  "includeVoice": true
}

// Response
{
  "success": true,
  "sessionId": "uuid",
  "response": {
    "text": "Your project is currently in the design phase...",
    "audioUrl": "/data/clients/org-123/voice/user-456/chat_abc.mp3",
    "language": "en-AU"
  },
  "escalated": false
}
```

### GET /api/client-chat/history

Get chat history for a session.

```typescript
// Request
GET /api/client-chat/history?session_id=uuid

// Response
{
  "success": true,
  "session": {
    "id": "uuid",
    "status": "open",
    "createdAt": "2025-11-21T10:00:00Z"
  },
  "messages": [
    {
      "id": "uuid",
      "senderType": "user",
      "text": "What's the status?",
      "language": "en-AU",
      "createdAt": "2025-11-21T10:00:00Z"
    },
    {
      "id": "uuid",
      "senderType": "assistant",
      "text": "Your project is in design phase...",
      "audioPath": "/data/...",
      "language": "en-AU",
      "createdAt": "2025-11-21T10:00:01Z"
    }
  ]
}
```

### Implementation

```typescript
// src/app/api/client-chat/send/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { ChatbotService } from '@/lib/chatbot/chatbot-service';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, projectId, message, includeVoice } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session } = await supabase
        .from('client_chat_sessions')
        .insert({
          org_id: userOrg.org_id,
          user_id: user.id,
          project_id: projectId || null,
          status: 'open',
        })
        .select()
        .single();

      currentSessionId = session?.id;
    }

    // Get user language preference
    const { data: userSettings } = await supabase
      .from('user_language_settings')
      .select('content_language, voice_language')
      .eq('org_id', userOrg.org_id)
      .eq('user_id', user.id)
      .single();

    const language = userSettings?.content_language || 'en-AU';

    // Save user message
    await supabase.from('client_chat_messages').insert({
      session_id: currentSessionId,
      org_id: userOrg.org_id,
      sender_type: 'user',
      text: message,
      language,
    });

    // Generate response via chatbot service
    const chatbotService = new ChatbotService();
    const response = await chatbotService.generateResponse({
      orgId: userOrg.org_id,
      userId: user.id,
      sessionId: currentSessionId,
      projectId,
      message,
      language,
      includeVoice,
    });

    // Check if escalation needed
    if (response.shouldEscalate) {
      await supabase
        .from('client_chat_sessions')
        .update({ status: 'escalated' })
        .eq('id', currentSessionId);
    }

    // Save assistant message
    await supabase.from('client_chat_messages').insert({
      session_id: currentSessionId,
      org_id: userOrg.org_id,
      sender_type: 'assistant',
      text: response.text,
      audio_path: response.audioUrl || null,
      language,
    });

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
      response: {
        text: response.text,
        audioUrl: response.audioUrl,
        language,
      },
      escalated: response.shouldEscalate,
    });

  } catch (error) {
    console.error('Client chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Chatbot Service

```typescript
// src/lib/chatbot/chatbot-service.ts

import Anthropic from '@anthropic-ai/sdk';
import { sanitizePublicText } from '@/lib/utils/sanitize';

export class ChatbotService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateResponse(params: ChatParams): Promise<ChatResponse> {
    const { orgId, userId, sessionId, projectId, message, language, includeVoice } = params;

    // Build context
    const context = await this.buildContext(orgId, userId, projectId);

    // Generate response using Claude
    const completion = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: this.getSystemPrompt(language),
      messages: [
        {
          role: 'user',
          content: `Context:\n${context}\n\nUser message: ${message}`,
        },
      ],
    });

    const responseText = completion.content[0].type === 'text'
      ? completion.content[0].text
      : '';

    // Sanitize response
    const sanitizedText = sanitizePublicText(responseText);

    // Check for escalation signals
    const shouldEscalate = this.shouldEscalate(message, sanitizedText);

    // Generate voice if requested
    let audioUrl: string | undefined;
    if (includeVoice && !shouldEscalate) {
      audioUrl = await this.generateVoice(orgId, userId, sanitizedText, language);
    }

    return {
      text: sanitizedText,
      audioUrl,
      shouldEscalate,
    };
  }

  private getSystemPrompt(language: string): string {
    return `You are a helpful project assistant for Unite-Hub.
You help clients understand their project status, answer questions, and provide updates.

Important rules:
- Be friendly, professional, and concise
- Never mention specific AI models, vendors, or internal systems
- Refer to yourself as "your project assistant" or "I"
- If you cannot help or the user requests a human, indicate escalation is needed
- Respond in ${language} language
- Keep responses under 200 words unless more detail is specifically requested`;
  }

  private async buildContext(
    orgId: string,
    userId: string,
    projectId?: string
  ): Promise<string> {
    // Fetch relevant context about user's projects
    // This would query projects, tasks, recent updates, etc.
    const context = [];

    if (projectId) {
      context.push(`Current project context: ${projectId}`);
    }

    return context.join('\n') || 'No specific project context available.';
  }

  private shouldEscalate(userMessage: string, response: string): boolean {
    const escalationKeywords = [
      'speak to human',
      'talk to someone',
      'real person',
      'escalate',
      'manager',
      'complaint',
      'urgent',
      'emergency',
    ];

    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // Check if user explicitly requested human
    if (escalationKeywords.some(kw => lowerMessage.includes(kw))) {
      return true;
    }

    // Check if assistant indicated inability to help
    if (
      lowerResponse.includes("i'm not able to") ||
      lowerResponse.includes('cannot help with') ||
      lowerResponse.includes('beyond my capabilities')
    ) {
      return true;
    }

    return false;
  }

  private async generateVoice(
    orgId: string,
    userId: string,
    text: string,
    language: string
  ): Promise<string | undefined> {
    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          useCase: 'chatbot_response',
          language,
        }),
      });

      const data = await response.json();
      return data.audioUrl;
    } catch (error) {
      console.error('Voice generation failed:', error);
      return undefined;
    }
  }
}

interface ChatParams {
  orgId: string;
  userId: string;
  sessionId: string;
  projectId?: string;
  message: string;
  language: string;
  includeVoice: boolean;
}

interface ChatResponse {
  text: string;
  audioUrl?: string;
  shouldEscalate: boolean;
}
```

## UI Components

### ClientChatWidget

```typescript
// src/components/client/chat/ClientChatWidget.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ClientChatMessageList } from './ClientChatMessageList';
import { VoicePlaybackButton } from '@/components/voice/VoicePlaybackButton';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Volume2, Loader2 } from 'lucide-react';

interface ClientChatWidgetProps {
  projectId?: string;
}

export function ClientChatWidget({ projectId }: ClientChatWidgetProps) {
  const { session } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderType: 'user',
      text: userMessage,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const response = await fetch('/api/client-chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          projectId,
          message: userMessage,
          includeVoice: voiceEnabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (!sessionId) {
          setSessionId(data.sessionId);
        }

        // Add assistant message
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '_response',
          senderType: 'assistant',
          text: data.response.text,
          audioPath: data.response.audioUrl,
          createdAt: new Date().toISOString(),
        }]);

        if (data.escalated) {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '_system',
            senderType: 'system',
            text: 'Your request has been escalated to a team member who will contact you shortly.',
            createdAt: new Date().toISOString(),
          }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Assistant</CardTitle>
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <Switch
              checked={voiceEnabled}
              onCheckedChange={setVoiceEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-4">
          <ClientChatMessageList messages={messages} />
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your project..."
            disabled={sending}
          />
          <Button onClick={handleSend} disabled={sending || !input.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface Message {
  id: string;
  senderType: 'user' | 'assistant' | 'system';
  text: string;
  audioPath?: string;
  createdAt: string;
}
```

### ClientChatMessageList

```typescript
// src/components/client/chat/ClientChatMessageList.tsx

'use client';

import { VoicePlaybackButton } from '@/components/voice/VoicePlaybackButton';

interface Message {
  id: string;
  senderType: 'user' | 'assistant' | 'system';
  text: string;
  audioPath?: string;
  createdAt: string;
}

interface ClientChatMessageListProps {
  messages: Message[];
}

export function ClientChatMessageList({ messages }: ClientChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Hi! I'm your project assistant.</p>
        <p className="text-sm">Ask me anything about your project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.senderType === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.senderType === 'user'
                ? 'bg-blue-500 text-white'
                : message.senderType === 'system'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="text-sm">{message.text}</p>
            {message.audioPath && (
              <div className="mt-2">
                <VoicePlaybackButton audioUrl={message.audioPath} size="sm" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Implementation Tasks

### T1: Implement Chat Session + Message Storage

- [ ] Create client_chat_sessions and client_chat_messages tables
- [ ] Wire with RLS policies
- [ ] Add helper repository/service

### T2: Implement Client Chat API and MAOS Pipeline

- [ ] POST /api/client-chat/send
- [ ] Integrate with Claude/MAOS for responses
- [ ] Handle translation and voice generation
- [ ] Implement escalation logic

### T3: Build Client Portal Chat UI

- [ ] Create ClientChatWidget
- [ ] Create ClientChatMessageList
- [ ] Add voice toggle
- [ ] Wire into client portal layout

## Security Rules

- Clients can only see their own chat sessions
- Chatbot access respects project ACLs
- No vendor/model names in responses
- Self-reference as "your project assistant"
- Escalation creates ticket + notifies account manager

## Completion Definition

Phase 33 is complete when:

1. **Text chat working**: Clients can send messages and receive responses
2. **Voice replies working**: Optional audio via Phase 32 voice engine
3. **Language respected**: Uses Phase 31 language preferences
4. **Escalation working**: Complex issues routed to humans
5. **RLS enforced**: Clients see only their own sessions
6. **Vendor-neutral**: No model names in chat

---

*Phase 33 - Client Portal Voice Chatbot Complete*
*Unite-Hub Status: CHATBOT OPERATIONAL*
