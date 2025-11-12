# Claude AI Integration

Complete Claude AI (Anthropic) integration for Unite-Hub's AI-powered features.

## Overview

This module provides production-ready integration with Claude Opus 4 (claude-sonnet-4-5-20250929) for:

- Auto-reply generation with qualifying questions
- Customer persona development
- Marketing strategy generation
- Campaign content creation
- Hooks and scripts generation
- Mind map concept extraction

## Directory Structure

```
lib/claude/
├── client.ts           # Anthropic client initialization and core functions
├── prompts.ts          # System prompts and user prompt builders
├── streaming.ts        # Streaming response handlers
├── context.ts          # Conversation context management
├── types.ts            # TypeScript type definitions
├── utils.ts            # Utility functions
├── client-helpers.ts   # Client-side API request helpers
├── hooks.ts            # React hooks for AI features
├── index.ts            # Main exports
└── README.md           # This file
```

## Installation

1. Install dependencies:
```bash
npm install @anthropic-ai/sdk
```

2. Set environment variable:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

## API Endpoints

All endpoints are located in `src/app/api/ai/`:

### POST /api/ai/auto-reply
Generate auto-reply emails with qualifying questions.

**Request:**
```json
{
  "from": "client@example.com",
  "subject": "Interested in your services",
  "body": "I need help with marketing...",
  "context": "First-time inquiry",
  "contactId": "contact_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "intent": "Seeking marketing services",
      "needs": ["Social media marketing", "Brand awareness"],
      "gaps": ["Budget", "Timeline", "Current situation"],
      "urgency": "medium"
    },
    "questions": [
      {
        "question": "What specific marketing channels are you currently using?",
        "purpose": "Understand current strategy",
        "category": "context"
      }
    ],
    "emailTemplate": {
      "greeting": "Hi [Name],",
      "acknowledgment": "Thank you for reaching out...",
      "body": "...",
      "closing": "...",
      "signature": "..."
    }
  },
  "metadata": {
    "generatedAt": "2025-01-13T10:30:00Z",
    "model": "claude-sonnet-4-5-20250929"
  }
}
```

### POST /api/ai/persona
Generate customer persona from emails and business data.

**Request:**
```json
{
  "emails": [
    {
      "from": "client@example.com",
      "subject": "Marketing help needed",
      "body": "We are a startup..."
    }
  ],
  "businessDescription": "E-commerce startup",
  "assets": [
    {
      "type": "logo",
      "description": "Modern minimalist design"
    }
  ],
  "contactId": "contact_123"
}
```

### POST /api/ai/strategy
Generate comprehensive marketing strategy.

**Request:**
```json
{
  "persona": { ... },
  "businessGoals": "Increase brand awareness and generate 1000 leads",
  "budget": "$5,000/month",
  "timeline": "3 months",
  "competitors": ["Company A", "Company B"]
}
```

### POST /api/ai/campaign
Generate platform-specific campaign content.

**Request:**
```json
{
  "strategy": { ... },
  "platforms": ["Instagram", "Facebook", "TikTok"],
  "budget": "$5,000",
  "duration": "30 days",
  "objective": "Brand awareness and lead generation"
}
```

### POST /api/ai/hooks
Generate attention-grabbing hooks.

**Request:**
```json
{
  "persona": { ... },
  "business": "Sustainable fashion startup",
  "platforms": ["TikTok", "Instagram"],
  "toneOfVoice": "Authentic and inspiring"
}
```

### POST /api/ai/mindmap
Extract key concepts for mind map visualization.

**Request:**
```json
{
  "emails": [
    {
      "from": "client@example.com",
      "subject": "Marketing challenges",
      "body": "...",
      "date": "2025-01-10"
    }
  ],
  "focusArea": "Digital marketing strategy"
}
```

## Usage Examples

### Using Client Helpers

```typescript
import { aiClient } from '@/lib/claude/client-helpers';

// Generate auto-reply
const result = await aiClient.autoReply({
  from: 'client@example.com',
  subject: 'Need help',
  body: 'I need marketing services',
  contactId: 'contact_123'
});

console.log(result.questions);
```

### Using React Hooks

```typescript
'use client';

import { useAutoReply } from '@/lib/claude/hooks';

function AutoReplyButton() {
  const { data, loading, error, execute } = useAutoReply();

  const handleGenerate = async () => {
    await execute({
      from: 'client@example.com',
      subject: 'Inquiry',
      body: 'I need help with marketing',
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Auto-Reply'}
      </button>
      {error && <p>Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Using Complete Pipeline

```typescript
import { useAIPipeline } from '@/lib/claude/hooks';

