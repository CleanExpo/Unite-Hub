// Web Vitals Monitoring - Native Implementation

export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

// Metric type for internal use
interface Metric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

// Thresholds based on Google's recommendations
const thresholds = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = thresholds[name as keyof typeof thresholds];
  if (!threshold) return 'poor';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Generate unique ID for metrics
 */
function generateId(): string {
  return `v${Date.now()}-${Math.floor(Math.random() * 8999) + 1000}`;
}

/**
 * Report web vitals to analytics
 */
export function reportWebVitals(metric: Metric) {
  const rating = getRating(metric.name, metric.value);
  
  const webVitalsMetric: WebVitalsMetric = {
    name: metric.name as any,
    value: metric.value,
    rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', webVitalsMetric);
  }

  // Send to analytics service
  if ((window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      rating,
    });
  }

  // Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webVitalsMetric),
    }).catch(() => {
      // Silently fail - don't impact user experience
    });
  }
}

/**
 * Observe First Contentful Paint
 */
function observeFCP(callback: (metric: Metric) => void) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        callback({
          name: 'FCP',
          value: entry.startTime,
          delta: entry.startTime,
          id: generateId(),
        });
        observer.disconnect();
      }
    }
  });
  
  observer.observe({ entryTypes: ['paint'] });
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP(callback: (metric: Metric) => void) {
  let lastEntry: PerformanceEntry;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      lastEntry = entry;
    }
  });
  
  observer.observe({ entryTypes: ['largest-contentful-paint'] });
  
  // Report final LCP when page is backgrounded
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && lastEntry) {
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        delta: lastEntry.startTime,
        id: generateId(),
      });
      observer.disconnect();
    }
  }, { once: true });
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS(callback: (metric: Metric) => void) {
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        const firstSessionEntry = clsEntries[0];
        const lastSessionEntry = clsEntries[clsEntries.length - 1];
        
        if (firstSessionEntry && entry.startTime - lastSessionEntry.startTime < 1000 && 
            entry.startTime - firstSessionEntry.startTime < 5000) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        } else {
          clsValue = (entry as any).value;
          clsEntries = [entry];
        }
      }
    }
  });
  
  observer.observe({ entryTypes: ['layout-shift'] });
  
  // Report final CLS when page is backgrounded
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      callback({
        name: 'CLS',
        value: clsValue,
        delta: clsValue,
        id: generateId(),
      });
      observer.disconnect();
    }
  }, { once: true });
}

/**
 * Observe First Input Delay
 */
function observeFID(callback: (metric: Metric) => void) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'first-input') {
        const fidEntry = entry as any; // PerformanceEventTiming not fully typed
        const delay = fidEntry.processingStart - fidEntry.startTime;
        callback({
          name: 'FID',
          value: delay,
          delta: delay,
          id: generateId(),
        });
        observer.disconnect();
      }
    }
  });
  
  observer.observe({ entryTypes: ['first-input'] });
}

/**
 * Calculate Time to First Byte
 */
function calculateTTFB(callback: (metric: Metric) => void) {
  const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (navigationEntry) {
    const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
    callback({
      name: 'TTFB',
      value: ttfb,
      delta: ttfb,
      id: generateId(),
    });
  }
}

/**
 * Initialize web vitals monitoring
 */
export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    observeFCP(reportWebVitals);
    observeLCP(reportWebVitals);
    observeCLS(reportWebVitals);
    observeFID(reportWebVitals);
    calculateTTFB(reportWebVitals);
  } catch (e) {
    // Silently fail if Performance Observer is not supported
    console.warn('Web Vitals monitoring not fully supported:', e);
  }
}

/**
 * Get current performance metrics
 */
export function getCurrentMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!navigation) return null;

  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,
    
    // Resource timing
    resources: performance.getEntriesByType('resource').map(resource => ({
      name: resource.name,
      type: (resource as any).initiatorType,
      duration: resource.duration,
      size: (resource as any).transferSize || 0,
    })),
    
    // Memory usage (if available)
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  };
}

/**
 * Performance observer for long tasks
 */
export function observeLongTasks(callback: (entries: PerformanceEntry[]) => void) {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });
    
    try {
      observer.observe({ entryTypes: ['longtask'] });
      return () => observer.disconnect();
    } catch (e) {
      // Long task monitoring not supported
      return () => {};
    }
  }
  
  return () => {};
}

/**
 * Check if the user has a slow connection
 */
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return (
      connection.saveData ||
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g'
    );
  }
  return false;
}
