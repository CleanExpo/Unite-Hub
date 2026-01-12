'use client';

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export type ChangeType = 'increase' | 'decrease' | 'neutral';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: ChangeType;
  icon?: LucideIcon;
  description?: string;
  className?: string;
  loading?: boolean;
  formatValue?: (value: string | number) => string;
}

/**
 * StatCard Component
 *
 * Displays a statistic with optional trend indicator.
 * Used in dashboards for KPIs and metrics.
 */
export function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
  className,
  loading = false,
  formatValue,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  const displayValue = formatValue ? formatValue(value) : value;

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return TrendingUp;
      case 'decrease':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-success-500';
      case 'decrease':
        return 'text-error-500';
      default:
        return 'text-text-muted';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card
      className={cn(
        'relative overflow-hidden bg-bg-card border-border-subtle',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-text-muted">
              {title}
            </p>
            <p className="text-3xl font-bold text-text-primary">
              {displayValue}
            </p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                <TrendIcon className="h-4 w-4" />
                <span className="font-medium">
                  {changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : ''}
                  {Math.abs(change)}%
                </span>
                <span className="text-text-muted">vs last period</span>
              </div>
            )}
            {description && (
              <p className="text-sm text-text-muted">{description}</p>
            )}
          </div>

          {Icon && (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-500/20">
              <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * StatCardSkeleton
 *
 * Loading state for StatCard
 */
export function StatCardSkeleton() {
  return (
    <Card className="bg-bg-card border-border-subtle">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * StatCardGrid
 *
 * Grid layout for multiple stat cards
 */
export function StatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>{children}</div>
  );
}

export default StatCard;
