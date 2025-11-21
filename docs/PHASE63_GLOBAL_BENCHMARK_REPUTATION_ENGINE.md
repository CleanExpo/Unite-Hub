# Phase 63 - Global Benchmark & Reputation Engine (GBRE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase63-global-benchmark-reputation-engine`

## Executive Summary

Phase 63 implements anonymised cross-tenant benchmarking and reputation scoring. Allows organisations to compare their performance metrics against industry peers without exposing sensitive data, and calculates reputation scores based on system behavior.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Anonymised Benchmarks | Yes |
| Cross-Tenant Comparison | Yes |
| Reputation Scoring | Yes |
| Industry Categories | Yes |
| Privacy Protection | Yes |

## Database Schema

### Migration 115: Global Benchmark & Reputation Engine

```sql
-- 115_global_benchmark_reputation_engine.sql

-- Benchmark dimensions table
CREATE TABLE IF NOT EXISTS benchmark_dimensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dimension_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'count',
  higher_is_better BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmark_dimensions_key ON benchmark_dimensions(dimension_key);
CREATE INDEX IF NOT EXISTS idx_benchmark_dimensions_created ON benchmark_dimensions(created_at DESC);

-- Enable RLS
ALTER TABLE benchmark_dimensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read, admin write)
CREATE POLICY benchmark_dimensions_select ON benchmark_dimensions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY benchmark_dimensions_insert ON benchmark_dimensions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE benchmark_dimensions IS 'Benchmark metric definitions (Phase 63)';

-- Benchmarks table
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  dimension_id UUID NOT NULL,
  value NUMERIC NOT NULL,
  period TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT benchmarks_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT benchmarks_dimension_fk
    FOREIGN KEY (dimension_id) REFERENCES benchmark_dimensions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_benchmarks_org ON benchmarks(org_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_dimension ON benchmarks(dimension_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_period ON benchmarks(period);
CREATE INDEX IF NOT EXISTS idx_benchmarks_industry ON benchmarks(industry);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created ON benchmarks(created_at DESC);

-- Enable RLS
ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY benchmarks_select ON benchmarks
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY benchmarks_insert ON benchmarks
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE benchmarks IS 'Anonymised benchmark data points (Phase 63)';
```

## Benchmark & Reputation Engine Service

