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

// ============================================
// ADDITIONAL COMMON SCHEMAS (P2-3)
// ============================================

// Phone number schema with basic validation
export const PhoneSchema = z.string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
    'Must be a valid phone number');

// URL schema
export const URLSchema = z.string().url({ message: 'Must be a valid URL' });

// Positive integer schema
export const PositiveIntSchema = z.number().int().positive();

// Non-negative integer schema
export const NonNegativeIntSchema = z.number().int().nonnegative();

// ISO date string schema
export const ISODateSchema = z.string().datetime();

// Date range schema
export const DateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Bulk operation schema (for bulk create/update/delete)
export const BulkOperationSchema = z.object({
  workspaceId: UUIDSchema,
  ids: z.array(UUIDSchema).min(1, 'At least one ID required').max(1000, 'Maximum 1000 IDs allowed'),
  action: z.enum(['delete', 'archive', 'restore', 'tag', 'untag']),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================
// ENHANCED CONTACT SCHEMAS
// ============================================

// Contact tags schema
export const ContactTagsSchema = z.array(z.string().min(1).max(50)).max(20);

// Contact status enum
export const ContactStatusEnum = z.enum([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
  'unsubscribed',
  'bounced'
]);

// Bulk contact create schema
export const BulkCreateContactsSchema = z.object({
  workspaceId: UUIDSchema,
  contacts: z.array(CreateContactSchema.omit({ workspaceId: true }))
    .min(1, 'At least one contact required')
    .max(1000, 'Maximum 1000 contacts per bulk operation'),
});

// Contact filter schema (for GET requests)
export const ContactFilterSchema = z.object({
  workspaceId: UUIDSchema,
  status: ContactStatusEnum.optional(),
  tags: z.string().optional(), // Comma-separated tag list
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  search: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  ...PaginationSchema.shape,
});

// ============================================
// ENHANCED CAMPAIGN SCHEMAS
// ============================================

// Campaign status enum
export const CampaignStatusEnum = z.enum([
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

// Email template schema
export const EmailTemplateSchema = z.object({
  workspaceId: UUIDSchema,
  name: z.string().min(1, 'Template name required').max(200),
  subject: z.string().min(1, 'Subject required').max(500),
  body: z.string().min(1, 'Body required'),
  variables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Campaign step schema (for drip campaigns)
export const CampaignStepSchema = z.object({
  type: z.enum(['email', 'wait', 'condition', 'tag', 'score_update', 'webhook']),
  delay_days: z.number().int().nonnegative().optional(),
  email_template_id: UUIDSchema.optional(),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.unknown(),
  }).optional(),
  webhook_url: URLSchema.optional(),
});

// Drip campaign create schema
export const CreateDripCampaignSchema = z.object({
  workspaceId: UUIDSchema,
  name: z.string().min(1, 'Campaign name required').max(200),
  description: z.string().max(1000).optional(),
  trigger: z.enum(['manual', 'new_contact', 'tag_added', 'score_threshold', 'form_submission']),
  trigger_config: z.record(z.unknown()).optional(),
  steps: z.array(CampaignStepSchema).min(1, 'At least one step required'),
  status: CampaignStatusEnum.default('draft'),
});

// ============================================
// AUTHENTICATION & AUTHORIZATION SCHEMAS
// ============================================

// Login schema
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Register schema
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  company: z.string().max(200).optional(),
});

// Reset password schema
export const ResetPasswordSchema = z.object({
  email: EmailSchema,
});

// Change password schema
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// API key schema
export const ApiKeySchema = z.object({
  workspaceId: UUIDSchema,
  name: z.string().min(1, 'API key name required').max(100),
  scopes: z.array(z.enum(['read', 'write', 'delete', 'admin'])).min(1),
  expiresAt: z.string().datetime().optional(),
});

// ============================================
// INTEGRATION SCHEMAS
// ============================================

// Gmail OAuth callback schema (enhanced)
export const GmailOAuthCompleteSchema = z.object({
  code: z.string().min(1, 'Authorization code required'),
  state: z.string().optional(),
  scope: z.string().optional(),
});

// Email webhook schema
export const EmailWebhookSchema = z.object({
  event: z.enum(['opened', 'clicked', 'bounced', 'complained', 'delivered', 'failed']),
  email_id: UUIDSchema,
  contact_id: UUIDSchema,
  timestamp: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================
// AI AGENT SCHEMAS
// ============================================

// Content generation request (enhanced)
export const EnhancedGenerateContentSchema = z.object({
  workspaceId: UUIDSchema,
  contactId: UUIDSchema.optional(),
  type: z.enum(['email', 'followup', 'proposal', 'social', 'blog', 'case_study', 'newsletter']),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual', 'enthusiastic', 'empathetic']),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  context: z.string().max(5000).optional(),
  includePersonalization: z.boolean().default(true),
  targetAudience: z.string().max(500).optional(),
});

// Email processing result schema
export const EmailProcessingResultSchema = z.object({
  workspaceId: UUIDSchema,
  emailId: UUIDSchema,
  contactId: UUIDSchema.optional(),
  intents: z.array(z.string()),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  suggestedActions: z.array(z.string()),
});

// ============================================
// ANALYTICS & REPORTING SCHEMAS
// ============================================

// Analytics query schema
export const AnalyticsQuerySchema = z.object({
  workspaceId: UUIDSchema,
  metric: z.enum(['contacts', 'campaigns', 'emails', 'revenue', 'conversion_rate']),
  dateRange: DateRangeSchema,
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('day'),
  filters: z.record(z.unknown()).optional(),
});

// Report generation schema
export const GenerateReportSchema = z.object({
  workspaceId: UUIDSchema,
  type: z.enum(['contact_activity', 'campaign_performance', 'revenue', 'custom']),
  dateRange: DateRangeSchema,
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(false),
});

// ============================================
// WEBHOOK SCHEMAS
// ============================================

// Webhook create schema
export const CreateWebhookSchema = z.object({
  workspaceId: UUIDSchema,
  url: URLSchema,
  events: z.array(z.enum([
    'contact.created',
    'contact.updated',
    'contact.deleted',
    'email.sent',
    'email.opened',
    'email.clicked',
    'campaign.started',
    'campaign.completed',
  ])).min(1, 'At least one event required'),
  secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  active: z.boolean().default(true),
});

// Webhook test schema
export const TestWebhookSchema = z.object({
  webhookId: UUIDSchema,
  event: z.string(),
  payload: z.record(z.unknown()).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Phone = z.infer<typeof PhoneSchema>;
export type URL = z.infer<typeof URLSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type BulkOperation = z.infer<typeof BulkOperationSchema>;
export type BulkCreateContacts = z.infer<typeof BulkCreateContactsSchema>;
export type ContactFilter = z.infer<typeof ContactFilterSchema>;
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type CreateDripCampaign = z.infer<typeof CreateDripCampaignSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type Register = z.infer<typeof RegisterSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type ChangePassword = z.infer<typeof ChangePasswordSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type GmailOAuthComplete = z.infer<typeof GmailOAuthCompleteSchema>;
export type EmailWebhook = z.infer<typeof EmailWebhookSchema>;
export type EnhancedGenerateContent = z.infer<typeof EnhancedGenerateContentSchema>;
export type EmailProcessingResult = z.infer<typeof EmailProcessingResultSchema>;
export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type GenerateReport = z.infer<typeof GenerateReportSchema>;
export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;
export type TestWebhook = z.infer<typeof TestWebhookSchema>;
