'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon | ReactNode;
  title: string;
  description: string;
  details?: string[];
  highlighted?: boolean;
}

export interface FeatureGridProps {
  title?: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'compact';
  className?: string;
}

/**
 * Feature Grid Component
 *
 * Displays a grid of features with icons and descriptions.
 * Supports 2, 3, or 4 column layouts.
 *
 * @example
 * ```tsx
 * <FeatureGrid
 *   title="Core Features"
 *   description="Everything you need to succeed"
 *   features={[
 *     {
 *       icon: Brain,
 *       title: 'AI Intelligence',
 *       description: 'Smart automation powered by Claude AI',
 *       details: ['Lead scoring', 'Content generation', 'Intent analysis'],
 *       highlighted: true
 *     },
 *     // ... more features
 *   ]}
 *   columns={3}
 * />
 * ```
 */
export function FeatureGrid({
  title,
  description,
  features,
  columns = 3,
  variant = 'default',
  className = '',
}: FeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  const renderIcon = (icon: LucideIcon | ReactNode) => {
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-10 w-10 mb-2 text-primary" />;
    }
    return <div className="mb-2 text-primary">{icon}</div>;
  };

  return (
    <div className={`mb-20 ${className}`}>
      {(title || description) && (
        <div className="text-center mb-12">
          {title && <h2 className="text-3xl font-bold mb-4">{title}</h2>}
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
      )}

      <div className={`grid ${gridCols[columns]} gap-6`}>
        {features.map((feature, index) => (
          <Card
            key={index}
            className={`${
              feature.highlighted ? 'border-primary/50 shadow-lg' : ''
            } ${variant === 'compact' ? 'hover:border-primary/30 transition-colors' : ''}`}
          >
            <CardHeader>
              {renderIcon(feature.icon)}
              <CardTitle className={variant === 'compact' ? 'text-lg' : ''}>
                {feature.title}
              </CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>

            {feature.details && feature.details.length > 0 && (
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx}>• {detail}</li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