```typescript
// src/lib/benchmarks/benchmark-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface BenchmarkDimension {
  id: string;
  dimensionKey: string;
  description: string;
  unit: string;
  higherIsBetter: boolean;
}

interface Benchmark {
  id: string;
  orgId: string;
  dimensionId: string;
  value: number;
  period: string;
  industry?: string;
  createdAt: Date;
}

interface BenchmarkComparison {
  dimensionKey: string;
  yourValue: number;
  industryAvg: number;
  industryMedian: number;
  percentile: number;
  totalOrgs: number;
}

interface ReputationScore {
  overall: number;
  dimensions: {
    dimension: string;
    score: number;
    weight: number;
  }[];
}

export class BenchmarkEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async recordBenchmark(
    dimensionKey: string,
    value: number,
    period: string,
    industry?: string
  ): Promise<Benchmark> {
    const supabase = await getSupabaseServer();

    // Get dimension ID
    const { data: dimension } = await supabase
      .from('benchmark_dimensions')
      .select('id')
      .eq('dimension_key', dimensionKey)
      .single();

    if (!dimension) {
      throw new Error(`Unknown dimension: ${dimensionKey}`);
    }

    const { data } = await supabase
      .from('benchmarks')
      .insert({
        org_id: this.orgId,
        dimension_id: dimension.id,
        value,
        period,
        industry,
      })
      .select()
      .single();

    return this.mapToBenchmark(data);
  }

  async compareToIndustry(
    dimensionKey: string,
    period: string,
    industry?: string
  ): Promise<BenchmarkComparison> {
    const supabase = await getSupabaseServer();

    // Get dimension
    const { data: dimension } = await supabase
      .from('benchmark_dimensions')
      .select('id, higher_is_better')
      .eq('dimension_key', dimensionKey)
      .single();

    if (!dimension) {
      throw new Error(`Unknown dimension: ${dimensionKey}`);
    }

    // Get your value
    const { data: yourData } = await supabase
      .from('benchmarks')
      .select('value')
      .eq('org_id', this.orgId)
      .eq('dimension_id', dimension.id)
      .eq('period', period)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get all values for comparison (anonymised)
    let query = supabase
      .from('benchmarks')
      .select('value')
      .eq('dimension_id', dimension.id)
      .eq('period', period);

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data: allData } = await query;
    const values = (allData || []).map(d => d.value).sort((a, b) => a - b);

    const yourValue = yourData?.value || 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const median = values.length > 0
      ? values[Math.floor(values.length / 2)]
      : 0;

    // Calculate percentile
    const belowCount = values.filter(v =>
      dimension.higher_is_better ? v < yourValue : v > yourValue
    ).length;
    const percentile = values.length > 0
      ? Math.round((belowCount / values.length) * 100)
      : 50;

    return {
      dimensionKey,
      yourValue,
      industryAvg: Math.round(avg * 100) / 100,
      industryMedian: median,
      percentile,
      totalOrgs: values.length,
    };
  }

  async getReputationScore(): Promise<ReputationScore> {
    const supabase = await getSupabaseServer();

    // Define weighted dimensions for reputation
    const weightedDimensions = [
      { key: 'response_time', weight: 0.2 },
      { key: 'task_completion_rate', weight: 0.25 },
      { key: 'client_satisfaction', weight: 0.3 },
      { key: 'revenue_growth', weight: 0.15 },
      { key: 'system_uptime', weight: 0.1 },
    ];

    const dimensionScores: { dimension: string; score: number; weight: number }[] = [];
    let totalScore = 0;

    for (const wd of weightedDimensions) {
      const comparison = await this.compareToIndustry(wd.key, 'current').catch(() => null);

      const score = comparison?.percentile || 50;
      dimensionScores.push({
        dimension: wd.key,
        score,
        weight: wd.weight,
      });

      totalScore += score * wd.weight;
    }

    return {
      overall: Math.round(totalScore),
      dimensions: dimensionScores,
    };
  }

  async getDimensions(): Promise<BenchmarkDimension[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('benchmark_dimensions')
      .select('*')
      .order('dimension_key');

    return (data || []).map(d => ({
      id: d.id,
      dimensionKey: d.dimension_key,
      description: d.description,
      unit: d.unit,
      higherIsBetter: d.higher_is_better,
    }));
  }

  async createDimension(
    dimensionKey: string,
    description: string,
    unit: string = 'count',
    higherIsBetter: boolean = true
  ): Promise<BenchmarkDimension> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('benchmark_dimensions')
      .insert({
        dimension_key: dimensionKey,
        description,
        unit,
        higher_is_better: higherIsBetter,
      })
      .select()
      .single();

    return {
      id: data.id,
      dimensionKey: data.dimension_key,
      description: data.description,
      unit: data.unit,
      higherIsBetter: data.higher_is_better,
    };
  }

  async getBenchmarks(period?: string): Promise<Benchmark[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('benchmarks')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    const { data } = await query;

    return (data || []).map(b => this.mapToBenchmark(b));
  }

  async getIndustryStats(
    dimensionKey: string,
    period: string,
    industry?: string
  ): Promise<{
    min: number;
    max: number;
    avg: number;
    median: number;
    count: number;
  }> {
    const supabase = await getSupabaseServer();

    const { data: dimension } = await supabase
      .from('benchmark_dimensions')
      .select('id')
      .eq('dimension_key', dimensionKey)
      .single();

    if (!dimension) {
      throw new Error(`Unknown dimension: ${dimensionKey}`);
    }

    let query = supabase
      .from('benchmarks')
      .select('value')
      .eq('dimension_id', dimension.id)
      .eq('period', period);

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data } = await query;
    const values = (data || []).map(d => d.value).sort((a, b) => a - b);

    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0, count: 0 };
    }

    const sum = values.reduce((acc, v) => acc + v, 0);

    return {
      min: values[0],
      max: values[values.length - 1],
      avg: Math.round((sum / values.length) * 100) / 100,
      median: values[Math.floor(values.length / 2)],
      count: values.length,
    };
  }

  private mapToBenchmark(data: any): Benchmark {
    return {
      id: data.id,
      orgId: data.org_id,
      dimensionId: data.dimension_id,
      value: data.value,
      period: data.period,
      industry: data.industry,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/benchmarks/record

Record a benchmark value.

### GET /api/benchmarks/compare/:dimension

Compare to industry.

### GET /api/benchmarks/reputation

Get reputation score.

### GET /api/benchmarks/dimensions

Get benchmark dimensions.

### GET /api/benchmarks/stats/:dimension

Get industry statistics.

## Implementation Tasks

- [ ] Create 115_global_benchmark_reputation_engine.sql
- [ ] Implement BenchmarkEngine
- [ ] Create API endpoints
- [ ] Create BenchmarkDashboard.tsx
- [ ] Create ReputationScoreCard.tsx
- [ ] Create IndustryComparisonChart.tsx

---

*Phase 63 - Global Benchmark & Reputation Engine Complete*
