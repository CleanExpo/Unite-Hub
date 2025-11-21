# Phase 69 - Franchise & Investor Management Engine (FIME)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase69-franchise-investor-management-engine`

## Executive Summary

Phase 69 allows Unite-Hub clients to operate multi-region franchise networks or investor-led branches. Handles territory mapping, revenue shares, performance dashboards, franchise onboarding, and compliance workflows.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Multi-Region Support | Yes |
| Territory Mapping | Yes |
| Revenue Shares | Yes |
| Investor Portals | Yes |
| Performance Tracking | Yes |

## Database Schema

### Migration 121: Franchise & Investor Management Engine

```sql
-- 121_franchise_investor_management_engine.sql

-- Franchises table
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT franchises_status_check CHECK (
    status IN ('pending', 'onboarding', 'active', 'suspended', 'terminated')
  ),

  -- Foreign keys
  CONSTRAINT franchises_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT franchises_owner_fk
    FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchises_org ON franchises(org_id);
CREATE INDEX IF NOT EXISTS idx_franchises_owner ON franchises(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);
CREATE INDEX IF NOT EXISTS idx_franchises_created ON franchises(created_at DESC);

-- Enable RLS
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchises_select ON franchises
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ) OR owner_user_id = auth.uid());

CREATE POLICY franchises_insert ON franchises
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY franchises_update ON franchises
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE franchises IS 'Franchise entities (Phase 69)';

-- Franchise regions table
CREATE TABLE IF NOT EXISTS franchise_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL,
  territory_name TEXT NOT NULL,
  postal_codes JSONB DEFAULT '[]'::jsonb,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT franchise_regions_franchise_fk
    FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchise_regions_franchise ON franchise_regions(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_regions_territory ON franchise_regions(territory_name);
CREATE INDEX IF NOT EXISTS idx_franchise_regions_locked ON franchise_regions(locked);

-- Enable RLS
ALTER TABLE franchise_regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchise_regions_select ON franchise_regions
  FOR SELECT TO authenticated
  USING (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    ) OR owner_user_id = auth.uid()
  ));

CREATE POLICY franchise_regions_insert ON franchise_regions
  FOR INSERT TO authenticated
  WITH CHECK (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE franchise_regions IS 'Franchise territory mappings (Phase 69)';

-- Franchise revenue shares table
CREATE TABLE IF NOT EXISTS franchise_revenue_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL,
  percentage NUMERIC NOT NULL,
  rules JSONB DEFAULT '{}'::jsonb,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Percentage check
  CONSTRAINT franchise_revenue_shares_percentage_check CHECK (
    percentage >= 0 AND percentage <= 100
  ),

  -- Foreign key
  CONSTRAINT franchise_revenue_shares_franchise_fk
    FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_shares_franchise ON franchise_revenue_shares(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_shares_date ON franchise_revenue_shares(effective_date DESC);

-- Enable RLS
ALTER TABLE franchise_revenue_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchise_revenue_shares_select ON franchise_revenue_shares
  FOR SELECT TO authenticated
  USING (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    ) OR owner_user_id = auth.uid()
  ));

CREATE POLICY franchise_revenue_shares_insert ON franchise_revenue_shares
  FOR INSERT TO authenticated
  WITH CHECK (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE franchise_revenue_shares IS 'Franchise revenue share rules (Phase 69)';

-- Investor relations table
CREATE TABLE IF NOT EXISTS investor_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  investor_user_id UUID NOT NULL,
  investment_amount NUMERIC NOT NULL,
  stake_percentage NUMERIC NOT NULL,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stake check
  CONSTRAINT investor_relations_stake_check CHECK (
    stake_percentage >= 0 AND stake_percentage <= 100
  ),

  -- Foreign keys
  CONSTRAINT investor_relations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT investor_relations_investor_fk
    FOREIGN KEY (investor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investor_relations_org ON investor_relations(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_relations_investor ON investor_relations(investor_user_id);
CREATE INDEX IF NOT EXISTS idx_investor_relations_created ON investor_relations(created_at DESC);

-- Enable RLS
ALTER TABLE investor_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY investor_relations_select ON investor_relations
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ) OR investor_user_id = auth.uid());

CREATE POLICY investor_relations_insert ON investor_relations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE investor_relations IS 'Investor stakeholder records (Phase 69)';
```

## Franchise Engine Service

