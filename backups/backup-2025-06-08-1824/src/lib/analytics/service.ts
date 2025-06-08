/**
 * Analytics Service
 * 
 * This module provides the core analytics service functionality, including
 * event tracking, session management, and provider integration.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  AnalyticsEvent, 
  EventType, 
  AnalyticsDimension, 
  AnalyticsMetric,
  UserJourney
} from './types';
import { 
  getAnalyticsConfig, 
  isAnalyticsEnabled, 
  isEventTypeEnabled,
  isDimensionEnabled,
  isMetricEnabled,
  isProviderEnabled
} from './config';

/**
 * Current session information
 */
interface SessionInfo {
  /**
   * Session ID
   */
  id: string;
  
  /**
   * Session start time
   */
  startTime: Date;
  
  /**
   * Last activity time
   */
  lastActivityTime: Date;
  
  /**
   * Number of events in the session
   */
  eventCount: number;
  
  /**
   * Whether this is the first session for the user
   */
  isFirstSession: boolean;
  
  /**
   * Page view count in the session
   */
  pageViewCount: number;
  
  /**
   * Current page path
   */
  currentPagePath: string;
  
  /**
   * Previous page path
   */
  previousPagePath: string;
  
  /**
   * Session UTM parameters
   */
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

/**
 * Analytics service instance
 */
class AnalyticsService {
  /**
   * Current session information
   */
  private sessionInfo: SessionInfo | null = null;
  
  /**
   * User ID (if authenticated)
   */
  private userId: string | null = null;
  
  /**
   * Anonymous ID for tracking unauthenticated users
   */
  private anonymousId: string | null = null;
  
  /**
   * Consent status
   */
  private consentStatus: Record<string, boolean> = {
    necessary: true,
    performance: false,
    functional: false,
    targeting: false,
  };
  
  /**
   * Active user journeys
   */
  private activeJourneys: Map<string, UserJourney> = new Map();
  
  /**
   * Registered analytics providers
   */
  private providers: Map<string, unknown> = new Map();
  
  /**
   * Queue for events that couldn't be sent immediately
   */
  private eventQueue: AnalyticsEvent[] = [];
  
  /**
   * Whether the analytics service has been initialized
   */
  private initialized = false;
  
  /**
   * Session timeout interval
   */
  private sessionTimeoutInterval: NodeJS.Timeout | null = null;
  
  /**
   * Debug mode
   */
  private debugMode = false;

  /**
   * Get browser name
   */
  private getBrowser(): string {
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }
    
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      return 'Samsung Internet';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      return 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      return 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      return 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      return 'Safari';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Get device type
   */
  private getDeviceType(): string {
    if (typeof navigator === 'undefined') {
      return 'unknown';
    }
    
    const userAgent = navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'iOS';
    } else if (/Android/.test(userAgent)) {
      return 'Android';
    } else if (
      /Windows NT/.test(userAgent) || 
      /Mac OS X/.test(userAgent) || 
      /Linux/.test(userAgent)
    ) {
      return 'Desktop';
    } else {
      return 'unknown';
    }
  }
  
  /**
   * Get viewport size
   */
  private getViewportSize(): string {
    if (typeof window === 'undefined') {
      return 'unknown';
    }
    
    return `${window.innerWidth}x${window.innerHeight}`;
  }
  
  /**
   * Get consistent sampling decision based on user ID
   */
  private getConsistentSamplingDecision(rate: number): boolean {
    const id = this.userId || this.anonymousId;
    if (!id) {
      return Math.random() < rate;
    }
    
    // Use a simple hash of the ID for deterministic sampling
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    // Normalize to 0-1 range
    const normalizedHash = Math.abs(hash) / 2147483647;
    
    return normalizedHash < rate;
  }
  
  /**
   * Process event queue
   */
  private processEventQueue(): void {
    if (this.eventQueue.length === 0) {
      return;
    }
    
    if (this.debugMode) {
      console.log(`Processing ${this.eventQueue.length} queued events`);
    }
    
    // Process events in FIFO order
    const queueCopy = [...this.eventQueue];
    this.eventQueue = [];
    
    for (const event of queueCopy) {
      this.sendEventToProviders(event);
    }
  }
  
