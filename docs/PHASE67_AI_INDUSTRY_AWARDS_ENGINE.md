# Phase 67 - AI Industry Awards Engine (AIAE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase67-industry-awards-engine`

## Executive Summary

Phase 67 automatically generates industry awards, badges, recognition tiers, and public-facing certificates for clients based on benchmark performance, academy completions, operational excellence, and customer satisfaction.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto Badge Generation | Yes |
| Certificate Generation | Yes |
| Eligibility Rules | Yes |
| SEO Embed Codes | Yes |
| Reputation Integration | Yes |

## Database Schema

### Migration 119: AI Industry Awards Engine

```sql
-- 119_ai_industry_awards_engine.sql

-- Award badges table
CREATE TABLE IF NOT EXISTS award_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  badge_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  criteria_met JSONB DEFAULT '{}'::jsonb,
  score NUMERIC NOT NULL DEFAULT 0,
  certificate_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT award_badges_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT award_badges_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_award_badges_org ON award_badges(org_id);
CREATE INDEX IF NOT EXISTS idx_award_badges_brand ON award_badges(brand_id);
CREATE INDEX IF NOT EXISTS idx_award_badges_year ON award_badges(year);
CREATE INDEX IF NOT EXISTS idx_award_badges_type ON award_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_award_badges_generated ON award_badges(generated_at DESC);

-- Enable RLS
ALTER TABLE award_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY award_badges_select ON award_badges
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY award_badges_insert ON award_badges
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE award_badges IS 'Client award badges and certificates (Phase 67)';

-- Award eligibility rules table
CREATE TABLE IF NOT EXISTS award_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_type TEXT NOT NULL UNIQUE,
  criteria JSONB NOT NULL,
  min_score NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_award_eligibility_rules_type ON award_eligibility_rules(badge_type);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_rules_active ON award_eligibility_rules(active);

-- Enable RLS
ALTER TABLE award_eligibility_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY award_eligibility_rules_select ON award_eligibility_rules
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY award_eligibility_rules_insert ON award_eligibility_rules
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE award_eligibility_rules IS 'Award eligibility criteria (Phase 67)';
```

## Industry Awards Engine Service

```typescript
// src/lib/awards/industry-awards-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface AwardBadge {
  id: string;
  orgId: string;
  brandId?: string;
  badgeType: string;
  year: number;
  criteriaMet: Record<string, any>;
  score: number;
  certificateUrl?: string;
  generatedAt: Date;
}

interface EligibilityRule {
  id: string;
  badgeType: string;
  criteria: AwardCriteria;
  minScore: number;
  active: boolean;
}

interface AwardCriteria {
  benchmarkPercentile?: number;
  academyCertifications?: number;
  supportScore?: number;
  revenueGrowth?: number;
  automationUsage?: number;
}

const AWARD_TYPES = [
  'excellence_customer_care',
  'automation_master',
  'industry_innovation_leader',
  'top_10_benchmark',
  'best_training_adoption',
  'outstanding_brand_experience',
];

export class IndustryAwardsEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async checkEligibility(brandId?: string): Promise<{
    eligible: string[];
    scores: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    // Get all active rules
    const { data: rules } = await supabase
      .from('award_eligibility_rules')
      .select('*')
      .eq('active', true);

    // Gather performance data
    const benchmarks = await this.getBenchmarkData(brandId);
    const academy = await this.getAcademyData();
    const support = await this.getSupportData();
    const revenue = await this.getRevenueData();

    const eligible: string[] = [];
    const scores: Record<string, number> = {};

    for (const rule of rules || []) {
      const score = this.calculateScore(rule.criteria, {
        benchmarks,
        academy,
        support,
        revenue,
      });

      scores[rule.badge_type] = score;

      if (score >= rule.min_score) {
        eligible.push(rule.badge_type);
      }
    }

    return { eligible, scores };
  }

  async generateAwards(brandId?: string): Promise<AwardBadge[]> {
    const supabase = await getSupabaseServer();

    const { eligible, scores } = await this.checkEligibility(brandId);
    const year = new Date().getFullYear();
    const awards: AwardBadge[] = [];

    for (const badgeType of eligible) {
      // Check if already awarded this year
      const { data: existing } = await supabase
        .from('award_badges')
        .select('id')
        .eq('org_id', this.orgId)
        .eq('badge_type', badgeType)
        .eq('year', year)
        .maybeSingle();

      if (existing) continue;

      // Generate certificate
      const certificateUrl = await this.generateCertificate(badgeType, year);

      // Create award
      const { data } = await supabase
        .from('award_badges')
        .insert({
          org_id: this.orgId,
          brand_id: brandId,
          badge_type: badgeType,
          year,
          criteria_met: { score: scores[badgeType] },
          score: scores[badgeType],
          certificate_url: certificateUrl,
        })
        .select()
        .single();

      awards.push(this.mapToBadge(data));
    }

    return awards;
  }

  private calculateScore(
    criteria: AwardCriteria,
    data: {
      benchmarks: Record<string, number>;
      academy: Record<string, any>;
      support: Record<string, any>;
      revenue: Record<string, any>;
    }
  ): number {
    let score = 0;
    let weights = 0;

    if (criteria.benchmarkPercentile) {
      const avgPercentile = Object.values(data.benchmarks).reduce((a, b) => a + b, 0) /
        Object.values(data.benchmarks).length;
      score += (avgPercentile / criteria.benchmarkPercentile) * 25;
      weights += 25;
    }

    if (criteria.academyCertifications) {
      score += Math.min(25, (data.academy.certifications / criteria.academyCertifications) * 25);
      weights += 25;
    }

    if (criteria.supportScore) {
      const supportScore = 100 - (data.support.escalationRate || 0) * 2;
      score += (supportScore / criteria.supportScore) * 25;
      weights += 25;
    }

    if (criteria.revenueGrowth) {
      score += Math.min(25, (data.revenue.growth / criteria.revenueGrowth) * 25);
      weights += 25;
    }

    return weights > 0 ? Math.round((score / weights) * 100) : 0;
  }

  private async getBenchmarkData(brandId?: string): Promise<Record<string, number>> {
    // Would fetch from benchmarks (Phase 63)
    return {
      response_time: 75,
      client_satisfaction: 80,
      automation_usage: 60,
    };
  }

  private async getAcademyData(): Promise<Record<string, any>> {
    // Would fetch from lesson_progress (Phase 62)
    return { completionRate: 65, certifications: 5 };
  }

  private async getSupportData(): Promise<Record<string, any>> {
    // Would fetch from support_tickets (Phase 60)
    return { avgResolutionTime: 3, escalationRate: 5 };
  }

  private async getRevenueData(): Promise<Record<string, any>> {
    // Would fetch from revenue tables (Phases 39-42)
    return { mrr: 8000, growth: 15, churn: 2 };
  }

  private async generateCertificate(badgeType: string, year: number): Promise<string> {
    // Would generate PDF certificate
    const filename = `certificate_${badgeType}_${year}_${this.orgId}.pdf`;
    return `/certificates/${filename}`;
  }

  async getEmbedCode(badgeId: string): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data: badge } = await supabase
      .from('award_badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    const badgeName = badge.badge_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

    return `<a href="${badge.certificate_url}" target="_blank">
  <img src="/badges/${badge.badge_type}.png" alt="${badgeName} ${badge.year}" width="150" />
