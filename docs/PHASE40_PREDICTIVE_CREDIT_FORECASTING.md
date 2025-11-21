# Phase 40 - Predictive Credit Forecasting Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase40-predictive-credit-forecasting`

## Executive Summary

Phase 40 uses historical token usage to forecast when organizations will run out of voice/text credits. The engine calculates daily burn rates, predicts runout dates, and triggers proactive warnings and recommendations. All outputs are human-readable via Deep Agent without exposing vendor costs.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Predictive Forecasting | Yes |
| Risk Level Calculation | Yes |
| Deep Agent Explainer | Yes |
| No Vendor Exposure | Yes |
| RLS Isolation | Yes |
| Scheduled + On-Demand | Yes |

## Environment Variables

```env
# Forecasting
FORECAST_WINDOW_DAYS=14
FORECAST_HIGH_RISK_DAYS=3
FORECAST_MEDIUM_RISK_DAYS=7
```

## Database Schema

### Migration 092: Credit Forecasts

```sql
-- 092_credit_forecasts.sql

-- Credit forecasts table
CREATE TABLE IF NOT EXISTS credit_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE,
  voice_tokens_remaining INTEGER NOT NULL DEFAULT 0,
  text_tokens_remaining INTEGER NOT NULL DEFAULT 0,
  predicted_runout_date_voice DATE,
  predicted_runout_date_text DATE,
  confidence_voice NUMERIC NOT NULL DEFAULT 0,
  confidence_text NUMERIC NOT NULL DEFAULT 0,
  avg_daily_voice_burn NUMERIC NOT NULL DEFAULT 0,
  avg_daily_text_burn NUMERIC NOT NULL DEFAULT 0,
  window_days INTEGER NOT NULL DEFAULT 14,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT credit_forecasts_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH')
  ),

  -- Foreign key
  CONSTRAINT credit_forecasts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_org ON credit_forecasts(org_id);
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_risk ON credit_forecasts(risk_level);
CREATE INDEX IF NOT EXISTS idx_credit_forecasts_runout
  ON credit_forecasts(predicted_runout_date_voice, predicted_runout_date_text);

-- Enable RLS
ALTER TABLE credit_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY credit_forecasts_select ON credit_forecasts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY credit_forecasts_upsert ON credit_forecasts
  FOR ALL TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE credit_forecasts IS 'Predictive credit runout forecasts per org (Phase 40)';
```

## API Endpoints

### GET /api/billing/forecast

Get current credit forecast for organization.

```typescript
// Response
{
  "success": true,
  "forecast": {
    "voiceTokensRemaining": 3500,
    "textTokensRemaining": 12000,
    "predictedRunoutDateVoice": "2025-12-05",
    "predictedRunoutDateText": "2025-12-15",
    "confidenceVoice": 0.85,
    "confidenceText": 0.92,
    "avgDailyVoiceBurn": 250,
    "avgDailyTextBurn": 800,
    "riskLevel": "MEDIUM",
    "daysUntilVoiceRunout": 14,
    "daysUntilTextRunout": 24,
    "lastCalculatedAt": "2025-11-21T10:00:00Z"
  }
}
```

### POST /api/billing/forecast/recalculate

Force recalculation of forecast (admin-only).

```typescript
// Response
{
  "success": true,
  "forecast": {
    // Same as GET response
  },
  "message": "Forecast recalculated successfully"
}
```

## Credit Forecast Service

