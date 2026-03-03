# Anthropic Claude API Documentation

> Official documentation sourced from [docs.anthropic.com](https://docs.anthropic.com) and [github.com/anthropics](https://github.com/anthropics)

## Installation

### Python

```bash
pip install anthropic
```

### TypeScript/JavaScript

```bash
npm install @anthropic-ai/sdk
```

## Available Models

### Latest Models (Claude 4.5)

| Model ID                     | Alias               | Description                                  | Context        | Max Output |
| ---------------------------- | ------------------- | -------------------------------------------- | -------------- | ---------- |
| `claude-sonnet-4-5-20250929` | `claude-sonnet-4-5` | Smartest model for complex agents and coding | 200K (1M beta) | 64K        |
| `claude-haiku-4-5-20251001`  | `claude-haiku-4-5`  | Fastest with near-frontier intelligence      | 200K           | 64K        |
| `claude-opus-4-1-20250805`   | `claude-opus-4-1`   | Exceptional for specialized reasoning        | 200K           | 32K        |

### Claude 4 Models

| Model ID                   | Alias               | Description                |
| -------------------------- | ------------------- | -------------------------- |
| `claude-sonnet-4-20250514` | `claude-sonnet-4-0` | Fast, balanced performance |
| `claude-opus-4-20250514`   | `claude-opus-4-0`   | Powerful reasoning         |

### Claude 3.7 Models

| Model ID                     | Alias                      |
| ---------------------------- | -------------------------- |
| `claude-3-7-sonnet-20250219` | `claude-3-7-sonnet-latest` |

### Claude 3.5 Models

| Model ID                     | Alias                                   |
| ---------------------------- | --------------------------------------- |
| `claude-3-5-haiku-20241022`  | `claude-3-5-haiku-latest`               |
| `claude-3-5-sonnet-20241022` | `claude-3-5-sonnet-latest` (deprecated) |

### Pricing

| Model             | Input    | Output   |
| ----------------- | -------- | -------- |
| Claude Sonnet 4.5 | $3/MTok  | $15/MTok |
| Claude Haiku 4.5  | $1/MTok  | $5/MTok  |
| Claude Opus 4.1   | $15/MTok | $75/MTok |

## Client Setup

### Python

```python
import anthropic

client = anthropic.Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key="my_api_key",
)
```

### TypeScript

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'my_api_key', // defaults to process.env["ANTHROPIC_API_KEY"]
});
```

## Basic Messages

### Python

```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)
print(message.content)
```

### TypeScript

```typescript
const msg = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
});
console.log(msg);
```

## System Prompts

```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    system="You are a helpful assistant that speaks like a pirate.",
    messages=[
        {"role": "user", "content": "Tell me about the weather"}
    ]
)
```

## Streaming Responses

### Python

```python
from anthropic import Anthropic

client = Anthropic()

stream = client.messages.create(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    model="claude-sonnet-4-5-20250929",
    stream=True,
)
for event in stream:
    print(event.type)
```

### Python (Stream Helper)

```python
async with client.messages.stream(
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Say hello there!"}
    ],
    model="claude-sonnet-4-5-20250929",
) as stream:
    async for text in stream.text_stream:
        print(text, end="", flush=True)
```

### TypeScript

```typescript
const stream = await anthropic.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello, Claude' }],
});

for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    process.stdout.write(event.delta.text);
  }
}
```

## Extended Thinking

For complex reasoning tasks, enable extended thinking:

### Python

```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000
    },
    messages=[{
        "role": "user",
        "content": "Are there an infinite number of prime numbers such that n mod 4 == 3?"
    }]
)

# Response contains thinking and text blocks
for block in response.content:
    if block.type == "thinking":
        print(f"Thinking summary: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### TypeScript

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 16000,
  thinking: {
    type: 'enabled',
    budget_tokens: 10000,
  },
  messages: [
    {
      role: 'user',
      content: 'Are there an infinite number of prime numbers such that n mod 4 == 3?',
    },
  ],
});

for (const block of response.content) {
  if (block.type === 'thinking') {
    console.log(`Thinking summary: ${block.thinking}`);
  } else if (block.type === 'text') {
    console.log(`Response: ${block.text}`);
  }
}
```

### Streaming with Thinking

```python
with client.messages.stream(
    model="claude-opus-4-1-20250805",
    max_tokens=16000,
    thinking={"type": "enabled", "budget_tokens": 10000},
    messages=[{"role": "user", "content": "What is 27 * 453?"}],
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if event.delta.type == "thinking_delta":
                print(f"Thinking: {event.delta.thinking}", end="")
            elif event.delta.type == "text_delta":
                print(f"Response: {event.delta.text}", end="")
```

## Tool Use (Function Calling)

### Define Tools

```python
tools = [{
    "name": "get_weather",
    "description": "Get the current weather in a given location",
    "input_schema": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
            },
            "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The unit of temperature"
            }
        },
        "required": ["location"]
    }
}]
```

### Make Tool Request

```python
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "What is the weather like in San Francisco?"}]
)

