/**
 * IconBadge Component
 * Phase 37: UI/UX Polish
 *
 * Colored icon container with consistent styling
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface IconBadgeProps {
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const variantStyles = {
  primary: {
    bg: "bg-accent-100 dark:bg-accent-900/30",
    icon: "text-accent-600 dark:text-accent-400",
  },
  success: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
  },
  warning: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
  },
  error: {
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: "text-red-600 dark:text-red-400",
  },
  info: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
  },
  neutral: {
    bg: "bg-bg-hover",
    icon: "text-text-secondary",
  },
};

const sizeStyles = {
  sm: {
    container: "p-1.5 rounded",
    icon: "w-3.5 h-3.5",
  },
  md: {
    container: "p-2 rounded-md",
    icon: "w-5 h-5",
  },
  lg: {
    container: "p-3 rounded-lg",
    icon: "w-6 h-6",
  },
};

export function IconBadge({
  icon: Icon,
  variant = "primary",
  size = "md",
  className = "",
}: IconBadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <div
      className={`
        inline-flex items-center justify-center
        ${variantStyle.bg}
        ${sizeStyle.container}
        ${className}
      `}
    >
      <Icon className={`${variantStyle.icon} ${sizeStyle.icon}`} />
    </div>
  );
}

export default IconBadge;
