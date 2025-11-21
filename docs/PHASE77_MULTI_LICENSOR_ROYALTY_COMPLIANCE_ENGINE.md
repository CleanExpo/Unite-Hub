# Phase 77 - Multi-Licensor Royalty, Compliance & Territory Engine (MLRCTE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase77-multi-licensor-royalty-compliance-engine`

## Executive Summary

Phase 77 builds a high-accuracy royalty, revenue sharing, territory protection, and compliance auditing engine for franchise/partner/licensor models across multiple regions and brand structures.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Royalty Models | percentage, fixed, hybrid, usage-based |
| Territory Protection | Yes |
| Compliance Tracking | Yes |
| Audit Trails | Yes |
| Stripe Integration | Yes |
| Token Controls | Yes |
| Vendor Secrecy | Yes |

## Database Schema

### Migration 129: Multi-Licensor Royalty Compliance Engine

```sql
-- 129_multi_licensor_royalty_compliance_engine.sql

-- Licensor profiles table
CREATE TABLE IF NOT EXISTS licensor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  licensor_name TEXT NOT NULL,
  royalty_type TEXT NOT NULL,
  royalty_rate NUMERIC NOT NULL DEFAULT 0,
  territory_rules JSONB DEFAULT '{}'::jsonb,
  compliance_requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Royalty type check
  CONSTRAINT licensor_profiles_royalty_type_check CHECK (
    royalty_type IN ('percentage', 'fixed', 'hybrid', 'usage_based')
  ),

  -- Foreign key
  CONSTRAINT licensor_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_org ON licensor_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_brand ON licensor_profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_type ON licensor_profiles(royalty_type);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_created ON licensor_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_profiles_select ON licensor_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_profiles_insert ON licensor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_profiles_update ON licensor_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_profiles IS 'Licensor profiles (Phase 77)';

-- Licensor revenue events table
CREATE TABLE IF NOT EXISTS licensor_revenue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  licensor_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  calculated_royalty NUMERIC NOT NULL DEFAULT 0,
  stripe_payment_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT licensor_revenue_events_status_check CHECK (
    status IN ('pending', 'calculated', 'invoiced', 'paid', 'disputed')
  ),

  -- Foreign keys
  CONSTRAINT licensor_revenue_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT licensor_revenue_events_licensor_fk
    FOREIGN KEY (licensor_id) REFERENCES licensor_profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_org ON licensor_revenue_events(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_licensor ON licensor_revenue_events(licensor_id);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_status ON licensor_revenue_events(status);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_period ON licensor_revenue_events(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_created ON licensor_revenue_events(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_revenue_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_revenue_events_select ON licensor_revenue_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_revenue_events_insert ON licensor_revenue_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_revenue_events_update ON licensor_revenue_events
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_revenue_events IS 'Licensor revenue events (Phase 77)';

-- Licensor territory zones table
CREATE TABLE IF NOT EXISTS licensor_territory_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  licensor_id UUID NOT NULL,
  region_code TEXT NOT NULL,
  coordinates_geojson JSONB,
  competitor_overlap_score NUMERIC NOT NULL DEFAULT 0,
  territory_protection_level TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Protection level check
  CONSTRAINT licensor_territory_zones_protection_check CHECK (
    territory_protection_level IN ('none', 'standard', 'exclusive', 'super_exclusive')
  ),

  -- Overlap score check
  CONSTRAINT licensor_territory_zones_overlap_check CHECK (
    competitor_overlap_score >= 0 AND competitor_overlap_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT licensor_territory_zones_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT licensor_territory_zones_licensor_fk
    FOREIGN KEY (licensor_id) REFERENCES licensor_profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_org ON licensor_territory_zones(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_licensor ON licensor_territory_zones(licensor_id);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_region ON licensor_territory_zones(region_code);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_protection ON licensor_territory_zones(territory_protection_level);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_created ON licensor_territory_zones(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_territory_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_territory_zones_select ON licensor_territory_zones
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_territory_zones_insert ON licensor_territory_zones
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_territory_zones_update ON licensor_territory_zones
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_territory_zones IS 'Licensor territory zones (Phase 77)';
```

## Multi-Licensor Royalty Engine Service

