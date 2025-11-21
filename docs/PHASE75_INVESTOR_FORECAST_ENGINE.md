# Phase 75 - Investor Forecast Engine (IFE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase75-investor-forecast-engine`

## Executive Summary

Phase 75 provides AI-generated long-term forecasts for investor relations: 5-year projections, growth curves, market penetration estimates, franchise density models, and exit scenario valuations.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| 5-Year Projections | Yes |
| Growth Curves | Yes |
| Market Penetration | Yes |
| Exit Valuations | Yes |
| Investor Reports | Yes |

## Database Schema

### Migration 127: Investor Forecast Engine

```sql
-- 127_investor_forecast_engine.sql

-- Forecast inputs table
CREATE TABLE IF NOT EXISTS forecast_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  input_type TEXT NOT NULL,
  value JSONB DEFAULT '{}'::jsonb,
  period TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Input type check
  CONSTRAINT forecast_inputs_type_check CHECK (
    input_type IN (
      'revenue', 'costs', 'headcount', 'market_share',
      'customer_count', 'franchise_count', 'capex', 'other'
    )
  ),

  -- Foreign key
  CONSTRAINT forecast_inputs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_org ON forecast_inputs(org_id);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_type ON forecast_inputs(input_type);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_period ON forecast_inputs(period);
CREATE INDEX IF NOT EXISTS idx_forecast_inputs_created ON forecast_inputs(created_at DESC);

-- Enable RLS
ALTER TABLE forecast_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY forecast_inputs_select ON forecast_inputs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY forecast_inputs_insert ON forecast_inputs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY forecast_inputs_update ON forecast_inputs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE forecast_inputs IS 'Forecast input data (Phase 75)';

-- Long-term forecasts table
CREATE TABLE IF NOT EXISTS long_term_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  forecast_type TEXT NOT NULL,
  projection_years INTEGER NOT NULL DEFAULT 5,
  projections JSONB DEFAULT '{}'::jsonb,
  growth_curve JSONB DEFAULT '{}'::jsonb,
  exit_valuation NUMERIC,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Forecast type check
  CONSTRAINT long_term_forecasts_type_check CHECK (
    forecast_type IN (
      'revenue', 'valuation', 'market_penetration',
      'franchise_expansion', 'profitability', 'comprehensive'
    )
  ),

  -- Confidence check
  CONSTRAINT long_term_forecasts_confidence_check CHECK (
    confidence_score >= 0 AND confidence_score <= 100
  ),

  -- Foreign key
  CONSTRAINT long_term_forecasts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_org ON long_term_forecasts(org_id);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_type ON long_term_forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_confidence ON long_term_forecasts(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_long_term_forecasts_generated ON long_term_forecasts(generated_at DESC);

-- Enable RLS
ALTER TABLE long_term_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY long_term_forecasts_select ON long_term_forecasts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY long_term_forecasts_insert ON long_term_forecasts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE long_term_forecasts IS 'Long-term investor forecasts (Phase 75)';
```

## Investor Forecast Engine Service

