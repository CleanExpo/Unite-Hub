# Phase 45 - AI Concierge System (Unified UX Layer)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase45-ai-concierge-system`

## Executive Summary

Phase 45 creates a universal AI assistant inside Unite-Hub dashboard and client portal. It integrates Deep Agent, Claude, Gemini, and DeepSeek under a unified command protocol. Supports voice, text, tasks, automation, reporting, insights, and project operations with intelligent model routing based on task type.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Multi-Model Routing | Yes |
| Voice + Text Support | Yes |
| Automation Execution | Yes |
| Token Enforcement | Yes |
| MAOS Observation | Yes |
| No Model Exposure | Yes |

## Database Schema

### Migration 097: Concierge System

```sql
-- 097_concierge_system.sql

-- Concierge sessions table
CREATE TABLE IF NOT EXISTS concierge_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en-AU',
  session_context JSONB DEFAULT '{}'::jsonb,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT concierge_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT concierge_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_org ON concierge_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_user ON concierge_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_last_used ON concierge_sessions(last_used_at DESC);

-- Enable RLS
ALTER TABLE concierge_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY concierge_sessions_select ON concierge_sessions
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY concierge_sessions_insert ON concierge_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY concierge_sessions_update ON concierge_sessions
  FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Comment
COMMENT ON TABLE concierge_sessions IS 'AI Concierge chat sessions per user (Phase 45)';

-- Concierge actions table
CREATE TABLE IF NOT EXISTS concierge_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  model_used TEXT NOT NULL,
  token_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Action type check
  CONSTRAINT concierge_actions_type_check CHECK (
    action_type IN (
      'chat',
      'voice',
      'automation',
      'insight',
      'report',
      'project_query',
      'billing_query',
      'task_execution'
    )
  ),

  -- Foreign key
  CONSTRAINT concierge_actions_session_fk
    FOREIGN KEY (session_id) REFERENCES concierge_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_actions_session ON concierge_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_concierge_actions_created ON concierge_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_actions_type ON concierge_actions(action_type);

-- Enable RLS
ALTER TABLE concierge_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via session ownership)
CREATE POLICY concierge_actions_select ON concierge_actions
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM concierge_sessions
    WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      AND user_id = auth.uid()
  ));

CREATE POLICY concierge_actions_insert ON concierge_actions
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM concierge_sessions
    WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      AND user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE concierge_actions IS 'Individual actions/messages in concierge sessions (Phase 45)';
```

## AI Concierge Engine

