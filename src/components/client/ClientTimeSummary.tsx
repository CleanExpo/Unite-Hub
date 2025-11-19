/**
 * Client Time Summary Component - Phase 3 Step 8 Priority 2
 *
 * Displays time tracking summary for clients:
 * - Total billable hours
 * - Total non-billable hours
 * - Total cost
 * - Date range filters
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, DollarSign, Calendar, FileText } from 'lucide-react';

interface TimeSummary {
  billableHours: number;
  nonBillableHours: number;
  totalHours: number;
  totalCost: number;
  entriesCount: number;
}

interface ClientTimeSummaryProps {
  summary: TimeSummary;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export default function ClientTimeSummary({
  summary,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: ClientTimeSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{summary.totalHours.toFixed(2)}h</p>
              <p className="text-xs text-muted-foreground">
                {summary.entriesCount} {summary.entriesCount === 1 ? 'entry' : 'entries'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billable Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Billable Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {summary.billableHours.toFixed(2)}h
              </p>
              <p className="text-xs text-muted-foreground">
                {((summary.billableHours / summary.totalHours) * 100 || 0).toFixed(0)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Non-Billable Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Non-Billable Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {summary.nonBillableHours.toFixed(2)}h
              </p>
              <p className="text-xs text-muted-foreground">
                {((summary.nonBillableHours / summary.totalHours) * 100 || 0).toFixed(0)}% of total
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">${summary.totalCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Billable entries only
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Summary Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Average Hourly Rate</span>
              <span className="text-sm font-semibold">
                ${summary.billableHours > 0 ? (summary.totalCost / summary.billableHours).toFixed(2) : '0.00'}/hour
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Billable vs Non-Billable Ratio</span>
              <span className="text-sm font-semibold">
                {summary.billableHours.toFixed(1)}h / {summary.nonBillableHours.toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-sm font-medium">Average Hours per Entry</span>
              <span className="text-sm font-semibold">
                {summary.entriesCount > 0 ? (summary.totalHours / summary.entriesCount).toFixed(2) : '0.00'}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Entries</span>
              <span className="text-sm font-semibold">{summary.entriesCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
