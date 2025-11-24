'use client';

import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, Rocket } from 'lucide-react';

interface TierBadgeProps {
  tierName: string;
  showIcon?: boolean;
}

export function TierBadge({ tierName, showIcon = true }: TierBadgeProps) {
  const getTierConfig = (name: string) => {
    const configs: Record<string, { color: string; icon: any }> = {
      Starter: { color: 'bg-gray-500', icon: Star },
      Growth: { color: 'bg-blue-500', icon: Zap },
      Professional: { color: 'bg-purple-500', icon: Rocket },
      Enterprise: { color: 'bg-amber-500', icon: Crown },
    };
    return configs[name] || { color: 'bg-gray-500', icon: Star };
  };

  const config = getTierConfig(tierName);
  const Icon = config.icon;

  return (
    <Badge className={`${config.color} text-white`}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {tierName}
    </Badge>
  );
}
