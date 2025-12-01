/**
 * Validators Index
 *
 * Central export point for all validation schemas and utilities.
 *
 * @example
 *   import { ContactInsertSchema, validateData } from '@/lib/validators';
 *
 *   const { success, data, errors } = validateData(ContactInsertSchema, req.body);
 */

export {
  // Patterns
  UUIDSchema,
  EmailSchema,
  URLSchema,
  NonEmptyString,
  DateTimeSchema,
  AIScorerSchema,
  ContactStatusSchema,
  UserRoleSchema,
  // Contact Schemas
  ContactRowSchema,
  ContactInsertSchema,
  ContactUpdateSchema,
  type ContactRow,
  type ContactInsert,
  type ContactUpdate,
  // Workspace Schemas
  WorkspaceRowSchema,
  WorkspaceInsertSchema,
  WorkspaceUpdateSchema,
  type WorkspaceRow,
  type WorkspaceInsert,
  type WorkspaceUpdate,
  // Organization Schemas
  OrganizationRowSchema,
  OrganizationInsertSchema,
  type OrganizationRow,
  type OrganizationInsert,
  // User Profile Schemas
  UserProfileRowSchema,
  UserProfileInsertSchema,
  type UserProfileRow,
  type UserProfileInsert,
  // Email Schemas
  EmailRowSchema,
  EmailInsertSchema,
  type EmailRow,
  type EmailInsert,
  // Campaign Schemas
  CampaignRowSchema,
  CampaignInsertSchema,
  CampaignUpdateSchema,
  type CampaignRow,
  type CampaignInsert,
  type CampaignUpdate,
  // Utilities
  formatValidationErrors,
  validateData,
} from './database-schemas';
