/**
 * Validation Schemas with Zod
 * Phase 2 Step 7 - Interactive Features
 *
 * Centralized validation schemas for forms
 */

import { z } from 'zod';

// Utility schemas
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();

// Helper function to format Zod errors
export function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => e.message).join(', ');
}

// Agent request schemas
export const ContactIntelligenceRequestSchema = z.object({
  action: z.enum(['analyze_contact', 'analyze_workspace', 'get_hot_leads']),
  contact_id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  limit: z.number().int().positive().optional(),
});// Agent request schemas (legacy)
export const LegacyContactIntelligenceRequestSchema = z.object({
  contactId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
});

export const ContentGenerationRequestSchema = z.object({
  contactId: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  type: z.string().optional(),
});

// Gmail schemas
export const GmailOAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export const GmailSendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  threadId: z.string().optional(),
});

// Profile schemas
export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
});

// Client Idea Validation
export const clientIdeaSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z.string().optional(),
  media_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ClientIdeaFormData = z.infer<typeof clientIdeaSchema>;

// Vault Entry Validation
export const vaultEntrySchema = z.object({
  service_name: z
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must be less than 100 characters'),
  username: z.string().max(100, 'Username must be less than 100 characters').optional().or(z.literal('')),
  encrypted_password: z
    .string()
    .min(3, 'Password must be at least 3 characters')
    .max(500, 'Password is too long'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional().or(z.literal('')),
});

export type VaultEntryFormData = z.infer<typeof vaultEntrySchema>;

// Staff Task Validation
export const staffTaskSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.string().optional(),
  assigned_to: z.string().optional(),
});

export type StaffTaskFormData = z.infer<typeof staffTaskSchema>;

// Contact Form Validation (for future use)
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Must be a valid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// ============================================
// API ROUTE VALIDATION HELPERS
// ============================================

/**
 * Safe parse request body with typed response
 * Use in API routes for standardized validation
 */
export async function safeParseBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string; response: Response }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: formatZodError(result.error),
        response: new Response(
          JSON.stringify({ error: 'Validation failed', details: formatZodError(result.error) }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (e) {
    return {
      success: false,
      error: 'Invalid JSON body',
      response: new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Safe parse URL search params with typed response
 */
export function safeParseParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  return { success: true, data: result.data };
}

// ============================================
// COMMON API SCHEMAS
// ============================================

// Workspace-scoped base schema (all operations must include this)
export const WorkspaceScopedSchema = z.object({
  workspaceId: UUIDSchema,
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ID parameter schema
export const IdParamSchema = z.object({
  id: UUIDSchema,
});

// Contact schemas
export const CreateContactSchema = z.object({
  workspaceId: UUIDSchema,
  name: z.string().min(1, 'Name is required'),
  email: EmailSchema,
  company: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('new'),
  tags: z.array(z.string()).optional(),
});

export const UpdateContactSchema = CreateContactSchema.partial().omit({ workspaceId: true });

// Campaign schemas
export const CreateCampaignSchema = z.object({
  workspaceId: UUIDSchema,
  name: z.string().min(1, 'Campaign name is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'completed']).default('draft'),
  scheduledAt: z.string().datetime().optional(),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial().omit({ workspaceId: true });

// Email schemas
export const SendEmailSchema = z.object({
  workspaceId: UUIDSchema,
  contactId: UUIDSchema,
  to: EmailSchema,
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
});

// Content generation schemas
export const GenerateContentSchema = z.object({
  workspaceId: UUIDSchema,
  contactId: UUIDSchema.optional(),
  type: z.enum(['email', 'followup', 'proposal', 'social', 'blog']).default('email'),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual']).default('professional'),
  context: z.string().optional(),
});

// AI Agent schemas
export const AgentActionSchema = z.object({
  workspaceId: UUIDSchema,
  action: z.string(),
  params: z.record(z.unknown()).optional(),
});

// Search schema
export const SearchSchema = z.object({
  workspaceId: UUIDSchema,
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['contacts', 'emails', 'campaigns', 'content', 'all']).default('all'),
  ...PaginationSchema.shape,
});

// Type exports
export type WorkspaceScoped = z.infer<typeof WorkspaceScopedSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type CreateContact = z.infer<typeof CreateContactSchema>;
export type UpdateContact = z.infer<typeof UpdateContactSchema>;
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaign = z.infer<typeof UpdateCampaignSchema>;
export type SendEmail = z.infer<typeof SendEmailSchema>;
export type GenerateContent = z.infer<typeof GenerateContentSchema>;
export type AgentAction = z.infer<typeof AgentActionSchema>;
export type SearchParams = z.infer<typeof SearchSchema>;