  /**
   * Send event to providers
   */
  private sendEventToProviders(event: AnalyticsEvent): void {
    const config = getAnalyticsConfig();
    
    for (const providerConfig of config.providers) {
      if (!providerConfig.enabled || !this.providers.has(providerConfig.provider)) {
        continue;
      }
      
      try {
        switch (providerConfig.provider) {
          case 'Google Analytics':
            this.sendToGoogleAnalytics(event);
            break;
          
          case 'Custom':
            this.sendToCustomBackend(event);
            break;
          
          // Add more provider send methods here
        }
      } catch (error) {
        console.error(`Failed to send event to provider ${providerConfig.provider}:`, error);
        
        // Queue event for retry if it's important
        if (event.type !== EventType.PAGE_VIEW && event.type !== EventType.PAGE_EXIT) {
          this.eventQueue.push(event);
        }
      }
    }
  }
  
  /**
   * Send event to Google Analytics
   */
  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }
    
    const eventName = event.type === EventType.CUSTOM 
      ? String(event.properties.name || 'custom_event')
      : String(event.type);

    const params: Record<string, unknown> = {
      ...event.properties,
    };

    // Add dimensions as parameters
    for (const [dimension, value] of Object.entries(event.dimensions)) {
      if (value !== undefined) {
        params[dimension] = value;
      }
    }

    // Add metrics as parameters
    for (const [metric, value] of Object.entries(event.metrics)) {
      if (value !== undefined) {
        params[metric] = value;
      }
    }

    // Send event to Google Analytics
    window.gtag('event', eventName, params);
  }
  
  /**
   * Send event to custom backend
   */
  private sendToCustomBackend(event: AnalyticsEvent): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    const config = getAnalyticsConfig();
    const customConfig = config.providers.find(p => p.provider === 'Custom');
    
    if (!customConfig || !customConfig.options?.endpoint) {
      return;
    }
    
    // Send event to custom backend (fire and forget)
    fetch(String(customConfig.options.endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: event.type === EventType.PAGE_EXIT,
    }).catch(error => {
      if (this.debugMode) {
        console.error('Failed to send event to custom backend:', error);
      }
    });
  }
  
  /**
   * Update active journeys with event
   */
  private updateJourneys(_event: AnalyticsEvent): void {
    // This would contain complex logic to update user journeys based on events
    // For brevity, we're omitting the implementation
  }
  
  /**
   * Initialize the analytics service
   * @param options Initialization options
   */
  async initialize(options: {
    userId?: string;
    consentStatus?: Record<string, boolean>;
    debugMode?: boolean;
  } = {}): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    const config = getAnalyticsConfig();
    
    // Set user ID if provided
    if (options.userId) {
      this.userId = options.userId;
    }
    
    // Set consent status if provided
    if (options.consentStatus) {
      this.consentStatus = {
        ...this.consentStatus,
        ...options.consentStatus,
      };
    }
    
    // Set debug mode
    this.debugMode = options.debugMode !== undefined ? options.debugMode : config.debug;
    
    // Initialize anonymous ID from local storage or create a new one
    if (typeof window !== 'undefined') {
      this.anonymousId = localStorage.getItem('analytics_anonymous_id');
      if (!this.anonymousId) {
        this.anonymousId = uuidv4();
        localStorage.setItem('analytics_anonymous_id', this.anonymousId);
      }
    } else {
      this.anonymousId = uuidv4();
    }
    
    // Start a new session
    this.startNewSession();
    
    // Initialize providers
    await this.initializeProviders();
    
    // Process event queue
    this.processEventQueue();
    
    // Track page view for the initial page
    if (typeof window !== 'undefined') {
      this.trackPageView(window.location.pathname);
    }
    
    // Add event listeners
    if (typeof window !== 'undefined') {
      // Track page changes
      if ('onpopstate' in window) {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
          originalPushState.call(history, data, unused, url);
          this.handleLocationChange();
        };
        
        history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
          originalReplaceState.call(history, data, unused, url);
          this.handleLocationChange();
        };
        
        window.addEventListener('popstate', () => {
          this.handleLocationChange();
        });
      }
      
      // Track page visibility changes
      if ('hidden' in document) {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            this.trackEvent(EventType.PAGE_EXIT);
          }
        });
      }
      
      // Track page unload
      window.addEventListener('beforeunload', () => {
        this.trackEvent(EventType.PAGE_EXIT);
      });
    }
    
    this.initialized = true;
    
    if (this.debugMode) {
      console.log('Analytics service initialized', {
        userId: this.userId,
        anonymousId: this.anonymousId,
        sessionId: this.sessionInfo?.id,
        consentStatus: this.consentStatus,
      });
    }
  }
  
  /**
   * Start a new session
   */
  private startNewSession(): void {
    const config = getAnalyticsConfig();
    
    // Check if there's an existing session in storage
    let existingSessionId: string | null = null;
    let isFirstSession = true;
    
    if (typeof window !== 'undefined') {
      existingSessionId = sessionStorage.getItem('analytics_session_id');
      const sessionStartTime = sessionStorage.getItem('analytics_session_start_time');
      const lastActivityTime = sessionStorage.getItem('analytics_last_activity_time');
      
      if (existingSessionId && sessionStartTime && lastActivityTime) {
        const lastActivity = new Date(lastActivityTime);
        const now = new Date();
        const timeDiff = now.getTime() - lastActivity.getTime();
        const timeoutMs = config.session.timeoutMinutes * 60 * 1000;
        
        // If the session hasn't timed out, reuse it
        if (timeDiff < timeoutMs && !config.session.refreshOnReload) {
          this.sessionInfo = {
            id: existingSessionId,
            startTime: new Date(sessionStartTime),
            lastActivityTime: new Date(),
            eventCount: parseInt(sessionStorage.getItem('analytics_event_count') || '0', 10),
            isFirstSession: sessionStorage.getItem('analytics_is_first_session') === 'true',
            pageViewCount: parseInt(sessionStorage.getItem('analytics_page_view_count') || '0', 10),
            currentPagePath: sessionStorage.getItem('analytics_current_page_path') || '',
            previousPagePath: sessionStorage.getItem('analytics_previous_page_path') || '',
            utmParams: JSON.parse(sessionStorage.getItem('analytics_utm_params') || '{}'),
          };
          
          // Update last activity time
          this.updateSessionLastActivity();
          
          return;
        }
      }
      
      // Check if this is the first session ever
      isFirstSession = localStorage.getItem('analytics_has_session') !== 'true';
      localStorage.setItem('analytics_has_session', 'true');
    }
    
    // Extract UTM parameters from URL
    const utmParams: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const utmKeys = ['source', 'medium', 'campaign', 'term', 'content'];
      
      for (const key of utmKeys) {
        const value = urlParams.get(`utm_${key}`);
        if (value) {
          utmParams[key] = value;
        }
      }
    }
    
    // Create a new session
    this.sessionInfo = {
      id: uuidv4(),
      startTime: new Date(),
      lastActivityTime: new Date(),
      eventCount: 0,
      isFirstSession,
      pageViewCount: 0,
      currentPagePath: typeof window !== 'undefined' ? window.location.pathname : '',
      previousPagePath: '',
      utmParams: utmParams as SessionInfo['utmParams'],
    };
    
    // Store session info in storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_session_id', this.sessionInfo.id);
      sessionStorage.setItem('analytics_session_start_time', this.sessionInfo.startTime.toISOString());
      sessionStorage.setItem('analytics_last_activity_time', this.sessionInfo.lastActivityTime.toISOString());
      sessionStorage.setItem('analytics_event_count', '0');
      sessionStorage.setItem('analytics_is_first_session', String(isFirstSession));
      sessionStorage.setItem('analytics_page_view_count', '0');
      sessionStorage.setItem('analytics_current_page_path', this.sessionInfo.currentPagePath);
      sessionStorage.setItem('analytics_previous_page_path', '');
      sessionStorage.setItem('analytics_utm_params', JSON.stringify(utmParams));
    }
    
    // Set up session timeout
    this.setupSessionTimeout();
  }
  
  /**
   * Update session last activity time
   */
  private updateSessionLastActivity(): void {
    if (!this.sessionInfo) {
      return;
    }
    
    this.sessionInfo.lastActivityTime = new Date();
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analytics_last_activity_time', this.sessionInfo.lastActivityTime.toISOString());
    }
    
    // Reset session timeout
    this.setupSessionTimeout();
  }
  
  /**
   * Set up session timeout
   */
  private setupSessionTimeout(): void {
    const config = getAnalyticsConfig();
    
    // Clear existing timeout
    if (this.sessionTimeoutInterval) {
      clearTimeout(this.sessionTimeoutInterval);
    }
    
    // Set up new timeout
    this.sessionTimeoutInterval = setTimeout(() => {
      // Session timed out, start a new one on next activity
      this.sessionInfo = null;
    }, config.session.timeoutMinutes * 60 * 1000);
  }
  
  /**
   * Handle location change
   */
  private handleLocationChange(): void {
    if (typeof window !== 'undefined') {
      this.trackPageView(window.location.pathname);
    }
  }
  
  /**
   * Initialize analytics providers
   */
  private async initializeProviders(): Promise<void> {
    const config = getAnalyticsConfig();
    
    for (const providerConfig of config.providers) {
      if (!providerConfig.enabled) {
        continue;
      }
      
      try {
        switch (providerConfig.provider) {
          case 'Google Analytics':
            await this.initializeGoogleAnalytics(providerConfig.apiKey || '');
            break;
          
          case 'Custom':
            // Custom provider is already set up
            break;
          
          // Add more provider initializations here
        }
        
        this.providers.set(providerConfig.provider, true);
      } catch (error) {
        console.error(`Failed to initialize analytics provider ${providerConfig.provider}:`, error);
      }
    }
  }
  
  /**
   * Initialize Google Analytics
   * @param measurementId Google Analytics measurement ID
   */
  private async initializeGoogleAnalytics(measurementId: string): Promise<void> {
    if (!measurementId) {
      return;
    }
    
    // Load Google Analytics script
    if (typeof window !== 'undefined' && !window.gtag) {
      // Create script tag
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      
      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        if (window.dataLayer) {
          window.dataLayer.push(arguments);
        }
      };
      
      // Configure Google Analytics
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        anonymize_ip: getAnalyticsConfig().privacy.anonymizeIp,
        send_page_view: false, // We'll track page views manually
      });
      
      // Add script to document
      document.head.appendChild(script);
    }
  }
  
  /**
   * Set user ID
   * @param userId User ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    // Update Google Analytics user ID
    if (typeof window !== 'undefined' && window.gtag && isProviderEnabled('Google Analytics')) {
      window.gtag('set', { user_id: userId });
    }
    
    if (this.debugMode) {
      console.log('Analytics user ID set', { userId });
    }
  }
  
  /**
   * Clear user ID (for logout)
   */
  clearUserId(): void {
    this.userId = null;
    
    // Update Google Analytics user ID
    if (typeof window !== 'undefined' && window.gtag && isProviderEnabled('Google Analytics')) {
      window.gtag('set', { user_id: undefined });
    }
    
    if (this.debugMode) {
      console.log('Analytics user ID cleared');
    }
  }
  
  /**
   * Set consent status
   * @param status Consent status
   */
  setConsentStatus(status: Record<string, boolean>): void {
    this.consentStatus = {
      ...this.consentStatus,
      ...status,
    };
    
    if (this.debugMode) {
      console.log('Analytics consent status set', { consentStatus: this.consentStatus });
    }
  }
  
  /**
   * Track event
   * @param eventType Event type
   * @param properties Event properties
   * @param dimensions Event dimensions
   * @param metrics Event metrics
   * @returns Event ID if the event was tracked, null otherwise
   */
  trackEvent(
    eventType: EventType,
    properties: Record<string, unknown> = {},
    dimensions: Partial<Record<AnalyticsDimension, string | number | boolean>> = {},
    metrics: Partial<Record<AnalyticsMetric, number>> = {}
  ): string | null {
    // Ensure service is initialized
    if (!this.initialized) {
      this.initialize();
    }
    
    // Make sure we have a session
    if (!this.sessionInfo) {
      this.startNewSession();
    }
    
    // Check if analytics is enabled
    if (!isAnalyticsEnabled(this.consentStatus)) {
      return null;
    }
    
    // Check if the event type is enabled
    if (!isEventTypeEnabled(eventType)) {
      return null;
    }
    
    // Check if we've reached the maximum events per session
    const config = getAnalyticsConfig();
    if (this.sessionInfo && this.sessionInfo.eventCount >= config.eventFiltering.maxEventsPerSession) {
      if (this.debugMode) {
        console.warn(`Maximum events per session (${config.eventFiltering.maxEventsPerSession}) reached, event not tracked`);
      }
      return null;
    }
    
    // Update session info
    this.updateSessionLastActivity();
    if (this.sessionInfo) {
      this.sessionInfo.eventCount++;
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('analytics_event_count', String(this.sessionInfo.eventCount));
      }
    }
    
    // Apply sampling
    if (config.sampling.rate < 1) {
      const shouldSample = config.sampling.consistent
        ? this.getConsistentSamplingDecision(config.sampling.rate)
        : Math.random() < config.sampling.rate;
      
      if (!shouldSample) {
        if (this.debugMode) {
          console.log(`Event sampled out (rate: ${config.sampling.rate})`, { eventType });
        }
        return null;
      }
    }
    
    // Prepare event data
    const eventId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Add default dimensions
    const enrichedDimensions: Partial<Record<AnalyticsDimension, string | number | boolean>> = {
      [AnalyticsDimension.USER_ID]: this.userId || undefined,
      [AnalyticsDimension.SESSION_ID]: this.sessionInfo?.id,
      [AnalyticsDimension.SESSION_IS_FIRST]: this.sessionInfo?.isFirstSession,
      [AnalyticsDimension.SESSION_START_TIME]: this.sessionInfo?.startTime.toISOString(),
      [AnalyticsDimension.SESSION_PAGE_COUNT]: this.sessionInfo?.pageViewCount,
      
      // Add UTM parameters
      [AnalyticsDimension.UTM_SOURCE]: this.sessionInfo?.utmParams.source,
      [AnalyticsDimension.UTM_MEDIUM]: this.sessionInfo?.utmParams.medium,
      [AnalyticsDimension.UTM_CAMPAIGN]: this.sessionInfo?.utmParams.campaign,
      [AnalyticsDimension.UTM_TERM]: this.sessionInfo?.utmParams.term,
      [AnalyticsDimension.UTM_CONTENT]: this.sessionInfo?.utmParams.content,
      
      // Add technical dimensions
      [AnalyticsDimension.PAGE_URL]: typeof window !== 'undefined' ? window.location.href : undefined,
      [AnalyticsDimension.PAGE_PATH]: typeof window !== 'undefined' ? window.location.pathname : undefined,
      [AnalyticsDimension.PAGE_TITLE]: typeof document !== 'undefined' ? document.title : undefined,
      [AnalyticsDimension.PAGE_REFERRER]: typeof document !== 'undefined' ? document.referrer : undefined,
      
      // Add browser and device info
      [AnalyticsDimension.BROWSER]: this.getBrowser(),
      [AnalyticsDimension.DEVICE_TYPE]: this.getDeviceType(),
      [AnalyticsDimension.VIEWPORT_SIZE]: this.getViewportSize(),
      [AnalyticsDimension.LANGUAGE]: typeof navigator !== 'undefined' ? navigator.language : undefined,
      
      // Add custom dimensions
      ...dimensions,
    };
    
    // Filter disabled dimensions
    const filteredDimensions: Partial<Record<AnalyticsDimension, string | number | boolean>> = {};
    for (const [dimension, value] of Object.entries(enrichedDimensions)) {
      if (value !== undefined && isDimensionEnabled(dimension as AnalyticsDimension)) {
        filteredDimensions[dimension as AnalyticsDimension] = value;
      }
    }
    
    // Filter disabled metrics
    const filteredMetrics: Partial<Record<AnalyticsMetric, number>> = {};
    for (const [metric, value] of Object.entries(metrics)) {
      if (value !== undefined && isMetricEnabled(metric as AnalyticsMetric)) {
        filteredMetrics[metric as AnalyticsMetric] = value;
      }
    }
    
    // Create event object
    const event: AnalyticsEvent = {
      id: eventId,
      type: eventType,
      timestamp,
      userId: this.userId || undefined,
      sessionId: this.sessionInfo?.id,
      properties,
      dimensions: filteredDimensions,
      metrics: filteredMetrics,
    };
    
    // Send event to providers
    this.sendEventToProviders(event);
    
    // Update active journeys
    this.updateJourneys(event);
    
    if (this.debugMode) {
      console.log('Analytics event tracked', event);
    }
    
    return eventId;
  }
  
  /**
   * Track page view
   * @param path Page path
   * @param properties Additional properties
   * @returns Event ID if the event was tracked, null otherwise
   */
  trackPageView(path: string, properties: Record<string, unknown> = {}): string | null {
    // Update session info
    if (this.sessionInfo) {
      this.sessionInfo.previousPagePath = this.sessionInfo.currentPagePath;
      this.sessionInfo.currentPagePath = path;
      this.sessionInfo.pageViewCount++;
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('analytics_previous_page_path', this.sessionInfo.previousPagePath);
        sessionStorage.setItem('analytics_current_page_path', this.sessionInfo.currentPagePath);
        sessionStorage.setItem('analytics_page_view_count', String(this.sessionInfo.pageViewCount));
      }
    }
    
    // Track page view event
    return this.trackEvent(EventType.PAGE_VIEW, {
      path,
      ...properties,
    });
  }
}

// Export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService;