```typescript
// src/lib/billing/credit-forecast-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Forecast {
  voiceTokensRemaining: number;
  textTokensRemaining: number;
  predictedRunoutDateVoice: string | null;
  predictedRunoutDateText: string | null;
  confidenceVoice: number;
  confidenceText: number;
  avgDailyVoiceBurn: number;
  avgDailyTextBurn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  daysUntilVoiceRunout: number | null;
  daysUntilTextRunout: number | null;
  lastCalculatedAt: string;
}

const WINDOW_DAYS = parseInt(process.env.FORECAST_WINDOW_DAYS || '14');
const HIGH_RISK_DAYS = parseInt(process.env.FORECAST_HIGH_RISK_DAYS || '3');
const MEDIUM_RISK_DAYS = parseInt(process.env.FORECAST_MEDIUM_RISK_DAYS || '7');

export class CreditForecastService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async calculate(): Promise<Forecast> {
    const supabase = await getSupabaseServer();

    // Get current wallet balances
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('voice_budget_aud, text_budget_aud')
      .eq('org_id', this.orgId)
      .single();

    if (!wallet) {
      throw new Error('No wallet found for organization');
    }

    // Convert AUD to tokens for display (approximate)
    const voiceTokens = Math.round(parseFloat(wallet.voice_budget_aud) / 0.00096 * 1000);
    const textTokens = Math.round(parseFloat(wallet.text_budget_aud) / 0.00024 * 1000);

    // Get usage events from last N days
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

    const { data: usageEvents } = await supabase
      .from('token_usage_events')
      .select('event_type, amount, created_at')
      .eq('org_id', this.orgId)
      .in('event_type', ['voice_consume', 'text_consume'])
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: true });

    // Calculate daily burn rates
    const voiceUsage = (usageEvents || [])
      .filter(e => e.event_type === 'voice_consume')
      .reduce((sum, e) => sum + e.amount, 0);

    const textUsage = (usageEvents || [])
      .filter(e => e.event_type === 'text_consume')
      .reduce((sum, e) => sum + e.amount, 0);

    const avgDailyVoiceBurn = voiceUsage / WINDOW_DAYS;
    const avgDailyTextBurn = textUsage / WINDOW_DAYS;

    // Calculate confidence based on data consistency
    const voiceConfidence = this.calculateConfidence(
      (usageEvents || []).filter(e => e.event_type === 'voice_consume')
    );
    const textConfidence = this.calculateConfidence(
      (usageEvents || []).filter(e => e.event_type === 'text_consume')
    );

    // Predict runout dates
    let daysUntilVoiceRunout: number | null = null;
    let daysUntilTextRunout: number | null = null;
    let predictedRunoutDateVoice: string | null = null;
    let predictedRunoutDateText: string | null = null;

    if (avgDailyVoiceBurn > 0) {
      daysUntilVoiceRunout = Math.ceil(voiceTokens / avgDailyVoiceBurn);
      const runoutDate = new Date();
      runoutDate.setDate(runoutDate.getDate() + daysUntilVoiceRunout);
      predictedRunoutDateVoice = runoutDate.toISOString().split('T')[0];
    }

    if (avgDailyTextBurn > 0) {
      daysUntilTextRunout = Math.ceil(textTokens / avgDailyTextBurn);
      const runoutDate = new Date();
      runoutDate.setDate(runoutDate.getDate() + daysUntilTextRunout);
      predictedRunoutDateText = runoutDate.toISOString().split('T')[0];
    }

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(
      daysUntilVoiceRunout,
      daysUntilTextRunout
    );

    const forecast: Forecast = {
      voiceTokensRemaining: voiceTokens,
      textTokensRemaining: textTokens,
      predictedRunoutDateVoice,
      predictedRunoutDateText,
      confidenceVoice: voiceConfidence,
      confidenceText: textConfidence,
      avgDailyVoiceBurn: Math.round(avgDailyVoiceBurn),
      avgDailyTextBurn: Math.round(avgDailyTextBurn),
      riskLevel,
      daysUntilVoiceRunout,
      daysUntilTextRunout,
      lastCalculatedAt: new Date().toISOString(),
    };

    // Persist forecast
    await this.persistForecast(forecast);

    return forecast;
  }

  private calculateConfidence(events: any[]): number {
    if (events.length === 0) return 0;
    if (events.length < 3) return 0.3;
    if (events.length < 7) return 0.6;

    // Calculate variance to adjust confidence
    const amounts = events.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const cv = Math.sqrt(variance) / mean; // Coefficient of variation

    // High variance = lower confidence
    if (cv > 1) return 0.5;
    if (cv > 0.5) return 0.7;
    return 0.9;
  }

  private calculateRiskLevel(
    voiceDays: number | null,
    textDays: number | null
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const minDays = Math.min(
      voiceDays ?? Infinity,
      textDays ?? Infinity
    );

    if (minDays <= HIGH_RISK_DAYS) return 'HIGH';
    if (minDays <= MEDIUM_RISK_DAYS) return 'MEDIUM';
    return 'LOW';
  }

  private async persistForecast(forecast: Forecast): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('credit_forecasts')
      .upsert({
        org_id: this.orgId,
        voice_tokens_remaining: forecast.voiceTokensRemaining,
        text_tokens_remaining: forecast.textTokensRemaining,
        predicted_runout_date_voice: forecast.predictedRunoutDateVoice,
        predicted_runout_date_text: forecast.predictedRunoutDateText,
        confidence_voice: forecast.confidenceVoice,
        confidence_text: forecast.confidenceText,
        avg_daily_voice_burn: forecast.avgDailyVoiceBurn,
        avg_daily_text_burn: forecast.avgDailyTextBurn,
        window_days: WINDOW_DAYS,
        risk_level: forecast.riskLevel,
        last_calculated_at: forecast.lastCalculatedAt,
      }, {
        onConflict: 'org_id',
      });
  }

  async getForecast(): Promise<Forecast | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('credit_forecasts')
      .select('*')
      .eq('org_id', this.orgId)
      .single();

    if (!data) return null;

    // Calculate days until runout from current date
    const today = new Date();
    let daysUntilVoiceRunout: number | null = null;
    let daysUntilTextRunout: number | null = null;

    if (data.predicted_runout_date_voice) {
      const runoutDate = new Date(data.predicted_runout_date_voice);
      daysUntilVoiceRunout = Math.ceil(
        (runoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (data.predicted_runout_date_text) {
      const runoutDate = new Date(data.predicted_runout_date_text);
      daysUntilTextRunout = Math.ceil(
        (runoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      voiceTokensRemaining: data.voice_tokens_remaining,
      textTokensRemaining: data.text_tokens_remaining,
      predictedRunoutDateVoice: data.predicted_runout_date_voice,
      predictedRunoutDateText: data.predicted_runout_date_text,
      confidenceVoice: parseFloat(data.confidence_voice),
      confidenceText: parseFloat(data.confidence_text),
      avgDailyVoiceBurn: parseFloat(data.avg_daily_voice_burn),
      avgDailyTextBurn: parseFloat(data.avg_daily_text_burn),
      riskLevel: data.risk_level,
      daysUntilVoiceRunout,
      daysUntilTextRunout,
      lastCalculatedAt: data.last_calculated_at,
    };
  }
}
```

