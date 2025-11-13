import { NextRequest, NextResponse } from "next/server";

/**
 * Context object passed to API route handlers
 * Contains validated client ID and parsed request body
 *
 * @interface ApiContext
 * @property {string} clientId - Validated client ID (guaranteed non-null)
 * @property {any} [body] - Parsed JSON request body (if applicable)
 */
export interface ApiContext {
  clientId: string;
  body?: any;
}

/**
 * Error response structure
 *
 * @interface ApiErrorResponse
 * @property {string} error - Human-readable error message
 * @property {string} [details] - Additional error details or context
 * @property {string} [stack] - Stack trace (only in development mode)
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  stack?: string;
}

/**
 * Standard pattern for ALL API routes that require client context
 *
 * This wrapper provides:
 * - Automatic client ID extraction from multiple sources (header, body, query params)
 * - Client ID validation
 * - Consistent error handling and error response format
 * - Type-safe context passed to handler
 * - Development-friendly error messages with stack traces
 *
 * **Client ID Resolution Order:**
 * 1. `x-client-id` header (preferred for SPA/API calls)
 * 2. Request body `clientId` field (for POST/PUT)
 * 3. URL query parameter `clientId` (for GET/DELETE)
 *
 * **Benefits:**
 * - Single validation point for all client-dependent routes
 * - Eliminates repetitive validation code
 * - Consistent error responses across all endpoints
 * - Type safety with guaranteed non-null clientId
 * - Automatic request method handling
 *
 * @example
 * ```typescript
 * // app/api/my-feature/route.ts
 * export async function POST(req: NextRequest) {
 *   return withClientValidation(req, async ({ clientId, body }) => {
 *     // clientId is guaranteed to be a valid string
 *     const result = await processFeature(clientId, body);
 *     return NextResponse.json({ success: true, data: result });
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // GET endpoint with query params
 * export async function GET(req: NextRequest) {
 *   return withClientValidation(req, async ({ clientId }) => {
 *     const data = await fetchClientData(clientId);
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With Convex integration
 * import { api } from "@/convex/_generated/api";
 * import { fetchQuery } from "convex/nextjs";
 *
 * export async function POST(req: NextRequest) {
 *   return withClientValidation(req, async ({ clientId, body }) => {
 *     const result = await fetchMutation(api.myFeature.create, {
 *       clientId: clientId as Id<"clients">,
 *       ...body,
 *     });
 *
 *     return NextResponse.json({ success: true, data: result });
 *   });
 * }
 * ```
 *
 * @param {NextRequest} req - Next.js request object
 * @param {(ctx: ApiContext) => Promise<NextResponse>} handler - Handler function receiving validated context
 * @returns {Promise<NextResponse>} API response or error response
 */
export async function withClientValidation(
  req: NextRequest,
  handler: (ctx: ApiContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    let clientId: string | null = null;
    let body: any = null;

    // Step 1: Try to get clientId from header (preferred method)
    // This is the cleanest approach for SPA/API calls
    clientId = req.headers.get("x-client-id");

    // Step 2: If not in header, try body (for POST/PUT requests)
    if (!clientId && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
      try {
        body = await req.json();
        clientId = body.clientId;
      } catch (parseError) {
        // Body parsing failed - will be caught in validation below
        console.error("Failed to parse request body:", parseError);
      }
    }

    // Step 3: If not in body, try URL query params (for GET/DELETE)
    if (!clientId) {
      const { searchParams } = new URL(req.url);
      clientId = searchParams.get("clientId");
    }

    // Step 4: Validate clientId exists
    if (!clientId || clientId.trim() === "") {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: "Client ID required",
          details: "Please provide clientId in one of: x-client-id header, request body, or query parameter"
        },
        { status: 400 }
      );
    }

    // Step 5: Execute handler with validated context
    return await handler({ clientId, body });

  } catch (error: any) {
    console.error("API error:", error);

    // Determine status code based on error type
    let status = 500;
    if (error.message?.includes("not found")) {
      status = 404;
    } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
      status = 403;
    } else if (error.message?.includes("invalid") || error.message?.includes("required")) {
      status = 400;
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error.message || "Internal server error",
        details: error.details || undefined,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status }
    );
  }
}

/**
 * Simpler wrapper for API routes that don't require client validation
 *
 * Provides consistent error handling without client ID validation.
 * Use this for:
 * - Public endpoints
 * - Authentication endpoints
 * - System-level operations
 * - Health checks
 *
 * @example
 * ```typescript
 * // app/api/health/route.ts
 * export async function GET() {
 *   return withErrorHandling(async () => {
 *     const status = await checkSystemHealth();
 *     return NextResponse.json({ status: "ok", ...status });
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // app/api/auth/login/route.ts
 * export async function POST(req: NextRequest) {
 *   return withErrorHandling(async () => {
 *     const body = await req.json();
 *     const token = await authenticateUser(body);
 *     return NextResponse.json({ token });
 *   });
 * }
 * ```
 *
 * @param {() => Promise<NextResponse>} handler - Handler function to execute
 * @returns {Promise<NextResponse>} API response or error response
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error: any) {
    console.error("API error:", error);

    // Determine status code based on error type
    let status = 500;
    if (error.message?.includes("not found")) {
      status = 404;
    } else if (error.message?.includes("unauthorized") || error.message?.includes("forbidden")) {
      status = 403;
    } else if (error.message?.includes("invalid") || error.message?.includes("required")) {
      status = 400;
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: error.message || "Internal server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status }
    );
  }
}

/**
 * Extracts and validates multiple client IDs from request
 *
 * Use this for batch operations that work with multiple clients.
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   return withErrorHandling(async () => {
 *     const body = await req.json();
 *     const clientIds = extractClientIds(body.clientIds);
 *
 *     const results = await Promise.all(
 *       clientIds.map(id => processClient(id))
 *     );
 *
 *     return NextResponse.json({ results });
 *   });
 * }
 * ```
 *
 * @param {unknown} value - Value to extract client IDs from
 * @returns {string[]} Array of validated client ID strings
 * @throws {Error} If value is not an array or contains invalid IDs
 */
export function extractClientIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Client IDs must be an array");
  }

  const clientIds = value.filter((id): id is string =>
    typeof id === "string" && id.trim().length > 0
  );

  if (clientIds.length === 0) {
    throw new Error("At least one valid client ID is required");
  }

  if (clientIds.length !== value.length) {
    throw new Error("All client IDs must be non-empty strings");
  }

  return clientIds;
}

/**
 * Type guard to check if error is a Convex error
 *
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is from Convex
 */
export function isConvexError(error: unknown): error is { data: any; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    "message" in error
  );
}

/**
 * Formats Convex errors for API responses
 *
 * @param {unknown} error - Error from Convex
 * @returns {ApiErrorResponse} Formatted error response
 */
export function formatConvexError(error: unknown): ApiErrorResponse {
  if (isConvexError(error)) {
    return {
      error: error.message,
      details: JSON.stringify(error.data),
    };
  }

  return {
    error: error instanceof Error ? error.message : "Unknown error occurred",
  };
}
