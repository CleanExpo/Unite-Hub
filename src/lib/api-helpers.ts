/**
 * API Helper Utilities
 *
 * Comprehensive utilities for Next.js API routes providing:
 * - Standardized response formatting
 * - Input validation
 * - Error handling
 * - Common patterns for database operations
 *
 * Usage:
 * ```typescript
 * import { successResponse, errorResponse, validateEmail } from '@/lib/api-helpers';
 *
 * export async function POST(req: NextRequest) {
 *   const { email } = await req.json();
 *   if (!validateEmail(email)) {
 *     return validationError({ email: "Invalid email format" });
 *   }
 *   return successResponse({ message: "Success" });
 * }
 * ```
 */

import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Authenticates a user from an API request using server-side methods only.
 *
 * IMPORTANT: This replaces the old pattern that used supabaseBrowser on the server.
 * - If Authorization header present: Uses getSupabaseServerWithAuth(token)
 * - If no header: Uses getSupabaseServer() to read session from cookies
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const { user, supabase, error } = await authenticateRequest(req);
 *   if (error) return error;
 *   // user is authenticated, supabase client has their context
 * }
 */
export async function authenticateRequest(req: NextRequest): Promise<{
  user: { id: string; email?: string } | null;
  supabase: any;
  error: NextResponse | null;
}> {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const { getSupabaseServer, getSupabaseServerWithAuth } = await import("@/lib/supabase");

    // Use token-based auth or cookie-based session
    const supabase = token
      ? getSupabaseServerWithAuth(token)
      : await getSupabaseServer();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return {
        user: null,
        supabase,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return {
      user: data.user,
      supabase,
      error: null,
    };
  } catch (err) {
    console.error("[authenticateRequest] Error:", err);
    return {
      user: null,
      supabase: null,
      error: NextResponse.json({ error: "Authentication failed" }, { status: 500 }),
    };
  }
}

/**
 * Simple error boundary wrapper for API handlers.
 * Ensures exceptions are converted to 500 JSON responses.
 */
export function withErrorBoundary<T>(
  handler: () => Promise<NextResponse<T>> | NextResponse<T>
): Promise<NextResponse<T>> {
  return Promise.resolve()
    .then(() => handler())
    .catch((err: any) => {
      console.error('[API] Unhandled error', err);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: err?.message || 'Unexpected error',
          },
        },
        { status: 500 }
      ) as unknown as NextResponse<T>;
    });
}

/**
 * Gets the user ID from an API request (convenience wrapper)
 *
 * @example
 * const { userId, error } = await getUserId(req);
 * if (error) return error;
 */
export async function getUserId(req: NextRequest): Promise<{
  userId: string | null;
  error: NextResponse | null;
}> {
  const { user, error } = await authenticateRequest(req);
  return {
    userId: user?.id ?? null,
    error,
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string | Record<string, string>;
  code?: string;
}

/**
 * Returns a standardized success response
 *
 * @example
 * successResponse({ user: { id: 1, name: "John" } })
 * successResponse({ users: [...] }, { count: 10, total: 100 })
 * successResponse(null, null, "Operation completed successfully", 201)
 */
export function successResponse<T = any>(
  data?: T,
  meta?: SuccessResponse["meta"],
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Returns a standardized error response
 *
 * @example
 * errorResponse("User not found", 404)
 * errorResponse("Invalid data", 400, "Email is required")
 * errorResponse("Server error", 500, { field: "error message" })
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: string | Record<string, string>,
  code?: string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Returns a validation error response (400)
 *
 * @example
 * validationError({ email: "Invalid email", password: "Too short" })
 * validationError("Missing required fields")
 */
export function validationError(
  errors: Record<string, string> | string
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: errors,
      code: "VALIDATION_ERROR",
    },
    { status: 400 }
  );
}

/**
 * Returns an unauthorized error response (401)
 */
export function unauthorizedError(
  message: string = "Unauthorized"
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  );
}

