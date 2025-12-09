/**
 * Health Trend Chart - Cognitive Twin
 *
 * Line chart showing health over time with multiple domains,
 * date range selector, hover tooltips with values using recharts.
 */

"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthDataPoint {
  timestamp: string;
  domain_scores: {
    [domainId: string]: number;
  };
}

interface DomainInfo {
  domain_id: string;
  domain_name: string;
  color: string;
}

interface HealthTrendChartProps {
  data: HealthDataPoint[];
  domains: DomainInfo[];
  title?: string;
  height?: number;
  showReference?: boolean;
  targetScore?: number;
  isLoading?: boolean;
  error?: string;
}

// Color palette for domains
const DOMAIN_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#6366F1", // indigo
  "#84CC16", // lime
  "#06B6D4", // cyan
  "#A855F7", // violet
  "#F43F5E", // rose
];

export default function HealthTrendChart({
  data,
  domains,
  title = "Health Trend Over Time",
  height = 400,
  showReference = true,
  targetScore = 70,
  isLoading = false,
  error,
}: HealthTrendChartProps) {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [visibleDomains, setVisibleDomains] = useState<Set<string>>(
    new Set(domains.map(d => d.domain_id))
  );

  // Process data based on date range
  const filteredData = useMemo(() => {
    if (dateRange === "all") {
return data;
}

    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter(point => new Date(point.timestamp) >= cutoffDate);
  }, [data, dateRange]);

  // Transform data for recharts
  const chartData = useMemo(() => {
    return filteredData.map(point => {
      const formattedPoint: any = {
        date: new Date(point.timestamp).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(point.timestamp).toLocaleString(),
        timestamp: point.timestamp,
      };

      // Add each domain's score
      domains.forEach(domain => {
        formattedPoint[domain.domain_id] = point.domain_scores[domain.domain_id] || 0;
      });

      return formattedPoint;
    });
  }, [filteredData, domains]);

  // Calculate statistics for each domain
  const domainStats = useMemo(() => {
    return domains.map(domain => {
      const scores = filteredData
        .map(point => point.domain_scores[domain.domain_id])
        .filter(score => score !== undefined && score !== null);

      if (scores.length === 0) {
        return {
          domain_id: domain.domain_id,
          domain_name: domain.domain_name,
          latest: 0,
          change: 0,
          avg: 0,
          min: 0,
          max: 0,
        };
      }

      const latest = scores[scores.length - 1];
      const previous = scores.length > 1 ? scores[scores.length - 2] : latest;
      const change = latest - previous;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const min = Math.min(...scores);
      const max = Math.max(...scores);

      return {
        domain_id: domain.domain_id,
        domain_name: domain.domain_name,
        latest,
        change,
        avg,
        min,
        max,
      };
    });
  }, [filteredData, domains]);

  // Toggle domain visibility
  const toggleDomain = (domainId: string) => {
    const newSet = new Set(visibleDomains);
    if (newSet.has(domainId)) {
      newSet.delete(domainId);
    } else {
      newSet.add(domainId);
    }
    setVisibleDomains(newSet);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-card p-3 rounded-lg shadow-lg border border-border-subtle">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {payload[0].payload.fullDate}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any) => {
              const domain = domains.find(d => d.domain_id === entry.dataKey);
              if (!domain) {
return null;
}

              return (
                <div key={entry.dataKey} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-xs text-text-secondary">
                      {domain.domain_name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold">{entry.value}/100</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-bg-hover rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-bg-hover rounded"></div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="bordered" className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">Error Loading Chart</p>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No health data available</p>
              <p className="text-sm mt-1">Data will appear as your Cognitive Twin tracks your domains</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Tracking {visibleDomains.size} of {domains.length} domains
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <Select value={dateRange} onValueChange={(val) => setDateRange(val as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Domain Legend with Toggle */}
        <div className="flex flex-wrap gap-2 mt-4">
          {domains.map((domain, index) => {
            const isVisible = visibleDomains.has(domain.domain_id);
            const stats = domainStats.find(s => s.domain_id === domain.domain_id);
            const color = domain.color || DOMAIN_COLORS[index % DOMAIN_COLORS.length];

            return (
              <button
                key={domain.domain_id}
                onClick={() => toggleDomain(domain.domain_id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm",
                  isVisible
                    ? "bg-bg-card border-border-base"
                    : "bg-bg-raised border-border-subtle opacity-50"
                )}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: isVisible ? color : "#9CA3AF" }}
                />
                <span className={cn("font-medium", !isVisible && "line-through")}>
                  {domain.domain_name}
                </span>
                {stats && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="font-semibold">{stats.latest}</span>
                    {stats.change !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5",
                          stats.change > 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {stats.change > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs">{Math.abs(stats.change)}</span>
                      </span>
                    )}
                  </>
                )}
                {isVisible ? (
                  <Eye className="w-3 h-3 text-gray-400" />
                ) : (
                  <EyeOff className="w-3 h-3 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />

            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="#9CA3AF"
            />

            <YAxis
              domain={[0, 100]}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="#9CA3AF"
              tickFormatter={(value) => `${value}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {showReference && (
              <ReferenceLine
                y={targetScore}
                stroke="#9CA3AF"
                strokeDasharray="5 5"
                label={{
                  value: `Target: ${targetScore}`,
                  position: "right",
                  fontSize: 10,
                  fill: "#9CA3AF",
                }}
              />
            )}

            {/* Render lines for visible domains */}
            {domains.map((domain, index) => {
              if (!visibleDomains.has(domain.domain_id)) {
return null;
}

              const color = domain.color || DOMAIN_COLORS[index % DOMAIN_COLORS.length];

              return (
                <Line
                  key={domain.domain_id}
                  type="monotone"
                  dataKey={domain.domain_id}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                  activeDot={{ r: 5, fill: color }}
                  name={domain.domain_name}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        {domainStats.length > 0 && visibleDomains.size > 0 && (
          <div className="mt-6 pt-6 border-t border-border-subtle">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {domainStats
                .filter(stat => visibleDomains.has(stat.domain_id))
                .map((stat, index) => {
                  const domain = domains.find(d => d.domain_id === stat.domain_id);
                  const color = domain?.color || DOMAIN_COLORS[index % DOMAIN_COLORS.length];

                  return (
                    <div key={stat.domain_id} className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-xs text-gray-500 truncate">
                          {stat.domain_name}
                        </div>
                      </div>
                      <div className="font-bold text-lg">{stat.avg.toFixed(0)}</div>
                      <div className="text-xs text-gray-500">
                        avg • {stat.min}-{stat.max} range
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
