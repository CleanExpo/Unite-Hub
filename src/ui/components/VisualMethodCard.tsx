'use client';

/**
 * Visual Method Card
 * Phase 68: Display visual generation method details
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Video,
  Image,
  Layers,
  Wand2,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface VisualMethodCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  providers: string[];
  estimated_time_seconds: number;
  cost_tier: 'low' | 'medium' | 'high' | 'premium';
  requires_approval: boolean;
  outputs: string[];
  onClick?: () => void;
}

export function VisualMethodCard({
  name,
  category,
  description,
  complexity,
  providers,
  estimated_time_seconds,
  cost_tier,
  requires_approval,
  outputs,
  onClick,
}: VisualMethodCardProps) {
  const getCategoryIcon = () => {
    switch (category) {
      case 'ui_ux':
        return <Layers className="h-4 w-4" />;
      case 'motion':
        return <Video className="h-4 w-4" />;
      case 'brand':
        return <Palette className="h-4 w-4" />;
      case 'advertising':
        return <Image className="h-4 w-4" />;
      default:
        return <Wand2 className="h-4 w-4" />;
    }
  };

  const getComplexityConfig = () => {
    switch (complexity) {
      case 'simple':
        return { color: 'bg-green-500', label: 'Simple' };
      case 'moderate':
        return { color: 'bg-blue-500', label: 'Moderate' };
      case 'complex':
        return { color: 'bg-orange-500', label: 'Complex' };
      case 'advanced':
        return { color: 'bg-purple-500', label: 'Advanced' };
    }
  };

  const getCostConfig = () => {
    switch (cost_tier) {
      case 'low':
        return { color: 'text-green-500', label: '$' };
      case 'medium':
        return { color: 'text-yellow-500', label: '$$' };
      case 'high':
        return { color: 'text-orange-500', label: '$$$' };
      case 'premium':
        return { color: 'text-red-500', label: '$$$$' };
    }
  };

  const complexityConfig = getComplexityConfig();
  const costConfig = getCostConfig();

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
return `${seconds}s`;
}
    return `${Math.round(seconds / 60)}m`;
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-muted rounded">
              {getCategoryIcon()}
            </div>
            <CardTitle className="text-sm font-medium">{name}</CardTitle>
          </div>
          {requires_approval && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <Badge className={`${complexityConfig.color} text-xs`}>
            {complexityConfig.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {category.replace('_', '/')}
          </Badge>
        </div>

        {/* Providers */}
        <div className="flex flex-wrap gap-1">
          {providers.slice(0, 3).map((provider, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 bg-muted rounded"
            >
              {provider}
            </span>
          ))}
          {providers.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
              +{providers.length - 3}
            </span>
          )}
        </div>

        {/* Outputs */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          <span>{outputs.length} output{outputs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(estimated_time_seconds)}</span>
          </div>
          <div className={`flex items-center gap-1 ${costConfig.color}`}>
            <DollarSign className="h-3 w-3" />
            <span>{costConfig.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default VisualMethodCard;