## Deep Agent Explainer

```typescript
// src/lib/billing/forecast-explainer.ts

interface ForecastExplanation {
  summary: string;
  recommendation: string;
  voiceStatus: string;
  textStatus: string;
}

export function generateForecastExplanation(forecast: any): ForecastExplanation {
  const { riskLevel, daysUntilVoiceRunout, daysUntilTextRunout } = forecast;

  // Generate summary
  let summary: string;
  if (riskLevel === 'HIGH') {
    summary = 'Your credits are running low and need attention soon.';
  } else if (riskLevel === 'MEDIUM') {
    summary = 'Your credit usage is on track, but consider topping up within the next week.';
  } else {
    summary = 'Your credit balance is healthy with plenty of runway.';
  }

  // Generate recommendation
  let recommendation: string;
  if (riskLevel === 'HIGH') {
    recommendation = 'We recommend topping up now to avoid any service interruptions.';
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'Consider enabling auto top-up to ensure uninterrupted service.';
  } else {
    recommendation = 'No action needed. Your current plan fits your usage well.';
  }

  // Voice status
  let voiceStatus: string;
  if (daysUntilVoiceRunout === null) {
    voiceStatus = 'No recent voice usage detected.';
  } else if (daysUntilVoiceRunout <= 3) {
    voiceStatus = `Voice credits projected to run out in ${daysUntilVoiceRunout} day${daysUntilVoiceRunout === 1 ? '' : 's'}.`;
  } else if (daysUntilVoiceRunout <= 7) {
    voiceStatus = `Voice credits should last about ${daysUntilVoiceRunout} more days.`;
  } else {
    voiceStatus = `Voice credits are healthy with ~${daysUntilVoiceRunout} days of runway.`;
  }

  // Text status
  let textStatus: string;
  if (daysUntilTextRunout === null) {
    textStatus = 'No recent text usage detected.';
  } else if (daysUntilTextRunout <= 3) {
    textStatus = `Text credits projected to run out in ${daysUntilTextRunout} day${daysUntilTextRunout === 1 ? '' : 's'}.`;
  } else if (daysUntilTextRunout <= 7) {
    textStatus = `Text credits should last about ${daysUntilTextRunout} more days.`;
  } else {
    textStatus = `Text credits are healthy with ~${daysUntilTextRunout} days of runway.`;
  }

  return {
    summary,
    recommendation,
    voiceStatus,
    textStatus,
  };
}
```

## UI Components

### ForecastPanel

