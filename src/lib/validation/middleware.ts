/**
 * Comprehensive Zod Validation Middleware
 * SECURITY TASK P2-3: API Input Validation
 *
 * Provides type-safe validation for all API routes with:
 * - Request body validation (POST/PUT/PATCH)
 * - Query parameter validation (GET)
 * - URL parameter validation (route params)
 * - Consistent error response format
 * - Workspace isolation enforcement
 *
 * @module lib/validation/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Standard validation error response format
 */
export interface ValidationErrorResponse {
  error: string;
  code: 'VALIDATION_ERROR';
  details: {
    field: string;
    message: string;
    value?: unknown;
  }[];
  timestamp: string;
}

/**
 * Validation result for successful parsing
 */
export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

/**
 * Validation result for failed parsing
 */
export interface ValidationFailure {
  success: false;
  error: string;
  details: ValidationErrorResponse['details'];
  response: NextResponse;
}

/**
 * Generic validation result type
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================
// ERROR FORMATTING
// ============================================

/**
 * Format Zod errors into consistent error response format
 *
 * @param error - Zod validation error
 * @returns Formatted error details
 */
export function formatZodError(error: ZodError): ValidationErrorResponse['details'] {
  return error.errors.map((err) => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    value: err.path.length > 0 ? undefined : err.code,
  }));
}

/**
 * Create standardized validation error response
 *
 * @param message - High-level error message
 * @param details - Detailed validation errors
 * @returns NextResponse with error payload
 */