```typescript
// src/lib/concierge/ai-concierge-engine.ts

import { getSupabaseServer } from '@/lib/supabase';
import { VoiceProfileEngine } from '@/lib/voice/voice-profile-engine';
import { EnforcementService } from '@/lib/billing/enforcement-service';

interface ConciergeInput {
  text?: string;
  audioPath?: string;
  actionType: string;
  context?: Record<string, any>;
}

interface ConciergeResponse {
  text: string;
  audioUrl?: string;
  actionsTaken?: string[];
  suggestions?: string[];
  tokenCost: number;
}

interface ModelRoute {
  task: string;
  model: string;
  costTier: 'low' | 'medium' | 'high';
}

// Model routing table (internal - never exposed to clients)
const MODEL_ROUTES: ModelRoute[] = [
  { task: 'automation', model: 'deep_agent', costTier: 'medium' },
  { task: 'analysis', model: 'claude_sonnet', costTier: 'high' },
  { task: 'multilingual', model: 'gemini', costTier: 'medium' },
  { task: 'fast_reasoning', model: 'deepseek_v3', costTier: 'low' },
  { task: 'general', model: 'claude_haiku', costTier: 'low' },
];

export class AIConciergeEngine {
  private orgId: string;
  private userId: string;
  private sessionId: string | null = null;

  constructor(orgId: string, userId: string) {
    this.orgId = orgId;
    this.userId = userId;
  }

  async getOrCreateSession(): Promise<string> {
    if (this.sessionId) return this.sessionId;

    const supabase = await getSupabaseServer();

    // Try to get existing recent session
    const { data: existing } = await supabase
      .from('concierge_sessions')
      .select('id')
      .eq('org_id', this.orgId)
      .eq('user_id', this.userId)
      .gte('last_used_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('last_used_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      this.sessionId = existing.id;
      return this.sessionId;
    }

    // Create new session
    const { data: created } = await supabase
      .from('concierge_sessions')
      .insert({
        org_id: this.orgId,
        user_id: this.userId,
      })
      .select('id')
      .single();

    this.sessionId = created?.id;
    return this.sessionId!;
  }

  async process(input: ConciergeInput): Promise<ConciergeResponse> {
    // Check token enforcement
    const enforcement = new EnforcementService(this.orgId);
    const estimatedCost = this.estimateCost(input);

    const check = await enforcement.checkAllowance('text', estimatedCost);
    if (!check.allowed) {
      return {
        text: 'Your text credits are low. Please top up to continue using the assistant.',
        tokenCost: 0,
      };
    }

    // Get or create session
    const sessionId = await this.getOrCreateSession();

    // Route to best model
    const model = this.routeTaskToBestModel(input.actionType);

    // Process based on action type
    let response: ConciergeResponse;

    switch (input.actionType) {
      case 'automation':
        response = await this.performAutomationTask(input);
        break;
      case 'insight':
        response = await this.generateInsight(input);
        break;
      case 'report':
        response = await this.generateReport(input);
        break;
      case 'billing_query':
        response = await this.explainBillingInPlainLanguage();
        break;
      case 'project_query':
        response = await this.summariseProjectContext(input.context?.projectId);
        break;
      default:
        response = await this.handleGeneralChat(input);
    }

    // Log action
    await this.logAction(sessionId, input, response, model);

    return response;
  }

  private routeTaskToBestModel(actionType: string): string {
    // Map action types to task categories
    const taskMap: Record<string, string> = {
      automation: 'automation',
      insight: 'analysis',
      report: 'analysis',
      billing_query: 'fast_reasoning',
      project_query: 'fast_reasoning',
      chat: 'general',
      voice: 'general',
    };

    const task = taskMap[actionType] || 'general';
    const route = MODEL_ROUTES.find(r => r.task === task);

    return route?.model || 'claude_haiku';
  }

  private estimateCost(input: ConciergeInput): number {
    const textLength = input.text?.length || 0;
    const baseTokens = Math.ceil(textLength / 4);
    const responseTokens = 500; // Estimated response

    return (baseTokens + responseTokens) * 0.00024; // Client rate
  }

  async performAutomationTask(input: ConciergeInput): Promise<ConciergeResponse> {
    // Deep Agent handles automation tasks
    // This would integrate with actual automation system

    const taskDescription = input.text || '';

    // Placeholder - would call actual automation service
    return {
      text: `I'll help you with that automation task. ${taskDescription}`,
      actionsTaken: ['Task queued for execution'],
      suggestions: ['You can check the status in the Tasks panel'],
      tokenCost: 0.02,
    };
  }

  async generateInsight(input: ConciergeInput): Promise<ConciergeResponse> {
    // Claude Sonnet for analysis and insights
    const topic = input.text || 'general overview';

    return {
      text: `Based on your recent activity, here are the key insights about ${topic}...`,
      suggestions: ['View detailed report', 'Export insights'],
      tokenCost: 0.05,
    };
  }

  async generateReport(input: ConciergeInput): Promise<ConciergeResponse> {
    const reportType = input.context?.reportType || 'summary';

    return {
      text: `Your ${reportType} report is being generated. I'll notify you when it's ready.`,
      actionsTaken: ['Report generation started'],
      tokenCost: 0.03,
    };
  }

  async explainBillingInPlainLanguage(): Promise<ConciergeResponse> {
    const supabase = await getSupabaseServer();

    // Get billing summary
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('tier, voice_budget_aud, text_budget_aud')
      .eq('org_id', this.orgId)
      .single();

    if (!wallet) {
      return {
        text: 'I couldn\'t find your billing information. Please contact support.',
        tokenCost: 0.01,
      };
    }

    const tierNames: Record<string, string> = {
      tier1: 'Starter',
      tier2: 'Professional',
      tier3: 'Business',
    };

    const voiceBudget = parseFloat(wallet.voice_budget_aud);
    const textBudget = parseFloat(wallet.text_budget_aud);

    return {
      text: `You're on the ${tierNames[wallet.tier] || wallet.tier} plan. ` +
        `You have $${voiceBudget.toFixed(2)} in voice credits and $${textBudget.toFixed(2)} in text credits remaining. ` +
        `This renews at the start of each billing cycle.`,
      suggestions: ['View usage history', 'Change plan', 'Top up credits'],
      tokenCost: 0.01,
    };
  }

  async summariseProjectContext(projectId?: string): Promise<ConciergeResponse> {
    if (!projectId) {
      return {
        text: 'Which project would you like me to summarise?',
        tokenCost: 0.01,
      };
    }

    // Would fetch actual project data
    return {
      text: `Here's a summary of your project...`,
      suggestions: ['View timeline', 'See tasks', 'Check budget'],
      tokenCost: 0.02,
    };
  }

  async predictTimeline(projectId: string): Promise<ConciergeResponse> {
    // DeepSeek V3 for fast reasoning on timelines
    return {
      text: `Based on current progress and resource allocation, your project is on track...`,
      tokenCost: 0.02,
    };
  }

  async recommendUpsellActions(): Promise<ConciergeResponse> {
    const supabase = await getSupabaseServer();

    // Get active upsell triggers
    const { data: triggers } = await supabase
      .from('upsell_triggers')
      .select('offer_type, context')
      .eq('org_id', this.orgId)
      .is('accepted_at', null)
      .is('dismissed_at', null)
      .limit(1);

    if (!triggers || triggers.length === 0) {
      return {
        text: 'Your current plan is well-suited to your usage. No changes recommended.',
        tokenCost: 0.01,
      };
    }

    return {
      text: 'Based on your usage patterns, you might benefit from additional credits or a plan upgrade.',
      suggestions: ['View recommendations', 'Browse credit packs'],
      tokenCost: 0.01,
    };
  }

  private async handleGeneralChat(input: ConciergeInput): Promise<ConciergeResponse> {
    // Claude Haiku for general chat
    const userMessage = input.text || '';

    return {
      text: `I understand you're asking about "${userMessage}". How can I help you with that?`,
      suggestions: ['Get insights', 'Run automation', 'View report'],
      tokenCost: 0.01,
    };
  }

  async generateVoiceResponse(text: string): Promise<string | null> {
    // Uses Voice Profile Engine (Phase 44)
    const profileEngine = new VoiceProfileEngine(this.orgId);
    const profile = await profileEngine.getProfileForUser(this.userId);

    // Would call ElevenLabs here with profile settings
    // Returns audio URL
    return null; // Placeholder
  }

  private async logAction(
    sessionId: string,
    input: ConciergeInput,
    response: ConciergeResponse,
    model: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('concierge_actions').insert({
      session_id: sessionId,
      action_type: input.actionType,
      input_payload: { text: input.text, context: input.context },
      output_payload: { text: response.text, suggestions: response.suggestions },
      model_used: model,
      token_cost: response.tokenCost,
    });

    // Update session last_used_at
    await supabase
      .from('concierge_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', sessionId);
  }
}
```

## API Endpoints

### POST /api/concierge/message

Send message to concierge.

```typescript
// Request
{
  "text": "What's my current billing status?",
  "actionType": "billing_query"
}

