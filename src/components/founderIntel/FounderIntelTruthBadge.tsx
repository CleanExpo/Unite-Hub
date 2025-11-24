'use client';

/**
 * Founder Intel Truth Badge
 * Phase 80: Display confidence and completeness indicators
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { getTruthBadgeInfo } from '@/lib/founderIntel/founderIntelTruthAdapter';

interface FounderIntelTruthBadgeProps {
  confidenceScore: number;
  completenessScore: number;
  className?: string;
}

export function FounderIntelTruthBadge({
  confidenceScore,
  completenessScore,
  className = '',
}: FounderIntelTruthBadgeProps) {
  const badgeInfo = getTruthBadgeInfo(confidenceScore, completenessScore);

  const Icon = badgeInfo.level === 'high'
    ? ShieldCheck
    : badgeInfo.level === 'medium'
    ? Shield
    : ShieldAlert;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`text-xs cursor-help ${badgeInfo.color} ${className}`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {badgeInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{badgeInfo.tooltip}</p>
          <div className="mt-2 text-xs space-y-1">
            <p>Data Completeness: {(completenessScore * 100).toFixed(0)}%</p>
            <p>Confidence: {(confidenceScore * 100).toFixed(0)}%</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version for lists
 */
export function FounderIntelTruthBadgeCompact({
  confidenceScore,
  completenessScore,
}: {
  confidenceScore: number;
  completenessScore: number;
}) {
  const combined = (confidenceScore + completenessScore) / 2;
  const color = combined >= 0.8
    ? 'bg-green-500'
    : combined >= 0.6
    ? 'bg-yellow-500'
    : 'bg-orange-500';

  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-muted-foreground">
        {(combined * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default FounderIntelTruthBadge;
