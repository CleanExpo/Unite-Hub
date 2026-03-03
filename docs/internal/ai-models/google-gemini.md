# Google Gemini API Documentation

> Official documentation sourced from [ai.google.dev](https://ai.google.dev/gemini-api/docs) and [googleapis/python-genai](https://github.com/googleapis/python-genai)

## Installation

### Python

```bash
pip install google-genai
```

### TypeScript/JavaScript

```bash
npm install @google/genai
```

## Available Models

### Current Generation (Latest)

| Model ID                     | Description                                                                     | Context                |
| ---------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| `gemini-3-pro-preview`       | Best model for multimodal understanding, most powerful agentic and coding model | 1M input / 65K output  |
| `gemini-3-pro-image-preview` | Image generation and understanding with thinking                                | 65K input / 32K output |
| `gemini-2.5-pro`             | State-of-the-art thinking model for complex reasoning (code, math, STEM)        | 1M input / 65K output  |
| `gemini-2.5-flash`           | Best price-performance, well-rounded capabilities                               | 1M input / 65K output  |
| `gemini-2.5-flash-lite`      | Fastest flash model, optimized for cost-efficiency                              | 1M input / 65K output  |
| `gemini-2.5-flash-image`     | Native image generation with text output                                        | 1M input / 65K output  |

### Previous Generation

| Model ID                | Description                 | Context              |
| ----------------------- | --------------------------- | -------------------- |
| `gemini-2.0-flash`      | Second-generation workhorse | 1M input / 8K output |
| `gemini-2.0-flash-001`  | GA version of 2.0 Flash     | 1M input / 8K output |
| `gemini-2.0-flash-lite` | Cost-efficient 2.0 model    | 1M input / 8K output |

### Other Models

| Model ID                   | Description                 |
| -------------------------- | --------------------------- |
| `imagen-4.0-generate-001`  | Image generation            |
| `veo-3.0-generate-preview` | Video generation with audio |
| `gemini-embedding-001`     | Text embeddings             |

## Client Setup

### Python (Gemini Developer API)

```python
from google import genai

# Using API key directly
client = genai.Client(api_key='YOUR_GEMINI_API_KEY')

# Or using environment variable (recommended)
# Set GEMINI_API_KEY or GOOGLE_API_KEY env var
client = genai.Client()
```

### Python (Vertex AI)

```python
from google import genai

client = genai.Client(
    vertexai=True,
    project='your-project-id',
    location='us-central1'
)
```

### TypeScript (Gemini Developer API)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
```

### TypeScript (Vertex AI)

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'your_project',
  location: 'your_location',
});
```

## Generate Content

### Python

```python
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Why is the sky blue?'
)
print(response.text)
```

### TypeScript

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Why is the sky blue?',
});
console.log(response.text);
```

## Streaming

### Python

```python
for chunk in client.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

### TypeScript

```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a 100-word poem.',
});
for await (const chunk of response) {
  console.log(chunk.text);
}
```

## Async (Python)

```python
response = await client.aio.models.generate_content(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
)
print(response.text)

# Async streaming
async for chunk in await client.aio.models.generate_content_stream(
    model='gemini-2.5-flash',
    contents='Tell me a story in 300 words.'
):
    print(chunk.text, end='')
```

## System Instructions and Config

### Python

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='high',
    config=types.GenerateContentConfig(
        system_instruction='I say high, you say low',
        max_output_tokens=100,
        temperature=0.3,
        top_p=0.95,
        top_k=20,
        candidate_count=1,
        seed=5,
        stop_sequences=['STOP!'],
        presence_penalty=0.0,
        frequency_penalty=0.0,
    ),
)
print(response.text)
```

## Multi-turn Chat

### Python

```python
chat = client.chats.create(model='gemini-2.5-flash')

response = chat.send_message('Hello!')
print(response.text)

response = chat.send_message('What did I just say?')
print(response.text)

# Get history
history = chat.get_history()
```

### TypeScript

```typescript
const chat = ai.chats.create({ model: 'gemini-2.5-flash' });

const response1 = await chat.sendMessage('Hello!');
console.log(response1.text);

const response2 = await chat.sendMessage('What did I just say?');
console.log(response2.text);
```

## Thinking Models

For complex reasoning tasks, use thinking-capable models:

### Python

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-pro',  # or gemini-2.5-flash with thinking
    contents='Solve this step by step: If a train travels at 60mph for 2.5 hours, how far does it go?',
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=8192,  # Token budget for thinking
        )
    )
)
print(response.text)
```

## JSON Mode (Structured Output)

### With Pydantic Schema

```python
from pydantic import BaseModel
from google.genai import types

class CountryInfo(BaseModel):
    name: str
    population: int
    capital: str
    continent: str

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Give me information for the United States.',
    config=types.GenerateContentConfig(
        response_mime_type='application/json',
        response_schema=CountryInfo,
    ),
)
print(response.text)
```

### With Dict Schema

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Give me information for the United States.',
    config=types.GenerateContentConfig(
        response_mime_type='application/json',
        response_schema={
            'type': 'OBJECT',
            'required': ['name', 'population', 'capital'],
            'properties': {
                'name': {'type': 'STRING'},
                'population': {'type': 'INTEGER'},
                'capital': {'type': 'STRING'},
            },
        },
    ),
)
print(response.text)
```

## Function Calling

### Automatic Function Calling (Python)

```python
from google.genai import types

def get_current_weather(location: str) -> str:
    """Returns the current weather.

    Args:
      location: The city and state, e.g. San Francisco, CA
    """
    return 'sunny'

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='What is the weather like in Boston?',
    config=types.GenerateContentConfig(tools=[get_current_weather]),
)
print(response.text)
```

### Manual Function Declaration

```python
from google.genai import types

