import OpenAI from 'openai';

/**
 * Direct OpenAI Client using your existing OpenAI API key
 * No need for OpenRouter - this uses OpenAI directly
 */
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Available OpenAI models
 */
export const OPENAI_MODELS = {
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_4: 'gpt-4',
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_35_TURBO: 'gpt-3.5-turbo',
} as const;

/**
 * Generate content using OpenAI GPT-4o (recommended for code)
 */
export async function generateWithGPT4o(prompt: string) {
  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4O,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using GPT-4o
 */
export async function* streamWithGPT4o(prompt: string) {
  const stream = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4O,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}

/**
 * Generate content using GPT-4o Mini (faster, cheaper)
 */
export async function generateWithGPT4oMini(prompt: string) {
  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4O_MINI,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using GPT-4o Mini
 */
export async function* streamWithGPT4oMini(prompt: string) {
  const stream = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4O_MINI,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}

/**
 * Generate content using GPT-4 Turbo
 */
export async function generateWithGPT4Turbo(prompt: string) {
  const completion = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4_TURBO,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using GPT-4 Turbo
 */
export async function* streamWithGPT4Turbo(prompt: string) {
  const stream = await openaiClient.chat.completions.create({
    model: OPENAI_MODELS.GPT_4_TURBO,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}

/**
 * Generic function to generate content with any OpenAI model
 */
export async function generateWithOpenAI(prompt: string, model: string) {
  const completion = await openaiClient.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generic function to stream content with any OpenAI model
 */
export async function* streamWithOpenAI(prompt: string, model: string) {
  const stream = await openaiClient.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}

export default openaiClient;
