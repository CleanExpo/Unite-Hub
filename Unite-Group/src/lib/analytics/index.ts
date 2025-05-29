/**
 * Analytics Module
 * 
 * This is the main entry point for analytics functionality.
 * It exports all analytics-related configurations, utilities, and components.
 */

// Export types
export type {
  AnalyticsEvent,
  EventType,
  AnalyticsDimension,
  AnalyticsMetric,
  UserJourney,
  JourneyStep,
  AnalyticsFunnel,
  FunnelStep,
  ReportTimePeriod,
  ReportMetric,
  DashboardConfig,
  PredictionModelType,
  PredictionModel,
  AnalyticsProviderConfig
} from './types';

// Export configuration types
export type { AnalyticsConfig } from './config';

// Export configuration functions and values
export {
  defaultAnalyticsConfig,
  getAnalyticsConfig,
  setAnalyticsConfig,
  isAnalyticsEnabled,
  isEventTypeEnabled,
  isDimensionEnabled,
  isMetricEnabled,
  isProviderEnabled
} from './config';

// Simplified analytics service for now
export const trackEvent = (eventName: string, properties?: Record<string, any>): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - We know gtag might exist but TypeScript doesn't
    window.gtag('event', eventName, properties || {});
  }
  
  // Log in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] Event tracked: ${eventName}`, properties);
  }
};

export const trackPageView = (path: string, properties?: Record<string, any>): void => {
  trackEvent('page_view', { 
    page_path: path,
    ...properties
  });
};

export const setUserId = (userId: string): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - We know gtag might exist but TypeScript doesn't
    window.gtag('set', { user_id: userId });
  }
};

export const clearUserId = (): void => {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    // @ts-ignore - We know gtag might exist but TypeScript doesn't
    window.gtag('set', { user_id: undefined });
  }
};

// Default export for convenience
export default {
  trackEvent,
  trackPageView,
  setUserId,
  clearUserId
};
