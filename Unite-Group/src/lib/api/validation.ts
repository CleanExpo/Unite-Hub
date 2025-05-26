/**
 * API Response Validation
 * Provides utilities for validating API responses using Zod schemas
 */

import { z } from 'zod';

/**
 * Validate a response against a Zod schema
 * @param data The data to validate
 * @param schema The Zod schema to validate against
 * @returns The validated and typed data
 * @throws Error if validation fails
 */
export function validateResponse<T>(data: unknown, schema: z.ZodType<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format the error message
      const errorMessage = formatZodError(error);
      
      // Throw a new error with more context
      throw new ValidationError(
        `API response validation failed: ${errorMessage}`,
        error.errors,
        data
      );
    }
    // Re-throw unknown errors
    throw error;
  }
}

/**
 * Format a Zod error into a readable string
 * @param error The Zod error to format
 * @returns A formatted error message
 */
function formatZodError(error: z.ZodError): string {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return `${path ? `${path}: ` : ''}${err.message}`;
  }).join('; ');
}

/**
 * Validation Error class
 */
export class ValidationError extends Error {
  public errors: z.ZodIssue[];
  public data: unknown;

  constructor(message: string, errors: z.ZodIssue[], data: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.data = data;
  }
}

/**
 * Common response schemas for API responses
 */
export const CommonSchemas = {
  /**
   * Empty response schema
   */
  empty: z.object({}),
  
  /**
   * Generic success response schema
   */
  success: z.object({
    success: z.boolean(),
    message: z.string().optional(),
  }),
  
  /**
   * Generic error response schema
   */
  error: z.object({
    error: z.string(),
    message: z.string().optional(),
    code: z.string().or(z.number()).optional(),
  }),
  
  /**
   * Pagination schema for paginated responses
   */
  pagination: z.object({
    page: z.number(),
    perPage: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  
  /**
   * Generic paginated response wrapper
   */
  paginatedResponse: <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
    data: z.array(itemSchema),
    pagination: CommonSchemas.pagination,
  }),
  
  /**
   * Array wrapper for array responses
   */
  array: <T extends z.ZodTypeAny>(itemSchema: T) => z.array(itemSchema),
  
  /**
   * Data wrapper for data responses
   */
  data: <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
    data: dataSchema,
  }),
};

/**
 * Create a union schema that allows for either a success or error response
 * @param successSchema The schema for successful responses
 * @returns A schema that allows for either a success or error response
 */
export function createResponseSchema<T extends z.ZodTypeAny>(successSchema: T) {
  return z.union([successSchema, CommonSchemas.error]);
}

/**
 * Create a schema for a paginated response
 * @param itemSchema The schema for individual items in the response
 * @returns A schema for a paginated response
 */
export function createPaginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return CommonSchemas.paginatedResponse(itemSchema);
}
