/**
 * ChartWrapper Component
 * Phase 37: UI/UX Polish
 *
 * Consistent wrapper for chart components with loading states
 */

"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

interface ChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  height?: number | string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ChartWrapper({
  children,
  title,
  description,
  height = 300,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
  className = "",
}: ChartWrapperProps) {
  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={className}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      <div
        className="relative"
        style={{ height: heightStyle }}
      >
        {loading ? (
          <ChartSkeleton />
        ) : empty ? (
          <ChartEmpty message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="animate-pulse space-y-3 w-full px-4">
        <div className="flex items-end justify-between h-32 gap-2">
          {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <BarChart3 className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ElementType;
}) {
  const changeColor = {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-gray-500 dark:text-gray-400",
  }[changeType || "neutral"];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      {change && (
        <p className={`mt-1 text-xs ${changeColor}`}>{change}</p>
      )}
    </div>
  );
}

export default ChartWrapper;
