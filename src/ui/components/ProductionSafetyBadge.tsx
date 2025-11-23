'use client';

/**
 * Production Safety Badge Component
 * Phase 50: Displays safety score and verification status
 */

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface ProductionSafetyBadgeProps {
  safetyScore: number;
  truthLayerVerified: boolean;
  safetyFlags?: string[];
  showDetails?: boolean;
}

export function ProductionSafetyBadge({
  safetyScore,
  truthLayerVerified,
  safetyFlags = [],
  showDetails = false,
}: ProductionSafetyBadgeProps) {
  const getConfig = () => {
    if (safetyScore >= 95 && truthLayerVerified && safetyFlags.length === 0) {
      return {
        icon: ShieldCheck,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        label: 'Verified Safe',
        variant: 'outline' as const,
      };
    }
    if (safetyScore >= 80) {
      return {
        icon: Shield,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'Safe',
        variant: 'outline' as const,
      };
    }
    if (safetyScore >= 60) {
      return {
        icon: ShieldAlert,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        label: 'Review Needed',
        variant: 'outline' as const,
      };
    }
    return {
      icon: ShieldX,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      label: 'Safety Concerns',
      variant: 'destructive' as const,
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  if (!showDetails) {
    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {safetyScore}%
      </Badge>
    );
  }

  return (
    <div className={`p-3 rounded-lg ${config.bgColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{config.label}</span>
        <span className="text-sm text-muted-foreground">({safetyScore}%)</span>
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Truth Layer:</span>
          <span className={truthLayerVerified ? 'text-green-500' : 'text-amber-500'}>
            {truthLayerVerified ? 'Verified' : 'Pending'}
          </span>
        </div>

        {safetyFlags.length > 0 && (
          <div>
            <span className="text-muted-foreground">Flags:</span>
            <ul className="mt-1 ml-4 list-disc text-xs text-amber-600 dark:text-amber-400">
              {safetyFlags.map((flag, i) => (
                <li key={i}>{flag.replace(/_/g, ' ')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductionSafetyBadge;
