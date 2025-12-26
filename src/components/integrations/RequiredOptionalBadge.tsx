'use client';

/**
 * Required/Optional Badge Component
 * Visual indicator for integration priority
 * Pattern 3: "I don't know what's required vs optional" (3 users)
 */

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Star } from 'lucide-react';

export type IntegrationPriority = 'required' | 'recommended' | 'optional';

export interface RequiredOptionalBadgeProps {
  priority: IntegrationPriority;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RequiredOptionalBadge({
  priority,
  size = 'md',
  showIcon = true,
}: RequiredOptionalBadgeProps) {
  const config = {
    required: {
      label: 'REQUIRED',
      variant: 'destructive' as const,
      icon: <AlertCircle className="w-3 h-3" />,
      className: 'bg-red-500 text-white border-red-600',
    },
    recommended: {
      label: 'RECOMMENDED',
      variant: 'default' as const,
      icon: <Star className="w-3 h-3" />,
      className: 'bg-accent-500 text-white border-accent-600',
    },
    optional: {
      label: 'OPTIONAL',
      variant: 'secondary' as const,
      icon: <CheckCircle className="w-3 h-3" />,
      className: 'bg-gray-500 text-white border-gray-600',
    },
  };

  const { label, variant, icon, className } = config[priority];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge variant={variant} className={`${className} ${sizeClasses[size]} font-semibold`}>
      {showIcon && <span className="mr-1">{icon}</span>}
      {label}
    </Badge>
  );
}

/**
 * Integration Priority Explanation Tooltip
 */
export interface PriorityTooltipProps {
  priority: IntegrationPriority;
  consequenceIfSkipped: string;
  enablesFeatures: string[];
}

export function IntegrationPriorityTooltip({
  priority,
  consequenceIfSkipped,
  enablesFeatures,
}: PriorityTooltipProps) {
  const explanations = {
    required: {
      title: 'Required Integration',
      description: 'This integration is necessary for core Unite-Hub functionality.',
      action: 'You must connect this to use the platform effectively.',
    },
    recommended: {
      title: 'Recommended Integration',
      description: 'Strongly suggested for the best experience.',
      action: 'We recommend connecting this, but you can skip if needed.',
    },
    optional: {
      title: 'Optional Integration',
      description: 'Nice-to-have feature that enhances your workflow.',
      action: 'Skip if you don\'t need this functionality.',
    },
  };

  const { title, description, action } = explanations[priority];

  return (
    <div className="space-y-3 text-sm max-w-xs">
      <div>
        <div className="font-semibold text-text-primary mb-1">{title}</div>
        <div className="text-text-secondary">{description}</div>
      </div>

      {enablesFeatures.length > 0 && (
        <div>
          <div className="font-medium text-text-primary mb-1">Enables:</div>
          <ul className="space-y-1">
            {enablesFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-text-secondary">
                <span className="text-accent-500 mt-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {consequenceIfSkipped && (
        <div>
          <div className="font-medium text-text-primary mb-1">If you skip:</div>
          <div className="text-text-secondary">{consequenceIfSkipped}</div>
        </div>
      )}

      <div className="pt-2 border-t border-border-base text-text-tertiary">
        {action}
      </div>
    </div>
  );
}
