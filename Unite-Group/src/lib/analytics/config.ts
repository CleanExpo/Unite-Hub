/**
 * Analytics Configuration
 * 
 * This module provides configuration for the analytics system, including
 * provider configurations, event filtering, and privacy settings.
 */

import { 
  EventType, 
  AnalyticsDimension, 
  AnalyticsMetric,
  AnalyticsProviderConfig
} from './types';

/**
 * Analytics configuration options
 */
export interface AnalyticsConfig {
  /**
   * Whether analytics tracking is enabled
   * @default true in production, false in development
   */
  enabled: boolean;
  
  /**
   * Debug mode (logs events to console)
   * @default false in production, true in development
   */
  debug: boolean;
  
  /**
   * User consent settings
   */
  consent: {
    /**
     * Whether consent is required for tracking
     * @default true
     */
    required: boolean;
    
    /**
     * Categories of consent
     */
    categories: {
      /**
       * Whether necessary cookies are allowed (cannot be disabled)
       * @default true
       */
      necessary: boolean;
      
      /**
       * Whether performance tracking is allowed
       * @default false
       */
      performance: boolean;
      
      /**
       * Whether functional cookies are allowed
       * @default false
       */
      functional: boolean;
      
      /**
       * Whether targeting/advertising cookies are allowed
       * @default false
       */
      targeting: boolean;
    };
  };
  
  /**
   * Privacy settings
   */
  privacy: {
    /**
     * Whether to anonymize IP addresses
     * @default true
     */
    anonymizeIp: boolean;
    
    /**
     * Whether to mask personally identifiable information (PII)
     * @default true
     */
    maskPii: boolean;
    
    /**
     * Data retention period in days
     * @default 365
     */
    retentionDays: number;
    
    /**
     * Whether to respect Do Not Track (DNT) header
     * @default true
     */
    respectDnt: boolean;
  };
  
  /**
   * Sampling settings
   */
  sampling: {
    /**
     * Sampling rate (0-1)
     * @default 1 (100%, no sampling)
     */
    rate: number;
    
    /**
     * Whether to use consistent sampling (same user always included/excluded)
     * @default true
     */
    consistent: boolean;
  };
  
  /**
   * Session settings
   */
  session: {
    /**
     * Session timeout in minutes
     * @default 30
     */
    timeoutMinutes: number;
    
    /**
     * Whether to create a new session on page refresh
     * @default false
     */
    refreshOnReload: boolean;
  };
  
  /**
   * Event filtering settings
   */
  eventFiltering: {
    /**
     * Enabled event types (if empty, all are enabled)
     */
    enabledEvents: EventType[];
    
    /**
     * Disabled event types
     */
    disabledEvents: EventType[];
    
    /**
     * Maximum number of events to track per session
     * @default 1000
     */
    maxEventsPerSession: number;
  };
  
  /**
   * Dimension filtering settings
   */
  dimensionFiltering: {
    /**
     * Enabled dimensions (if empty, all are enabled)
     */
    enabledDimensions: AnalyticsDimension[];
    
    /**
     * Disabled dimensions
     */
    disabledDimensions: AnalyticsDimension[];
  };
  
  /**
   * Metric filtering settings
   */
  metricFiltering: {
    /**
     * Enabled metrics (if empty, all are enabled)
     */
    enabledMetrics: AnalyticsMetric[];
    
    /**
     * Disabled metrics
     */
    disabledMetrics: AnalyticsMetric[];
  };
  
  /**
   * Provider configurations
   */
  providers: AnalyticsProviderConfig[];
  
  /**
   * Custom settings
   */
  custom: Record<string, any>;
}

/**
 * Default analytics configuration
 */
export const defaultAnalyticsConfig: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV !== 'production',
  
  consent: {
    required: true,
    categories: {
      necessary: true,
      performance: false,
      functional: false,
      targeting: false,
    },
  },
  
  privacy: {
    anonymizeIp: true,
    maskPii: true,
    retentionDays: 365,
    respectDnt: true,
  },
  
  sampling: {
    rate: 1,
    consistent: true,
  },
  
  session: {
    timeoutMinutes: 30,
    refreshOnReload: false,
  },
  
  eventFiltering: {
    enabledEvents: [],
    disabledEvents: [],
    maxEventsPerSession: 1000,
  },
  
  dimensionFiltering: {
    enabledDimensions: [],
    disabledDimensions: [],
  },
  
  metricFiltering: {
    enabledMetrics: [],
    disabledMetrics: [],
  },
  
  providers: [
    {
      provider: 'Google Analytics',
      apiKey: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
      enabled: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
      includePII: false,
      options: {
        anonymizeIp: true,
      },
    },
    {
      provider: 'Custom',
      enabled: true,
      includePII: false,
      options: {
        endpoint: '/api/analytics',
      },
    },
  ],
  
  custom: {},
};

