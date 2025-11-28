'use client';

import React from 'react';

export function ContentCardSkeleton() {
  return (
    <div className="bg-muted rounded-lg p-4 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
        <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
        <div className="h-3 bg-muted-foreground/20 rounded w-2/3"></div>
      </div>
    </div>
  );
}

interface ContentListSkeletonProps {
  count?: number;
}

export function ContentListSkeleton({ count = 6 }: ContentListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ContentCardSkeleton key={index} />
      ))}
    </div>
  );
}
