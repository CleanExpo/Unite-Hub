'use client';

/**
 * Governance Risk Card
 * Phase 63: Display governance risk item
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  ShieldAlert,
  Shield,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface GovernanceRiskCardProps {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detected_at: string;
  requires_founder_action: boolean;
  auto_resolved: boolean;
  onResolve?: () => void;
  onView?: () => void;
}

export function GovernanceRiskCard({
  category,
  severity,
  title,
  description,
  detected_at,
  requires_founder_action,
  auto_resolved,
  onResolve,
  onView,
}: GovernanceRiskCardProps) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className={`${getSeverityBorder(severity)} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          <Badge className={getSeverityColor(severity)}>
            {severity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{formatCategory(category)}</Badge>
          {requires_founder_action && (
            <Badge variant="outline" className="border-orange-500 text-orange-500">
              Founder Action
            </Badge>
          )}
          {auto_resolved && (
            <Badge variant="outline" className="border-green-500 text-green-500">
              Auto-resolved
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(detected_at)}
          </div>
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={onView}
                className="text-xs text-blue-500 hover:underline"
              >
                Details
              </button>
            )}
            {onResolve && (
              <button
                onClick={onResolve}
                className="flex items-center gap-1 text-xs text-green-500 hover:underline"
              >
                <CheckCircle2 className="h-3 w-3" />
                Resolve
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GovernanceRiskCard;
