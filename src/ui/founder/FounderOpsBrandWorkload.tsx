'use client';

/**
 * Founder Ops Brand Workload
 *
 * Brand-specific workload summaries showing task distribution,
 * capacity utilization, and performance metrics per brand.
 *
 * @module ui/founder/FounderOpsBrandWorkload
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface FounderOpsBrandWorkloadProps {
  workspaceId: string;
}

interface BrandWorkload {
  brand_slug: string;
  brand_name: string;
  domain: string;
  current_workload: number;
  capacity_percentage: number;
  is_overloaded: boolean;
  recommended_capacity: number;
  next_available_slot?: string;
  metrics: {
    total_tasks: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    total_duration_minutes: number;
    pending_approvals: number;
    next_deadline?: string;
  };
}

export default function FounderOpsBrandWorkload({ workspaceId }: FounderOpsBrandWorkloadProps) {
  const [workloads, setWorkloads] = useState<BrandWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brand workloads
  const fetchWorkloads = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/founder/ops/brand-workload?workspaceId=${workspaceId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch brand workloads');
      }

      const data = await response.json();
      setWorkloads(data.workloads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWorkloads();
  }, [workspaceId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Brand Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Brand Workload Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchWorkloads} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Workload Distribution</CardTitle>
              <CardDescription>{workloads.length} brands tracked</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={fetchWorkloads}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Brand Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workloads.map((workload) => (
          <BrandWorkloadCard key={workload.brand_slug} workload={workload} />
        ))}
      </div>

      {workloads.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-sm text-muted-foreground">
              No brand workload data available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Brand Workload Card Component
function BrandWorkloadCard({ workload }: { workload: BrandWorkload }) {
  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) {
return 'text-red-500';
}
    if (percentage >= 70) {
return 'text-orange-500';
}
    if (percentage >= 50) {
return 'text-yellow-500';
}
    return 'text-green-500';
  };

  const getCapacityBgColor = (percentage: number) => {
    if (percentage >= 90) {
return 'bg-red-500';
}
    if (percentage >= 70) {
return 'bg-orange-500';
}
    if (percentage >= 50) {
return 'bg-yellow-500';
}
    return 'bg-green-500';
  };

  return (
    <Card className={workload.is_overloaded ? 'border-red-500' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{workload.brand_name}</CardTitle>
          {workload.is_overloaded && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overloaded
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{workload.domain}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Capacity</span>
            <span className={`text-sm font-bold ${getCapacityColor(workload.capacity_percentage)}`}>
              {workload.capacity_percentage}%
            </span>
          </div>
          <Progress
            value={workload.capacity_percentage}
            className="h-2"
            indicatorClassName={getCapacityBgColor(workload.capacity_percentage)}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {workload.current_workload} / {workload.recommended_capacity} tasks
          </div>
        </div>

        {/* Task Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Active</div>
            <div className="text-lg font-bold">
              {(workload.metrics.by_status.scheduled || 0) +
                (workload.metrics.by_status.in_progress || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Pending Review</div>
            <div className="text-lg font-bold">{workload.metrics.pending_approvals}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Completed</div>
            <div className="text-lg font-bold text-green-600">
              {workload.metrics.by_status.completed || 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Time</div>
            <div className="text-lg font-bold">
              {Math.round(workload.metrics.total_duration_minutes / 60)}h
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="pt-3 border-t">
          <div className="text-xs font-medium mb-2">Priority Distribution</div>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="text-sm font-bold text-red-500">
                {workload.metrics.by_priority.urgent || 0}
              </div>
              <div className="text-xs text-muted-foreground">Urgent</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-orange-500">
                {workload.metrics.by_priority.high || 0}
              </div>
              <div className="text-xs text-muted-foreground">High</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-500">
                {workload.metrics.by_priority.medium || 0}
              </div>
              <div className="text-xs text-muted-foreground">Med</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-500">
                {workload.metrics.by_priority.low || 0}
              </div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        </div>

        {/* Next Deadline */}
        {workload.metrics.next_deadline && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Next deadline:</span>
              <span className="font-medium">
                {new Date(workload.metrics.next_deadline).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Next Available Slot */}
        {workload.next_available_slot && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Next available:</span>
              <span className="font-medium">
                {new Date(workload.next_available_slot).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t">
          <Button size="sm" variant="outline" className="w-full">
            <TrendingUp className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
