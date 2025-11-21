'use client';

/**
 * GlobalSuspenseBoundary Component
 * Phase 15 Week 7-8 - MVP Deployment Readiness
 *
 * Provides consistent loading states across the application.
 */

import React, { Suspense, ReactNode } from 'react';
import { DashboardSkeleton } from '@/components/ui/skeleton-card';

interface GlobalSuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function GlobalSuspenseBoundary({
  children,
  fallback,
}: GlobalSuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || <DashboardSkeleton />}>
      {children}
    </Suspense>
  );
}

export default GlobalSuspenseBoundary;
