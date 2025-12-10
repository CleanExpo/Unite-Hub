# OpenAI Responses API Integration

Complete integration of OpenAI's advanced Responses API into Unite-Hub SaaS platform.

## 📋 Overview

The OpenAI Responses API is OpenAI's most advanced interface for generating model responses. It supports:

- ✅ Text and image inputs
- ✅ Streaming responses
- ✅ Multi-turn conversations with state management
- ✅ Built-in tools (web search, file search, code interpreter, computer use)
- ✅ Function calling for external integrations
- ✅ Structured JSON outputs
- ✅ Background processing for long-running tasks
- ✅ Conversation compaction for token optimization
- ✅ Advanced reasoning models (o-series, gpt-5)

## 🏗️ Architecture

```
src/
├── lib/openai/responses/
│   ├── types.ts              # TypeScript type definitions
│   ├── client.ts             # API client utilities
│   └── index.ts              # (auto-generated exports)
└── app/api/ai/responses/
    ├── route.ts              # POST /api/ai/responses - Create response
    ├── compact/route.ts      # POST /api/ai/responses/compact
    ├── input-tokens/route.ts # POST /api/ai/responses/input-tokens
    └── [responseId]/
        ├── route.ts          # GET/DELETE /api/ai/responses/[id]
        ├── cancel/route.ts   # POST /api/ai/responses/[id]/cancel
        └── input-items/      # GET /api/ai/responses/[id]/input-items
            └── route.ts
```

## 🔧 Installation & Setup

### 1. Environment Variables

Add your OpenAI API key to `.env.local`:

```bash
# OpenAI API (already configured in Unite-Hub)
OPENAI_API_KEY=sk-proj-your-key-here
```

### 2. Verify Installation

The integration automatically uses your existing `OPENAI_API_KEY` from `.env.local`.

## 📚 API Endpoints

### Create Response
```http
POST /api/ai/responses
```

**Simple Text Request:**
```javascript
const response = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'Write a marketing tagline for a coffee shop'
  })
});

const data = await response.json();
console.log(data.output[0].content[0].text);
```

**Streaming Response:**
```javascript
const response = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'Write a blog post about AI',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log(chunk); // Process streaming chunks
}
```

**With Function Calling:**
```javascript
const response = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'What is the current temperature in Sydney?',
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the current weather in a location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'City name'
              }
            },
            required: ['location']
          }
        }
      }
    ]
  })
});
```

**With Web Search (Built-in Tool):**
```javascript
const response = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'What are the latest AI news from this week?',
    tools: [{ type: 'web_search' }],
    include: ['web_search_call.action.sources']
  })
});
```

**Multi-turn Conversation:**
```javascript
// First message
const response1 = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'My name is Alex and I love hiking'
  })
});

const data1 = await response1.json();

// Follow-up message (remembers context)
const response2 = await fetch('/api/ai/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'What activities might I enjoy?',
    previous_response_id: data1.id
  })
});
```

### Get Response
```http
GET /api/ai/responses/[responseId]
```

```javascript
const response = await fetch('/api/ai/responses/resp_abc123');
const data = await response.json();
```

### Delete Response
```http
DELETE /api/ai/responses/[responseId]
```

```javascript
const response = await fetch('/api/ai/responses/resp_abc123', {
  method: 'DELETE'
});
```

### Cancel Background Response
```http
POST /api/ai/responses/[responseId]/cancel
```

```javascript
const response = await fetch('/api/ai/responses/resp_abc123/cancel', {
  method: 'POST'
});
```

### Compact Conversation
```http
POST /api/ai/responses/compact
```

```javascript
const response = await fetch('/api/ai/responses/compact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    previous_response_id: 'resp_abc123'
  })
});
```

### Get Input Token Counts
```http
POST /api/ai/responses/input-tokens
```

```javascript
const response = await fetch('/api/ai/responses/input-tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'Some long text to estimate tokens'
  })
});

const data = await response.json();
console.log(`Estimated tokens: ${data.input_tokens}`);
```

### List Input Items
```http
GET /api/ai/responses/[responseId]/input-items
```

```javascript
const response = await fetch('/api/ai/responses/resp_abc123/input-items?limit=10');
const data = await response.json();
```

## 💻 Direct Client Usage

You can also use the client directly in server-side code:

```typescript
import { 
  createResponse, 
  generateText,
  ConversationManager 
} from '@/lib/openai/responses/client';

// Simple text generation
const text = await generateText('Write a haiku about AI');
console.log(text);

// Full control
const response = await createResponse({
  model: 'gpt-4o',
  input: 'Explain quantum computing',
  max_output_tokens: 500,
  temperature: 0.7
});

// Conversation manager
const conversation = new ConversationManager('gpt-4o');
await conversation.sendMessage('Hello!');
await conversation.sendMessage('Tell me about yourself');
```

## 🎯 Use Cases in Unite-Hub

### 1. **Enhanced AI Chat**
Replace basic chat with stateful conversations:

```typescript
// src/app/api/ai/chat-enhanced/route.ts
import { createResponse } from '@/lib/openai/responses/client';

export async function POST(request: NextRequest) {
  const { message, conversationId } = await request.json();
  
  const response = await createResponse({
    model: 'gpt-4o',
    input: message,
    previous_response_id: conversationId,
    instructions: 'You are a marketing assistant for Unite-Hub'
  });
  
  return NextResponse.json(response);
}
```

### 2. **Content Research with Web Search**
Generate content with real-time data:

```typescript
const response = await createResponse({
  model: 'gpt-4o',
  input: 'Research latest trends in social media marketing',
  tools: [{ type: 'web_search' }],
  include: ['web_search_call.action.sources']
});
```

