'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { IncidentSummary } from '@/lib/compliance';

interface ComplianceOverviewPanelProps {
  summary: IncidentSummary;
  coverage?: {
    regions: string[];
    platforms: string[];
    totalPolicies: number;
  };
}

export function ComplianceOverviewPanel({
  summary,
  coverage
}: ComplianceOverviewPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Incidents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total}</div>
          <p className="text-xs text-muted-foreground">
            {summary.unresolved} unresolved
          </p>
        </CardContent>
      </Card>

      {/* By Severity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Severity</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="destructive">
              {summary.bySeverity.critical} Critical
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {summary.bySeverity.high} High
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {summary.bySeverity.medium} Medium
            </Badge>
            <Badge variant="outline">
              {summary.bySeverity.low} Low
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* By Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-800">
              {summary.byStatus.warning} Warning
            </Badge>
            <Badge variant="destructive">
              {summary.byStatus.blocked} Blocked
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {summary.byStatus.overridden} Overridden
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Last 30 Days */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.last30Days}</div>
          <p className="text-xs text-muted-foreground">
            incidents this month
          </p>
        </CardContent>
      </Card>

      {/* Coverage (if provided) */}
      {coverage && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Policy Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Regions</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {coverage.regions.map(r => (
                    <Badge key={r} variant="outline">{r.toUpperCase()}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Platforms</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {coverage.platforms.map(p => (
                    <Badge key={p} variant="outline">{p}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Policies</div>
                <div className="text-lg font-bold">{coverage.totalPolicies}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
