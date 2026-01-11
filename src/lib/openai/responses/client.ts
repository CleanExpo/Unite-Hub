/**
 * OpenAI Responses API Client
 * Comprehensive client for OpenAI's advanced Responses API
 * Supports text/image inputs, streaming, tools, conversations, and more
 */

import { openaiClient } from '../client';
import {
  CreateResponseRequest,
  Response,
  GetResponseRequest,
  DeleteResponseResponse,
  CompactResponseRequest,
  CompactedResponse,
  ListInputItemsRequest,
  InputItemList,
  GetInputTokenCountsRequest,
  InputTokenCountsResponse,
} from './types';

const BASE_URL = 'https://api.openai.com/v1/responses';

/**
 * Create a model response
 * POST /v1/responses
 */
export async function createResponse(
  request: CreateResponseRequest
): Promise<Response> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Create response failed:', error);
    throw error;
  }
}

/**
 * Create a streaming model response
 * POST /v1/responses with stream: true
 */
export async function createStreamingResponse(
  request: CreateResponseRequest
): Promise<ReadableStream<Uint8Array>> {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  } catch (error) {
    console.error('[OpenAI Responses] Create streaming response failed:', error);
    throw error;
  }
}

/**
 * Get a model response by ID
 * GET /v1/responses/{response_id}
 */
export async function getResponse(
  responseId: string,
  options?: Omit<GetResponseRequest, 'response_id'>
): Promise<Response> {
  try {
    const queryParams = new URLSearchParams();
    if (options?.include) {
      options.include.forEach((item) => queryParams.append('include', item));
    }
    if (options?.include_obfuscation !== undefined) {
      queryParams.append('include_obfuscation', String(options.include_obfuscation));
    }
    if (options?.starting_after !== undefined) {
      queryParams.append('starting_after', String(options.starting_after));
    }

    const url = `${BASE_URL}/${responseId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Get response failed:', error);
    throw error;
  }
}

/**
 * Delete a model response
 * DELETE /v1/responses/{response_id}
 */
export async function deleteResponse(
  responseId: string
): Promise<DeleteResponseResponse> {
  try {
    const response = await fetch(`${BASE_URL}/${responseId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Delete response failed:', error);
    throw error;
  }
}

/**
 * Cancel a background response
 * POST /v1/responses/{response_id}/cancel
 */
export async function cancelResponse(responseId: string): Promise<Response> {
  try {
    const response = await fetch(`${BASE_URL}/${responseId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Cancel response failed:', error);
    throw error;
  }
}

/**
 * Compact a response (compress conversation history)
 * POST /v1/responses/compact
 */
export async function compactResponse(
  request: CompactResponseRequest
): Promise<CompactedResponse> {
  try {
    const response = await fetch(`${BASE_URL}/compact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Compact response failed:', error);
    throw error;
  }
}

/**
 * List input items for a response
 * GET /v1/responses/{response_id}/input_items
 */
export async function listInputItems(
  request: ListInputItemsRequest
): Promise<InputItemList> {
  try {
    const queryParams = new URLSearchParams();
    if (request.after) {
queryParams.append('after', request.after);
}
    if (request.limit) {
queryParams.append('limit', String(request.limit));
}
    if (request.order) {
queryParams.append('order', request.order);
}
    if (request.include) {
      request.include.forEach((item) => queryParams.append('include', item));
    }

    const url = `${BASE_URL}/${request.response_id}/input_items?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] List input items failed:', error);
    throw error;
  }
}

/**
 * Get input token counts (estimate tokens before creating response)
 * POST /v1/responses/input_tokens
 */
export async function getInputTokenCounts(
  request: GetInputTokenCountsRequest
): Promise<InputTokenCountsResponse> {
  try {
    const response = await fetch(`${BASE_URL}/input_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI Responses API error: ${error.error?.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('[OpenAI Responses] Get input token counts failed:', error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse streaming response chunks
 */
export async function* parseStreamingResponse(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<any, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
break;
}

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') {
continue;
}
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            yield data;
          } catch (e) {
            console.warn('[OpenAI Responses] Failed to parse stream chunk:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Simple text generation (convenience function)
 */
export async function generateText(
  prompt: string,
  options?: Partial<CreateResponseRequest>
): Promise<string> {
  const response = await createResponse({
    model: options?.model || 'gpt-4o',
    input: prompt,
    ...options,
  });

  // Extract text from first message output
  const firstMessage = response.output.find((item) => item.type === 'message');
  const textContent = firstMessage?.content?.find(
    (c) => c.type === 'output_text'
  );

  return textContent?.text || '';
}

/**
 * Generate text with streaming
 */
export async function* generateTextStream(
  prompt: string,
  options?: Partial<CreateResponseRequest>
): AsyncGenerator<string, void, unknown> {
  const stream = await createStreamingResponse({
    model: options?.model || 'gpt-4o',
    input: prompt,
    ...options,
  });

  for await (const chunk of parseStreamingResponse(stream)) {
    if (chunk.type === 'content.delta') {
      yield chunk.delta?.text || '';
    }
  }
}

/**
 * Multi-turn conversation helper
 */
export class ConversationManager {
  private previousResponseId: string | null = null;
  private model: string;

  constructor(model: string = 'gpt-4o') {
    this.model = model;
  }

  async sendMessage(
    message: string,
    options?: Partial<CreateResponseRequest>
  ): Promise<Response> {
    const response = await createResponse({
      model: this.model,
      input: message,
      previous_response_id: this.previousResponseId || undefined,
      ...options,
    });

    this.previousResponseId = response.id;
    return response;
  }

  async sendMessageStream(
    message: string,
    options?: Partial<CreateResponseRequest>
  ): Promise<ReadableStream<Uint8Array>> {
    const stream = await createStreamingResponse({
      model: this.model,
      input: message,
      previous_response_id: this.previousResponseId || undefined,
      ...options,
    });

    // Note: We need to extract response ID from stream for next turn
    // This is simplified - in production, capture ID from first chunk
    return stream;
  }

  getLastResponseId(): string | null {
    return this.previousResponseId;
  }

  reset(): void {
    this.previousResponseId = null;
  }
}

export default {
  createResponse,
  createStreamingResponse,
  getResponse,
  deleteResponse,
  cancelResponse,
  compactResponse,
  listInputItems,
  getInputTokenCounts,
  parseStreamingResponse,
  generateText,
  generateTextStream,
  ConversationManager,
};