</a>`;
  }

  async getAwards(brandId?: string, year?: number): Promise<AwardBadge[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('award_badges')
      .select('*')
      .eq('org_id', this.orgId)
      .order('generated_at', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    if (year) {
      query = query.eq('year', year);
    }

    const { data } = await query;

    return (data || []).map(b => this.mapToBadge(b));
  }

  async createEligibilityRule(
    badgeType: string,
    criteria: AwardCriteria,
    minScore: number
  ): Promise<EligibilityRule> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('award_eligibility_rules')
      .insert({
        badge_type: badgeType,
        criteria,
        min_score: minScore,
      })
      .select()
      .single();

    return {
      id: data.id,
      badgeType: data.badge_type,
      criteria: data.criteria,
      minScore: data.min_score,
      active: data.active,
    };
  }

  async getRules(): Promise<EligibilityRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('award_eligibility_rules')
      .select('*')
      .order('badge_type');

    return (data || []).map(r => ({
      id: r.id,
      badgeType: r.badge_type,
      criteria: r.criteria,
      minScore: r.min_score,
      active: r.active,
    }));
  }

  private mapToBadge(data: any): AwardBadge {
    return {
      id: data.id,
      orgId: data.org_id,
      brandId: data.brand_id,
      badgeType: data.badge_type,
      year: data.year,
      criteriaMet: data.criteria_met,
      score: data.score,
      certificateUrl: data.certificate_url,
      generatedAt: new Date(data.generated_at),
    };
  }
}
```

## API Endpoints

### POST /api/awards/generate

Generate awards for eligible criteria.

### GET /api/awards/eligibility

Check award eligibility.

### GET /api/awards

Get awards.

### GET /api/awards/:id/embed

Get SEO embed code.

### POST /api/awards/rules

Create eligibility rule.

## Implementation Tasks

- [ ] Create 119_ai_industry_awards_engine.sql
- [ ] Implement IndustryAwardsEngine
- [ ] Create API endpoints
- [ ] Create AwardsDashboard.tsx
- [ ] Create AwardCertificateGenerator.ts
- [ ] Integrate with Reputation Engine

---

*Phase 67 - AI Industry Awards Engine Complete*
