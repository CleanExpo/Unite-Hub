'use client';

/**
 * Alignment Blockers Panel
 * Phase 73: Display truth-layer compliant blockers with suggested actions
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { AlignmentBlocker, getDimensionDisplayName } from '@/lib/alignment/alignmentEngine';

interface AlignmentBlockersPanelProps {
  blockers: AlignmentBlocker[];
  className?: string;
}

export function AlignmentBlockersPanel({
  blockers,
  className = '',
}: AlignmentBlockersPanelProps) {
  if (blockers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Blockers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No blockers identified. Your journey is progressing without obstruction.
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = blockers.filter(b => b.severity === 'critical').length;
  const highCount = blockers.filter(b => b.severity === 'high').length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-500' : highCount > 0 ? 'text-orange-500' : 'text-yellow-500'}`} />
            <CardTitle className="text-sm">Blockers</CardTitle>
          </div>
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px]">
                {criticalCount} critical
              </Badge>
            )}
            {highCount > 0 && (
              <Badge className="bg-orange-500 text-white text-[10px]">
                {highCount} high
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {blockers.map((blocker) => (
          <BlockerCard key={blocker.blocker_id} blocker={blocker} />
        ))}
      </CardContent>
    </Card>
  );
}

function BlockerCard({ blocker }: { blocker: AlignmentBlocker }) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-500/10 border-red-500/30',
          textColor: 'text-red-500',
          icon: AlertTriangle,
          label: 'Critical',
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500/10 border-orange-500/30',
          textColor: 'text-orange-500',
          icon: AlertTriangle,
          label: 'High',
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-500/10 border-yellow-500/30',
          textColor: 'text-yellow-500',
          icon: AlertCircle,
          label: 'Medium',
        };
      default:
        return {
          bgColor: 'bg-blue-500/10 border-blue-500/30',
          textColor: 'text-blue-500',
          icon: Info,
          label: 'Low',
        };
    }
  };

  const config = getSeverityConfig(blocker.severity);
  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-lg border space-y-2 ${config.bgColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 flex-shrink-0 ${config.textColor}`} />
          <span className="text-sm font-medium">{blocker.title}</span>
        </div>
        <Badge variant="outline" className={`text-[10px] ${config.textColor}`}>
          {config.label}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground pl-6">
        {blocker.description}
      </p>

      <div className="flex items-center justify-between pl-6">
        <div className="flex flex-wrap gap-1">
          {blocker.affected_dimensions.map((dim) => (
            <Badge key={dim} variant="outline" className="text-[9px]">
              {getDimensionDisplayName(dim)}
            </Badge>
          ))}
        </div>
        {blocker.days_blocked !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {blocker.days_blocked}d
          </div>
        )}
      </div>

      <div className={`flex items-center gap-2 pl-6 pt-1 border-t ${config.bgColor.replace('/10', '/20')}`}>
        <ArrowRight className={`h-3 w-3 ${config.textColor}`} />
        <span className={`text-xs ${config.textColor}`}>
          {blocker.suggested_action}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact blocker indicator
 */
export function BlockerCount({
  blockers,
  onClick,
}: {
  blockers: AlignmentBlocker[];
  onClick?: () => void;
}) {
  if (blockers.length === 0) {
return null;
}

  const criticalCount = blockers.filter(b => b.severity === 'critical' || b.severity === 'high').length;
  const color = criticalCount > 0 ? 'text-red-500' : 'text-yellow-500';

  return (
    <div
      className={`flex items-center gap-1 text-xs ${color} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
      onClick={onClick}
    >
      <AlertTriangle className="h-3 w-3" />
      {blockers.length} {blockers.length === 1 ? 'blocker' : 'blockers'}
      {onClick && <ArrowRight className="h-3 w-3" />}
    </div>
  );
}

export default AlignmentBlockersPanel;
