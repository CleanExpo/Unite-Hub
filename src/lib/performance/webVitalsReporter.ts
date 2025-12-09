/**
 * Web Vitals Reporter
 * Phase 10: UX-05 Performance & Accessibility
 *
 * Core Web Vitals monitoring and reporting for performance optimization
 */

import { createApiLogger } from "@/lib/logger";

const logger = createApiLogger({ context: "WebVitals" });

/**
 * Web Vitals metric types
 */
export type WebVitalMetric = {
  name: "CLS" | "FID" | "FCP" | "INP" | "LCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: "navigate" | "reload" | "back-forward" | "back-forward-cache" | "prerender";
};

/**
 * Threshold configurations for Core Web Vitals
 */
export const WEB_VITAL_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

/**
 * Get rating for a metric value
 */
function getRating(
  name: WebVitalMetric["name"],
  value: number
): WebVitalMetric["rating"] {
  const thresholds = WEB_VITAL_THRESHOLDS[name];

  if (value <= thresholds.good) {
return "good";
}
  if (value <= thresholds.needsImprovement) {
return "needs-improvement";
}
  return "poor";
}

/**
 * Report handler type
 */
export type ReportHandler = (metric: WebVitalMetric) => void;

/**
 * Collected metrics storage
 */
const collectedMetrics: Map<string, WebVitalMetric> = new Map();

/**
 * Get collected metrics summary
 */
export function getMetricsSummary(): Record<string, WebVitalMetric> {
  const summary: Record<string, WebVitalMetric> = {};
  collectedMetrics.forEach((metric, name) => {
    summary[name] = metric;
  });
  return summary;
}

/**
 * Calculate overall performance score (0-100)
 */
export function calculatePerformanceScore(): {
  score: number;
  breakdown: Record<string, { value: number; rating: string; weight: number }>;
} {
  const weights = {
    LCP: 25,
    FID: 25,
    INP: 25,
    CLS: 25,
    FCP: 0, // Not in core score
    TTFB: 0, // Not in core score
  };

  let totalScore = 0;
  let totalWeight = 0;
  const breakdown: Record<string, { value: number; rating: string; weight: number }> = {};

  collectedMetrics.forEach((metric) => {
    const weight = weights[metric.name] || 0;

    if (weight > 0) {
      let metricScore = 0;
      if (metric.rating === "good") {
metricScore = 100;
} else if (metric.rating === "needs-improvement") {
metricScore = 50;
} else {
metricScore = 0;
}

      totalScore += metricScore * weight;
      totalWeight += weight;
    }

    breakdown[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      weight,
    };
  });

  const score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  return { score, breakdown };
}

/**
 * Default report handler - logs to console and stores metric
 */
const defaultReportHandler: ReportHandler = (metric) => {
  // Store the metric
  collectedMetrics.set(metric.name, metric);

  // Log with appropriate level based on rating
  const logData = {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };

  if (metric.rating === "good") {
    logger.info("Web Vital measured", logData);
  } else if (metric.rating === "needs-improvement") {
    logger.warn("Web Vital needs improvement", logData);
  } else {
    logger.error("Web Vital is poor", logData);
  }
};

/**
 * Initialize Web Vitals reporting
 * Call this in your app's entry point (e.g., _app.tsx or layout.tsx)
 */
export async function initWebVitals(
  customReportHandler?: ReportHandler
): Promise<void> {
  // Only run in browser
  if (typeof window === "undefined") {
return;
}

  const handler = customReportHandler || defaultReportHandler;

  try {
    // Dynamically import web-vitals to avoid SSR issues
    const { onCLS, onFID, onFCP, onINP, onLCP, onTTFB } = await import(
      "web-vitals"
    );

    // Cumulative Layout Shift
    onCLS((metric) => {
      handler({
        name: "CLS",
        value: metric.value,
        rating: getRating("CLS", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    // First Input Delay
    onFID((metric) => {
      handler({
        name: "FID",
        value: metric.value,
        rating: getRating("FID", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    // First Contentful Paint
    onFCP((metric) => {
      handler({
        name: "FCP",
        value: metric.value,
        rating: getRating("FCP", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    // Interaction to Next Paint
    onINP((metric) => {
      handler({
        name: "INP",
        value: metric.value,
        rating: getRating("INP", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    // Largest Contentful Paint
    onLCP((metric) => {
      handler({
        name: "LCP",
        value: metric.value,
        rating: getRating("LCP", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    // Time to First Byte
    onTTFB((metric) => {
      handler({
        name: "TTFB",
        value: metric.value,
        rating: getRating("TTFB", metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType as WebVitalMetric["navigationType"],
      });
    });

    logger.info("Web Vitals monitoring initialized");
  } catch (error) {
    logger.error("Failed to initialize Web Vitals", { error });
  }
}

/**
 * Send metrics to analytics endpoint
 */
export async function sendMetricsToAnalytics(
  endpoint?: string
): Promise<boolean> {
  const url = endpoint || "/api/analytics/vitals";

  try {
    const metrics = getMetricsSummary();
    const { score, breakdown } = calculatePerformanceScore();

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metrics,
        score,
        breakdown,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true, // Ensure the request completes even on page unload
    });

    return response.ok;
  } catch (error) {
    logger.error("Failed to send metrics to analytics", { error });
    return false;
  }
}

export default {
  initWebVitals,
  getMetricsSummary,
  calculatePerformanceScore,
  sendMetricsToAnalytics,
  WEB_VITAL_THRESHOLDS,
};
