/**
 * Input Validation Middleware - Phase 2 API Routes
 * Validates and sanitizes API request inputs
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * Validate request body against Zod schema
 */
export async function validateBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { data: null, error: errorMessages };
    }
    return { data: null, error: 'Invalid request body' };
  }
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T | null; error: string | null } {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = Object.fromEntries(searchParams.entries());
    const validated = schema.parse(query);
    return { data: validated, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { data: null, error: errorMessages };
    }
    return { data: null, error: 'Invalid query parameters' };
  }
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  pagination: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  }),
};

/**
 * Staff task validation schemas
 */
export const taskSchemas = {
  create: z.object({
    project_id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    due_date: z.string().optional(),
  }),
  update: z.object({
    id: z.string().uuid(),
    status: z.enum(['pending', 'in_progress', 'completed']).optional(),
    proof: z.any().optional(),
  }),
};

/**
 * Client idea validation schemas
 */
export const ideaSchemas = {
  create: z.object({
    content: z.string().min(10).max(5000),
    type: z.enum(['voice', 'text', 'video', 'uploaded']),
  }),
};

/**
 * Digital vault validation schemas
 */
export const vaultSchemas = {
  create: z.object({
    key_name: z.string().min(1).max(100),
    value: z.string().min(1).max(1000),
    category: z.string().optional(),
  }),
};
