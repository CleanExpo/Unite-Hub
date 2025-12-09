'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SEOMetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  status?: 'good' | 'warning' | 'error' | 'neutral';
  onClick?: () => void;
}

export function SEOMetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status = 'neutral',
  onClick,
}: SEOMetricCardProps) {
  const statusStyles = {
    good: 'border-green-200 bg-green-50/50',
    warning: 'border-yellow-200 bg-yellow-50/50',
    error: 'border-red-200 bg-red-50/50',
    neutral: 'border-gray-200',
  };

  const statusBadge = {
    good: <Badge className="bg-green-100 text-green-800 text-xs">Good</Badge>,
    warning: <Badge className="bg-yellow-100 text-yellow-800 text-xs">Needs Work</Badge>,
    error: <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>,
    neutral: null,
  };

  const getTrendIcon = () => {
    if (!trend) {
return null;
}
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        statusStyles[status],
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn(
                'p-2 rounded-lg',
                status === 'good' && 'bg-green-100',
                status === 'warning' && 'bg-yellow-100',
                status === 'error' && 'bg-red-100',
                status === 'neutral' && 'bg-gray-100'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  status === 'good' && 'text-green-600',
                  status === 'warning' && 'text-yellow-600',
                  status === 'error' && 'text-red-600',
                  status === 'neutral' && 'text-gray-600'
                )} />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusBadge[status]}
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {getTrendIcon()}
                <span className={cn(
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-600',
                  trend.direction === 'neutral' && 'text-gray-500'
                )}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
