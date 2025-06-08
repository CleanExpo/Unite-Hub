'use client';

import { useExperimentContext } from '@/components/experiments/ExperimentProvider';
import type { UseExperimentReturn } from '@/types/experiments';

/**
 * Hook to use an experiment and get its variant
 * 
 * @param experimentName - The name of the experiment
 * @returns Object containing the variant name and tracking function
 * 
 * @example
 * ```tsx
 * const { variant, track } = useExperiment('Homepage CTA Test');
 * 
 * // Use variant to render different UI
 * if (variant === 'green-button') {
 *   return <Button color="green" onClick={() => track('cta_clicked')}>Get Started</Button>
 * } else {
 *   return <Button color="blue" onClick={() => track('cta_clicked')}>Get Started</Button>
 * }
 * ```
 */
export function useExperiment(experimentName: string): UseExperimentReturn {
  const { getVariant, trackEvent, isLoading } = useExperimentContext();

  const variant = getVariant(experimentName);
  
  const track = (eventName: string, value?: any) => {
    trackEvent(experimentName, eventName, value);
  };

  return {
    variant,
    track,
    isLoading,
  };
}
