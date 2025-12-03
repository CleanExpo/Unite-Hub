/**
 * Dynamic Chart Components Wrapper
 * Phase 9 Performance Optimization - Zero Cost Improvement
 *
 * Uses next/dynamic for code splitting to reduce initial bundle size.
 * Recharts (~330KB) is only loaded when charts are used.
 */

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Loading skeleton for charts
function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div
          className="bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center animate-pulse"
          style={{ height }}
        >
          <div className="text-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Loading chart...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Dynamically import HealthTrendChart from cognitiveTwin
export const DynamicHealthTrendChart = dynamic(
  () => import("@/components/cognitiveTwin/HealthTrendChart"),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Dynamically import SEO KeywordMovementChart
export const DynamicKeywordMovementChart = dynamic(
  () => import("@/components/seo/KeywordMovementChart").then((mod) => mod.default || mod),
  {
    loading: () => <ChartSkeleton height={300} />,
    ssr: false,
  }
);

// Dynamically import SEO HealthTrendChart
export const DynamicSEOHealthTrendChart = dynamic(
  () => import("@/components/seo/HealthTrendChart").then((mod) => mod.default || mod),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Export skeleton for custom usage
export { ChartSkeleton };
