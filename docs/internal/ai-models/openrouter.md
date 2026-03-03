# OpenRouter API Documentation

> Official documentation sourced from [openrouter.ai/docs](https://openrouter.ai/docs/api/reference/overview)

## Overview

OpenRouter provides a unified API to access 300+ AI models from various providers including OpenAI, Anthropic, Google, Meta, Mistral, and more.

## Installation

```bash
# Use OpenAI SDK (compatible)
pip install openai

# TypeScript/JavaScript
npm install openai
```

## Client Setup

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="sk-or-v1-...",
)
```

### TypeScript

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

### Using Fetch

```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings
    'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
  }),
});
```

## Basic Chat Completion

### Python

```python
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)
print(response.choices[0].message.content)
```

### TypeScript

```typescript
const completion = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});
console.log(completion.choices[0].message.content);
```

## Streaming Responses

Server-Sent Events (SSE) are supported for all models. Send `stream: true` in your request body.

### Python

```python
stream = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "Write a story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### TypeScript

```typescript
const stream = await client.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Write a story' }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

## Model Selection

### Popular Models (2025)

```python
# Anthropic Claude 4.5
model = "anthropic/claude-sonnet-4-5"
model = "anthropic/claude-opus-4"
model = "anthropic/claude-haiku-4-5"

# OpenAI
model = "openai/gpt-4o"
model = "openai/gpt-4o-mini"
model = "openai/o1"
model = "openai/o1-mini"

# Google Gemini
model = "google/gemini-2.5-pro"
model = "google/gemini-2.5-flash"
model = "google/gemini-3-pro-preview"

# Meta Llama
model = "meta-llama/llama-3.3-70b-instruct"
model = "meta-llama/llama-3.1-405b-instruct"

# Mistral
model = "mistralai/mistral-large"
model = "mistralai/mixtral-8x22b-instruct"

# DeepSeek
model = "deepseek/deepseek-chat"
model = "deepseek/deepseek-r1"

# Qwen
model = "qwen/qwen-2.5-72b-instruct"
```

### Auto Router (Best Model Selection)

```python
response = client.chat.completions.create(
    model="openrouter/auto",  # Automatically selects best model
    messages=[{"role": "user", "content": "Complex question..."}]
)
```

## Provider Routing

### Specify Provider Preferences

```python
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "Hello"}],
    extra_body={
        "provider": {
            "order": ["Anthropic", "AWS Bedrock"],
            "allow_fallbacks": True
        }
    }
)
```

### Require Specific Provider

```python
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "Hello"}],
    extra_body={
        "provider": {
            "require": ["Anthropic"]
        }
    }
)
```

## Tool/Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"}
                },
                "required": ["location"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "What's the weather in Paris?"}],
    tools=tools,
    tool_choice="auto"
)

# Handle tool calls
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    # Execute function and continue conversation
```

## Vision (Multimodal)

```python
import base64

with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What's in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_data}"
                    }
                }
            ]
        }
    ]
)
```

## JSON Mode

```python
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[
        {"role": "user", "content": "List 3 colors as JSON array"}
    ],
    response_format={"type": "json_object"}
)
```

## Finish Reasons

OpenRouter normalizes each model's `finish_reason` to one of:

- `tool_calls` - Model wants to call a tool
- `stop` - Natural completion
- `length` - Max tokens reached
- `content_filter` - Content filtered
- `error` - An error occurred

The raw finish_reason is available via `native_finish_reason`.

## Querying Cost and Stats

Token counts in completions API response use a normalized, model-agnostic count (GPT4o tokenizer). For precise native token counts, use the generation endpoint:

```typescript
const generation = await fetch('https://openrouter.ai/api/v1/generation?id=$GENERATION_ID', {
  headers,
});

const stats = await generation.json();
// Contains native token counts and actual cost
```

## Cost Management

### Get Model Pricing

```python
import requests

response = requests.get("https://openrouter.ai/api/v1/models")
models = response.json()["data"]

for model in models:
    print(f"{model['id']}: ${model['pricing']['prompt']}/1K input tokens")
```

### Track Usage

```python
# Response includes usage info
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "Hello"}]
)

# Access usage (normalized token counts)
print(f"Prompt tokens: {response.usage.prompt_tokens}")
print(f"Completion tokens: {response.usage.completion_tokens}")
```

### Set Spending Limits

```python
response = client.chat.completions.create(
    model="anthropic/claude-sonnet-4",
    messages=[{"role": "user", "content": "Hello"}],
    extra_headers={
        "X-Max-Cost": "0.01"  # Max $0.01 for this request
    }
)
```

## Rate Limiting

```python
import time
from openai import RateLimitError

def make_request_with_retry(messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(
                model="anthropic/claude-sonnet-4",
                messages=messages
            )
        except RateLimitError:
            wait_time = 2 ** attempt
            time.sleep(wait_time)
    raise Exception("Max retries exceeded")
```

## Model Fallbacks

```python
models_to_try = [
    "anthropic/claude-sonnet-4",
    "openai/gpt-4o",
    "google/gemini-2.5-pro"
]

for model in models_to_try:
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": "Hello"}]
        )
        break
    except Exception as e:
        print(f"{model} failed: {e}")
        continue
```

## List Available Models

```python
import requests

response = requests.get(
    "https://openrouter.ai/api/v1/models",
    headers={"Authorization": f"Bearer {api_key}"}
)

models = response.json()["data"]
for model in models[:10]:
    print(f"{model['id']}: {model['name']}")
```

## Check API Credits

```python
import requests

response = requests.get(
    "https://openrouter.ai/api/v1/auth/key",
    headers={"Authorization": f"Bearer {api_key}"}
)

data = response.json()["data"]
print(f"Credits remaining: ${data['limit'] - data['usage']}")
```

## Environment Variables

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

## Best Practices

1. **Use model fallbacks** for reliability
2. **Track costs** with generation endpoint for native token counts
3. **Set spending limits** to avoid surprise bills
4. **Use provider routing** for latency/cost optimization
5. **Include HTTP-Referer** for better rate limits
6. **Cache responses** when appropriate
7. **Use streaming** for better UX
8. **Handle rate limits** with exponential backoff

## Official Resources

- **Documentation**: [openrouter.ai/docs](https://openrouter.ai/docs)
- **Models**: [openrouter.ai/models](https://openrouter.ai/models)
- **API Reference**: [openrouter.ai/docs/api/reference](https://openrouter.ai/docs/api/reference/overview)
