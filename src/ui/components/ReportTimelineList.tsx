'use client';

/**
 * Report Timeline List
 * Phase 76: Display chronological list of reports
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { ReportSummaryCard } from './ReportSummaryCard';
import { ComposedReport, getReportSummary } from '@/lib/reports/reportCompositionEngine';
import { ReportType } from '@/lib/reports/reportSectionsConfig';

interface ReportTimelineListProps {
  reports: ComposedReport[];
  onViewReport?: (report: ComposedReport) => void;
  groupByType?: boolean;
  showHeader?: boolean;
  className?: string;
}

export function ReportTimelineList({
  reports,
  onViewReport,
  groupByType = true,
  showHeader = true,
  className = '',
}: ReportTimelineListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<ReportType>>(
    new Set(['weekly', 'monthly', 'ninety_day'])
  );

  if (reports.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          No reports available yet
        </CardContent>
      </Card>
    );
  }

  // Sort by most recent first
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  // Group by type if requested
  if (groupByType) {
    const groups: Record<ReportType, ComposedReport[]> = {
      weekly: [],
      monthly: [],
      ninety_day: [],
    };

    for (const report of sortedReports) {
      groups[report.report_type].push(report);
    }

    const toggleGroup = (type: ReportType) => {
      const newExpanded = new Set(expandedGroups);
      if (newExpanded.has(type)) {
        newExpanded.delete(type);
      } else {
        newExpanded.add(type);
      }
      setExpandedGroups(newExpanded);
    };

    const typeConfig = {
      weekly: { label: 'Weekly Reports', color: 'text-blue-500' },
      monthly: { label: 'Monthly Reports', color: 'text-purple-500' },
      ninety_day: { label: '90-Day Reports', color: 'text-green-500' },
    };

    return (
      <div className={`space-y-4 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Report History</h3>
            <Badge variant="outline" className="text-xs">
              {reports.length} total
            </Badge>
          </div>
        )}

        {(['weekly', 'monthly', 'ninety_day'] as ReportType[]).map((type) => {
          const groupReports = groups[type];
          if (groupReports.length === 0) {
return null;
}

          const config = typeConfig[type];
          const isExpanded = expandedGroups.has(type);

          return (
            <Card key={type}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => toggleGroup(type)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className={`h-4 w-4 ${config.color}`} />
                    <CardTitle className="text-sm">{config.label}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {groupReports.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3">
                  {groupReports.map((report) => (
                    <ReportSummaryCard
                      key={report.report_id}
                      report={report}
                      onView={onViewReport ? () => onViewReport(report) : undefined}
                    />
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  // Flat timeline (no grouping)
  return (
    <div className={`space-y-3 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Report History</h3>
          <Badge variant="outline" className="text-xs">
            {reports.length} total
          </Badge>
        </div>
      )}
      {sortedReports.map((report) => (
        <ReportSummaryCard
          key={report.report_id}
          report={report}
          onView={onViewReport ? () => onViewReport(report) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Report timeline item for compact display
 */
export function ReportTimelineItem({
  report,
  onClick,
}: {
  report: ComposedReport;
  onClick?: () => void;
}) {
  const summary = getReportSummary(report);
  const statusColor = summary.status === 'complete' ? 'bg-green-500' :
                      summary.status === 'partial' ? 'bg-yellow-500' : 'bg-orange-500';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 border rounded-lg ${
        onClick ? 'cursor-pointer hover:bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${statusColor} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{summary.title}</p>
        <p className="text-xs text-muted-foreground">{summary.subtitle}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {formatDate(report.generated_at)}
      </div>
    </div>
  );
}

export default ReportTimelineList;
