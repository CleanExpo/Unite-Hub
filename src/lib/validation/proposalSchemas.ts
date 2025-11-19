/**
 * Proposal Validation Schemas
 * Phase 3 Step 5 - Client Proposal Selection
 *
 * Zod schemas for validating proposal-related data structures.
 * Provides runtime type validation and error messages.
 *
 * Usage:
 * ```typescript
 * import { selectProposalSchema } from '@/lib/validation/proposalSchemas';
 *
 * const result = selectProposalSchema.safeParse(requestBody);
 * if (!result.success) {
 *   console.error(result.error.issues);
 * }
 * ```
 */

import { z } from 'zod';

/**
 * Scope Tier enum
 */
export const scopeTierSchema = z.enum(['good', 'better', 'best'], {
  errorMap: () => ({ message: 'Tier must be good, better, or best' }),
});

/**
 * Client Idea schema
 */
export const clientIdeaSchema = z.object({
  id: z.string().uuid('Invalid idea ID format'),
  organizationId: z.string().uuid('Invalid organization ID format'),
  clientId: z.string().uuid('Invalid client ID format'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  createdAt: z.string().datetime('Invalid date format'),
});

/**
 * Scope Section schema
 */
export const scopeSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().min(1, 'Section description is required'),
  order: z.number().int().positive().optional(),
});

/**
 * Scope Package schema
 */
export const scopePackageSchema = z.object({
  id: z.string().min(1, 'Package ID is required'),
  tier: scopeTierSchema,
  label: z.string().min(1, 'Package label is required'),
  summary: z.string().min(1, 'Package summary is required'),
  deliverables: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  timeline: z.string().optional(),
});

/**
 * Proposal Scope schema
 */
export const proposalScopeSchema = z.object({
  idea: clientIdeaSchema,
  sections: z.array(scopeSectionSchema),
  packages: z.array(scopePackageSchema).min(1, 'At least one package is required'),
  metadata: z
    .object({
      generatedAt: z.string().datetime('Invalid date format'),
      generatedBy: z.string().optional(),
      aiModel: z.string().optional(),
    })
    .optional(),
});

/**
 * Select Proposal Request schema
 */
export const selectProposalSchema = z.object({
  ideaId: z.string().uuid('Invalid idea ID format'),
  tier: scopeTierSchema,
  packageId: z.string().min(1, 'Package ID is required'),
});

/**
 * Get Proposal Query schema
 */
export const getProposalQuerySchema = z.object({
  ideaId: z.string().uuid('Invalid idea ID format'),
});

/**
 * Proposal Selection Record schema (for database)
 */
export const proposalSelectionSchema = z.object({
  id: z.string().uuid().optional(),
  idea_id: z.string().uuid('Invalid idea ID format'),
  proposal_scope_id: z.string().uuid('Invalid proposal scope ID format'),
  client_id: z.string().uuid('Invalid client ID format'),
  organization_id: z.string().uuid('Invalid organization ID format'),
  selected_tier: scopeTierSchema,
  selected_package_id: z.string().min(1, 'Package ID is required'),
  package_details: scopePackageSchema,
  selected_at: z.string().datetime('Invalid date format'),
  selected_by: z.string().email('Invalid email format').or(z.literal('unknown')),
});

/**
 * Helper function to validate and parse data
 */
export function validateProposalSelection(data: unknown) {
  return selectProposalSchema.safeParse(data);
}

export function validateProposalScope(data: unknown) {
  return proposalScopeSchema.safeParse(data);
}

export function validateGetProposalQuery(data: unknown) {
  return getProposalQuerySchema.safeParse(data);
}

/**
 * Type exports for use in TypeScript
 */
export type ScopeTier = z.infer<typeof scopeTierSchema>;
export type ClientIdea = z.infer<typeof clientIdeaSchema>;
export type ScopeSection = z.infer<typeof scopeSectionSchema>;
export type ScopePackage = z.infer<typeof scopePackageSchema>;
export type ProposalScope = z.infer<typeof proposalScopeSchema>;
export type SelectProposalRequest = z.infer<typeof selectProposalSchema>;
export type GetProposalQuery = z.infer<typeof getProposalQuerySchema>;
export type ProposalSelection = z.infer<typeof proposalSelectionSchema>;