export function createValidationErrorResponse(
  message: string,
  details: ValidationErrorResponse['details']
): NextResponse {
  const errorResponse: ValidationErrorResponse = {
    error: message,
    code: 'VALIDATION_ERROR',
    details,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(errorResponse, {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// ============================================
// VALIDATION MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Validate request body against Zod schema
 *
 * Use in API routes for POST/PUT/PATCH requests
 *
 * @param req - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 *
 * @example
 * ```typescript
 * const CreateContactSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   workspace_id: z.string().uuid()
 * });
 *
 * export async function POST(req: NextRequest) {
 *   const validation = await validateBody(req, CreateContactSchema);
 *
 *   if (!validation.success) {
 *     return validation.response; // 400 error with details
 *   }
 *
 *   const { name, email, workspace_id } = validation.data;
 *   // ... proceed with validated data
 * }
 * ```
 */
export async function validateBody<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    // Parse JSON body
    let body: unknown;

    try {
      body = await req.json();
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid JSON in request body',
        details: [
          {
            field: 'body',
            message: 'Request body must be valid JSON',
          },
        ],
        response: createValidationErrorResponse('Invalid JSON in request body', [
          {
            field: 'body',
            message: 'Request body must be valid JSON',
          },
        ]),
      };
    }

    // Validate against schema
    const result = schema.safeParse(body);

    if (!result.success) {
      const details = formatZodError(result.error);
      return {
        success: false,
        error: 'Request body validation failed',
        details,
        response: createValidationErrorResponse('Request body validation failed', details),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    // Unexpected error during validation
    return {
      success: false,
      error: 'Internal validation error',
      details: [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      response: createValidationErrorResponse('Internal validation error', [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ]),
    };
  }
}

/**
 * Validate URL query parameters against Zod schema
 *
 * Use in API routes for GET requests with query parameters
 *
 * @param req - Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 *
 * @example
 * ```typescript
 * const GetContactsQuerySchema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   limit: z.coerce.number().int().min(1).max(100).default(20),
 *   status: z.enum(['new', 'contacted', 'qualified']).optional(),
 *   workspace_id: z.string().uuid()
 * });
 *
 * export async function GET(req: NextRequest) {
 *   const validation = validateQuery(req, GetContactsQuerySchema);
 *
 *   if (!validation.success) {
 *     return validation.response; // 400 error with details
 *   }
 *
 *   const { page, limit, status, workspace_id } = validation.data;
 *   // ... proceed with validated query params
 * }
 * ```
 */
export function validateQuery<T extends ZodSchema>(
  req: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> {
  try {
    // Extract query parameters from URL
    const searchParams = req.nextUrl.searchParams;

    // Convert URLSearchParams to plain object
    const queryObject: Record<string, string | string[]> = {};

    searchParams.forEach((value, key) => {
      const existing = queryObject[key];
      if (existing !== undefined) {
        // Handle multiple values for same key (e.g., ?tag=a&tag=b)
        queryObject[key] = Array.isArray(existing) ? [...existing, value] : [String(existing), value];
      } else {
        queryObject[key] = value;
      }
    });

    // Validate against schema
    const result = schema.safeParse(queryObject);

    if (!result.success) {
      const details = formatZodError(result.error);
      return {
        success: false,
        error: 'Query parameter validation failed',
        details,
        response: createValidationErrorResponse('Query parameter validation failed', details),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal validation error',
      details: [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      response: createValidationErrorResponse('Internal validation error', [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ]),
    };
  }
}

/**
 * Validate URL path parameters against Zod schema
 *
 * Use in API routes with dynamic segments like /api/contacts/[id]
 *
 * @param params - Route params object from Next.js
 * @param schema - Zod schema for validation
 * @returns Validation result with typed data or error response
 *
 * @example
 * ```typescript
 * const ContactIdParamSchema = z.object({
 *   id: z.string().uuid()
 * });
 *
 * export async function GET(
 *   req: NextRequest,
 *   { params }: { params: { id: string } }
 * ) {
 *   const validation = await validateParams(params, ContactIdParamSchema);
 *
 *   if (!validation.success) {
 *     return validation.response; // 400 error with details
 *   }
 *
 *   const { id } = validation.data;
 *   // ... proceed with validated param
 * }
 * ```
 */
export async function validateParams<T extends ZodSchema>(
  params: unknown,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    // Await params if it's a promise (Next.js 15+ behavior)
    const resolvedParams = params instanceof Promise ? await params : params;

    // Validate against schema
    const result = schema.safeParse(resolvedParams);

    if (!result.success) {
      const details = formatZodError(result.error);
      return {
        success: false,
        error: 'URL parameter validation failed',
        details,
        response: createValidationErrorResponse('URL parameter validation failed', details),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Internal validation error',
      details: [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      response: createValidationErrorResponse('Internal validation error', [
        {
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ]),
    };
  }
}

// ============================================
// WORKSPACE ISOLATION HELPERS
// ============================================

/**
 * Extract and validate workspace_id from request
 *
 * Checks query parameters and request body for workspace_id
 * Ensures proper workspace isolation
 *
 * @param req - Next.js request object
 * @returns Validation result with workspace_id or error response
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const validation = await validateWorkspaceId(req);
 *
 *   if (!validation.success) {
 *     return validation.response;
 *   }
 *
 *   const workspaceId = validation.data;
 *   // ... proceed with workspace-scoped operations
 * }
 * ```
 */
export async function validateWorkspaceId(
  req: NextRequest
): Promise<ValidationResult<string>> {
  // Try query parameter first
  const workspaceId = req.nextUrl.searchParams.get('workspace_id') ||
                      req.nextUrl.searchParams.get('workspaceId');

  if (workspaceId) {
    const uuidSchema = z.string().uuid();
    const result = uuidSchema.safeParse(workspaceId);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: 'Invalid workspace_id in query parameters',
      details: [
        {
          field: 'workspace_id',
          message: 'Must be a valid UUID',
          value: workspaceId,
        },
      ],
      response: createValidationErrorResponse('Invalid workspace_id in query parameters', [
        {
          field: 'workspace_id',
          message: 'Must be a valid UUID',
          value: workspaceId,
        },
      ]),
    };
  }

  // Try request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const body = await req.json();

      if (body && typeof body === 'object') {
        const bodyWorkspaceId = (body as any).workspace_id || (body as any).workspaceId;

        if (bodyWorkspaceId) {
          const uuidSchema = z.string().uuid();
          const result = uuidSchema.safeParse(bodyWorkspaceId);

          if (result.success) {
            return {
              success: true,
              data: result.data,
            };
          }

          return {
            success: false,
            error: 'Invalid workspace_id in request body',
            details: [
              {
                field: 'workspace_id',
                message: 'Must be a valid UUID',
                value: bodyWorkspaceId,
              },
            ],
            response: createValidationErrorResponse('Invalid workspace_id in request body', [
              {
                field: 'workspace_id',
                message: 'Must be a valid UUID',
                value: bodyWorkspaceId,
              },
            ]),
          };
        }
      }
    } catch {
      // Continue to "missing" error if JSON parsing fails
    }
  }

  // workspace_id not found
  return {
    success: false,
    error: 'Missing workspace_id',
    details: [
      {
        field: 'workspace_id',
        message: 'Required in query parameters or request body',
      },
    ],
    response: createValidationErrorResponse('Missing workspace_id', [
      {
        field: 'workspace_id',
        message: 'Required in query parameters or request body',
      },
    ]),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Combine multiple Zod schemas into one
 *
 * @param schemas - Array of Zod object schemas to merge
 * @returns Merged schema
 *
 * @example
 * ```typescript
 * const QuerySchema = combineSchemas(
 *   PaginationSchema,
 *   SearchSchema,
 *   z.object({ workspace_id: z.string().uuid() })
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

/**
 * Make all fields in a schema optional (for PATCH/update operations)
 *
 * @param schema - Original Zod object schema
 * @returns Schema with all fields optional
 *
 * @example
 * ```typescript
 * const CreateContactSchema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 *   phone: z.string().optional()
 * });
 *
 * const UpdateContactSchema = makeOptional(CreateContactSchema);
 * // All fields are now optional
 * ```
 */
export function makeOptional<T extends z.ZodObject<any>>(
  schema: T
): z.ZodObject<{ [K in keyof T['shape']]: z.ZodOptional<T['shape'][K]> }> {
  return schema.partial() as any;
}

/**
 * Add workspace_id requirement to any schema
 *
 * @param schema - Original Zod object schema
 * @returns Schema with workspace_id required
 *
 * @example
 * ```typescript
 * const ContactSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * const WorkspaceScopedContactSchema = addWorkspaceId(ContactSchema);
 * // Now requires workspace_id: string (UUID)
 * ```
 */
export function addWorkspaceId<T extends z.ZodObject<any>>(
  schema: T
): z.ZodObject<T['shape'] & { workspace_id: z.ZodString }> {
  return schema.extend({
    workspace_id: z.string().uuid({ message: 'workspace_id must be a valid UUID' }),
  });
}
