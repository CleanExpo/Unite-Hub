'use client';

import React from 'react';

interface IndustrialCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  topRightElement?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

/**
 * IndustrialCard - Heavy metal-inspired card component
 *
 * Features:
 * - Metal texture background with gradient
 * - Outset shadow for raised prominence
 * - Top border shimmer effect
 * - Optional title and top-right action element
 * - Requires data-theme="industrial" on root element
 *
 * @example
 * ```tsx
 * <IndustrialCard
 *   title="System Status"
 *   topRightElement={<span>⚙️</span>}
 * >
 *   <p>All systems nominal</p>
 * </IndustrialCard>
 * ```
 */
export function IndustrialCard({
  children,
  title,
  topRightElement,
  className = '',
  onClick,
  interactive = false,
}: IndustrialCardProps) {
  return (
    <div
      className={`
        relative
        bg-industrial-metal
        shadow-metal-outset
        rounded-3xl
        p-6
        border-t border-white/5
        transition-all duration-200
        ${interactive ? 'cursor-pointer hover:shadow-rust-glow' : ''}
        ${className}
      `}
      onClick={onClick}
      role={interactive ? 'button' : 'region'}
      tabIndex={interactive ? 0 : -1}
    >
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Header section */}
      {(title || topRightElement) && (
        <div className="flex justify-between items-center mb-6">
          {title && (
            <h3 className="text-industrial-text font-medium text-lg">
              {title}
            </h3>
          )}
          {topRightElement && (
            <div className="flex-shrink-0 text-industrial-text">
              {topRightElement}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="text-industrial-text">
        {children}
      </div>
    </div>
  );
}
