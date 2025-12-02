/**
 * Unite-Hub Component Patterns
 *
 * Reusable React components for common UI patterns.
 * This is a TypeScript JSX file with component specifications.
 * Copy components into your src/components/ui/ directory.
 *
 * Last Updated: December 2, 2025
 * @jsx React
 */

// @ts-nocheck - This is a reference file with pattern examples
import React from 'react';

// ====== SKELETON LOADERS ======

/**
 * Generic Card Skeleton
 * Shows a loading state that matches card layout
 */
export function CardSkeleton({
  lines = 3,
  imageHeight = 160,
}: {
  lines?: number;
  imageHeight?: number;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
      {/* Image placeholder */}
      <div
        className="w-full bg-gray-200 rounded-md mb-4"
        style={{ height: `${imageHeight}px` }}
      />

      {/* Title */}
      <div className="h-5 bg-gray-200 rounded-md mb-3" />

      {/* Text lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-100 rounded-md mb-2"
          style={{
            width: i === lines - 1 ? "75%" : "100%",
          }}
        />
      ))}

      {/* Action button */}
      <div className="h-10 bg-gray-200 rounded-md mt-4" />
    </div>
  );
}

/**
 * Table/List Row Skeleton
 * Shows multiple loading rows like a table
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-white border border-gray-200 rounded-md animate-pulse"
        >
          {/* Checkbox */}
          <div className="w-5 h-5 bg-gray-200 rounded mt-0.5" />

          {/* Columns */}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>

          {/* Action button */}
          <div className="w-8 h-8 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Dashboard Grid Skeleton
 * Shows loading state for dashboard with stat cards and charts
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-96" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-32" />
            <div className="h-3 bg-gray-100 rounded w-16 mt-3" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 bg-gray-100 rounded w-24" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Panel Skeleton
 * Shows loading state for a side panel (like hot leads)
 */
export function PanelSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header */}
      <div className="h-6 bg-gray-200 rounded w-32 mb-4" />

      {/* Items */}
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 p-3 bg-white border border-gray-200 rounded-md"
        >
          {/* Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-40" />
          </div>

          {/* Badge */}
          <div className="h-6 bg-gray-200 rounded-full w-12 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ====== EMPTY STATES ======

/**
 * Empty State Component
 * Shows when there's no data with helpful message and action
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionText = "Get started",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: () => void;
  actionText?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-teal-600" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-center max-w-sm mb-6">{description}</p>

      {/* Action */}
      {action && (
        <button
          onClick={action}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

/**
 * Search Empty State
 * Shows when search has no results
 */
export function SearchEmptyState({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No results for "{query}"
      </h3>

      <p className="text-gray-600 text-center mb-6 max-w-sm">
        Try adjusting your search terms or filters
      </p>

      <button
        onClick={onClear}
        className="text-teal-600 hover:text-teal-700 font-medium"
      >
        Clear search
      </button>
    </div>
  );
}

// ====== ERROR STATES ======

/**
 * Error Message Component
 * Shows error with clear next action
 */
export function ErrorMessage({
  title = "Something went wrong",
  message,
  action,
  actionText = "Try again",
}: {
  title?: string;
  message: string;
  action?: () => void;
  actionText?: string;
}) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
      {/* Icon + Title */}
      <div className="flex gap-3 mb-2">
        <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">
          <svg
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-red-900">{title}</h4>
        </div>
      </div>

      {/* Message */}
      <p className="text-red-700 ml-8 mb-3">{message}</p>

      {/* Action */}
      {action && (
        <div className="ml-8">
          <button
            onClick={action}
            className="text-red-600 hover:text-red-700 font-medium text-sm"
          >
            {actionText} →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Inline Error
 * For form field validation errors
 */
export function InlineError({ message }: { message: string }) {
  return (
    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18.101 12.93a1 1 0 00-1.414-1.414L10 15.586 3.414 9.02A1 1 0 102 10.434l7 7a1 1 0 001.414 0l8.687-8.687z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

// ====== BUTTON VARIANTS ======

/**
 * Primary Button
 * For main actions (submit, save, create)
 */
export function ButtonPrimary({
  children,
  loading = false,
  disabled = false,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        min-h-11 px-4 py-2.5 rounded-lg
        bg-teal-600 text-white font-medium
        hover:bg-teal-700 active:bg-teal-800
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        flex items-center justify-center gap-2
        ${className}
      `}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

/**
 * Secondary Button
 * For secondary actions (cancel, back, view details)
 */
export function ButtonSecondary({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-11 px-4 py-2.5 rounded-lg
        bg-gray-100 text-gray-900 font-medium
        hover:bg-gray-200 active:bg-gray-300
        transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Destructive Button
 * For delete/remove actions
 */
export function ButtonDestructive({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-11 px-4 py-2.5 rounded-lg
        bg-red-600 text-white font-medium
        hover:bg-red-700 active:bg-red-800
        transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/**
 * Ghost Button
 * For subtle actions (links styled as buttons)
 */
export function ButtonGhost({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        min-h-11 px-3 py-2.5 rounded-lg
        text-teal-600 font-medium
        hover:bg-teal-50 active:bg-teal-100
        transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// ====== SPINNER ======

/**
 * Loading Spinner
 * Use skeleton loaders instead when possible
 */
export function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <svg
      className={`${sizeClasses[size]} animate-spin text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ====== BADGE / PILL ======

/**
 * Badge Component
 * For status indicators and tags
 */
export function Badge({
  children,
  variant = "primary",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "error" | "gray";
  size?: "sm" | "md" | "lg";
}) {
  const variantClasses = {
    primary: "bg-teal-50 text-teal-700",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs font-medium rounded",
    md: "px-3 py-1.5 text-sm font-medium rounded-md",
    lg: "px-4 py-2 text-base font-medium rounded-lg",
  };

  return (
    <span className={`${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}

// ====== CARD ======

/**
 * Card Component
 * Container for related content
 */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        p-6 shadow-sm hover:shadow-md transition-shadow
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// ====== PROGRESS BAR ======

/**
 * Progress Bar Component
 * For showing progress through a process
 */
export function ProgressBar({
  value,
  max = 100,
  size = "md",
}: {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const percentage = (value / max) * 100;

  return (
    <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
      <div
        className="bg-teal-600 h-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ====== ALERT ======

/**
 * Alert Component
 * For important messages
 */
export function Alert({
  children,
  variant = "info",
  onClose,
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  onClose?: () => void;
}) {
  const variantClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-900",
  };

  return (
    <div
      className={`rounded-lg border p-4 flex gap-3 items-start ${variantClasses[variant]}`}
    >
      <div className="flex-1">{children}</div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

// ====== FORM INPUTS ======

/**
 * Text Input Component
 * With label and error state
 */
export function TextInput({
  label,
  placeholder,
  error,
  value,
  onChange,
  type = "text",
}: {
  label?: string;
  placeholder?: string;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<Record<string, unknown>>) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-900">{label}</label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          min-h-11 px-3 py-2.5 rounded-lg
          border transition-colors
          ${
            error
              ? "border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              : "border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          }
        `}
      />

      {error && <InlineError message={error} />}
    </div>
  );
}

// ====== EXPORT ======

export {
  CardSkeleton as Skeleton,
  EmptyState,
  ErrorMessage,
  ButtonPrimary as Button,
  Badge as Tag,
  Card as Container,
};
