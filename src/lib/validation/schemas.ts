/**
 * Validation Schemas with Zod
 * Phase 2 Step 7 - Interactive Features
 *
 * Centralized validation schemas for forms
 */

import { z } from 'zod';

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