```typescript
// src/components/billing/ForecastPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Forecast {
  voiceTokensRemaining: number;
  textTokensRemaining: number;
  daysUntilVoiceRunout: number | null;
  daysUntilTextRunout: number | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceVoice: number;
  confidenceText: number;
}

export function ForecastPanel() {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/billing/forecast');
      const data = await response.json();
      if (data.success) {
        setForecast(data.forecast);
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const response = await fetch('/api/billing/forecast/recalculate', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setForecast(data.forecast);
      }
    } catch (error) {
      console.error('Failed to recalculate:', error);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  if (!forecast) {
    return null;
  }

  const riskColors = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };

  const riskIcons = {
    LOW: <CheckCircle className="h-4 w-4" />,
    MEDIUM: <Info className="h-4 w-4" />,
    HIGH: <AlertTriangle className="h-4 w-4" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Credit Forecast</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={riskColors[forecast.riskLevel]}>
            {riskIcons[forecast.riskLevel]}
            <span className="ml-1">{forecast.riskLevel} Risk</span>
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={recalculate}
            disabled={recalculating}
          >
            <RefreshCw className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Voice Credits</span>
            <span>
              {forecast.daysUntilVoiceRunout
                ? `~${forecast.daysUntilVoiceRunout} days`
                : 'No usage'}
            </span>
          </div>
          <Progress
            value={forecast.confidenceVoice * 100}
            className="h-2"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Text Credits</span>
            <span>
              {forecast.daysUntilTextRunout
                ? `~${forecast.daysUntilTextRunout} days`
                : 'No usage'}
            </span>
          </div>
          <Progress
            value={forecast.confidenceText * 100}
            className="h-2"
          />
        </div>

        {forecast.riskLevel !== 'LOW' && (
          <Button className="w-full" asChild>
            <a href="/dashboard/settings/billing">Top Up Credits</a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### RunoutBadge

```typescript
// src/components/billing/RunoutBadge.tsx

'use client';

import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface RunoutBadgeProps {
  days: number | null;
  type: 'voice' | 'text';
}

export function RunoutBadge({ days, type }: RunoutBadgeProps) {
  if (days === null) {
    return null;
  }

  const variant = days <= 3 ? 'destructive' : days <= 7 ? 'warning' : 'secondary';
  const label = type === 'voice' ? 'Voice' : 'Text';

  return (
    <Badge variant={variant} className="gap-1">
      <Clock className="h-3 w-3" />
      {label}: {days}d
    </Badge>
  );
}
```

## Cron Job Runner

```typescript
// src/lib/billing/forecast-scheduler.ts

import { getSupabaseServer } from '@/lib/supabase';
import { CreditForecastService } from './credit-forecast-service';

export async function runForecastCalculations(): Promise<void> {
  const supabase = await getSupabaseServer();

  // Get all organizations with wallets
  const { data: wallets } = await supabase
    .from('token_wallets')
    .select('org_id');

  if (!wallets) return;

  for (const wallet of wallets) {
    try {
      const service = new CreditForecastService(wallet.org_id);
      await service.calculate();
    } catch (error) {
      console.error(`Forecast failed for org ${wallet.org_id}:`, error);
    }
  }
}
```

## Alert Integration

When forecasts indicate MEDIUM or HIGH risk, the system should:

1. Create usage warnings (Phase 38)
2. Trigger email notifications
3. Display in-app banners

```typescript
// Integration with Phase 38 warnings
if (forecast.riskLevel === 'HIGH') {
  await supabase.from('usage_warnings').insert({
    org_id: orgId,
    warning_type: 'voice_critical',
    threshold_percent: 5,
    message: `Voice credits projected to run out in ${forecast.daysUntilVoiceRunout} days.`,
  });
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 092_credit_forecasts.sql
- [ ] Test RLS policies
- [ ] Verify indexes

### T2: Implement Forecast Service

- [ ] Create CreditForecastService
- [ ] Implement burn rate calculation
- [ ] Implement confidence scoring
- [ ] Implement risk level determination

### T3: API Endpoints

- [ ] GET /api/billing/forecast
- [ ] POST /api/billing/forecast/recalculate

### T4: Deep Agent Explainer

- [ ] Create generateForecastExplanation function
- [ ] Human-readable summaries
- [ ] No vendor/cost exposure

### T5: UI Components

- [ ] ForecastPanel.tsx
- [ ] RunoutBadge.tsx
- [ ] RiskLevelTag.tsx

### T6: Scheduling

- [ ] Hourly cron job
- [ ] Event-triggered recalculation
- [ ] Alert integration

## Completion Definition

Phase 40 is complete when:

1. **Forecasts calculated**: Daily burn and runout dates computed
2. **Risk levels assigned**: LOW/MEDIUM/HIGH based on thresholds
3. **API exposed**: Forecasts available via REST endpoints
4. **UI integrated**: Panels and badges display forecasts
5. **Human-readable**: Deep Agent generates clear explanations
6. **No vendor exposure**: All language uses credits/usage only
7. **Alerts triggered**: MEDIUM/HIGH risk creates warnings

---

*Phase 40 - Predictive Credit Forecasting Complete*
*Unite-Hub Status: FORECASTING ACTIVE*