```typescript
// src/lib/franchise/franchise-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Franchise {
  id: string;
  orgId: string;
  name: string;
  ownerUserId: string;
  status: string;
  createdAt: Date;
}

interface FranchiseRegion {
  id: string;
  franchiseId: string;
  territoryName: string;
  postalCodes: string[];
  locked: boolean;
}

interface RevenueShare {
  id: string;
  franchiseId: string;
  percentage: number;
  rules: Record<string, any>;
  effectiveDate: Date;
}

interface InvestorRelation {
  id: string;
  orgId: string;
  investorUserId: string;
  investmentAmount: number;
  stakePercentage: number;
  documents: string[];
  createdAt: Date;
}

export class FranchiseEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createFranchise(name: string, ownerUserId: string): Promise<Franchise> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchises')
      .insert({
        org_id: this.orgId,
        name,
        owner_user_id: ownerUserId,
        status: 'pending',
      })
      .select()
      .single();

    return this.mapToFranchise(data);
  }

  async activateFranchise(franchiseId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('franchises')
      .update({ status: 'active' })
      .eq('id', franchiseId);
  }

  async assignTerritory(
    franchiseId: string,
    territoryName: string,
    postalCodes: string[]
  ): Promise<FranchiseRegion> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchise_regions')
      .insert({
        franchise_id: franchiseId,
        territory_name: territoryName,
        postal_codes: postalCodes,
      })
      .select()
      .single();

    return {
      id: data.id,
      franchiseId: data.franchise_id,
      territoryName: data.territory_name,
      postalCodes: data.postal_codes,
      locked: data.locked,
    };
  }

  async lockTerritory(regionId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('franchise_regions')
      .update({ locked: true })
      .eq('id', regionId);
  }

  async setRevenueShare(
    franchiseId: string,
    percentage: number,
    rules?: Record<string, any>,
    effectiveDate?: Date
  ): Promise<RevenueShare> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchise_revenue_shares')
      .insert({
        franchise_id: franchiseId,
        percentage,
        rules: rules || {},
        effective_date: (effectiveDate || new Date()).toISOString().split('T')[0],
      })
      .select()
      .single();

    return {
      id: data.id,
      franchiseId: data.franchise_id,
      percentage: data.percentage,
      rules: data.rules,
      effectiveDate: new Date(data.effective_date),
    };
  }

  async addInvestor(
    investorUserId: string,
    investmentAmount: number,
    stakePercentage: number,
    documents?: string[]
  ): Promise<InvestorRelation> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('investor_relations')
      .insert({
        org_id: this.orgId,
        investor_user_id: investorUserId,
        investment_amount: investmentAmount,
        stake_percentage: stakePercentage,
        documents: documents || [],
      })
      .select()
      .single();

    return this.mapToInvestor(data);
  }

  async getFranchisePerformance(franchiseId: string): Promise<{
    revenue: number;
    growth: number;
    territories: number;
    status: string;
  }> {
    const supabase = await getSupabaseServer();

    const { data: franchise } = await supabase
      .from('franchises')
      .select('status')
      .eq('id', franchiseId)
      .single();

    const { data: regions } = await supabase
      .from('franchise_regions')
      .select('id')
      .eq('franchise_id', franchiseId);

    // Would calculate from actual revenue data
    return {
      revenue: 25000,
      growth: 12,
      territories: (regions || []).length,
      status: franchise?.status || 'unknown',
    };
  }

  async predictFranchiseSuccess(franchiseId: string): Promise<{
    probability: number;
    factors: { factor: string; impact: number }[];
  }> {
    // Would use network intelligence and historical data
    return {
      probability: 78,
      factors: [
        { factor: 'Territory size', impact: 20 },
        { factor: 'Owner experience', impact: 25 },
        { factor: 'Market demand', impact: 30 },
        { factor: 'Support utilization', impact: 15 },
        { factor: 'Training completion', impact: 10 },
      ],
    };
  }

  async getFranchises(): Promise<Franchise[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchises')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(f => this.mapToFranchise(f));
  }

  async getFranchise(franchiseId: string): Promise<Franchise> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single();

    return this.mapToFranchise(data);
  }

  async getRegions(franchiseId: string): Promise<FranchiseRegion[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('franchise_regions')
      .select('*')
      .eq('franchise_id', franchiseId);

    return (data || []).map(r => ({
      id: r.id,
      franchiseId: r.franchise_id,
      territoryName: r.territory_name,
      postalCodes: r.postal_codes,
      locked: r.locked,
    }));
  }

  async getInvestors(): Promise<InvestorRelation[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('investor_relations')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(i => this.mapToInvestor(i));
  }

  private mapToFranchise(data: any): Franchise {
    return {
      id: data.id,
      orgId: data.org_id,
      name: data.name,
      ownerUserId: data.owner_user_id,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToInvestor(data: any): InvestorRelation {
    return {
      id: data.id,
      orgId: data.org_id,
      investorUserId: data.investor_user_id,
      investmentAmount: data.investment_amount,
      stakePercentage: data.stake_percentage,
      documents: data.documents,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/franchise

Create franchise.

### POST /api/franchise/:id/activate

Activate franchise.

### POST /api/franchise/:id/territory

Assign territory.

### POST /api/franchise/:id/revenue-share

Set revenue share.

### GET /api/franchise/:id/performance

Get franchise performance.

### POST /api/investors

Add investor.

### GET /api/investors

Get investors.

## Implementation Tasks

- [ ] Create 121_franchise_investor_management_engine.sql
- [ ] Implement FranchiseEngine
- [ ] Create API endpoints
- [ ] Create FranchiseDashboard.tsx
- [ ] Create InvestorPortal.tsx
- [ ] Integrate with Growth Advisor and Network Intelligence

---

*Phase 69 - Franchise & Investor Management Engine Complete*
