'use client';

import React from 'react';

export function StatsCardSkeleton() {
  return (
    <div className="bg-muted rounded-lg p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-muted-foreground/20 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2"></div>
          <div className="h-6 bg-muted-foreground/20 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

interface StatsGridSkeletonProps {
  count?: number;
}

export function StatsGridSkeleton({ count = 4 }: StatsGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <StatsCardSkeleton key={index} />
      ))}
    </div>
  );
}
