/**
 * Badge Component - Phase 2 UI Library
 * Small status indicators and labels
 */

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-white/[0.06] text-white/70 border border-white/[0.1]',
    success: 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30',
    danger: 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/30',
    info: 'bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30',
    outline: 'bg-transparent border border-white/[0.1] text-white/50',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
    lg: 'px-3 py-1.5 text-[13px]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-sm ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

// Named export for compatibility
export { Badge };
