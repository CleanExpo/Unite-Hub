/**
 * API Request Validation Utilities
 *
 * Provides type-safe validation for:
 * - Request body (JSON)
 * - Query parameters
 * - Workspace ID extraction
 *
 * Uses Zod for schema validation.
 *
 * @module api/_middleware/validation
 */

import { NextRequest } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/utils/error-handler';

/**
 * Parse and validate JSON request body
 *
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated data
 * @throws ValidationError if body is invalid or doesn't match schema
 *
 * @example
 * ```typescript
 * const CreateContactSchema = z.object({
 *   email: z.string().email(),
 *   name: z.string().min(1),
 *   workspace_id: z.string().uuid()
 * });
 *
 * export const POST = withApiHandler(
 *   async (req, context) => {
 *     const body = await validateBody(req.request, CreateContactSchema);
 *     // body is typed as { email: string; name: string; workspace_id: string }
 *     return successResponse(body);
 *   },
 *   { auth: true }
 * );
 * ```
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    // Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      throw new ValidationError('Invalid JSON in request body', {
        field: 'body',
        constraint: 'Must be valid JSON',
      });
    }

    // Validate against schema
    const result = schema.safeParse(body);

    if (!result.success) {
      // Extract first validation error for clear error message
      const firstError = result.error.errors[0];
      const fieldPath = firstError.path.join('.');

      throw new ValidationError(
        `Validation failed for field "${fieldPath}": ${firstError.message}`,
        {
          field: fieldPath,
          constraint: firstError.message,
          zodErrors: result.error.errors,
        }
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Re-throw as ValidationError for consistent error handling
    throw new ValidationError('Request body validation failed', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Parse and validate URL query parameters
 *
 * @param request - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Parsed and validated query parameters
 * @throws ValidationError if query params don't match schema
 *
 * @example
 * ```typescript
 * const GetContactsQuerySchema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 *   status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED']).optional(),
 *   search: z.string().optional()
 * });
 *
 * export const GET = withApiHandler(
 *   async (req, context) => {
 *     const query = validateQuery(req.request, GetContactsQuerySchema);
 *     // query is typed with defaults applied
 *     const { page, limit, status, search } = query;
 *     return successResponse({ page, limit, status, search });
 *   },
 *   { auth: true, workspace: true }
 * );
 * ```
 */
export function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);

    // Convert URLSearchParams to plain object
    const queryObject: Record<string, string | string[]> = {};

    searchParams.forEach((value, key) => {
      const existing = queryObject[key];
      if (existing) {
        // Handle multiple values for same key
        queryObject[key] = Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
      } else {
        queryObject[key] = value;
      }
    });

    // Validate against schema
    const result = schema.safeParse(queryObject);

    if (!result.success) {
      // Extract first validation error
      const firstError = result.error.errors[0];
      const fieldPath = firstError.path.join('.');

      throw new ValidationError(
        `Invalid query parameter "${fieldPath}": ${firstError.message}`,
        {
          field: fieldPath,
          constraint: firstError.message,
          zodErrors: result.error.errors,
        }
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Re-throw as ValidationError
    throw new ValidationError('Query parameter validation failed', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Extract and validate workspace ID from request
 *
 * Checks for workspace_id in:
 * 1. Query parameters (?workspace_id=...)
 * 2. Request body (JSON)
 *
 * @param request - Next.js request object
 * @returns Workspace ID (UUID)
 * @throws ValidationError if workspace_id is missing or invalid
 *
 * @example
 * ```typescript
 * export const POST = withApiHandler(
 *   async (req, context) => {
 *     const workspaceId = await parseWorkspaceId(req.request);
 *     // workspaceId is guaranteed to be a valid UUID
 *     return successResponse({ workspaceId });
 *   },
 *   { auth: true }
 * );
 * ```
 */
export async function parseWorkspaceId(request: NextRequest): Promise<string> {
  // Define UUID validation schema
  const uuidSchema = z.string().uuid({
    message: 'workspace_id must be a valid UUID',
  });

  // 1. Check query parameters first
  const { searchParams } = new URL(request.url);
  const queryWorkspaceId = searchParams.get('workspace_id');

  if (queryWorkspaceId) {
    const result = uuidSchema.safeParse(queryWorkspaceId);
    if (result.success) {
      return result.data;
    }
    throw new ValidationError(
      'Invalid workspace_id in query parameters: must be a valid UUID',
      {
        field: 'workspace_id',
        constraint: 'Must be a valid UUID',
        value: queryWorkspaceId,
      }
    );
  }

  // 2. Check request body (for POST/PUT/PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const body = await request.json();

      if (body && typeof body === 'object' && 'workspace_id' in body) {
        const result = uuidSchema.safeParse(body.workspace_id);
        if (result.success) {
          return result.data;
        }
        throw new ValidationError(
          'Invalid workspace_id in request body: must be a valid UUID',
          {
            field: 'workspace_id',
            constraint: 'Must be a valid UUID',
            value: body.workspace_id,
          }
        );
      }
    } catch (error) {
      // If JSON parsing fails, continue to "not found" error
      if (error instanceof ValidationError) {
        throw error;
      }
    }
  }

  // 3. Not found in query or body
  throw new ValidationError(
    'Missing workspace_id: must be provided in query parameters or request body',
    {
      field: 'workspace_id',
      constraint: 'Required field',
    }
  );
}

/**
 * Validation schema helpers for common patterns
 */
export const CommonSchemas = {
  /**
   * Pagination query parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  /**
   * UUID parameter
   */
  uuid: z.string().uuid(),

  /**
   * Email address
   */
  email: z.string().email(),

  /**
   * Workspace ID
   */
  workspaceId: z.string().uuid(),

  /**
   * Date range filter
   */
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),

  /**
   * Search query
   */
  search: z.object({
    q: z.string().min(1).optional(),
    search: z.string().min(1).optional(),
  }),

  /**
   * Sort parameters
   */
  sort: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
} as const;

/**
 * Combine multiple Zod schemas
 *
 * @param schemas - Array of Zod object schemas to merge
 * @returns Merged schema
 *
 * @example
 * ```typescript
 * const QuerySchema = combineSchemas(
 *   CommonSchemas.pagination,
 *   CommonSchemas.search,
 *   CommonSchemas.sort
 * );
 * ```
 */
export function combineSchemas<T extends z.ZodObject<any>[]>(
  ...schemas: T
): z.ZodObject<any> {
  return schemas.reduce(
    (acc: z.ZodObject<any>, schema) => acc.merge(schema),
    z.object({})
  );
}