# Check for tool use
for block in response.content:
    if block.type == "tool_use":
        tool_name = block.name
        tool_input = block.input
        tool_use_id = block.id
        print(f"Tool: {tool_name}, Input: {tool_input}")
```

### Return Tool Result

```python
# After executing the tool, return the result
messages = [
    {"role": "user", "content": "What is the weather like in San Francisco?"},
    {"role": "assistant", "content": response.content},
    {
        "role": "user",
        "content": [{
            "type": "tool_result",
            "tool_use_id": tool_use_id,
            "content": "15 degrees celsius, sunny"
        }]
    }
]

final_response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    tools=tools,
    messages=messages
)
print(final_response.content[0].text)
```

### Python Tool Helper (Beta)

```python
from anthropic import beta_tool

@beta_tool
def get_weather(location: str) -> str:
    """Lookup the weather for a given city.

    Args:
        location: The city and state, e.g. San Francisco, CA
    Returns:
        Weather information for the location.
    """
    return '{"temperature": "68°F", "condition": "Sunny"}'

runner = client.beta.messages.tool_runner(
    max_tokens=1024,
    model="claude-sonnet-4-5-20250929",
    tools=[get_weather],
    messages=[
        {"role": "user", "content": "What is the weather in SF?"},
    ],
)
for message in runner:
    print(message)
```

## Vision (Image Analysis)

### Base64 Image

```python
import base64

with open("image.png", "rb") as f:
    image_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": image_data,
                    },
                },
                {
                    "type": "text",
                    "text": "Describe this image."
                }
            ],
        }
    ],
)
```

### URL Image

```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/image.png",
                    },
                },
                {
                    "type": "text",
                    "text": "What's in this image?"
                }
            ],
        }
    ],
)
```

## PDF Document Support

```python
import base64

with open("document.pdf", "rb") as f:
    pdf_data = base64.standard_b64encode(f.read()).decode("utf-8")

message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": pdf_data,
                    },
                },
                {
                    "type": "text",
                    "text": "Summarize this document."
                }
            ],
        }
    ],
)
```

## Multi-turn Conversations

```python
messages = [
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "2+2 equals 4."},
    {"role": "user", "content": "And what is that times 3?"}
]

response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=messages
)
```

## Batch Processing

```python
# Create batch request
batch = client.batches.create(
    requests=[
        {
            "custom_id": "request-1",
            "params": {
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "Hello!"}]
            }
        },
        {
            "custom_id": "request-2",
            "params": {
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 1024,
                "messages": [{"role": "user", "content": "How are you?"}]
            }
        }
    ]
)

# Check batch status
batch_status = client.batches.retrieve(batch.id)

# Get results when complete
if batch_status.status == "ended":
    results = client.batches.results(batch.id)
```

## Token Counting

```python
response = client.messages.count_tokens(
    model="claude-sonnet-4-5-20250929",
    messages=[{"role": "user", "content": "Hello, world!"}]
)
print(f"Token count: {response.input_tokens}")
```

## Error Handling

```python
from anthropic import APIError, RateLimitError, APIConnectionError

try:
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello"}]
    )
except RateLimitError as e:
    print(f"Rate limited: {e}")
    # Implement exponential backoff
except APIConnectionError as e:
    print(f"Connection error: {e}")
except APIError as e:
    print(f"API error: {e}")
```

## Beta Features

Access beta features using the beta namespace:

```python
message = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ],
    betas=["beta-feature-name"]
)
```

## 1M Context Window (Beta)

For Claude Sonnet 4.5, enable 1M token context:

```python
message = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=1024,
    messages=[{"role": "user", "content": very_long_content}],
    extra_headers={"anthropic-beta": "context-1m-2025-08-07"}
)
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Official Resources

- **Documentation**: [docs.anthropic.com](https://docs.anthropic.com)
- **Python SDK**: [github.com/anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- **TypeScript SDK**: [github.com/anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript)
- **API Reference**: [docs.anthropic.com/en/api](https://docs.anthropic.com/en/api)
- **Console**: [console.anthropic.com](https://console.anthropic.com)