function = types.FunctionDeclaration(
    name='get_current_weather',
    description='Get the current weather in a given location',
    parameters_json_schema={
        'type': 'object',
        'properties': {
            'location': {
                'type': 'string',
                'description': 'The city and state, e.g. San Francisco, CA',
            }
        },
        'required': ['location'],
    },
)

tool = types.Tool(function_declarations=[function])

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='What is the weather like in Boston?',
    config=types.GenerateContentConfig(tools=[tool]),
)

# Handle function call
if response.function_calls:
    print(response.function_calls[0])
```

### TypeScript Function Calling

```typescript
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';

const controlLightDeclaration = {
  name: 'controlLight',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      brightness: { type: 'number' },
      colorTemperature: { type: 'string' },
    },
    required: ['brightness', 'colorTemperature'],
  },
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Dim the lights so the room feels cozy and warm.',
  config: {
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY,
        allowedFunctionNames: ['controlLight'],
      },
    },
    tools: [{ functionDeclarations: [controlLightDeclaration] }],
  },
});

console.log(response.functionCalls);
```

## Grounding with Google Search

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='What happened in the news today?',
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())]
    )
)
print(response.text)
```

## Grounding with Google Maps

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Find coffee shops near Times Square',
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_maps=types.GoogleMaps())]
    )
)
print(response.text)
```

## Code Execution

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Calculate the sum of the first 50 prime numbers',
    config=types.GenerateContentConfig(
        tools=[types.Tool(code_execution=types.ToolCodeExecution())]
    )
)
print(response.text)
```

## File Upload and Multimodal

### Upload File

```python
file = client.files.upload(file='document.pdf')

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=['Summarize this document', file]
)
print(response.text)
```

### Image Input

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
        'What is in this image?',
        types.Part.from_uri(
            file_uri='gs://bucket/image.jpg',
            mime_type='image/jpeg',
        )
    ]
)
print(response.text)
```

## Image Generation

```python
from google.genai import types

response = client.models.generate_content(
    model='gemini-2.5-flash-image',
    contents='A cartoon infographic for flying sneakers',
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(
            aspect_ratio="9:16",
        ),
    ),
)

for part in response.parts:
    if part.inline_data:
        generated_image = part.as_image()
        generated_image.show()
```

### Imagen Model

```python
from google.genai import types

response = client.models.generate_images(
    model='imagen-4.0-generate-001',
    prompt='An umbrella in the foreground, and a rainy night sky in the background',
    config=types.GenerateImagesConfig(
        number_of_images=1,
        include_rai_reason=True,
        output_mime_type='image/jpeg',
    ),
)
response.generated_images[0].image.show()
```

## Live API (Real-time)

The Live API enables real-time interaction with text, audio, and video:

```python
from google import genai

# Create live session
async with client.live.connect(model='gemini-2.0-flash-live-001') as session:
    # Send content
    await session.send(audio_chunk)

    # Receive responses
    async for response in session.receive():
        print(response.text)
```

## Batch API

For non-time-sensitive bulk requests with 50% cost discount:

```python
from google.genai import types

batch = client.batches.create(
    model='gemini-2.5-flash',
    requests=[
        types.CreateBatchJobRequest(contents='Summarize article 1'),
        types.CreateBatchJobRequest(contents='Summarize article 2'),
    ]
)

# Check status
status = client.batches.get(name=batch.name)
```

## Context Caching

Reduce costs for repeated large prompts:

```python
from google.genai import types

# Create cache
cache = client.caches.create(
    model='gemini-2.5-flash',
    contents=[large_document],
    config=types.CreateCacheConfig(ttl='3600s')
)

# Use cache
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents='Summarize this',
    config=types.GenerateContentConfig(cached_content=cache.name)
)
```

## Count Tokens

```python
response = client.models.count_tokens(
    model='gemini-2.5-flash',
    contents='Why is the sky blue?',
)
print(response.total_tokens)
```

## Embeddings

```python
response = client.models.embed_content(
    model='gemini-embedding-001',
    contents='What is machine learning?',
)
print(response.embedding)
```

## Error Handling

### Python

```python
from google.genai import errors

try:
    response = client.models.generate_content(
        model='invalid-model-name',
        contents='What is your name?',
    )
except errors.APIError as e:
    print(e.code)    # 404
    print(e.message)
```

### TypeScript

```typescript
await ai.models
  .generateContent({
    model: 'non-existent-model',
    contents: 'Write a poem.',
  })
  .catch((e) => {
    console.error('error name:', e.name);
    console.error('error message:', e.message);
    console.error('error status:', e.status);
  });
```

## OpenAI Compatibility

Use Gemini with OpenAI SDK:

```python
from openai import OpenAI

client = OpenAI(
    api_key='YOUR_GEMINI_API_KEY',
    base_url='https://generativelanguage.googleapis.com/v1beta/openai/'
)

response = client.chat.completions.create(
    model='gemini-2.5-flash',
    messages=[
        {'role': 'user', 'content': 'Hello!'}
    ]
)
print(response.choices[0].message.content)
```

## Environment Variables

```bash
# Gemini Developer API
export GEMINI_API_KEY='your-api-key'
# or
export GOOGLE_API_KEY='your-api-key'

# Vertex AI
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT='your-project-id'
export GOOGLE_CLOUD_LOCATION='us-central1'
```

## Official Resources

- **Documentation**: [ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)
- **Python SDK**: [github.com/googleapis/python-genai](https://github.com/googleapis/python-genai)
- **TypeScript SDK**: [github.com/googleapis/js-genai](https://github.com/googleapis/js-genai)
- **Cookbook**: [github.com/google-gemini/cookbook](https://github.com/google-gemini/cookbook)
- **API Key**: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
