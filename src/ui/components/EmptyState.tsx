/**
 * EmptyState Component
 * Phase 37: UI/UX Polish
 *
 * Consistent empty state with icon, title, description, and action
 */

import React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: {
    container: "py-6",
    icon: "w-8 h-8 mb-2",
    title: "text-sm font-medium",
    description: "text-xs",
  },
  md: {
    container: "py-12",
    icon: "w-12 h-12 mb-4",
    title: "text-base font-semibold",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "w-16 h-16 mb-6",
    title: "text-lg font-semibold",
    description: "text-base",
  },
};

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${styles.container}
        ${className}
      `}
    >
      <Icon
        className={`
          ${styles.icon}
          text-gray-300 dark:text-gray-600
        `}
      />
      <h3
        className={`
          ${styles.title}
          text-gray-900 dark:text-white
        `}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`
            ${styles.description}
            text-gray-500 dark:text-gray-400
            mt-1 max-w-sm
          `}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
