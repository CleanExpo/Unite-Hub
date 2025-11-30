/**
 * StatsCard Component
 *
 * Display individual metric with value, label, and trend indicator.
 * Perfect for dashboard KPI displays.
 *
 * @example
 * <StatsCard
 *   label="Total Contacts"
 *   value="1,234"
 *   trend={{ direction: "up", percent: 12 }}
 *   icon={<ContactsIcon />}
 *   color="accent"
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes } from 'react';

export interface TrendIndicator {
  direction: 'up' | 'down' | 'neutral';
  percent: number;
  label?: string;
}

export interface StatsCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card label/title */
  label: string;

  /** Main stat value */
  value: string | number;

  /** Optional secondary value */
  secondaryValue?: string | number;

  /** Trend indicator (up/down with percent) */
  trend?: TrendIndicator;

  /** Icon/visual element */
  icon?: ReactNode;

  /** Color scheme @default 'neutral' */
  color?: 'accent' | 'success' | 'warning' | 'error' | 'neutral';

  /** Card variant @default 'default' */
  variant?: 'default' | 'minimal';

  /** Clickable card @default false */
  clickable?: boolean;

  /** Click handler */
  onClick?: () => void;

  /** Additional CSS classes */
  className?: string;
}

/**
 * StatsCard Component
 *
 * Uses design tokens:
 * - Background: bg-bg-card, hover:bg-bg-hover
 * - Border: border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 * - Icons: Color based on scheme (accent-500, success-500, etc.)
 * - Trend: Green for up, red for down, gray for neutral
 */
export const StatsCard = forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      label,
      value,
      secondaryValue,
      trend,
      icon,
      color = 'neutral',
      variant = 'default',
      clickable = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const colorClasses = {
      accent: 'text-accent-500',
      success: 'text-success-500',
      warning: 'text-warning-500',
      error: 'text-error-500',
      neutral: 'text-text-secondary',
    };

    const borderClasses = {
      accent: 'border-l-4 border-l-accent-500',
      success: 'border-l-4 border-l-success-500',
      warning: 'border-l-4 border-l-warning-500',
      error: 'border-l-4 border-l-error-500',
      neutral: 'border-l-4 border-l-border-subtle',
    };

    const trendColor =
      trend?.direction === 'up'
        ? 'text-success-500'
        : trend?.direction === 'down'
        ? 'text-error-500'
        : 'text-text-secondary';

    return (
      <div
        ref={ref}
        className={`
          bg-bg-card
          border border-border-subtle
          rounded-lg
          p-6
          transition-all duration-normal ease-out
          ${variant === 'default' ? borderClasses[color] : ''}
          ${clickable || onClick ? 'cursor-pointer hover:bg-bg-hover hover:shadow-lg hover:-translate-y-1' : ''}
          ${className}
        `.trim()}
        onClick={onClick}
        role={clickable || onClick ? 'button' : 'article'}
        tabIndex={clickable || onClick ? 0 : -1}
        onKeyDown={(e) => {
          if ((clickable || onClick) && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...props}
      >
        {/* Header with Icon and Trend */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          {icon && (
            <div
              className={`
                text-2xl md:text-3xl
                p-2 md:p-3
                rounded-lg
                ${variant === 'default' ? colorClasses[color] : ''}
                bg-bg-hover
              `}
            >
              {icon}
            </div>
          )}

          {/* Trend Indicator */}
          {trend && (
            <div
              className={`
                flex items-center gap-1
                text-sm font-semibold
                ${trendColor}
              `}
            >
              {trend.direction === 'up' && <span>↑</span>}
              {trend.direction === 'down' && <span>↓</span>}
              <span>{trend.percent}%</span>
              {trend.label && (
                <span className="text-text-secondary text-xs ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-text-secondary text-sm font-medium mb-2">
          {label}
        </p>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-bold text-text-primary">
            {value}
          </span>
          {secondaryValue && (
            <span className="text-sm text-text-secondary font-medium">
              {secondaryValue}
            </span>
          )}
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;
