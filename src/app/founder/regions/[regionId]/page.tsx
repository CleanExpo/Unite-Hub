'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RegionPressureChart } from '@/components/globalScaling';
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Activity,
  Users,
  Building2
} from 'lucide-react';
import type { RegionScalingSummary, ScalingMode } from '@/lib/globalScaling';

const modeColors: Record<ScalingMode, string> = {
  normal: 'bg-green-500',
  cautious: 'bg-yellow-500',
  throttled: 'bg-orange-500',
  frozen: 'bg-red-500',
};

export default function RegionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session } = useAuth();
  const regionId = params.regionId as string;

  const [summary, setSummary] = useState<RegionScalingSummary | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !regionId) {
return;
}

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/regions/${regionId}/snapshot?includeHistory=true&periods=24`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch region data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Loading region details...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Region not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/founder/regions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Region Details</h1>
            <p className="text-muted-foreground">
              Detailed scaling metrics and health
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${modeColors[summary.scalingMode]} text-white`}>
            {summary.scalingMode.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.capacityScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Warning index: {summary.warningIndex.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summary.budget.remaining / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.budget.percentRemaining.toFixed(1)}% remaining of ${(summary.budget.monthly / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.utilization.activeAgencies}</div>
            <p className="text-xs text-muted-foreground">
              {summary.utilization.jobsInQueue} jobs in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.utilization.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Across all agencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pressure Chart */}
      <RegionPressureChart pressures={summary.pressures} />

      {/* Budget Details */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Monthly Budget</div>
              <div className="text-xl font-bold">
                ${(summary.budget.monthly / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className="text-xl font-bold text-green-600">
                ${(summary.budget.remaining / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Spent Today</div>
              <div className="text-xl font-bold text-amber-600">
                ${(summary.budget.spentToday / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.id || i}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      Capacity: {entry.avg_capacity?.toFixed(1) || 'N/A'}%
                    </span>
                    <span className="text-sm">
                      Pressure: {entry.peak_pressure?.toFixed(1) || 'N/A'}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      <div className="text-sm text-muted-foreground text-right">
        Last updated: {new Date(summary.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
