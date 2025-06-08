'use client';

import React from 'react';
import { useExperiment } from '@/hooks/useExperiment';

interface VariantProps {
  experiment: string;
  variant: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  trackView?: boolean;
  viewEventName?: string;
}

/**
 * Component for conditional rendering based on experiment variants
 * 
 * @example
 * ```tsx
 * <Variant experiment="Homepage CTA Test" variant="green-button">
 *   <Button color="green">Get Started</Button>
 * </Variant>
 * 
 * <Variant experiment="Homepage CTA Test" variant={['control', 'blue-button']}>
 *   <Button color="blue">Get Started</Button>
 * </Variant>
 * ```
 */
export function Variant({
  experiment,
  variant,
  children,
  fallback = null,
  trackView = false,
  viewEventName = 'variant_viewed',
}: VariantProps) {
  const { variant: currentVariant, track, isLoading } = useExperiment(experiment);

  // Track view event if enabled
  React.useEffect(() => {
    if (trackView && !isLoading) {
      const variants = Array.isArray(variant) ? variant : [variant];
      if (variants.includes(currentVariant)) {
        track(viewEventName, { variant: currentVariant });
      }
    }
  }, [currentVariant, isLoading, track, trackView, variant, viewEventName]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Check if current variant matches
  const variants = Array.isArray(variant) ? variant : [variant];
  const shouldRender = variants.includes(currentVariant);

  return <>{shouldRender ? children : fallback}</>;
}

interface MultiVariantProps {
  experiment: string;
  children: React.ReactNode;
  trackView?: boolean;
  viewEventName?: string;
}

/**
 * Component for rendering different content based on experiment variants
 * Uses child elements with data-variant attribute
 * 
 * @example
 * ```tsx
 * <MultiVariant experiment="Homepage CTA Test">
 *   <Button data-variant="control" color="blue">Get Started</Button>
 *   <Button data-variant="green-button" color="green">Get Started Now</Button>
 *   <Button data-variant="red-button" color="red">Start Free Trial</Button>
 * </MultiVariant>
 * ```
 */
export function MultiVariant({
  experiment,
  children,
  trackView = false,
  viewEventName = 'variant_viewed',
}: MultiVariantProps) {
  const { variant: currentVariant, track, isLoading } = useExperiment(experiment);

  // Track view event if enabled
  React.useEffect(() => {
    if (trackView && !isLoading && currentVariant) {
      track(viewEventName, { variant: currentVariant });
    }
  }, [currentVariant, isLoading, track, trackView, viewEventName]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Find matching child element
  const childrenArray = React.Children.toArray(children);
  const matchingChild = childrenArray.find((child) => {
    if (React.isValidElement(child) && child.props['data-variant'] === currentVariant) {
      return true;
    }
    return false;
  });

  // Fallback to control variant or first child
  if (!matchingChild) {
    const controlChild = childrenArray.find((child) => {
      if (React.isValidElement(child) && child.props['data-variant'] === 'control') {
        return true;
      }
      return false;
    });
    return <>{controlChild || childrenArray[0] || null}</>;
  }

  return <>{matchingChild}</>;
}
