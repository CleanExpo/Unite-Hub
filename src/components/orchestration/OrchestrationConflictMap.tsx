'use client';

/**
 * Orchestration Conflict Map
 * Phase 84: Highlights conflicts between reality engine, warnings, and channel fatigue
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';

interface Conflict {
  type: 'timing' | 'fatigue' | 'warning' | 'asset' | 'policy';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affected_schedules?: string[];
  resolution?: string;
}

interface OrchestrationConflictMapProps {
  conflicts: Conflict[];
  className?: string;
}

export function OrchestrationConflictMap({
  conflicts,
  className = '',
}: OrchestrationConflictMapProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'fatigue':
        return <Zap className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'policy':
        return <Shield className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      timing: 'Timing Conflict',
      fatigue: 'Channel Fatigue',
      warning: 'Early Warning',
      asset: 'Asset Issue',
      policy: 'Policy Violation',
    };
    return labels[type] || type;
  };

  if (conflicts.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conflict Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-green-500 text-sm font-medium">
              No conflicts detected
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All systems operating normally
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group by severity
  const highConflicts = conflicts.filter(c => c.severity === 'high');
  const mediumConflicts = conflicts.filter(c => c.severity === 'medium');
  const lowConflicts = conflicts.filter(c => c.severity === 'low');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Conflict Map
          <Badge variant="destructive" className="ml-auto">
            {conflicts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        {(highConflicts.length > 0 || mediumConflicts.length > 0) && (
          <div className="flex gap-2 text-xs">
            {highConflicts.length > 0 && (
              <Badge variant="destructive">
                {highConflicts.length} Critical
              </Badge>
            )}
            {mediumConflicts.length > 0 && (
              <Badge variant="secondary" className="text-yellow-500">
                {mediumConflicts.length} Warning
              </Badge>
            )}
            {lowConflicts.length > 0 && (
              <Badge variant="outline">
                {lowConflicts.length} Info
              </Badge>
            )}
          </div>
        )}

        {/* Conflict list */}
        <div className="space-y-2">
          {conflicts.map((conflict, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(conflict.severity)}`}
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getTypeIcon(conflict.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {getTypeLabel(conflict.type)}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${getSeverityColor(conflict.severity)}`}>
                      {conflict.severity}
                    </Badge>
                  </div>
                  <p className="text-xs">{conflict.description}</p>
                  {conflict.resolution && (
                    <p className="text-xs text-muted-foreground">
                      Resolution: {conflict.resolution}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
