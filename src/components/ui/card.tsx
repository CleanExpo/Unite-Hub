/**
 * Card Component - Phase 2 UI Library
 * Flexible card container with header, footer, and variants
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Card({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  const variantClasses = {
    default: 'bg-white/[0.02] border-[0.5px] border-white/[0.06] rounded-sm',
    bordered: 'bg-white/[0.02] border border-white/[0.1] rounded-sm',
    elevated: 'bg-white/[0.03] border-[0.5px] border-white/[0.08] rounded-sm',
    flat: 'bg-white/[0.01] rounded-sm',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    >
      {header && (
        <div className={`border-b border-white/[0.06] ${paddingClasses[padding]} pb-4`}>
          {header}
        </div>
      )}

      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`border-t border-white/[0.06] ${paddingClasses[padding]} pt-4`}>
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * CardHeader - Semantic header component
 */
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-lg font-semibold text-white/90 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Title within card
 */
export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-xl font-bold text-white/90 ${className}`}>
      {children}
    </h3>
  );
}

/**
 * CardDescription - Subtitle/description text
 */
export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-white/50 ${className}`}>
      {children}
    </p>
  );
}

/**
 * CardContent - Main content area
 */
export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardFooter - Footer area for actions
 */
export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
}

// Named export for Card compatibility
export { Card };
