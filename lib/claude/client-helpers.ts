// Client-side helpers for making API requests to Claude AI endpoints

import type {
  AutoReplyResult,
  PersonaResult,
  StrategyResult,
  CampaignResult,
  HooksResult,
  MindmapResult,
  AIResponse,
  AIError,
  EmailData,
  AssetData,
} from './types';

// Base API URL
const API_BASE = '/api/ai';

// Generic API request helper
async function makeAIRequest<T>(
  endpoint: string,
  data: any
): Promise<AIResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: AIError = await response.json();
    throw new Error(error.details || error.error || 'API request failed');
  }

  return await response.json();
}

// Auto-reply generation
export async function generateAutoReply(params: {
  from: string;
  subject: string;
  body: string;
  context?: string;
  contactId?: string;
  sessionId?: string;
}): Promise<AIResponse<AutoReplyResult>> {
  return makeAIRequest<AutoReplyResult>('/auto-reply', params);
}

// Persona generation
export async function generatePersona(params: {
  emails: EmailData[];
  businessDescription?: string;
  assets?: AssetData[];
  notes?: string;
  contactId?: string;
}): Promise<AIResponse<PersonaResult>> {
  return makeAIRequest<PersonaResult>('/persona', params);
}

// Strategy generation
export async function generateStrategy(params: {
  persona: any;
  businessGoals: string;
  budget?: string;
  timeline?: string;
  competitors?: string[];
  contactId?: string;
}): Promise<AIResponse<StrategyResult>> {
  return makeAIRequest<StrategyResult>('/strategy', params);
}

// Campaign generation
export async function generateCampaign(params: {
  strategy: any;
  platforms: string[];
  budget: string;
  duration: string;
  objective: string;
  contactId?: string;
}): Promise<AIResponse<CampaignResult>> {
  return makeAIRequest<CampaignResult>('/campaign', params);
}

// Hooks generation
export async function generateHooks(params: {
  persona: any;
  business: string;
  platforms: string[];
  toneOfVoice?: string;
  contactId?: string;
}): Promise<AIResponse<HooksResult>> {
  return makeAIRequest<HooksResult>('/hooks', params);
}

// Mindmap generation
export async function generateMindmap(params: {
  emails: EmailData[];
  focusArea?: string;
  contactId?: string;
}): Promise<AIResponse<MindmapResult>> {
  return makeAIRequest<MindmapResult>('/mindmap', params);
}

// Streaming auto-reply (if needed in future)
export async function streamAutoReply(
  params: {
    from: string;
    subject: string;
    body: string;
    context?: string;
  },
  onChunk: (chunk: string) => void,
  onComplete: (result: AutoReplyResult) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/auto-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to start stream');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
break;
}

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullText += data.chunk;
              onChunk(data.chunk);
            }

            if (data.done && data.result) {
              onComplete(data.result);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Batch generation helper
export async function batchGenerate<T>(
  requests: Array<() => Promise<AIResponse<T>>>
): Promise<AIResponse<T>[]> {
  return Promise.all(requests.map((req) => req()));
}

// React hooks-friendly wrapper
export class AIClient {
  // Auto-reply
  async autoReply(params: {
    from: string;
    subject: string;
    body: string;
    context?: string;
    contactId?: string;
  }): Promise<AutoReplyResult> {
    const response = await generateAutoReply(params);
    return response.data;
  }

  // Persona
  async persona(params: {
    emails: EmailData[];
    businessDescription?: string;
    assets?: AssetData[];
    notes?: string;
    contactId?: string;
  }): Promise<PersonaResult> {
    const response = await generatePersona(params);
    return response.data;
  }

  // Strategy
  async strategy(params: {
    persona: any;
    businessGoals: string;
    budget?: string;
    timeline?: string;
    competitors?: string[];
    contactId?: string;
  }): Promise<StrategyResult> {
    const response = await generateStrategy(params);
    return response.data;
  }

  // Campaign
  async campaign(params: {
    strategy: any;
    platforms: string[];
    budget: string;
    duration: string;
    objective: string;
    contactId?: string;
  }): Promise<CampaignResult> {
    const response = await generateCampaign(params);
    return response.data;
  }

  // Hooks
  async hooks(params: {
    persona: any;
    business: string;
    platforms: string[];
    toneOfVoice?: string;
    contactId?: string;
  }): Promise<HooksResult> {
    const response = await generateHooks(params);
    return response.data;
  }

  // Mindmap
  async mindmap(params: {
    emails: EmailData[];
    focusArea?: string;
    contactId?: string;
  }): Promise<MindmapResult> {
    const response = await generateMindmap(params);
    return response.data;
  }
}

// Export singleton instance
export const aiClient = new AIClient();

// Error handling helper
export function handleAIError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error?.error) {
    return error.error;
  }
  return 'An unexpected error occurred';
}
