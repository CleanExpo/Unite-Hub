'use client';

/**
 * Skeleton Card Components
 * Phase 15 Week 5-6 - Production Polish
 *
 * Shimmer loading states for dashboard widgets.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// BASE SKELETON CARD
// ============================================================================

interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showHeader?: boolean;
  showIcon?: boolean;
}

export function SkeletonCard({
  className,
  lines = 3,
  showHeader = true,
  showIcon = true,
}: SkeletonCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          {showIcon && <Skeleton className="h-4 w-4 rounded" />}
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-4',
              i === 0 ? 'w-3/4' : i === lines - 1 ? 'w-1/2' : 'w-full'
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DASHBOARD WIDGET SKELETON
// ============================================================================

export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// DASHBOARD GRID SKELETON
// ============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Onboarding banner skeleton */}
      <Card className="border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-1 w-full mt-2" />
        </CardContent>
      </Card>

      {/* Widget grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <WidgetSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD SKELETON
// ============================================================================

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TABLE ROW SKELETON
// ============================================================================

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-8' : i === 1 ? 'flex-1' : 'w-24'
          )}
        />
      ))}
    </div>
  );
}

export default SkeletonCard;