### 3. **Document Analysis with File Search**
Analyze uploaded documents:

```typescript
const response = await createResponse({
  model: 'gpt-4o',
  input: 'Summarize the key points from these documents',
  tools: [{ 
    type: 'file_search',
    vector_store_ids: ['vs_abc123'] 
  }]
});
```

### 4. **Structured Data Extraction**
Extract structured information:

```typescript
const response = await createResponse({
  model: 'gpt-4o',
  input: 'Extract contact information from this text...',
  text: {
    format: {
      type: 'json_schema',
      json_schema: {
        name: 'contact_extraction',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' }
          },
          required: ['name']
        }
      }
    }
  }
});
```

### 5. **Background Processing**
Process long-running tasks:

```typescript
// Start background job
const response = await createResponse({
  model: 'o3',
  input: 'Analyze this complex dataset...',
  background: true,
  reasoning: { effort: 'high' }
});

// Poll for completion
const result = await getResponse(response.id);
if (result.status === 'completed') {
  // Process results
}
```

## 🔐 Security & Rate Limiting

All endpoints are protected with:
- ✅ Rate limiting via `apiRateLimit` middleware
- ✅ API key validation
- ✅ Error handling and logging
- ✅ Input validation

## 📊 Token Usage Tracking

Every response includes token usage information:

```javascript
{
  "usage": {
    "input_tokens": 42,
    "input_tokens_details": {
      "cached_tokens": 0
    },
    "output_tokens": 87,
    "output_tokens_details": {
      "reasoning_tokens": 0
    },
    "total_tokens": 129
  }
}
```

## 🚀 Advanced Features

### Conversation Compaction
Reduce token usage by compacting long conversations:

```typescript
import { compactResponse } from '@/lib/openai/responses/client';

const compacted = await compactResponse({
  model: 'gpt-4o',
  previous_response_id: 'resp_long_conversation'
});

// Use compacted.output in next request
```

### Prompt Caching
Optimize costs with prompt caching:

```typescript
const response = await createResponse({
  model: 'gpt-4o',
  input: 'Analyze this data...',
  prompt_cache_key: 'user-123-dataset-v1',
  prompt_cache_retention: '24h'
});
```

### Reasoning Models
Use advanced reasoning with o-series models:

```typescript
const response = await createResponse({
  model: 'o3',
  input: 'Solve this complex problem...',
  reasoning: {
    effort: 'high',
    summary: true
  },
  include: ['reasoning.encrypted_content']
});
```

## 📖 Type Definitions

All TypeScript types are available in `src/lib/openai/responses/types.ts`:

```typescript
import type {
  CreateResponseRequest,
  Response,
  Tool,
  FunctionDefinition,
  ConversationObject
} from '@/lib/openai/responses/types';
```

## 🧪 Testing

Test the integration with curl:

```bash
# Simple text generation
curl http://localhost:3008/api/ai/responses \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Hello, world!"
  }'

# Token estimation
curl http://localhost:3008/api/ai/responses/input-tokens \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "input": "Some text to estimate"
  }'
```

## 🎨 Frontend Integration Example

```typescript
// components/AIResponsesChat.tsx
'use client';

import { useState } from 'react';

export function AIResponsesChat() {
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    
    const res = await fetch('/api/ai/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: message,
        previous_response_id: conversationId
      })
    });

    const data = await res.json();
    
    // Extract text from response
    const text = data.output[0]?.content[0]?.text || '';
    setResponse(text);
    setConversationId(data.id);
    setLoading(false);
  };

  return (
    <div>
      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} disabled={loading}>
        Send
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

## 🛠️ Available Models

- `gpt-4o` - Latest GPT-4 Omni (recommended for most tasks)
- `gpt-4o-mini` - Faster, cheaper variant
- `gpt-4-turbo` - Previous generation
- `gpt-5` - Next-generation model (when available)
- `o3` / `o1` - Advanced reasoning models

## 📈 Cost Optimization Tips

1. **Use Token Estimation**: Check costs before requests
2. **Enable Prompt Caching**: Cache repeated prompts
3. **Compact Conversations**: Reduce context length
4. **Choose Right Model**: Use gpt-4o-mini for simple tasks
5. **Set max_output_tokens**: Control generation length
6. **Background Processing**: For non-urgent tasks

## 🐛 Error Handling

All API errors return structured responses:

```json
{
  "error": "Error message",
  "code": "rate_limit_exceeded",
  "type": "invalid_request_error"
}
```

Common error codes:
- `invalid_request_error` - Missing/invalid parameters
- `rate_limit_exceeded` - Too many requests
- `insufficient_quota` - API quota exceeded
- `model_not_found` - Invalid model name

## 📞 Support

For issues or questions:
- Check OpenAI API documentation: https://platform.openai.com/docs
- Review error logs in console
- Verify API key in environment variables

## ✅ Integration Checklist

- [x] TypeScript types created
- [x] Client utilities implemented
- [x] API routes configured
- [x] Rate limiting applied
- [x] Error handling added
- [x] Documentation created
- [ ] Frontend integration examples
- [ ] Unit tests (future)
- [ ] E2E tests (future)

## 🎉 Summary

The OpenAI Responses API integration provides:
- Complete API coverage (create, get, delete, cancel, compact)
- Type-safe TypeScript implementation
- Rate-limited secure endpoints
- Streaming support
- Multi-turn conversations
- Advanced features (tools, functions, reasoning)
- Ready for production use in Unite-Hub

Deploy and start using immediately with your existing `OPENAI_API_KEY`!
