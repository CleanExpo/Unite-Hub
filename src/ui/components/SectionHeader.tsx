/**
 * SectionHeader Component
 * Phase 37: UI/UX Polish
 *
 * Standardized section header with icon, title, description, and action
 */

import React from "react";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  iconColor?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  action,
  className = "",
  iconColor = "text-teal-600",
}: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className={`w-7 h-7 ${iconColor}`} />}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function SubsectionHeader({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

export default SectionHeader;
