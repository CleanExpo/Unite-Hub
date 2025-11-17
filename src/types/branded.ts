/**
 * Branded types for domain-specific type safety
 * Prevents mixing up similar primitive types
 */

// Brand helper
type Brand<T, TBrand> = T & { __brand: TBrand };

// Domain-specific branded types
export type UserId = Brand<string, 'UserId'>;
export type OrganizationId = Brand<string, 'OrganizationId'>;
export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type ContactId = Brand<string, 'ContactId'>;
export type CampaignId = Brand<string, 'CampaignId'>;
export type MindmapId = Brand<string, 'MindmapId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type EmailAddress = Brand<string, 'EmailAddress'>;

// Constructor functions for type-safe creation
export function createUserId(value: string): UserId {
  return value as UserId;
}

export function createOrganizationId(value: string): OrganizationId {
  return value as OrganizationId;
}

export function createWorkspaceId(value: string): WorkspaceId {
  return value as WorkspaceId;
}

export function createContactId(value: string): ContactId {
  return value as ContactId;
}

export function createCampaignId(value: string): CampaignId {
  return value as CampaignId;
}

export function createMindmapId(value: string): MindmapId {
  return value as MindmapId;
}

export function createProjectId(value: string): ProjectId {
  return value as ProjectId;
}

export function createEmailAddress(value: string): EmailAddress {
  // Basic validation
  if (!value.includes('@')) {
    throw new Error(`Invalid email address: ${value}`);
  }
  return value as EmailAddress;
}

// Example usage:
// const userId: UserId = createUserId('user-123');
// const workspaceId: WorkspaceId = createWorkspaceId('ws-456');
// This won't compile (type error):
// const wrongAssignment: WorkspaceId = userId; // ❌ Type error!