/**
 * Returns a forbidden error response (403)
 */
export function forbiddenError(
  message: string = "Access denied"
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "FORBIDDEN",
    },
    { status: 403 }
  );
}

/**
 * Returns a not found error response (404)
 */
export function notFoundError(
  resource: string = "Resource"
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: `${resource} not found`,
      code: "NOT_FOUND",
    },
    { status: 404 }
  );
}

/**
 * Returns a conflict error response (409)
 */
export function conflictError(
  message: string = "Resource already exists"
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "CONFLICT",
    },
    { status: 409 }
  );
}

/**
 * Returns a rate limit error response (429)
 */
export function rateLimitError(
  retryAfter?: number
): NextResponse<ErrorResponse> {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers["Retry-After"] = retryAfter.toString();
  }

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      ...(retryAfter && { details: `Retry after ${retryAfter} seconds` }),
    },
    { status: 429, headers }
  );
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates email format using RFC 5322 regex
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
return false;
}

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates UUID format (v4)
 */
export function validateUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== "string") {
return false;
}

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates phone number (basic check - international formats)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
return false;
}

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Check if it's a valid phone number (10-15 digits with optional + prefix)
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validates URL format
 */
export function validateURL(url: string): boolean {
  if (!url || typeof url !== "string") {
return false;
}

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates required fields in an object
 *
 * @example
 * const errors = validateRequired(body, ["name", "email", "password"]);
 * if (errors) return validationError(errors);
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = data[field];

    if (value === undefined || value === null) {
      errors[field as string] = `${String(field)} is required`;
    } else if (typeof value === "string" && value.trim() === "") {
      errors[field as string] = `${String(field)} cannot be empty`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Validates field length constraints
 *
 * @example
 * const errors = validateLength(body, {
 *   name: { min: 2, max: 50 },
 *   password: { min: 8, max: 128 }
 * });
 */
export function validateLength<T extends Record<string, any>>(
  data: T,
  constraints: Record<keyof T, { min?: number; max?: number }>
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  for (const [field, { min, max }] of Object.entries(constraints)) {
    const value = data[field];

    if (value === undefined || value === null) {
continue;
}

    if (typeof value !== "string") {
      errors[field] = `${field} must be a string`;
      continue;
    }

    const length = value.trim().length;

    if (min !== undefined && length < min) {
      errors[field] = `${field} must be at least ${min} characters`;
    }

    if (max !== undefined && length > max) {
      errors[field] = `${field} must be at most ${max} characters`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Validates enum values
 *
 * @example
 * const errors = validateEnum(body, {
 *   status: ["active", "inactive", "pending"],
 *   role: ["admin", "user"]
 * });
 */
export function validateEnum<T extends Record<string, any>>(
  data: T,
  enums: Record<keyof T, readonly string[]>
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  for (const [field, validValues] of Object.entries(enums)) {
    const value = data[field];

    if (value === undefined || value === null) {
continue;
}

    if (!validValues.includes(value as string)) {
      errors[field] = `${field} must be one of: ${validValues.join(", ")}`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Combines multiple validation results
 *
 * @example
 * const errors = combineValidationErrors(
 *   validateRequired(body, ["name", "email"]),
 *   validateLength(body, { name: { min: 2, max: 50 } }),
 *   customValidation(body)
 * );
 * if (errors) return validationError(errors);
 */
export function combineValidationErrors(
  ...errorObjects: (Record<string, string> | null)[]
): Record<string, string> | null {
  const combined: Record<string, string> = {};

  for (const errors of errorObjects) {
    if (errors) {
      Object.assign(combined, errors);
    }
  }

  return Object.keys(combined).length > 0 ? combined : null;
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResult {
  limit: number;
  offset: number;
  page: number;
  pageSize: number;
}

/**
 * Parses and validates pagination parameters
 *
 * @example
 * const { limit, offset, page, pageSize } = parsePagination(req.nextUrl.searchParams);
 * const { data } = await supabase.from("contacts").select("*").range(offset, offset + limit - 1);
 */
export function parsePagination(
  params: URLSearchParams | PaginationParams,
  defaults: { pageSize?: number; maxPageSize?: number } = {}
): PaginationResult {
  const defaultPageSize = defaults.pageSize || 10;
  const maxPageSize = defaults.maxPageSize || 100;

  let page: number;
  let pageSize: number;
  let limit: number;
  let offset: number;

  if (params instanceof URLSearchParams) {
    page = parseInt(params.get("page") || "1");
    pageSize = parseInt(params.get("pageSize") || params.get("limit") || String(defaultPageSize));
    limit = pageSize;
    offset = parseInt(params.get("offset") || String((page - 1) * pageSize));
  } else {
    page = params.page || 1;
    pageSize = params.pageSize || params.limit || defaultPageSize;
    limit = pageSize;
    offset = params.offset !== undefined ? params.offset : (page - 1) * pageSize;
  }

  // Validate and constrain values
  page = Math.max(1, page);
  pageSize = Math.max(1, Math.min(pageSize, maxPageSize));
  limit = pageSize;
  offset = Math.max(0, offset);

  return { limit, offset, page, pageSize };
}

/**
 * Creates pagination metadata for responses
 *
 * @example
 * const meta = createPaginationMeta(contacts.length, totalCount, page, pageSize);
 * return successResponse(contacts, meta);
 */
export function createPaginationMeta(
  count: number,
  total: number,
  page: number,
  pageSize: number
): SuccessResponse["meta"] {
  const totalPages = Math.ceil(total / pageSize);

  return {
    count,
    total,
    page,
    pageSize,
  };
}

// ============================================================================
// DATABASE QUERY HELPERS
// ============================================================================

/**
 * Builds Supabase query filters from request parameters
 *
 * @example
 * const filters = parseQueryFilters(req.nextUrl.searchParams, {
 *   status: "eq",
 *   email: "ilike",
 *   created_at: "gte"
 * });
 */
export function parseQueryFilters(
  params: URLSearchParams,
  filterConfig: Record<string, "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in">
): Record<string, { operator: string; value: any }> {
  const filters: Record<string, { operator: string; value: any }> = {};

  for (const [field, operator] of Object.entries(filterConfig)) {
    const value = params.get(field);

    if (value !== null) {
      // Handle 'in' operator specially (comma-separated values)
      if (operator === "in") {
        filters[field] = {
          operator,
          value: value.split(",").map(v => v.trim()),
        };
      } else {
        filters[field] = { operator, value };
      }
    }
  }

  return filters;
}

/**
 * Applies filters to a Supabase query
 *
 * @example
 * let query = supabase.from("contacts").select("*");
 * query = applyQueryFilters(query, filters);
 */
export function applyQueryFilters<T>(
  query: any,
  filters: Record<string, { operator: string; value: any }>
): any {
  for (const [field, { operator, value }] of Object.entries(filters)) {
    switch (operator) {
      case "eq":
        query = query.eq(field, value);
        break;
      case "neq":
        query = query.neq(field, value);
        break;
      case "gt":
        query = query.gt(field, value);
        break;
      case "gte":
        query = query.gte(field, value);
        break;
      case "lt":
        query = query.lt(field, value);
        break;
      case "lte":
        query = query.lte(field, value);
        break;
      case "like":
        query = query.like(field, value);
        break;
      case "ilike":
        query = query.ilike(field, `%${value}%`);
        break;
      case "in":
        query = query.in(field, value);
        break;
    }
  }

  return query;
}

// ============================================================================
// SORTING HELPERS
// ============================================================================

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Parses sorting parameters from request
 *
 * @example
 * const { sortBy, sortOrder } = parseSorting(req.nextUrl.searchParams, {
 *   allowedFields: ["name", "email", "created_at"],
 *   defaultField: "created_at",
 *   defaultOrder: "desc"
 * });
 */
export function parseSorting(
  params: URLSearchParams,
  config: {
    allowedFields: string[];
    defaultField?: string;
    defaultOrder?: "asc" | "desc";
  }
): { sortBy: string; sortOrder: "asc" | "desc" } {
  const sortBy = params.get("sortBy") || params.get("sort") || config.defaultField || config.allowedFields[0];
  const sortOrder = (params.get("sortOrder") || params.get("order") || config.defaultOrder || "asc") as "asc" | "desc";

  // Validate sortBy is in allowed fields
  const validSortBy = config.allowedFields.includes(sortBy) ? sortBy : config.allowedFields[0];

  // Validate sortOrder is asc or desc
  const validSortOrder = sortOrder === "desc" ? "desc" : "asc";

  return {
    sortBy: validSortBy,
    sortOrder: validSortOrder,
  };
}

// ============================================================================
// ERROR FORMATTING HELPERS
// ============================================================================

/**
 * Formats Supabase errors for API responses
 */
export function formatSupabaseError(error: any): { message: string; details?: string } {
  if (!error) {
return { message: "Unknown error" };
}

  // PostgreSQL error codes
  const pgErrorMessages: Record<string, string> = {
    "23505": "Resource already exists (duplicate key)",
    "23503": "Related resource not found (foreign key violation)",
    "23514": "Data validation failed (check constraint)",
    "42501": "Permission denied",
  };

  if (error.code && pgErrorMessages[error.code]) {
    return {
      message: pgErrorMessages[error.code],
      details: error.message,
    };
  }

  return {
    message: error.message || "Database operation failed",
    details: error.hint || error.details,
  };
}

/**
 * Safely handles async operations with error formatting
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   return safeAsync(async () => {
 *     const data = await someOperation();
 *     return successResponse(data);
 *   });
 * }
 */
export async function safeAsync<T>(
  operation: () => Promise<NextResponse<T>>,
  onError?: (error: any) => NextResponse<T>
): Promise<NextResponse<T>> {
  try {
    return await operation();
  } catch (error: any) {
    console.error("[safeAsync] Error:", error);

    if (onError) {
      return onError(error);
    }

    // Default error handling
    if (error.message?.includes("Unauthorized")) {
      return unauthorizedError() as NextResponse<T>;
    }
    if (error.message?.includes("Forbidden")) {
      return forbiddenError() as NextResponse<T>;
    }
    if (error.message?.includes("not found")) {
      return notFoundError() as NextResponse<T>;
    }

    return errorResponse(
      error.message || "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? error.stack : undefined
    ) as NextResponse<T>;
  }
}

// ============================================================================
// REQUEST BODY HELPERS
// ============================================================================

/**
 * Safely parses JSON request body with error handling
 *
 * @example
 * const { body, error } = await parseRequestBody(req);
 * if (error) return error;
 */
export async function parseRequestBody<T = any>(
  req: Request
): Promise<{ body: T | null; error: NextResponse | null }> {
  try {
    const body = await req.json();
    return { body, error: null };
  } catch (error) {
    return {
      body: null,
      error: validationError("Invalid JSON in request body"),
    };
  }
}

/**
 * Extracts and validates specific fields from request body
 *
 * @example
 * const { fields, error } = await extractFields(req, ["name", "email"]);
 * if (error) return error;
 */
export async function extractFields<T extends string>(
  req: Request,
  requiredFields: T[]
): Promise<{ fields: Record<T, any> | null; error: NextResponse | null }> {
  const { body, error } = await parseRequestBody(req);

  if (error) {
return { fields: null, error };
}

  const validationErrors = validateRequired(body, requiredFields);

  if (validationErrors) {
    return { fields: null, error: validationError(validationErrors) };
  }

  return { fields: body, error: null };
}
