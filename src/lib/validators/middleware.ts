/**
 * Validation Middleware
 *
 * Helper functions for validating request data in API routes.
 * Provides type-safe validation with clear error messages.
 *
 * Pattern:
 * 1. Call validateRequestBody() or validateQueryParams() in API route
 * 2. Returns { success, data, errors }
 * 3. If validation fails, return error response
 * 4. Proceed with validated, typed data
 *
 * Benefits:
 * - Consistent validation across all routes
 * - Type-safe after validation
 * - Clear error messages
 * - Prevents invalid data from reaching database
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { formatValidationErrors } from './database-schemas';

/**
 * Validation result from middleware
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  statusCode?: number;
}

/**
 * Validate request JSON body against schema
 *
 * @example
 *   export async function POST(req: NextRequest) {
 *     const result = await validateRequestBody(req, ContactInsertSchema);
 *
 *     if (!result.success) {
 *       return errorResponse('Invalid contact data', 400, result.errors);
 *     }
 *
 *     // result.data is ContactInsert type
 *     const contact = await supabase.from('contacts').insert(result.data).single();
 *   }
 */
export async function validateRequestBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    // Parse request body
    const body = await req.json();

    // Validate against schema
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        errors: formatValidationErrors(result.error),
        statusCode: 400,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      errors: {
        body: error instanceof Error ? error.message : 'Invalid JSON body',
      },
      statusCode: 400,
    };
  }
}

/**
 * Validate query parameters against schema
 *
 * @example
 *   const QuerySchema = z.object({
 *     workspaceId: z.string().uuid(),
 *     limit: z.coerce.number().int().min(1).max(100).optional(),
 *   });
 *
 *   const result = await validateQueryParams(req, QuerySchema);
 *   if (!result.success) {
 *     return errorResponse('Invalid query', 400, result.errors);
 *   }
 */
export async function validateQueryParams<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    // Extract query parameters as object
    const params: Record<string, string | string[]> = {};
    req.nextUrl.searchParams.forEach((value, key) => {
      if (params[key]) {
        // Multiple values for same key - convert to array
        const existing = params[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing as string, value];
        }
      } else {
        params[key] = value;
      }
    });

    // Validate against schema
    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        errors: formatValidationErrors(result.error),
        statusCode: 400,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    return {
      success: false,
      errors: {
        query: error instanceof Error ? error.message : 'Invalid query parameters',
      },
      statusCode: 400,
    };
  }
}

/**
 * Validate request data from either body or query params
 *
 * Tries body first, falls back to query params.
 *
 * @example
 *   const result = await validateRequest(req, ContactInsertSchema);
 */
export async function validateRequest<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  // Try body first
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const bodyResult = await validateRequestBody(req, schema);
    if (bodyResult.success) {
      return bodyResult;
    }
  }

  // Fall back to query params
  return validateQueryParams(req, schema);
}

/**
 * Validate and extract specific fields from request
 *
 * @example
 *   const { workspaceId } = await validateRequired(req, {
 *     workspaceId: z.string().uuid(),
 *   });
 */
export async function validateRequired<T extends Record<string, z.ZodSchema>>(
  req: NextRequest,
  fields: T
): Promise<{ [K in keyof T]: z.infer<T[K]> }> {
  // Build schema from fields
  const schema = z.object(fields);

  // Try body first
  if (req.method !== 'GET') {
    try {
      const body = await req.json();
      const result = schema.safeParse(body);
      if (result.success) {
        return result.data;
      }
    } catch {
      // Continue to query params
    }
  }

  // Fall back to query params
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);
  if (!result.success) {
    throw new Error(
      `Missing required fields: ${Object.keys(fields).join(', ')}`
    );
  }

  return result.data;
}

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

/**
 * Pagination query parameters
 *
 * @example
 *   const result = await validateQueryParams(req, PaginationSchema);
 */
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Workspace scope validation
 *
 * Ensures workspaceId is provided in request
 *
 * @example
 *   const result = await validateRequest(req, WorkspaceScopeSchema);
 */
export const WorkspaceScopeSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace ID format'),
});

export type WorkspaceScope = z.infer<typeof WorkspaceScopeSchema>;

/**
 * Combined: Workspace scope + Pagination
 *
 * @example
 *   const result = await validateQueryParams(req, WorkspaceListSchema);
 */
export const WorkspaceListSchema = WorkspaceScopeSchema.merge(PaginationSchema);

export type WorkspaceList = z.infer<typeof WorkspaceListSchema>;

// ============================================================================
// VALIDATION PATTERN FOR API ROUTES
// ============================================================================

/**
 * RECOMMENDED PATTERN FOR API ROUTES:
 *
 * @example
 *   import { validateRequestBody, type ValidationResult } from '@/lib/validators/middleware';
 *   import { ContactInsertSchema, type ContactInsert } from '@/lib/validators';
 *   import { workspaceValidationService } from '@/lib/services';
 *   import { errorResponse, successResponse } from '@/lib/api-helpers';
 *
 *   export async function POST(req: NextRequest) {
 *     try {
 *       // Step 1: Validate authentication & workspace
 *       const user = await workspaceValidationService.validateUserAuth(req);
 *       const workspaceId = req.nextUrl.searchParams.get('workspaceId');
 *       if (!workspaceId) {
 *         return errorResponse('workspaceId required', 400);
 *       }
 *
 *       // Step 2: Validate request data
 *       const validation = await validateRequestBody(req, ContactInsertSchema);
 *       if (!validation.success) {
 *         return errorResponse('Invalid contact data', 400, validation.errors);
 *       }
 *
 *       // Step 3: Proceed with validated data (type-safe)
 *       const { data: contact } = await supabase
 *         .from('contacts')
 *         .insert([{ ...validation.data, workspace_id: workspaceId }])
 *         .select()
 *         .single();
 *
 *       return successResponse(contact, null, 'Contact created', 201);
 *     } catch (error) {
 *       console.error('Error creating contact:', error);
 *       return errorResponse('Failed to create contact', 500);
 *     }
 *   }
 */
