'use client';

/**
 * Director Risk Card
 * Phase 60: Display risk alert from AI Director
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  FileText,
  Shield,
  Cpu,
  Calendar,
} from 'lucide-react';

type RiskCategory =
  | 'churn_risk'
  | 'budget_overrun'
  | 'content_stagnation'
  | 'engagement_drop'
  | 'deadline_miss'
  | 'quality_decline'
  | 'compliance_issue'
  | 'resource_constraint';

interface DirectorRiskCardProps {
  category: RiskCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics: Record<string, string | number>;
  recommendedActions: string[];
  clientName?: string;
  createdAt: string;
  onAction?: (action: string) => void;
}

export function DirectorRiskCard({
  category,
  severity,
  title,
  description,
  metrics,
  recommendedActions,
  clientName,
  createdAt,
  onAction,
}: DirectorRiskCardProps) {
  const getCategoryIcon = (cat: RiskCategory) => {
    switch (cat) {
      case 'churn_risk':
        return <TrendingDown className="h-4 w-4" />;
      case 'budget_overrun':
        return <DollarSign className="h-4 w-4" />;
      case 'content_stagnation':
        return <FileText className="h-4 w-4" />;
      case 'engagement_drop':
        return <Clock className="h-4 w-4" />;
      case 'deadline_miss':
        return <Calendar className="h-4 w-4" />;
      case 'quality_decline':
        return <TrendingDown className="h-4 w-4" />;
      case 'compliance_issue':
        return <Shield className="h-4 w-4" />;
      case 'resource_constraint':
        return <Cpu className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSeverityBorder = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'border-l-4 border-l-red-500';
      case 'high':
        return 'border-l-4 border-l-orange-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      default:
        return 'border-l-4 border-l-blue-500';
    }
  };

  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`${getSeverityBorder(severity)} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${getSeverityColor(severity)} text-white`}>
              {getCategoryIcon(category)}
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {clientName && (
                <div className="text-xs text-muted-foreground">{clientName}</div>
              )}
            </div>
          </div>
          <Badge className={getSeverityColor(severity)}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Metrics */}
        {Object.keys(metrics).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="text-xs bg-muted px-2 py-1 rounded"
              >
                <span className="text-muted-foreground">
                  {key.replace(/_/g, ' ')}:
                </span>{' '}
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium">Recommended Actions:</div>
            {recommendedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => onAction?.(action)}
                className="block text-xs text-blue-500 hover:underline cursor-pointer"
              >
                → {action}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Detected: {formatDate(createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}

export default DirectorRiskCard;
