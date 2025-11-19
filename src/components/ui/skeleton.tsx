/**
 * Skeleton Component - Phase 2 UI Library
 * Loading placeholder for async content
 */

import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '1rem',
  variant = 'rectangular',
  className = '',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-label="Loading..."
      role="status"
    />
  );
}

/**
 * SkeletonCard - Preset skeleton for card loading
 */
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
      <Skeleton height="2rem" width="60%" />
      <Skeleton height="1rem" width="100%" />
      <Skeleton height="1rem" width="90%" />
      <Skeleton height="1rem" width="80%" />
      <div className="flex gap-2 pt-4">
        <Skeleton height="2.5rem" width="6rem" />
        <Skeleton height="2.5rem" width="6rem" />
      </div>
    </div>
  );
}

/**
 * SkeletonAvatar - Preset skeleton for avatar
 */
export function SkeletonAvatar({ size = '3rem' }: { size?: string }) {
  return <Skeleton height={size} width={size} variant="circular" />;
}

/**
 * SkeletonText - Preset skeleton for text lines
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}
