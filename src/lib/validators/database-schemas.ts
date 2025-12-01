/**
 * Database Validation Schemas
 *
 * Zod schemas that validate data against the database type definitions.
 * These schemas are automatically derived from the Database types (src/types/database.generated.ts)
 * and ensure that invalid data never reaches the database.
 *
 * Pattern:
 * 1. Create schema matching Database type
 * 2. Use .safeParse() in API routes
 * 3. Return validation errors if invalid
 * 4. Proceed with validated data
 *
 * Benefits:
 * - Type-safe at runtime (not just compile-time)
 * - Invalid data rejected at API boundary
 * - Consistent error format
 * - Self-documenting validation rules
 */

import { z } from 'zod';

// ============================================================================
// SHARED VALIDATION PATTERNS
// ============================================================================

/**
 * UUID validation - matches Supabase default
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation - standard format
 */
export const EmailSchema = z.string().email('Invalid email format').toLowerCase().trim();

/**
 * URL validation
 */
export const URLSchema = z.string().url('Invalid URL format');

/**
 * Non-empty string
 */
export const NonEmptyString = z.string().min(1, 'Cannot be empty').trim();

/**
 * ISO 8601 datetime string
 */
export const DateTimeSchema = z.string().datetime('Invalid datetime format');

/**
 * AI score: 0-100 integer
 */
export const AIScorerSchema = z.number().int().min(0).max(100).describe('AI score 0-100');

/**
 * Contact status enum
 */
export const ContactStatusSchema = z.enum(['active', 'inactive', 'pending', 'archived'], {
  errorMap: () => ({ message: 'Invalid contact status' }),
});

/**
 * User role enum
 */
export const UserRoleSchema = z.enum(['FOUNDER', 'STAFF', 'CLIENT', 'ADMIN'], {
  errorMap: () => ({ message: 'Invalid user role' }),
});

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

/**
 * Contact Row - full contact record from database
 */
