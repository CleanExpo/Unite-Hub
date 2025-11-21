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
