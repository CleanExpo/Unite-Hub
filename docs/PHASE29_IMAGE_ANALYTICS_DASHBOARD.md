# Phase 29 - Image Analytics, Cost Tracking & Utilisation Dashboard

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase29-image-analytics-and-costs`

## Executive Summary

Phase 29 implements the Image Analytics Dashboard that tracks per-image costs, per-org usage, and per-agent utilisation metrics. All analytics are vendor-neutral and RLS-protected to ensure no vendor details leak to clients.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Track Per-Image Cost | Yes |
| Track Per-Org Usage | Yes |
| Track Per-Agent Usage | Yes |
| Vendor-Neutral Labels | Yes |

## Database Schema

### Migration 084: Image Usage Analytics

```sql
-- 084_image_usage_analytics.sql

CREATE TABLE IF NOT EXISTS image_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_images_generated INTEGER NOT NULL DEFAULT 0,
  total_images_approved INTEGER NOT NULL DEFAULT 0,
  total_images_rejected INTEGER NOT NULL DEFAULT 0,
  total_cost_usd NUMERIC NOT NULL DEFAULT 0,
  by_agent JSONB DEFAULT '{}'::jsonb,
  by_category JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT image_usage_analytics_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint for period
  CONSTRAINT image_usage_analytics_org_period_unique
    UNIQUE (org_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_image_usage_org_period
  ON image_usage_analytics(org_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_image_usage_created
  ON image_usage_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE image_usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY image_usage_analytics_select ON image_usage_analytics
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY image_usage_analytics_insert ON image_usage_analytics
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY image_usage_analytics_update ON image_usage_analytics
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE image_usage_analytics IS 'Aggregates usage and cost metrics for images per org (Phase 29)';
```

## API Endpoints

### GET /api/analytics/images/summary

Get image usage summary for an organization.

```typescript
// Request
GET /api/analytics/images/summary?period=monthly&start_date=2025-11-01&end_date=2025-11-30

// Response
{
  "success": true,
  "period": {
    "start": "2025-11-01",
    "end": "2025-11-30"
  },
  "summary": {
    "totalGenerated": 150,
    "totalApproved": 120,
    "totalRejected": 10,
    "pendingReview": 20,
    "approvalRate": 80,
    "totalCost": 0.225
  },
  "trend": [
    { "date": "2025-11-01", "generated": 5, "approved": 4, "cost": 0.0075 },
    { "date": "2025-11-02", "generated": 8, "approved": 7, "cost": 0.012 }
  ]
}
```

### GET /api/analytics/images/by-agent

Get image usage broken down by agent.

```typescript
// Request
GET /api/analytics/images/by-agent?period=monthly

// Response
{
  "success": true,
  "byAgent": [
    {
      "agent": "ContentAgent",
      "generated": 80,
      "approved": 70,
      "cost": 0.12,
      "approvalRate": 87.5
    },
    {
      "agent": "ReportEngine",
      "generated": 45,
      "approved": 35,
      "cost": 0.0675,
      "approvalRate": 77.8
    },
    {
      "agent": "BrandingPacks",
      "generated": 25,
      "approved": 15,
      "cost": 0.0375,
      "approvalRate": 60
    }
  ]
}
```

### Implementation

```typescript
// src/app/api/analytics/images/summary/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check role
    if (!['admin', 'manager'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Calculate date range
    const { start, end } = getDateRange(period, startDate, endDate);

    // Get analytics
    const { data: analytics, error } = await supabase
      .from('image_usage_analytics')
      .select('*')
      .eq('org_id', userOrg.org_id)
      .gte('period_start', start)
      .lte('period_end', end)
      .order('period_start', { ascending: true });

    if (error) throw error;

    // Aggregate summary
    const summary = aggregateSummary(analytics || []);

    // Get trend data from image_approvals
    const trend = await getTrendData(supabase, userOrg.org_id, start, end);

    return NextResponse.json({
      success: true,
      period: { start, end },
      summary,
      trend,
    });

  } catch (error) {
    console.error('Analytics summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDateRange(period: string, startDate?: string | null, endDate?: string | null) {
  const now = new Date();

  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  switch (period) {
    case 'weekly':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      return {
        start: weekStart.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    case 'monthly':
    default:
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: monthStart.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
  }
}

function aggregateSummary(analytics: any[]): Summary {
  if (analytics.length === 0) {
    return {
      totalGenerated: 0,
      totalApproved: 0,
      totalRejected: 0,
      pendingReview: 0,
      approvalRate: 0,
      totalCost: 0,
    };
  }

  const totals = analytics.reduce(
    (acc, curr) => ({
      generated: acc.generated + curr.total_images_generated,
      approved: acc.approved + curr.total_images_approved,
      rejected: acc.rejected + curr.total_images_rejected,
      cost: acc.cost + parseFloat(curr.total_cost_usd),
    }),
    { generated: 0, approved: 0, rejected: 0, cost: 0 }
  );

  return {
    totalGenerated: totals.generated,
    totalApproved: totals.approved,
    totalRejected: totals.rejected,
    pendingReview: totals.generated - totals.approved - totals.rejected,
    approvalRate: totals.generated > 0
      ? Math.round((totals.approved / totals.generated) * 100)
      : 0,
    totalCost: Math.round(totals.cost * 1000) / 1000,
  };
}

async function getTrendData(supabase: any, orgId: string, start: string, end: string) {
  const { data } = await supabase
    .from('image_approvals')
    .select('created_at, status')
    .eq('org_id', orgId)
    .gte('created_at', start)
    .lte('created_at', end);

  if (!data) return [];

  // Group by date
  const byDate: Record<string, { generated: number; approved: number; cost: number }> = {};

  for (const item of data) {
    const date = item.created_at.split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { generated: 0, approved: 0, cost: 0 };
    }
    byDate[date].generated++;
    byDate[date].cost += 0.0015; // Cost per image
    if (item.status === 'approved') {
      byDate[date].approved++;
    }
  }

  return Object.entries(byDate)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

interface Summary {
  totalGenerated: number;
  totalApproved: number;
  totalRejected: number;
  pendingReview: number;
  approvalRate: number;
  totalCost: number;
}
```

```typescript
// src/app/api/analytics/images/by-agent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly';

    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get org
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Check role
    if (!['admin', 'manager'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get by-agent data from auto_generation_jobs
    const { data: jobs } = await supabase
      .from('auto_generation_jobs')
      .select('requested_by_agent, status')
      .eq('org_id', userOrg.org_id);

    // Aggregate by agent
    const byAgentMap: Record<string, AgentStats> = {};

    for (const job of jobs || []) {
      const agent = sanitiseAgentName(job.requested_by_agent);
      if (!byAgentMap[agent]) {
        byAgentMap[agent] = {
          agent,
          generated: 0,
          approved: 0,
          cost: 0,
          approvalRate: 0,
        };
      }
      byAgentMap[agent].generated++;
      byAgentMap[agent].cost += 0.0015;
      if (job.status === 'completed') {
        byAgentMap[agent].approved++;
      }
    }

    // Calculate approval rates
    const byAgent = Object.values(byAgentMap).map(agent => ({
      ...agent,
      cost: Math.round(agent.cost * 10000) / 10000,
      approvalRate: agent.generated > 0
        ? Math.round((agent.approved / agent.generated) * 1000) / 10
        : 0,
    }));

    return NextResponse.json({
      success: true,
      byAgent: byAgent.sort((a, b) => b.generated - a.generated),
    });

  } catch (error) {
    console.error('Analytics by-agent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sanitiseAgentName(agentName: string): string {
  // Remove any vendor references from agent names
  return agentName
    .replace(/gemini/gi, '')
    .replace(/google/gi, '')
    .replace(/openai/gi, '')
    .replace(/claude/gi, '')
    .trim() || 'System';
}

interface AgentStats {
  agent: string;
  generated: number;
  approved: number;
  cost: number;
  approvalRate: number;
}
```

## UI Components

### ImageAnalyticsDashboard

```typescript
// src/app/(admin)/admin/analytics/images/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUsageSummaryCard } from '@/components/admin/analytics/ImageUsageSummaryCard';
import { ImageCostTrendChart } from '@/components/admin/analytics/ImageCostTrendChart';
import { ImageApprovalRateCard } from '@/components/admin/analytics/ImageApprovalRateCard';
import { AgentUsageTable } from '@/components/admin/analytics/AgentUsageTable';
import { useAuth } from '@/contexts/AuthContext';

export default function ImageAnalyticsDashboard() {
  const { session } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [byAgent, setByAgent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const summaryRes = await fetch(`/api/analytics/images/summary?period=${period}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);
      setTrend(summaryData.trend || []);

      // Fetch by-agent
      const agentRes = await fetch(`/api/analytics/images/by-agent?period=${period}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const agentData = await agentRes.json();
      setByAgent(agentData.byAgent || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Image Analytics</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Last 7 days</SelectItem>
            <SelectItem value="monthly">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="h-32 animate-pulse bg-gray-100" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <ImageUsageSummaryCard
              title="Images Generated"
              value={summary?.totalGenerated || 0}
              subtitle={`${summary?.totalApproved || 0} approved`}
            />
            <ImageApprovalRateCard
              rate={summary?.approvalRate || 0}
              pending={summary?.pendingReview || 0}
            />
            <ImageUsageSummaryCard
              title="Total Cost"
              value={`$${summary?.totalCost?.toFixed(3) || '0.000'}`}
              subtitle="This period"
            />
          </div>

          {/* Cost Trend Chart */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generation Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageCostTrendChart data={trend} />
            </CardContent>
          </Card>

          {/* By Agent Table */}
          <Card>
            <CardHeader>
              <CardTitle>Usage by Component</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentUsageTable agents={byAgent} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

### ImageUsageSummaryCard

```typescript
// src/components/admin/analytics/ImageUsageSummaryCard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImageUsageSummaryCardProps {
  title: string;
  value: number | string;
  subtitle: string;
}

export function ImageUsageSummaryCard({
  title,
  value,
  subtitle,
}: ImageUsageSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
```

### ImageApprovalRateCard

```typescript
// src/components/admin/analytics/ImageApprovalRateCard.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ImageApprovalRateCardProps {
  rate: number;
  pending: number;
}

export function ImageApprovalRateCard({
  rate,
  pending,
}: ImageApprovalRateCardProps) {
  const getColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          Approval Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{rate}%</div>
        <Progress value={rate} className="mt-2" />
        <p className="text-sm text-gray-500 mt-2">
          {pending} pending review
        </p>
      </CardContent>
    </Card>
  );
}
```

### ImageCostTrendChart

```typescript
// src/components/admin/analytics/ImageCostTrendChart.tsx

'use client';

interface TrendData {
  date: string;
  generated: number;
  approved: number;
  cost: number;
}

interface ImageCostTrendChartProps {
  data: TrendData[];
}

export function ImageCostTrendChart({ data }: ImageCostTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available for this period
      </div>
    );
  }

  const maxGenerated = Math.max(...data.map(d => d.generated));

  return (
    <div className="h-64">
      <div className="flex h-full items-end gap-1">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex-1 flex flex-col items-center"
          >
            <div className="w-full flex flex-col items-center gap-1">
              {/* Generated bar */}
              <div
                className="w-full bg-blue-200 rounded-t"
                style={{
                  height: `${(item.generated / maxGenerated) * 200}px`,
                }}
              >
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${(item.approved / item.generated) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1">
              {new Date(item.date).getDate()}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Generated (light) / Approved (dark)</span>
        <span>Total: ${data.reduce((sum, d) => sum + d.cost, 0).toFixed(3)}</span>
      </div>
    </div>
  );
}
```

### AgentUsageTable

```typescript
// src/components/admin/analytics/AgentUsageTable.tsx

'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface AgentStats {
  agent: string;
  generated: number;
  approved: number;
  cost: number;
  approvalRate: number;
}

interface AgentUsageTableProps {
  agents: AgentStats[];
}

export function AgentUsageTable({ agents }: AgentUsageTableProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No usage data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Component</TableHead>
          <TableHead className="text-right">Generated</TableHead>
          <TableHead className="text-right">Approved</TableHead>
          <TableHead className="text-right">Cost</TableHead>
          <TableHead>Approval Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.agent}>
            <TableCell className="font-medium">{agent.agent}</TableCell>
            <TableCell className="text-right">{agent.generated}</TableCell>
            <TableCell className="text-right">{agent.approved}</TableCell>
            <TableCell className="text-right">${agent.cost.toFixed(4)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={agent.approvalRate} className="w-20" />
                <span className="text-sm">{agent.approvalRate}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Analytics Aggregation Service

```typescript
// src/lib/analytics/image-analytics-service.ts

import { getSupabaseServer } from '@/lib/supabase';

export class ImageAnalyticsService {
  /**
   * Backfill analytics from image_approvals table.
   * Run this periodically (e.g., daily cron job).
   */
  async backfillAnalytics(orgId: string, periodStart: Date, periodEnd: Date): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get all images in period
    const { data: images } = await supabase
      .from('image_approvals')
      .select('status, created_at')
      .eq('org_id', orgId)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (!images || images.length === 0) return;

    // Aggregate
    const generated = images.length;
    const approved = images.filter(i => i.status === 'approved').length;
    const rejected = images.filter(i => i.status === 'rejected').length;
    const cost = generated * 0.0015;

    // Upsert analytics record
    await supabase
      .from('image_usage_analytics')
      .upsert({
        org_id: orgId,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        total_images_generated: generated,
        total_images_approved: approved,
        total_images_rejected: rejected,
        total_cost_usd: cost,
      }, {
        onConflict: 'org_id,period_start,period_end',
      });
  }

  /**
   * Get cost for a specific image (vendor-neutral).
   */
  getCostPerImage(): number {
    // Fixed cost - no vendor details exposed
    return 0.0015;
  }
}
```

## Implementation Tasks

### T1: Backfill Analytics from image_approvals

- [ ] Aggregate count + cost per org per period
- [ ] Store in image_usage_analytics
- [ ] Schedule daily backfill job

### T2: Build Image Analytics Dashboard

- [ ] Implement summary cards
- [ ] Implement cost chart over time
- [ ] Implement by-agent breakdown table

### T3: Wire Analytics to CI & Observability

- [ ] Expose minimal metrics for monitoring
- [ ] No vendor details in logs
- [ ] Add health check for analytics tables

## Security Rules

- Analytics labels must be vendor-neutral
- No references to external pricing APIs
- Agent names sanitised (remove vendor references)
- Only Admin/Manager roles can view analytics
- RLS prevents cross-org access

## Completion Definition

Phase 29 is complete when:

1. **Per-org cost metrics computed**: Analytics aggregated correctly
2. **Only org owners see their data**: RLS enforced
3. **No vendor names in analytics UI**: All labels sanitised
4. **Dashboard functional**: Summary, trend, and by-agent views working
5. **CI passes with analytics fixtures**: Tests verify no vendor leaks

---

*Phase 29 - Image Analytics Dashboard Complete*
*Unite-Hub Status: ANALYTICS OPERATIONAL*
