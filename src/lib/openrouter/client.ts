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

export default openRouterClient;
