'use client';

import React from 'react';

interface IndustrialBadgeProps {
  children: React.ReactNode;
  variant?: 'rust' | 'metal' | 'success' | 'warning' | 'error';
  className?: string;
}

/**
 * IndustrialBadge - Status indicator with industrial aesthetic
 *
 * Variants:
 * - rust: Primary status (rust/orange)
 * - metal: Neutral status (gray metal)
 * - success: Positive status (green)
 * - warning: Caution status (yellow)
 * - error: Negative status (red)
 */
export function IndustrialBadge({
  children,
  variant = 'rust',
  className = '',
}: IndustrialBadgeProps) {
  const variantStyles = {
    rust: 'bg-industrial-rust/20 text-industrial-rust border-industrial-rust/30',
    metal: 'bg-industrial-metal/60 text-industrial-text border-white/10',
    success: 'bg-green-900/30 text-green-300 border-green-700/30',
    warning: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/30',
    error: 'bg-red-900/30 text-red-300 border-red-700/30',
  };

  return (
    <span
      className={`
        inline-block
        px-2.5 py-1.5
        rounded-full
        text-xs
        font-bold
        uppercase
        tracking-wide
        border
        ${variantStyles[variant]}
        ${className}
      `}
      data-theme="industrial"
    >
      {children}
    </span>
  );
}