// Current configuration
let currentConfig: AnalyticsConfig = { ...defaultAnalyticsConfig };

/**
 * Get the current analytics configuration
 * @returns Current analytics configuration
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  return currentConfig;
}

/**
 * Set the analytics configuration
 * @param config Partial analytics configuration to merge with current config
 */
export function setAnalyticsConfig(config: Partial<AnalyticsConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...config,
    // Deep merge for nested objects
    consent: {
      ...currentConfig.consent,
      ...config.consent,
      categories: {
        ...currentConfig.consent.categories,
        ...config.consent?.categories,
      },
    },
    privacy: {
      ...currentConfig.privacy,
      ...config.privacy,
    },
    sampling: {
      ...currentConfig.sampling,
      ...config.sampling,
    },
    session: {
      ...currentConfig.session,
      ...config.session,
    },
    eventFiltering: {
      ...currentConfig.eventFiltering,
      ...config.eventFiltering,
    },
    dimensionFiltering: {
      ...currentConfig.dimensionFiltering,
      ...config.dimensionFiltering,
    },
    metricFiltering: {
      ...currentConfig.metricFiltering,
      ...config.metricFiltering,
    },
    custom: {
      ...currentConfig.custom,
      ...config.custom,
    },
  };
}

/**
 * Check if analytics tracking is enabled based on configuration and user consent
 * @param consentCategories User consent categories
 * @returns Whether analytics tracking is enabled
 */
export function isAnalyticsEnabled(
  consentCategories?: Partial<AnalyticsConfig['consent']['categories']>
): boolean {
  // Check if analytics is globally enabled
  if (!currentConfig.enabled) {
    return false;
  }
  
  // Check Do Not Track if configured to respect it
  if (currentConfig.privacy.respectDnt && typeof window !== 'undefined') {
    if (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      navigator.doNotTrack === 'yes' ||
      (navigator as any).msDoNotTrack === '1'
    ) {
      return false;
    }
  }
  
  // If consent is not required, analytics is enabled
  if (!currentConfig.consent.required) {
    return true;
  }
  
  // If consent categories are provided, check if at least one non-necessary category is enabled
  if (consentCategories) {
    return (
      consentCategories.performance === true ||
      consentCategories.functional === true ||
      consentCategories.targeting === true
    );
  }
  
  // By default, if consent is required but no categories are provided, analytics is disabled
  return false;
}

/**
 * Check if a specific event type is enabled for tracking
 * @param eventType Event type to check
 * @returns Whether the event type is enabled
 */
export function isEventTypeEnabled(eventType: EventType): boolean {
  const { enabledEvents, disabledEvents } = currentConfig.eventFiltering;
  
  // If the event is explicitly disabled, return false
  if (disabledEvents.includes(eventType)) {
    return false;
  }
  
  // If enabled events is empty, all events are enabled
  if (enabledEvents.length === 0) {
    return true;
  }
  
  // Otherwise, check if the event is in the enabled list
  return enabledEvents.includes(eventType);
}

/**
 * Check if a specific dimension is enabled for tracking
 * @param dimension Dimension to check
 * @returns Whether the dimension is enabled
 */
export function isDimensionEnabled(dimension: AnalyticsDimension): boolean {
  const { enabledDimensions, disabledDimensions } = currentConfig.dimensionFiltering;
  
  // If the dimension is explicitly disabled, return false
  if (disabledDimensions.includes(dimension)) {
    return false;
  }
  
  // If enabled dimensions is empty, all dimensions are enabled
  if (enabledDimensions.length === 0) {
    return true;
  }
  
  // Otherwise, check if the dimension is in the enabled list
  return enabledDimensions.includes(dimension);
}

/**
 * Check if a specific metric is enabled for tracking
 * @param metric Metric to check
 * @returns Whether the metric is enabled
 */
export function isMetricEnabled(metric: AnalyticsMetric): boolean {
  const { enabledMetrics, disabledMetrics } = currentConfig.metricFiltering;
  
  // If the metric is explicitly disabled, return false
  if (disabledMetrics.includes(metric)) {
    return false;
  }
  
  // If enabled metrics is empty, all metrics are enabled
  if (enabledMetrics.length === 0) {
    return true;
  }
  
  // Otherwise, check if the metric is in the enabled list
  return enabledMetrics.includes(metric);
}

/**
 * Check if a specific provider is enabled
 * @param providerName Name of the provider to check
 * @returns Whether the provider is enabled
 */
export function isProviderEnabled(providerName: string): boolean {
  const provider = currentConfig.providers.find(p => p.provider === providerName);
  return provider ? provider.enabled : false;
}