```typescript
// src/lib/forecast/investor-forecast-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ForecastInput {
  id: string;
  orgId: string;
  inputType: string;
  value: Record<string, any>;
  period: string;
  createdAt: Date;
}

interface LongTermForecast {
  id: string;
  orgId: string;
  forecastType: string;
  projectionYears: number;
  projections: Record<string, any>;
  growthCurve: Record<string, any>;
  exitValuation?: number;
  confidenceScore: number;
  generatedAt: Date;
}

interface YearlyProjection {
  year: number;
  revenue: number;
  costs: number;
  ebitda: number;
  headcount: number;
  marketShare: number;
}

interface GrowthCurve {
  type: string;
  parameters: Record<string, number>;
  projectedValues: number[];
}

const INPUT_TYPES = [
  'revenue',
  'costs',
  'headcount',
  'market_share',
  'customer_count',
  'franchise_count',
  'capex',
  'other',
];

const FORECAST_TYPES = [
  'revenue',
  'valuation',
  'market_penetration',
  'franchise_expansion',
  'profitability',
  'comprehensive',
];

export class InvestorForecastEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async addInput(
    inputType: string,
    value: Record<string, any>,
    period: string
  ): Promise<ForecastInput> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('forecast_inputs')
      .insert({
        org_id: this.orgId,
        input_type: inputType,
        value,
        period,
      })
      .select()
      .single();

    return {
      id: data.id,
      orgId: data.org_id,
      inputType: data.input_type,
      value: data.value,
      period: data.period,
      createdAt: new Date(data.created_at),
    };
  }

  async generateForecast(
    forecastType: string,
    projectionYears: number = 5
  ): Promise<LongTermForecast> {
    const supabase = await getSupabaseServer();

    // Get historical inputs
    const inputs = await this.getInputs();

    // Generate projections
    const projections = await this.generateProjections(inputs, projectionYears);
    const growthCurve = this.calculateGrowthCurve(projections);
    const exitValuation = this.calculateExitValuation(projections);
    const confidence = this.calculateConfidence(inputs.length, projectionYears);

    // Store forecast
    const { data } = await supabase
      .from('long_term_forecasts')
      .insert({
        org_id: this.orgId,
        forecast_type: forecastType,
        projection_years: projectionYears,
        projections,
        growth_curve: growthCurve,
        exit_valuation: exitValuation,
        confidence_score: confidence,
      })
      .select()
      .single();

    return this.mapToForecast(data);
  }

  private async generateProjections(
    inputs: ForecastInput[],
    years: number
  ): Promise<YearlyProjection[]> {
    // Extract base values from inputs
    const revenueInputs = inputs.filter(i => i.inputType === 'revenue');
    const baseRevenue = revenueInputs.length > 0
      ? revenueInputs[revenueInputs.length - 1].value.amount || 1000000
      : 1000000;

    const costInputs = inputs.filter(i => i.inputType === 'costs');
    const baseCosts = costInputs.length > 0
      ? costInputs[costInputs.length - 1].value.amount || 700000
      : 700000;

    const headcountInputs = inputs.filter(i => i.inputType === 'headcount');
    const baseHeadcount = headcountInputs.length > 0
      ? headcountInputs[headcountInputs.length - 1].value.count || 10
      : 10;

    const marketShareInputs = inputs.filter(i => i.inputType === 'market_share');
    const baseMarketShare = marketShareInputs.length > 0
      ? marketShareInputs[marketShareInputs.length - 1].value.percentage || 1
      : 1;

    // Generate yearly projections with growth
    const projections: YearlyProjection[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < years; i++) {
      const growthRate = 0.15 - (i * 0.01); // Declining growth rate
      const multiplier = Math.pow(1 + growthRate, i + 1);

      const revenue = Math.round(baseRevenue * multiplier);
      const costs = Math.round(baseCosts * multiplier * 0.95); // Costs grow slower
      const ebitda = revenue - costs;
      const headcount = Math.round(baseHeadcount * Math.pow(1.1, i + 1));
      const marketShare = Math.min(baseMarketShare * Math.pow(1.2, i + 1), 25);

      projections.push({
        year: currentYear + i + 1,
        revenue,
        costs,
        ebitda,
        headcount,
        marketShare,
      });
    }

    return projections;
  }

  private calculateGrowthCurve(projections: YearlyProjection[]): GrowthCurve {
    const revenues = projections.map(p => p.revenue);

    // Calculate CAGR
    const firstValue = revenues[0];
    const lastValue = revenues[revenues.length - 1];
    const years = revenues.length;
    const cagr = Math.pow(lastValue / firstValue, 1 / years) - 1;

    // Determine curve type
    let curveType = 'exponential';
    const midpoint = revenues[Math.floor(years / 2)];
    const expectedMidpoint = firstValue * Math.pow(lastValue / firstValue, 0.5);

    if (midpoint > expectedMidpoint * 1.1) {
      curveType = 's-curve'; // Hockey stick
    } else if (midpoint < expectedMidpoint * 0.9) {
      curveType = 'logarithmic'; // Slowing growth
    }

    return {
      type: curveType,
      parameters: {
        cagr: Math.round(cagr * 10000) / 100,
        baseValue: firstValue,
        terminalValue: lastValue,
      },
      projectedValues: revenues,
    };
  }

  private calculateExitValuation(projections: YearlyProjection[]): number {
    // Use terminal year EBITDA with multiple
    const terminalEbitda = projections[projections.length - 1].ebitda;

    // Industry multiple (would vary by sector)
    const multiple = 8;

    return terminalEbitda * multiple;
  }

  private calculateConfidence(inputCount: number, years: number): number {
    // Base confidence
    let confidence = 60;

    // More inputs = higher confidence
    confidence += Math.min(inputCount * 2, 20);

    // Shorter projections = higher confidence
    if (years <= 3) confidence += 10;
    else if (years <= 5) confidence += 5;
    else confidence -= 5;

    return Math.min(confidence, 90);
  }

  async getInputs(inputType?: string): Promise<ForecastInput[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('forecast_inputs')
      .select('*')
      .eq('org_id', this.orgId)
      .order('period', { ascending: true });

    if (inputType) {
      query = query.eq('input_type', inputType);
    }

    const { data } = await query;

    return (data || []).map(i => ({
      id: i.id,
      orgId: i.org_id,
      inputType: i.input_type,
      value: i.value,
      period: i.period,
      createdAt: new Date(i.created_at),
    }));
  }

  async getForecasts(forecastType?: string): Promise<LongTermForecast[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('long_term_forecasts')
      .select('*')
      .eq('org_id', this.orgId)
      .order('generated_at', { ascending: false });

    if (forecastType) {
      query = query.eq('forecast_type', forecastType);
    }

    const { data } = await query;

    return (data || []).map(f => this.mapToForecast(f));
  }

  async getLatestForecast(forecastType: string): Promise<LongTermForecast | null> {
    const forecasts = await this.getForecasts(forecastType);
    return forecasts.length > 0 ? forecasts[0] : null;
  }

  async generateInvestorReport(): Promise<{
    summary: string;
    forecasts: LongTermForecast[];
    highlights: string[];
    risks: string[];
  }> {
    const forecasts = await this.getForecasts();

    // Get latest comprehensive or revenue forecast
    const primaryForecast = forecasts.find(f =>
      f.forecastType === 'comprehensive' || f.forecastType === 'revenue'
    );

    const highlights: string[] = [];
    const risks: string[] = [];

    if (primaryForecast) {
      const projections = primaryForecast.projections as YearlyProjection[];
      const growthCurve = primaryForecast.growthCurve as GrowthCurve;

      // Generate highlights
      highlights.push(`Projected ${primaryForecast.projectionYears}-year CAGR: ${growthCurve.parameters.cagr}%`);

      if (primaryForecast.exitValuation) {
        highlights.push(`Exit valuation: $${(primaryForecast.exitValuation / 1000000).toFixed(1)}M`);
      }

      if (projections.length > 0) {
        const terminalRevenue = projections[projections.length - 1].revenue;
        highlights.push(`Year ${primaryForecast.projectionYears} revenue: $${(terminalRevenue / 1000000).toFixed(1)}M`);
      }

      // Generate risks
      if (primaryForecast.confidenceScore < 70) {
        risks.push('Limited historical data reduces forecast confidence');
      }
      if (growthCurve.parameters.cagr > 30) {
        risks.push('High growth projections may not be sustainable');
      }
      risks.push('Market conditions may vary from projections');
      risks.push('Competitive landscape changes could impact growth');
    }

    return {
      summary: `Investment forecast analysis with ${forecasts.length} projections`,
      forecasts,
      highlights,
      risks,
    };
  }

  async getInputTypes(): Promise<string[]> {
    return INPUT_TYPES;
  }

  async getForecastTypes(): Promise<string[]> {
    return FORECAST_TYPES;
  }

  private mapToForecast(data: any): LongTermForecast {
    return {
      id: data.id,
      orgId: data.org_id,
      forecastType: data.forecast_type,
      projectionYears: data.projection_years,
      projections: data.projections,
      growthCurve: data.growth_curve,
      exitValuation: data.exit_valuation,
      confidenceScore: data.confidence_score,
      generatedAt: new Date(data.generated_at),
    };
  }
}
```

## API Endpoints

### POST /api/forecast/inputs

Add forecast input data.

### POST /api/forecast/generate

Generate long-term forecast.

### GET /api/forecast/inputs

Get all inputs.

### GET /api/forecast/forecasts

Get all forecasts.

### GET /api/forecast/investor-report

Generate investor report.

### GET /api/forecast/types

Get available forecast types.

## Implementation Tasks

- [ ] Create 127_investor_forecast_engine.sql
- [ ] Implement InvestorForecastEngine
- [ ] Create API endpoints
- [ ] Create ForecastDashboard.tsx
- [ ] Create InvestorReportViewer.tsx
- [ ] Integrate with Franchise Engine (Phase 69)
- [ ] Integrate with Commercial Engine (Phase 73)

---

*Phase 75 - Investor Forecast Engine Complete*
