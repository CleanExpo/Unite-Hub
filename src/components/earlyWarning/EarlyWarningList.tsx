'use client';

/**
 * Early Warning List
 * Phase 82: List of warnings with severity badges
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Clock,
} from 'lucide-react';
import {
  EarlyWarningEvent,
  getSeverityDisplay,
  getWarningTypeLabel,
  WarningStatus,
} from '@/lib/signalMatrix';

interface EarlyWarningListProps {
  warnings: EarlyWarningEvent[];
  onStatusChange?: (id: string, status: WarningStatus) => void;
  className?: string;
}

export function EarlyWarningList({
  warnings,
  onStatusChange,
  className = '',
}: EarlyWarningListProps) {
  if (warnings.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Early Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No active warnings. System is operating normally.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Early Warnings ({warnings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {warnings.map((warning) => (
          <WarningRow
            key={warning.id}
            warning={warning}
            onStatusChange={onStatusChange}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function WarningRow({
  warning,
  onStatusChange,
}: {
  warning: EarlyWarningEvent;
  onStatusChange?: (id: string, status: WarningStatus) => void;
}) {
  const severityDisplay = getSeverityDisplay(warning.severity);

  return (
    <div className={`p-3 rounded-lg border ${severityDisplay.bgColor}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] ${severityDisplay.color}`}>
              {severityDisplay.label}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {getWarningTypeLabel(warning.warning_type)}
            </Badge>
          </div>
          <p className="text-sm font-medium mt-1">{warning.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(warning.confidence * 100)}% confidence • {warning.source_signals.length} signals
          </p>
        </div>

        {onStatusChange && warning.status === 'open' && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(warning.id, 'acknowledged')}
              title="Acknowledge"
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(warning.id, 'resolved')}
              title="Resolve"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
          </div>
        )}

        {warning.status !== 'open' && (
          <Badge variant="outline" className="text-[10px]">
            {warning.status === 'acknowledged' && <Eye className="h-3 w-3 mr-1" />}
            {warning.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
            {warning.status}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {new Date(warning.created_at).toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
