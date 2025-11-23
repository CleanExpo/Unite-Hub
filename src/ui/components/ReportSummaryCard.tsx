'use client';

/**
 * Report Summary Card
 * Phase 76: Display report overview with actions
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Calendar,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { ComposedReport, getReportSummary } from '@/lib/reports/reportCompositionEngine';
import { exportReportToMarkdown } from '@/lib/reports/reportExportComposer';

interface ReportSummaryCardProps {
  report: ComposedReport;
  onView?: () => void;
  showActions?: boolean;
  className?: string;
}

export function ReportSummaryCard({
  report,
  onView,
  showActions = true,
  className = '',
}: ReportSummaryCardProps) {
  const [copied, setCopied] = useState(false);

  const summary = getReportSummary(report);

  const typeConfig = {
    weekly: { label: 'Weekly', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
    monthly: { label: 'Monthly', color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
    ninety_day: { label: '90-Day', color: 'bg-green-500/10 text-green-500 border-green-500/30' },
  }[report.report_type];

  const statusConfig = {
    complete: { icon: CheckCircle2, color: 'text-green-500', label: 'Complete' },
    partial: { icon: AlertCircle, color: 'text-yellow-500', label: 'Partial' },
    limited: { icon: AlertCircle, color: 'text-orange-500', label: 'Limited' },
  }[summary.status];

  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopy = async () => {
    try {
      const exported = exportReportToMarkdown(report);
      await navigator.clipboard.writeText(exported.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <Badge variant="outline" className={typeConfig.color}>
              {typeConfig.label}
            </Badge>
          </div>
          <Badge variant="outline" className={`${statusConfig.color} border-current/30`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Title */}
        <div>
          <p className="font-medium text-sm">{summary.title}</p>
          <p className="text-xs text-muted-foreground">{summary.subtitle}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            {summary.sections_count} sections
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {summary.completeness}% complete
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(report.generated_at)}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={onView}
              >
                View Report
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact report indicator
 */
export function ReportIndicator({
  reportType,
  completeness,
  generatedAt,
  onClick,
}: {
  reportType: string;
  completeness: number;
  generatedAt: string;
  onClick?: () => void;
}) {
  const statusColor = completeness >= 75 ? 'bg-green-500' :
                      completeness >= 40 ? 'bg-yellow-500' : 'bg-orange-500';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div
      className={`flex items-center gap-2 text-xs ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <div className={`w-2 h-2 rounded-full ${statusColor}`} />
      <span className="font-medium capitalize">{reportType.replace('_', '-')}</span>
      <span className="text-muted-foreground">{formatDate(generatedAt)}</span>
    </div>
  );
}

export default ReportSummaryCard;
