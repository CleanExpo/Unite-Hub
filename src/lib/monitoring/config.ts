/**
 * Monitoring Configuration - Sentry & Datadog Integration
 *
 * Phase 22: Production Launch Optimization
 */

// Sentry Configuration
export const sentryConfig = {
  dsn: process.env.SENTRY_DSN || "",
  environment: process.env.NODE_ENV || "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA || "local",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Error filtering
  ignoreErrors: [
    "ResizeObserver loop",
    "Non-Error exception captured",
    "Network request failed",
  ],

  // Breadcrumb filtering
  beforeBreadcrumb: (breadcrumb: { category?: string }) => {
    if (breadcrumb.category === "console") {
      return null; // Filter console breadcrumbs
    }
    return breadcrumb;
  },
};

// Datadog RUM Configuration
export const datadogConfig = {
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
  site: "datadoghq.com",
  service: "unite-hub",
  env: process.env.NODE_ENV || "development",
  version: process.env.VERCEL_GIT_COMMIT_SHA || "local",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 20,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: "mask-user-input" as const,
};

// Performance thresholds
export const performanceThresholds = {
  // API response times (ms)
  api: {
    good: 200,
    acceptable: 500,
    poor: 1000,
  },

  // Page load times (ms)
  page: {
    fcp: 1800, // First Contentful Paint
    lcp: 2500, // Largest Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
    ttfb: 800, // Time to First Byte
  },

  // Database query times (ms)
  database: {
    good: 50,
    acceptable: 200,
    poor: 500,
  },
};

// Alert thresholds
export const alertThresholds = {
  errorRate: 0.01, // 1% error rate
  p95Latency: 2000, // 2 seconds
  availability: 0.999, // 99.9%
};

// Metrics to track
export const metricsConfig = {
  custom: [
    "api.request.duration",
    "api.request.count",
    "api.error.count",
    "auth.login.count",
    "auth.failure.count",
    "ai.generation.duration",
    "ai.generation.tokens",
    "email.send.count",
    "email.error.count",
    "database.query.duration",
  ],
};

/**
 * Initialize Sentry (call in _app.tsx or layout.tsx)
 */
export async function initSentry() {
  if (typeof window === "undefined" || !sentryConfig.dsn) {
    return;
  }

  const Sentry = await import("@sentry/nextjs");

  Sentry.init({
    dsn: sentryConfig.dsn,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
    replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
    ignoreErrors: sentryConfig.ignoreErrors,
  });
}

/**
 * Initialize Datadog RUM (call in _app.tsx or layout.tsx)
 */
export async function initDatadog() {
  if (typeof window === "undefined" || !datadogConfig.applicationId) {
    return;
  }

  const { datadogRum } = await import("@datadog/browser-rum");

  datadogRum.init({
    applicationId: datadogConfig.applicationId,
    clientToken: datadogConfig.clientToken,
    site: datadogConfig.site,
    service: datadogConfig.service,
    env: datadogConfig.env,
    version: datadogConfig.version,
    sessionSampleRate: datadogConfig.sessionSampleRate,
    sessionReplaySampleRate: datadogConfig.sessionReplaySampleRate,
    trackUserInteractions: datadogConfig.trackUserInteractions,
    trackResources: datadogConfig.trackResources,
    trackLongTasks: datadogConfig.trackLongTasks,
    defaultPrivacyLevel: datadogConfig.defaultPrivacyLevel,
  });

  datadogRum.startSessionReplayRecording();
}

/**
 * Track custom metric
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  if (typeof window === "undefined") {
return;
}

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Metric] ${name}: ${value}`, tags);
  }

  // Send to Datadog if configured
  // Implementation depends on Datadog SDK setup
}

/**
 * Check if monitoring is enabled
 */
export function isMonitoringEnabled(): boolean {
  return !!(sentryConfig.dsn || datadogConfig.applicationId);
}
