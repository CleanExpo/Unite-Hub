/**
 * Spinner Component - Phase 2 UI Library
 * Loading spinner for async operations
 */

import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export default function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  const colorClasses = {
    primary: 'border-[#00F5FF] border-t-transparent',
    secondary: 'border-white/50 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * SpinnerOverlay - Full-screen loading overlay
 */
export function SpinnerOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#050505] border border-white/[0.08] rounded-sm p-8 text-center">
        <Spinner size="xl" />
        {message && (
          <p className="mt-4 text-white/50 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
