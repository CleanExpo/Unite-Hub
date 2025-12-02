'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * HotLeadsSkeleton Component
 *
 * Loading skeleton for the Hot Leads Panel that matches the actual content layout.
 * Replaces the simple spinner with a structured loading state that shows where
 * content will appear, reducing perceived load time and eliminating white flash.
 *
 * @param items - Number of skeleton lead items to display (default: 5)
 */
export function HotLeadsSkeleton({ items = 5 }: { items?: number }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 bg-slate-700" />
          <Skeleton className="h-4 w-64 bg-slate-700" />
        </div>
        {/* Refresh button skeleton */}
        <Skeleton className="h-9 w-32 bg-slate-700" />
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-700 border border-slate-600 rounded-lg p-4 animate-pulse"
            >
              {/* Lead header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 space-y-2">
                  {/* Name */}
                  <Skeleton className="h-5 w-40 bg-slate-600" />
                  {/* Email */}
                  <Skeleton className="h-4 w-56 bg-slate-600" />
                </div>
                {/* Score badge */}
                <Skeleton className="h-8 w-16 rounded-full bg-slate-600" />
              </div>

              {/* Progress bar */}
              <Skeleton className="h-2 w-full rounded-full bg-slate-600 mb-3" />

              {/* Meta info */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24 bg-slate-600" />
                <Skeleton className="h-4 w-32 bg-slate-600" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 flex-1 bg-slate-600" />
                <Skeleton className="h-9 flex-1 bg-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default HotLeadsSkeleton;
