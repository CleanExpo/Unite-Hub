import { OpenRouter } from '@openrouter/sdk';

/**
 * OpenRouter Client for kwaipilot/kat-coder-pro:free model
 *
 * Free model optimized for code generation and technical tasks
 */
export const openRouterClient = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'https://unite-hub-git-main-unite-group.vercel.app',
    'X-Title': 'Unite-Hub CRM',
  },
});

/**
 * Generate content using kwaipilot/kat-coder-pro:free
 */
export async function generateWithKatCoder(prompt: string) {
  const completion = await openRouterClient.chat.send({
    model: 'kwaipilot/kat-coder-pro:free',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using kwaipilot/kat-coder-pro:free
 */
export async function* streamWithKatCoder(prompt: string) {
  const stream = await openRouterClient.chat.send({
    model: 'kwaipilot/kat-coder-pro:free',
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
 * Generate content using OpenAI GPT-5.1 Codex via OpenRouter
 * Note: Verify this model identifier on OpenRouter's model list
 */
export async function generateWithGPTCodex(prompt: string) {
  const completion = await openRouterClient.chat.send({
    model: 'openai/gpt-5.1-codex',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using OpenAI GPT-5.1 Codex
 */
export async function* streamWithGPTCodex(prompt: string) {
  const stream = await openRouterClient.chat.send({
    model: 'openai/gpt-5.1-codex',
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
 * Generate content using Google Gemini 2.0 Flash via OpenRouter
 * Free, fast model optimized for general tasks
 */
export async function generateWithGemini(prompt: string) {
  const completion = await openRouterClient.chat.send({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generate streaming content using Google Gemini 2.0 Flash
 */
export async function* streamWithGemini(prompt: string) {
  const stream = await openRouterClient.chat.send({
    model: 'google/gemini-2.0-flash-exp:free',
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
 * Available model options
 */
export const MODELS = {
  KAT_CODER: 'kwaipilot/kat-coder-pro:free',
  GPT_CODEX: 'openai/gpt-5.1-codex',
  GEMINI_FLASH: 'google/gemini-2.0-flash-exp:free',
} as const;

/**
 * Generic function to generate content with any OpenRouter model
 */
export async function generateWithModel(prompt: string, model: string) {
  const completion = await openRouterClient.chat.send({
    model,
    messages: [{ role: 'user', content: prompt }],
    stream: false,
  });

  return completion.choices[0].message.content;
}

/**
 * Generic function to stream content with any OpenRouter model
 */
export async function* streamWithModel(prompt: string, model: string) {
  const stream = await openRouterClient.chat.send({
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

export default openRouterClient;
