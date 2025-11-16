/**
 * Zod Validation Schemas
 * Centralized input validation for API endpoints
 */

import { z } from 'zod';

// ==================================================
// Common Schemas
// ==================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const EmailSchema = z.string().email('Invalid email format').max(255);

export const URLSchema = z.string().url('Invalid URL format').max(2048);

export const DateSchema = z.coerce.date();

export const PositiveIntSchema = z.number().int().positive();

export const NonNegativeIntSchema = z.number().int().nonnegative();

// ==================================================
// User & Profile Schemas
// ==================================================

export const CreateUserSchema = z.object({
  email: EmailSchema,
  full_name: z.string().min(1).max(200),
  auth_provider: z.enum(['google', 'github', 'email']),
});

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, dashes, and underscores').optional(),
  business_name: z.string().max(200).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url('Invalid website URL').optional(),
  timezone: z.string().optional(),
  notification_preferences: z.object({
    email_notifications: z.boolean().optional(),
    browser_notifications: z.boolean().optional(),
    campaign_updates: z.boolean().optional(),
  }).optional(),
});

// ==================================================
// Contact Schemas
// ==================================================

export const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: EmailSchema,
  company: z.string().max(200).optional(),
  job_title: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
  workspace_id: UUIDSchema,
});

export const UpdateContactSchema = ContactSchema.partial().extend({
  ai_score: z.number().int().min(0).max(100).optional(),
  buying_intent: z.enum(['high', 'medium', 'low', 'unknown']).optional(),
  decision_stage: z.enum(['awareness', 'consideration', 'decision', 'unknown']).optional(),
  role_type: z.enum(['decision_maker', 'influencer', 'end_user', 'unknown']).optional(),
  sentiment_score: z.number().int().min(-50).max(100).optional(),
  engagement_velocity: z.number().int().min(-2).max(2).optional(),
});

export const BulkContactImportSchema = z.object({
  contacts: z.array(ContactSchema),
  workspace_id: UUIDSchema,
  skip_duplicates: z.boolean().default(true),
});

// ==================================================
// Campaign Schemas
// ==================================================

export const CampaignSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  workspace_id: UUIDSchema,
  type: z.enum(['email', 'drip', 'newsletter']),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).default('draft'),
  scheduled_at: DateSchema.optional(),
});

export const EmailCampaignSchema = CampaignSchema.extend({
  type: z.literal('email'),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  sender_name: z.string().max(200).optional(),
  sender_email: EmailSchema.optional(),
  recipient_filter: z.object({
    tags: z.array(z.string()).optional(),
    min_ai_score: z.number().int().min(0).max(100).optional(),
    status: z.array(z.string()).optional(),
  }).optional(),
});

// ==================================================
// Agent Schemas
// ==================================================

export const ContactIntelligenceRequestSchema = z.object({
  action: z.enum(['analyze_contact', 'get_hot_leads', 'analyze_workspace']),
  contact_id: UUIDSchema.optional(),
  workspace_id: UUIDSchema,
  limit: z.number().int().min(1).max(100).default(10).optional(),
});

export const ContentGenerationRequestSchema = z.object({
  contact_id: UUIDSchema,
  content_type: z.enum(['followup', 'proposal', 'case_study']),
  workspace_id: UUIDSchema,
});

export const EmailProcessingRequestSchema = z.object({
  email_id: UUIDSchema,
  workspace_id: UUIDSchema,
  batch_process: z.boolean().default(false).optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});

// ==================================================
// Integration Schemas
// ==================================================

export const GmailOAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

export const GmailSendEmailSchema = z.object({
  to: EmailSchema,
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  workspace_id: UUIDSchema,
  contact_id: UUIDSchema.optional(),
});

// ==================================================
// Webhook Schemas
// ==================================================

export const StripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
  id: z.string(),
  created: z.number(),
});

// ==================================================
// Pagination Schema
// ==================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==================================================
// Search Schema
// ==================================================

export const SearchSchema = z.object({
  query: z.string().min(1).max(200),
  workspace_id: UUIDSchema,
  filters: z.object({
    type: z.enum(['contacts', 'campaigns', 'emails', 'all']).default('all'),
    date_from: DateSchema.optional(),
    date_to: DateSchema.optional(),
  }).optional(),
}).merge(PaginationSchema);

// ==================================================
// Workspace Schemas
// ==================================================

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  org_id: UUIDSchema,
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

// ==================================================
// Organization Schemas
// ==================================================

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  email: EmailSchema,
  domain: z.string().max(200).optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

// ==================================================
// Helper Functions
// ==================================================

/**
 * Validate request body and return typed data
 * Throws ZodError if validation fails
 */
export function validateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Validate request body and return either success or error
 * Use this for safer validation with error handling
 */
export function safeValidateRequest<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): {
  field: string;
  message: string;
}[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
