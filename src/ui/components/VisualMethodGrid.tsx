'use client';

/**
 * Visual Method Grid
 * Phase 69: Display grid of visual generation methods
 */

import { useMemo } from 'react';
import { VisualMethodCard } from './VisualMethodCard';
import { FilterState } from './VisualMethodFilterBar';
import { METHOD_METADATA_REGISTRY, MethodMetadata } from '@/lib/visual/methods/metadata';

interface VisualMethodGridProps {
  filters: FilterState;
  onMethodSelect?: (method: MethodMetadata) => void;
  className?: string;
}

export function VisualMethodGrid({
  filters,
  onMethodSelect,
  className = '',
}: VisualMethodGridProps) {
  const filteredMethods = useMemo(() => {
    let methods = Array.from(METHOD_METADATA_REGISTRY.values());

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      methods = methods.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.description.toLowerCase().includes(search) ||
          m.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      methods = methods.filter((m) => m.category === filters.category);
    }

    // Channel filter
    if (filters.channel !== 'all') {
      methods = methods.filter(
        (m) =>
          m.primary_channel === filters.channel ||
          m.supported_channels.includes(filters.channel as any)
      );
    }

    // Cost tier filter
    if (filters.costTier !== 'all') {
      methods = methods.filter((m) => m.cost_tier === filters.costTier);
    }

    // Complexity filter
    if (filters.complexity !== 'all') {
      const complexityLevel = parseInt(filters.complexity);
      methods = methods.filter((m) => m.complexity === complexityLevel);
    }

    // Motion filter
    if (filters.motionOnly) {
      methods = methods.filter((m) => m.motion_support);
    }

    return methods;
  }, [filters]);

  if (filteredMethods.length === 0) {
    return (
      <div className={`flex items-center justify-center p-12 ${className}`}>
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No methods found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
    >
      {filteredMethods.map((method) => (
        <VisualMethodCard
          key={method.id}
          id={method.id}
          name={method.name}
          category={method.category}
          description={method.description}
          complexity={
            method.complexity <= 2
              ? 'simple'
              : method.complexity === 3
              ? 'moderate'
              : method.complexity === 4
              ? 'complex'
              : 'advanced'
          }
          providers={method.recommended_models.map((m) => m.model_id)}
          estimated_time_seconds={method.estimated_time_seconds}
          cost_tier={method.cost_tier}
          requires_approval={method.requires_approval}
          outputs={method.outputs}
          onClick={() => onMethodSelect?.(method)}
        />
      ))}
    </div>
  );
}

export default VisualMethodGrid;
