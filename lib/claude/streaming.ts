import Anthropic from '@anthropic-ai/sdk';

// Stream handler for Server-Sent Events (SSE)
export async function handleStreamResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  let fullText = '';

  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullText += chunk;
          onChunk(chunk);
        }
      }

      if (event.type === 'message_stop') {
        onComplete(fullText);
      }
    }
  } catch (error) {
    onError(error as Error);
  }
}

// Stream handler for Next.js API routes
export async function streamToNextResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>
): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            if (event.delta.type === 'text_delta') {
              const chunk = event.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
          }

          if (event.type === 'message_stop') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            controller.close();
          }

          if (event.type === 'error') {
            controller.error(event.error);
          }
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

// Parse streaming JSON response
export class StreamingJSONParser {
  private buffer = '';
  private inJSON = false;
  private braceCount = 0;

  addChunk(chunk: string): string | null {
    this.buffer += chunk;

    // Try to find JSON start
    if (!this.inJSON) {
      const jsonStartIndex = this.buffer.indexOf('{');
      if (jsonStartIndex !== -1) {
        this.inJSON = true;
        this.buffer = this.buffer.slice(jsonStartIndex);
      }
    }

    // Track braces to find complete JSON
    if (this.inJSON) {
      for (const char of chunk) {
        if (char === '{') {
this.braceCount++;
}
        if (char === '}') {
this.braceCount--;
}
      }

      // Complete JSON found
      if (this.braceCount === 0 && this.buffer.includes('}')) {
        const jsonEndIndex = this.buffer.lastIndexOf('}') + 1;
        const jsonString = this.buffer.slice(0, jsonEndIndex);
        this.buffer = this.buffer.slice(jsonEndIndex);
        this.inJSON = false;

        try {
          return jsonString;
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  getCompleteJSON(): any | null {
    if (this.buffer.trim()) {
      try {
        return JSON.parse(this.buffer);
      } catch {
        return null;
      }
    }
    return null;
  }

  reset(): void {
    this.buffer = '';
    this.inJSON = false;
    this.braceCount = 0;
  }
}

// Client-side streaming parser
export class ClientStreamParser {
  async parseStream(
    response: Response,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ): Promise<void> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete(fullText);
          break;
        }

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.chunk) {
              fullText += data.chunk;
              onChunk(data.chunk);
            }

            if (data.done) {
              onComplete(fullText);
              return;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

// Helper to create streaming response
export function createStreamingResponse(
  stream: ReadableStream,
  headers?: Record<string, string>
): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers,
    },
  });
}

// Batch streaming for multiple operations
export async function batchStreamOperations(
  operations: Array<{
    id: string;
    stream: AsyncIterable<Anthropic.MessageStreamEvent>;
  }>,
  onOperationChunk: (operationId: string, chunk: string) => void,
  onOperationComplete: (operationId: string, fullText: string) => void
): Promise<void> {
  await Promise.all(
    operations.map(({ id, stream }) =>
      handleStreamResponse(
        stream,
        (chunk) => onOperationChunk(id, chunk),
        (fullText) => onOperationComplete(id, fullText),
        (error) => console.error(`Stream error for ${id}:`, error)
      )
    )
  );
}