export const ContactRowSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  email: EmailSchema,
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  ai_score: AIScorerSchema,
  status: ContactStatusSchema,
  tags: z.array(z.string()).optional(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type ContactRow = z.infer<typeof ContactRowSchema>;

/**
 * Contact Insert - data for creating new contact
 */
export const ContactInsertSchema = z.object({
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  email: EmailSchema,
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  ai_score: AIScorerSchema.optional().default(0),
  status: ContactStatusSchema.optional().default('active'),
  tags: z.array(z.string()).optional(),
});

export type ContactInsert = z.infer<typeof ContactInsertSchema>;

/**
 * Contact Update - partial contact data for updates
 */
export const ContactUpdateSchema = z.object({
  name: NonEmptyString.optional(),
  email: EmailSchema.optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  job_title: z.string().optional(),
  ai_score: AIScorerSchema.optional(),
  status: ContactStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
});

export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;

// ============================================================================
// WORKSPACE SCHEMAS
// ============================================================================

/**
 * Workspace Row - workspace record
 */
export const WorkspaceRowSchema = z.object({
  id: UUIDSchema,
  org_id: UUIDSchema,
  name: NonEmptyString,
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type WorkspaceRow = z.infer<typeof WorkspaceRowSchema>;

/**
 * Workspace Insert - creating new workspace
 */
export const WorkspaceInsertSchema = z.object({
  org_id: UUIDSchema,
  name: NonEmptyString,
});

export type WorkspaceInsert = z.infer<typeof WorkspaceInsertSchema>;

/**
 * Workspace Update - updating workspace
 */
export const WorkspaceUpdateSchema = z.object({
  name: NonEmptyString.optional(),
});

export type WorkspaceUpdate = z.infer<typeof WorkspaceUpdateSchema>;

// ============================================================================
// ORGANIZATION SCHEMAS
// ============================================================================

/**
 * Organization Row
 */
export const OrganizationRowSchema = z.object({
  id: UUIDSchema,
  name: NonEmptyString,
  stripe_customer_id: z.string().optional(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type OrganizationRow = z.infer<typeof OrganizationRowSchema>;

/**
 * Organization Insert
 */
export const OrganizationInsertSchema = z.object({
  name: NonEmptyString,
  stripe_customer_id: z.string().optional(),
});

export type OrganizationInsert = z.infer<typeof OrganizationInsertSchema>;

// ============================================================================
// USER PROFILE SCHEMAS
// ============================================================================

/**
 * User Profile Row
 */
export const UserProfileRowSchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  email: EmailSchema,
  name: z.string().optional(),
  avatar_url: URLSchema.optional(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type UserProfileRow = z.infer<typeof UserProfileRowSchema>;

/**
 * User Profile Insert
 */
export const UserProfileInsertSchema = z.object({
  user_id: UUIDSchema,
  email: EmailSchema,
  name: z.string().optional(),
  avatar_url: URLSchema.optional(),
});

export type UserProfileInsert = z.infer<typeof UserProfileInsertSchema>;

// ============================================================================
// EMAIL SCHEMAS
// ============================================================================

/**
 * Email Row - email message record
 */
export const EmailRowSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  contact_id: UUIDSchema,
  from: EmailSchema,
  to: EmailSchema,
  subject: NonEmptyString,
  body: z.string(),
  html: z.string().optional(),
  sent_at: DateTimeSchema.optional(),
  opened_at: DateTimeSchema.optional(),
  created_at: DateTimeSchema,
});

export type EmailRow = z.infer<typeof EmailRowSchema>;

/**
 * Email Insert - sending new email
 */
export const EmailInsertSchema = z.object({
  workspace_id: UUIDSchema,
  contact_id: UUIDSchema,
  from: EmailSchema,
  to: EmailSchema,
  subject: NonEmptyString,
  body: z.string().min(1, 'Email body required'),
  html: z.string().optional(),
});

export type EmailInsert = z.infer<typeof EmailInsertSchema>;

// ============================================================================
// CAMPAIGN SCHEMAS
// ============================================================================

/**
 * Campaign Row
 */
export const CampaignRowSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export type CampaignRow = z.infer<typeof CampaignRowSchema>;

/**
 * Campaign Insert
 */
export const CampaignInsertSchema = z.object({
  workspace_id: UUIDSchema,
  name: NonEmptyString,
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional().default('draft'),
});

export type CampaignInsert = z.infer<typeof CampaignInsertSchema>;

/**
 * Campaign Update
 */
export const CampaignUpdateSchema = z.object({
  name: NonEmptyString.optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
});

export type CampaignUpdate = z.infer<typeof CampaignUpdateSchema>;

// ============================================================================
// VALIDATION HELPER FUNCTION
// ============================================================================

/**
 * Format Zod validation errors into user-friendly message
 *
 * @example
 *   const result = ContactRowSchema.safeParse(data);
 *   if (!result.success) {
 *     const errors = formatValidationErrors(result.error);
 *     return errorResponse('Validation failed', 400, errors);
 *   }
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    const message = err.message;
    formatted[path] = message;
  });

  return formatted;
}

/**
 * Safe parse with formatted errors
 *
 * @example
 *   const { success, data, errors } = validateData(ContactInsertSchema, req.body);
 *   if (!success) {
 *     return errorResponse('Validation failed', 400, errors);
 *   }
 *   // data is now typed and validated
 */
export function validateData<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): {
  success: boolean;
  data?: z.infer<T>;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: formatValidationErrors(result.error),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

// ============================================================================
// VALIDATION EXPORT SUMMARY
// ============================================================================

/**
 * Export all schemas and types for use in API routes
 *
 * @example
 *   import {
 *     ContactRowSchema,
 *     ContactInsertSchema,
 *     validateData,
 *     type ContactRow,
 *   } from '@/lib/validators/database-schemas';
 *
 *   export async function POST(req: NextRequest) {
 *     const { success, data, errors } = validateData(
 *       ContactInsertSchema,
 *       req.body
 *     );
 *
 *     if (!success) {
 *       return errorResponse('Invalid contact', 400, errors);
 *     }
 *
 *     // data is ContactInsert type now
 *     const contact = await supabase.from('contacts').insert(data).single();
 *   }
 */