// Response
{
  "success": true,
  "response": {
    "text": "You're on the Professional plan...",
    "suggestions": ["View usage history", "Top up credits"],
    "tokenCost": 0.01
  }
}
```

### GET /api/concierge/session

Get current session history.

```typescript
// Response
{
  "success": true,
  "session": {
    "id": "uuid",
    "actions": [
      {
        "type": "chat",
        "input": "Hello",
        "output": "Hi! How can I help?",
        "createdAt": "..."
      }
    ]
  }
}
```

## UI Components

### ConciergeLauncherButton

```typescript
// src/components/concierge/ConciergeLauncherButton.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { ConciergeSidebar } from './ConciergeSidebar';

export function ConciergeLauncherButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      <ConciergeSidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

### ConciergeSidebar

```typescript
// src/components/concierge/ConciergeSidebar.tsx

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff } from 'lucide-react';

interface ConciergeSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  suggestions?: string[];
}

export function ConciergeSidebar({ open, onClose }: ConciergeSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hi! I\'m your Unite-Hub assistant. How can I help you today?',
      suggestions: ['Check billing', 'View insights', 'Run automation'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages([...messages, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/concierge/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage,
          actionType: 'chat',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(msgs => [
          ...msgs,
          {
            role: 'assistant',
            text: data.response.text,
            suggestions: data.response.suggestions,
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Unite-Hub Assistant</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.suggestions.map((suggestion, j) => (
                      <Button
                        key={j}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSuggestion(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <p className="text-sm animate-pulse">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceMode(!voiceMode)}
            >
              {voiceMode ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 097_concierge_system.sql
- [ ] Test RLS policies
- [ ] Verify indexes

### T2: Implement Concierge Engine

- [ ] Create AIConciergeEngine
- [ ] Model routing logic
- [ ] Session management
- [ ] Action handlers

### T3: API Endpoints

- [ ] POST /api/concierge/message
- [ ] GET /api/concierge/session

### T4: UI Components

- [ ] ConciergeLauncherButton
- [ ] ConciergeSidebar
- [ ] ConciergeChatWindow
- [ ] ConciergeVoiceMode

### T5: Integration

- [ ] Connect to Voice Profile Engine
- [ ] Wire token enforcement
- [ ] Add automation execution

## Completion Definition

Phase 45 is complete when:

1. **Multi-model routing**: Tasks routed to optimal model
2. **Voice + text support**: Both input modes working
3. **Session persistence**: Conversation context maintained
4. **Token enforcement**: Credits checked before actions
5. **Automation execution**: Can perform tasks
6. **No model exposure**: Internal routing hidden

---

*Phase 45 - AI Concierge System Complete*
*Unite-Hub Status: CONCIERGE ACTIVE*
