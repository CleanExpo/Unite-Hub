/**
 * Franchise Types
 * Phase 91: Licensing, Franchise & Region Expansion
 */

export interface Region {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  countryCode: string;
  stateCode?: string;
  timezone: string;
  boundaryGeojson: any;
  parentRegionId: string | null;
  active: boolean;
  metadata: Record<string, any>;
}

export interface FranchiseTier {
  id: number;
  createdAt: string;
  name: string;
  description?: string;
  maxClients: number;
  maxUsers: number;
  maxSubAgencies: number;
  postingRateLimitHour: number;
  aiBudgetMonthly: number;
  features: TierFeatures;
  monthlyFee: number;
  revenueSharePercent: number;
  metadata: Record<string, any>;
}

export interface TierFeatures {
  autopilot: boolean;
  combat: boolean;
  scaling: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

export interface AgencyLicense {
  id: string;
  createdAt: string;
  updatedAt: string;
  agencyId: string;
  regionId: string;
  tierId: number;
  licenseKey?: string;
  startedOn: string;
  expiresOn: string;
  status: LicenseStatus;
  currentClients: number;
  currentUsers: number;
  nextBillingDate?: string;
  billingStatus: BillingStatus;
  metadata: Record<string, any>;
}

export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'cancelled';
export type BillingStatus = 'current' | 'past_due' | 'cancelled';

export interface FranchiseMetrics {
  id: string;
  createdAt: string;
  agencyId: string;
  periodStart: string;
  periodEnd: string;
  totalClients: number;
  activeClients: number;
  newClients: number;
  churnedClients: number;
  grossRevenue: number;
  netRevenue: number;
  mrr: number;
  avgClientHealth?: number;
  avgCampaignPerformance?: number;
  totalPosts: number;
  totalEngagements: number;
  metadata: Record<string, any>;
}

export interface AgencyWithLicense {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  licenseStatus?: string;
  tierName?: string;
  regionName?: string;
}

export interface LicenseDetails {
  licenseId: string;
  regionName: string;
  tierName: string;
  status: string;
  expiresOn: string;
  maxClients: number;
  currentClients: number;
  maxUsers: number;
  currentUsers: number;
}

export interface FranchiseRollup {
  totalAgencies: number;
  totalClients: number;
  totalRevenue: number;
  avgHealth: number;
}

export interface AssignRegionInput {
  agencyId: string;
  regionId: string;
  tierId: number;
  expiresOn: string;
}