function MarketingPipeline() {
  const { persona, strategy, campaign, hooks, loading, currentStep, execute } = useAIPipeline();

  const handleGenerate = async () => {
    await execute({
      emails: [...],
      businessDescription: 'E-commerce startup',
      businessGoals: 'Grow brand awareness',
      platforms: ['Instagram', 'TikTok'],
      budget: '$5,000',
      duration: '30 days',
      objective: 'Lead generation',
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={loading}>
        Generate Complete Strategy
      </button>
      <p>Current step: {currentStep}</p>
      {persona && <PersonaDisplay data={persona} />}
      {strategy && <StrategyDisplay data={strategy} />}
      {campaign && <CampaignDisplay data={campaign} />}
      {hooks && <HooksDisplay data={hooks} />}
    </div>
  );
}
```

### Direct API Usage

```typescript
import { createMessage, parseJSONResponse } from '@/lib/claude/client';
import { AUTO_REPLY_SYSTEM_PROMPT } from '@/lib/claude/prompts';

const message = await createMessage(
  [{ role: 'user', content: 'Analyze this email...' }],
  AUTO_REPLY_SYSTEM_PROMPT
);

const result = parseJSONResponse(message);
```

### Streaming Responses

```typescript
import { createStreamingMessage, handleStreamResponse } from '@/lib/claude';

const stream = await createStreamingMessage(
  messages,
  systemPrompt
);

await handleStreamResponse(
  stream,
  (chunk) => console.log('Chunk:', chunk),
  (fullText) => console.log('Complete:', fullText),
  (error) => console.error('Error:', error)
);
```

## Utilities

### Context Management

```typescript
import { ConversationContext } from '@/lib/claude/context';

const context = new ConversationContext('email');
context.addUserMessage('Hello');
context.addAssistantMessage('Hi there!');

const messages = context.getMessages(); // For Claude API
const summary = context.getSummary();
```

### Session Management

```typescript
import { sessionManager } from '@/lib/claude/context';

const session = sessionManager.getSession('user_123', 'email');
session.addUserMessage('Follow-up question');

// Later...
const existingSession = sessionManager.getSession('user_123');
```

### Helper Functions

```typescript
import {
  formatEmailTemplate,
  getPersonaSummary,
  getTopHooks,
  groupHooksByPlatform,
  getMindmapStats,
} from '@/lib/claude/utils';

// Format email template to plain text
const emailText = formatEmailTemplate(autoReply.emailTemplate);

// Get persona summary
const summary = getPersonaSummary(persona.persona);

// Get top performing hooks
const topHooks = getTopHooks(hooksResult, 5);

// Group hooks by platform
const grouped = groupHooksByPlatform(hooksResult.hooks);
```

## Configuration

### Rate Limiting

```typescript
import { RateLimiter } from '@/lib/claude/client';

const limiter = new RateLimiter(100, 60000); // 100 requests per minute
await limiter.checkLimit();
```

### Custom Parameters

```typescript
import { createMessage, CLAUDE_MODEL } from '@/lib/claude/client';

const message = await createMessage(
  messages,
  systemPrompt,
  {
    model: CLAUDE_MODEL,
    temperature: 0.8,
    max_tokens: 4096,
    top_p: 0.9,
  }
);
```

## Error Handling

```typescript
import { handleAIError, retryWithBackoff } from '@/lib/claude/utils';

try {
  const result = await retryWithBackoff(
    () => aiClient.autoReply({ ... }),
    3,  // max retries
    1000 // initial delay
  );
} catch (error) {
  const message = handleAIError(error);
  console.error(message);
}
```

## Best Practices

1. **Rate Limiting**: Always use rate limiting in production
2. **Error Handling**: Wrap API calls in try-catch blocks
3. **Context Management**: Use conversation context for multi-turn conversations
4. **Type Safety**: Use TypeScript types for all data
5. **Streaming**: Use streaming for long-running operations
6. **Caching**: Cache results when appropriate
7. **Validation**: Validate input data before sending to API

## Performance Optimization

1. **Batch Operations**: Use `batchGenerate` for multiple requests
2. **Parallel Processing**: Generate independent items in parallel
3. **Context Pruning**: Limit conversation context to recent messages
4. **Token Management**: Monitor token usage with `TokenCounter`
5. **Streaming**: Use streaming for real-time user feedback

## Testing

```typescript
// Test endpoints
await fetch('/api/ai/auto-reply', { method: 'GET' });
await fetch('/api/ai/persona', { method: 'GET' });
// etc.
```

## License

Copyright 2025 Unite-Hub. All rights reserved.
