/**
 * Tenancy Types
 * Phase 90: Multi-tenant agency engine types
 */

export type AgencyRole = 'owner' | 'manager' | 'staff' | 'client';

export interface Agency {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  parentAgencyId: string | null;
  active: boolean;
  settings: AgencySettings;
  metadata: Record<string, any>;
}

export interface AgencySettings {
  timezone: string;
  locale: string;
  branding: {
    primaryColor?: string;
    logo?: string;
  };
  features: {
    autopilot?: boolean;
    combat?: boolean;
    scaling?: boolean;
  };
}

export interface AgencyUser {
  id: string;
  createdAt: string;
  agencyId: string;
  userId: string;
  role: AgencyRole;
  permissions: string[];
  metadata: Record<string, any>;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  userId: string;
  role: AgencyRole;
  permissions: string[];
  isOwner: boolean;
  isManager: boolean;
}

export interface UserAgency {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  role: AgencyRole;
  isActive: boolean;
}

export interface TenantStats {
  totalUsers: number;
  totalContacts: number;
  activePlaybooks: number;
  subAgencies: number;
}

export interface CreateAgencyInput {
  name: string;
  slug: string;
  parentAgencyId?: string;
  settings?: Partial<AgencySettings>;
}

export interface TenantQueryOptions {
  tenantId: string;
  filters?: Record<string, any>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}
