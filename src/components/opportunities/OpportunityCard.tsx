'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Clock,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { OpportunityWindow } from '@/lib/predictive';

interface OpportunityCardProps {
  opportunity: OpportunityWindow;
  onViewDetails?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAct?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  creative: 'bg-purple-100 text-purple-800 border-purple-200',
  posting: 'bg-blue-100 text-blue-800 border-blue-200',
  campaign: 'bg-green-100 text-green-800 border-green-200',
  brand: 'bg-amber-100 text-amber-800 border-amber-200',
  engagement: 'bg-pink-100 text-pink-800 border-pink-200',
  audience: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  timing: 'bg-orange-100 text-orange-800 border-orange-200',
};

const windowTypeLabels: Record<string, string> = {
  '7_day': '7 Days',
  '14_day': '14 Days',
  '30_day': '30 Days',
};

export function OpportunityCard({
  opportunity,
  onViewDetails,
  onDismiss,
  onAct,
}: OpportunityCardProps) {
  const confidencePercent = Math.round(opportunity.confidence * 100);
  const isHighConfidence = opportunity.confidence >= 0.7;
  const isExpiringSoon = opportunity.expiresAt &&
    new Date(opportunity.expiresAt).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <Card className={`relative ${isHighConfidence ? 'border-primary/50' : ''}`}>
      {isHighConfidence && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            {opportunity.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className={categoryColors[opportunity.opportunityCategory]}>
              {opportunity.opportunityCategory}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {opportunity.description}
        </p>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Confidence</span>
            <span className={isHighConfidence ? 'font-medium text-primary' : ''}>
              {confidencePercent}%
            </span>
          </div>
          <Progress
            value={confidencePercent}
            className={`h-2 ${isHighConfidence ? '[&>div]:bg-primary' : ''}`}
          />
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {windowTypeLabels[opportunity.windowType]}
          </div>
          {isExpiringSoon && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Expiring soon
            </div>
          )}
        </div>

        {/* Uncertainty note */}
        <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-2">
          {opportunity.uncertaintyNotes.split('.')[0]}.
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(opportunity.id)}
                className="h-7 px-2"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            )}
            {onAct && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAct(opportunity.id)}
                className="h-7 px-2"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Done
              </Button>
            )}
          </div>
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(opportunity.id)}
              className="h-7"
            >
              Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
