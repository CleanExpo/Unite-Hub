/**
 * API Response Utilities
 *
 * Standardized response formatting for:
 * - Success responses
 * - Paginated responses
 * - Streaming responses (SSE)
 *
 * All responses follow a consistent structure:
 * ```json
 * {
 *   "success": true,
 *   "data": { ... },
 *   "meta": { ... }
 * }
 * ```
 *
 * @module api/_middleware/response
 */

import { NextResponse } from 'next/server';

/**
 * Standard API success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: Record<string, any>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
  meta?: Record<string, any>;
}

/**
 * Create a success response
 *
 * @param data - Response data
 * @param meta - Optional metadata (timestamps, versions, etc.)
 * @param status - HTTP status code (default: 200)
 * @returns Next.js response object
 *
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const contact = { id: '123', email: 'test@example.com' };
 *     return successResponse(contact, {
 *       timestamp: new Date().toISOString(),
 *       version: 'v1'
 *     });
 *   }
 * );
 * ```
 */
export function successResponse<T = any>(
  data: T,
  meta?: Record<string, any>,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated response
 *
 * @param items - Array of items for current page
 * @param options - Pagination options
 * @param meta - Optional additional metadata
 * @param status - HTTP status code (default: 200)
 * @returns Next.js response object with pagination
 *
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const query = validateQuery(req.request, CommonSchemas.pagination);
 *     const { page, limit } = query;
 *
 *     const { data: contacts, count } = await context.db
 *       .from('contacts')
 *       .select('*', { count: 'exact' })
 *       .range((page - 1) * limit, page * limit - 1);
 *
 *     return paginatedResponse(contacts || [], {
 *       page,
 *       limit,
 *       total: count || 0
 *     });
 *   },
 *   { auth: true, workspace: true }
 * );
 * ```
 */
export function paginatedResponse<T = any>(
  items: T[],
  options: {
    page: number;
    limit: number;
    total: number;
  },
  meta?: Record<string, any>,
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  const { page, limit, total } = options;

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };

  const response: PaginatedResponse<T> = {
    success: true,
    data: items,
    pagination,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a Server-Sent Events (SSE) streaming response
 *
 * @param stream - ReadableStream to pipe to client
 * @param headers - Optional additional headers
 * @returns Next.js streaming response
 *
 * @example
 * ```typescript
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const stream = new ReadableStream({
 *       async start(controller) {
 *         for (let i = 0; i < 10; i++) {
 *           const data = JSON.stringify({ count: i });
 *           controller.enqueue(`data: ${data}\n\n`);
 *           await new Promise(resolve => setTimeout(resolve, 1000));
 *         }
 *         controller.close();
 *       }
 *     });
 *
 *     return streamResponse(stream);
 *   },
 *   { auth: true }
 * );
 * ```
 */
export function streamResponse(
  stream: ReadableStream,
  headers?: Record<string, string>
): NextResponse {
  const responseHeaders = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering in nginx
    ...headers,
  });

  return new NextResponse(stream, {
    headers: responseHeaders,
  });
}

/**
 * Create a text stream from an async iterator
 *
 * @param iterator - AsyncIterableIterator that yields strings
 * @returns ReadableStream for SSE
 *
 * @example
 * ```typescript
 * async function* generateEvents() {
 *   for (let i = 0; i < 10; i++) {
 *     yield JSON.stringify({ count: i });
 *     await new Promise(resolve => setTimeout(resolve, 1000));
 *   }
 * }
 *
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const stream = createTextStream(generateEvents());
 *     return streamResponse(stream);
 *   }
 * );
 * ```
 */
export function createTextStream(
  iterator: AsyncIterableIterator<string>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const chunk of iterator) {
          // Format as SSE message
          const message = `data: ${chunk}\n\n`;
          controller.enqueue(encoder.encode(message));
        }
      } catch (error) {
        // Send error event
        const errorMessage = `event: error\ndata: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Cleanup if client disconnects
    },
  });
}

/**
 * Create a JSON stream from an async iterator
 *
 * @param iterator - AsyncIterableIterator that yields objects
 * @returns ReadableStream for SSE
 *
 * @example
 * ```typescript
 * async function* generateData() {
 *   for (let i = 0; i < 10; i++) {
 *     yield { count: i, timestamp: Date.now() };
 *     await new Promise(resolve => setTimeout(resolve, 1000));
 *   }
 * }
 *
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const stream = createJsonStream(generateData());
 *     return streamResponse(stream);
 *   }
 * );
 * ```
 */
export function createJsonStream<T = any>(
  iterator: AsyncIterableIterator<T>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const item of iterator) {
          // Serialize to JSON and format as SSE
          const json = JSON.stringify(item);
          const message = `data: ${json}\n\n`;
          controller.enqueue(encoder.encode(message));
        }
      } catch (error) {
        // Send error event
        const errorMessage = `event: error\ndata: ${JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorMessage));
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Cleanup if client disconnects
    },
  });
}

/**
 * Create a created (201) response
 *
 * @param data - Created resource data
 * @param resourceId - ID of created resource (added to meta)
 * @param meta - Optional additional metadata
 * @returns Next.js response with 201 status
 *
 * @example
 * ```typescript
 * export const POST = withApiHandler(
 *   async (req, context) => {
 *     const body = await validateBody(req.request, CreateContactSchema);
 *     const { data: contact } = await context.db
 *       .from('contacts')
 *       .insert(body)
 *       .select()
 *       .single();
 *
 *     return createdResponse(contact, contact.id);
 *   },
 *   { auth: true, workspace: true }
 * );
 * ```
 */
export function createdResponse<T = any>(
  data: T,
  resourceId?: string,
  meta?: Record<string, any>
): NextResponse<SuccessResponse<T>> {
  const responseMeta = resourceId
    ? { resourceId, ...meta }
    : meta;

  return successResponse(data, responseMeta, 201);
}

/**
 * Create a no content (204) response
 *
 * @returns Next.js response with 204 status (no body)
 *
 * @example
 * ```typescript
 * export const DELETE = withApiHandler(
 *   async (req, context) => {
 *     const { id } = context.params;
 *     await context.db
 *       .from('contacts')
 *       .delete()
 *       .eq('id', id);
 *
 *     return noContentResponse();
 *   },
 *   { auth: true, workspace: true }
 * );
 * ```
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Response builder for complex responses
 *
 * @example
 * ```typescript
 * return ResponseBuilder
 *   .success(data)
 *   .withMeta({ timestamp: Date.now() })
 *   .withStatus(201)
 *   .withHeaders({ 'X-Custom': 'value' })
 *   .build();
 * ```
 */
export class ResponseBuilder<T = any> {
  private data: T | null = null;
  private meta?: Record<string, any>;
  private status: number = 200;
  private headers: Record<string, string> = {};

  static success<T>(data: T): ResponseBuilder<T> {
    const builder = new ResponseBuilder<T>();
    builder.data = data;
    return builder;
  }

  withMeta(meta: Record<string, any>): this {
    this.meta = { ...this.meta, ...meta };
    return this;
  }

  withStatus(status: number): this {
    this.status = status;
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  build(): NextResponse<SuccessResponse<T>> {
    const response: SuccessResponse<T> = {
      success: true,
      data: this.data as T,
    };

    if (this.meta) {
      response.meta = this.meta;
    }

    return NextResponse.json(response, {
      status: this.status,
      headers: this.headers,
    });
  }
}