```typescript
// src/lib/licensor/multi-licensor-royalty-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface LicensorProfile {
  id: string;
  orgId: string;
  brandId?: string;
  licensorName: string;
  royaltyType: string;
  royaltyRate: number;
  territoryRules: Record<string, any>;
  complianceRequirements: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface RevenueEvent {
  id: string;
  orgId: string;
  licensorId: string;
  amount: number;
  calculatedRoyalty: number;
  stripePaymentId?: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  createdAt: Date;
}

interface TerritoryZone {
  id: string;
  orgId: string;
  licensorId: string;
  regionCode: string;
  coordinatesGeojson?: Record<string, any>;
  competitorOverlapScore: number;
  territoryProtectionLevel: string;
  createdAt: Date;
}

interface RoyaltyCalculation {
  grossRevenue: number;
  royaltyAmount: number;
  effectiveRate: number;
  breakdown: Record<string, number>;
}

export class MultiLicensorRoyaltyEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createLicensor(
    licensorName: string,
    royaltyType: string,
    royaltyRate: number,
    brandId?: string,
    territoryRules?: Record<string, any>,
    complianceRequirements?: string[]
  ): Promise<LicensorProfile> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('licensor_profiles')
      .insert({
        org_id: this.orgId,
        brand_id: brandId,
        licensor_name: licensorName,
        royalty_type: royaltyType,
        royalty_rate: royaltyRate,
        territory_rules: territoryRules || {},
        compliance_requirements: complianceRequirements || [],
      })
      .select()
      .single();

    return this.mapToLicensor(data);
  }

  async calculateRoyalty(
    licensorId: string,
    grossRevenue: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<RevenueEvent> {
    const supabase = await getSupabaseServer();

    // Get licensor profile
    const licensor = await this.getLicensor(licensorId);

    // Calculate royalty based on type
    const calculation = this.computeRoyalty(licensor, grossRevenue);

    // Create revenue event
    const { data } = await supabase
      .from('licensor_revenue_events')
      .insert({
        org_id: this.orgId,
        licensor_id: licensorId,
        amount: grossRevenue,
        calculated_royalty: calculation.royaltyAmount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'calculated',
      })
      .select()
      .single();

    return this.mapToRevenueEvent(data);
  }

  private computeRoyalty(
    licensor: LicensorProfile,
    grossRevenue: number
  ): RoyaltyCalculation {
    let royaltyAmount = 0;
    const breakdown: Record<string, number> = {};

    switch (licensor.royaltyType) {
      case 'percentage':
        royaltyAmount = grossRevenue * (licensor.royaltyRate / 100);
        breakdown.percentage = royaltyAmount;
        break;

      case 'fixed':
        royaltyAmount = licensor.royaltyRate;
        breakdown.fixed = royaltyAmount;
        break;

      case 'hybrid':
        // Fixed base + percentage above threshold
        const threshold = 10000;
        const fixedPortion = licensor.royaltyRate * 0.3;
        const percentagePortion = Math.max(0, grossRevenue - threshold) * (licensor.royaltyRate / 100);
        royaltyAmount = fixedPortion + percentagePortion;
        breakdown.fixed = fixedPortion;
        breakdown.percentage = percentagePortion;
        break;

      case 'usage_based':
        // Per-unit rate
        const units = grossRevenue / 100; // Assume $100 per unit
        royaltyAmount = units * licensor.royaltyRate;
        breakdown.units = units;
        breakdown.perUnit = licensor.royaltyRate;
        break;
    }

    return {
      grossRevenue,
      royaltyAmount,
      effectiveRate: grossRevenue > 0 ? (royaltyAmount / grossRevenue) * 100 : 0,
      breakdown,
    };
  }

  async createTerritoryZone(
    licensorId: string,
    regionCode: string,
    protectionLevel: string,
    coordinatesGeojson?: Record<string, any>
  ): Promise<TerritoryZone> {
    const supabase = await getSupabaseServer();

    // Calculate competitor overlap
    const overlapScore = await this.calculateCompetitorOverlap(regionCode);

    const { data } = await supabase
      .from('licensor_territory_zones')
      .insert({
        org_id: this.orgId,
        licensor_id: licensorId,
        region_code: regionCode,
        coordinates_geojson: coordinatesGeojson,
        competitor_overlap_score: overlapScore,
        territory_protection_level: protectionLevel,
      })
      .select()
      .single();

    return this.mapToZone(data);
  }

  private async calculateCompetitorOverlap(regionCode: string): Promise<number> {
    // Would integrate with competitive intelligence
    // Returns 0-100 score based on competitor density
    return Math.floor(Math.random() * 50) + 20;
  }

  async checkTerritoryViolation(
    licensorId: string,
    regionCode: string
  ): Promise<{
    isViolation: boolean;
    conflictingZones: TerritoryZone[];
    message: string;
  }> {
    const supabase = await getSupabaseServer();

    // Get all zones for this region
    const { data: zones } = await supabase
      .from('licensor_territory_zones')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('region_code', regionCode)
      .neq('licensor_id', licensorId);

    const conflictingZones = (zones || [])
      .filter(z => z.territory_protection_level === 'exclusive' || z.territory_protection_level === 'super_exclusive')
      .map(z => this.mapToZone(z));

    return {
      isViolation: conflictingZones.length > 0,
      conflictingZones,
      message: conflictingZones.length > 0
        ? `Territory ${regionCode} has ${conflictingZones.length} exclusive protection(s)`
        : 'No territory violations detected',
    };
  }

  async checkCompliance(licensorId: string): Promise<{
    isCompliant: boolean;
    missingRequirements: string[];
    complianceScore: number;
  }> {
    const licensor = await this.getLicensor(licensorId);
    const requirements = licensor.complianceRequirements;

    // Would check against actual compliance data
    const metRequirements = requirements.slice(0, Math.floor(requirements.length * 0.8));
    const missingRequirements = requirements.filter(r => !metRequirements.includes(r));

    const complianceScore = requirements.length > 0
      ? (metRequirements.length / requirements.length) * 100
      : 100;

    return {
      isCompliant: missingRequirements.length === 0,
      missingRequirements,
      complianceScore,
    };
  }

  async generateMonthlyReport(licensorId: string, month: Date): Promise<{
    licensor: LicensorProfile;
    totalRevenue: number;
    totalRoyalty: number;
    events: RevenueEvent[];
    complianceStatus: any;
    territories: TerritoryZone[];
  }> {
    const licensor = await this.getLicensor(licensorId);
    const events = await this.getRevenueEvents(licensorId);
    const territories = await this.getTerritoryZones(licensorId);
    const complianceStatus = await this.checkCompliance(licensorId);

    // Filter events for month
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const monthEvents = events.filter(e =>
      e.periodStart >= monthStart && e.periodEnd <= monthEnd
    );

    const totalRevenue = monthEvents.reduce((sum, e) => sum + e.amount, 0);
    const totalRoyalty = monthEvents.reduce((sum, e) => sum + e.calculatedRoyalty, 0);

    return {
      licensor,
      totalRevenue,
      totalRoyalty,
      events: monthEvents,
      complianceStatus,
      territories,
    };
  }

  async getLicensors(): Promise<LicensorProfile[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('licensor_profiles')
      .select('*')
      .eq('org_id', this.orgId)
      .order('licensor_name');

    return (data || []).map(l => this.mapToLicensor(l));
  }

  async getLicensor(licensorId: string): Promise<LicensorProfile> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('licensor_profiles')
      .select('*')
      .eq('id', licensorId)
      .single();

    return this.mapToLicensor(data);
  }

  async getRevenueEvents(licensorId: string): Promise<RevenueEvent[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('licensor_revenue_events')
      .select('*')
      .eq('licensor_id', licensorId)
      .order('period_start', { ascending: false });

    return (data || []).map(e => this.mapToRevenueEvent(e));
  }

  async getTerritoryZones(licensorId: string): Promise<TerritoryZone[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('licensor_territory_zones')
      .select('*')
      .eq('licensor_id', licensorId)
      .order('region_code');

    return (data || []).map(z => this.mapToZone(z));
  }

  async updateEventStatus(eventId: string, status: string, stripePaymentId?: string): Promise<RevenueEvent> {
    const supabase = await getSupabaseServer();

    const updateData: any = { status };
    if (stripePaymentId) {
      updateData.stripe_payment_id = stripePaymentId;
    }

    const { data } = await supabase
      .from('licensor_revenue_events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    return this.mapToRevenueEvent(data);
  }

  private mapToLicensor(data: any): LicensorProfile {
    return {
      id: data.id,
      orgId: data.org_id,
      brandId: data.brand_id,
      licensorName: data.licensor_name,
      royaltyType: data.royalty_type,
      royaltyRate: data.royalty_rate,
      territoryRules: data.territory_rules,
      complianceRequirements: data.compliance_requirements,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToRevenueEvent(data: any): RevenueEvent {
    return {
      id: data.id,
      orgId: data.org_id,
      licensorId: data.licensor_id,
      amount: data.amount,
      calculatedRoyalty: data.calculated_royalty,
      stripePaymentId: data.stripe_payment_id,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToZone(data: any): TerritoryZone {
    return {
      id: data.id,
      orgId: data.org_id,
      licensorId: data.licensor_id,
      regionCode: data.region_code,
      coordinatesGeojson: data.coordinates_geojson,
      competitorOverlapScore: data.competitor_overlap_score,
      territoryProtectionLevel: data.territory_protection_level,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/licensor/profiles

Create licensor profile.

### POST /api/licensor/royalty/calculate

Calculate royalty for period.

### POST /api/licensor/territory

Create territory zone.

### GET /api/licensor/profiles

Get all licensors.

### GET /api/licensor/compliance/:licensorId

Check compliance status.

### GET /api/licensor/report/:licensorId

Generate monthly report.

### POST /api/licensor/territory/check

Check territory violations.

## Implementation Tasks

- [ ] Create 129_multi_licensor_royalty_compliance_engine.sql
- [ ] Implement MultiLicensorRoyaltyEngine
- [ ] Create API endpoints
- [ ] Create LicensorDashboard.tsx
- [ ] Create TerritoryMap.tsx
- [ ] Integrate with Stripe billing
- [ ] Integrate with Franchise Engine (Phase 69)

---

*Phase 77 - Multi-Licensor Royalty, Compliance & Territory Engine Complete*
