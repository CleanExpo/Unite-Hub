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
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700',
    flat: 'bg-gray-50 dark:bg-gray-900',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`rounded-xl ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {header && (
        <div className={`border-b border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} pb-4`}>
          {header}
        </div>
      )}

      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className={`border-t border-gray-200 dark:border-gray-700 ${paddingClasses[padding]} pt-4`}>
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
    <div className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle - Title within card
 */
export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-xl font-bold text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </h3>
  );
}

/**
 * CardDescription - Subtitle/description text
 */
export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
}
