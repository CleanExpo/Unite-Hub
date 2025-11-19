/**
 * Health Trend Chart - Phase 8 Week 24
 *
 * Interactive line chart showing health score trends over time.
 */

"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HealthDataPoint {
  date: string;
  health_score: number;
  audit_type?: string;
}

interface HealthTrendChartProps {
  data: HealthDataPoint[];
  title?: string;
  height?: number;
  showReference?: boolean;
  targetScore?: number;
}

export default function HealthTrendChart({
  data,
  title = "Health Score Trend",
  height = 300,
  showReference = true,
  targetScore = 70,
}: HealthTrendChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString("en-AU", {
        month: "short",
        day: "numeric",
      }),
      fullDate: point.date,
    }));
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const scores = data.map((d) => d.health_score);
    const latest = scores[scores.length - 1];
    const previous = scores.length > 1 ? scores[scores.length - 2] : latest;
    const change = latest - previous;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);

    return { latest, change, avg, min, max };
  }, [data]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#F59E0B";
    return "#EF4444";
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">{point.fullDate}</p>
          <p className="text-lg font-semibold" style={{ color: getScoreColor(point.health_score) }}>
            {point.health_score}/100
          </p>
          {point.audit_type && (
            <p className="text-xs text-gray-400">{point.audit_type} audit</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-gray-500">Latest:</span>{" "}
                <span
                  className="font-semibold"
                  style={{ color: getScoreColor(stats.latest) }}
                >
                  {stats.latest}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Change:</span>{" "}
                <span
                  className={`font-semibold ${
                    stats.change >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stats.change >= 0 ? "+" : ""}
                  {stats.change}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              fontSize={12}
              tickLine={false}
              axisLine={false}
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
            <Line
              type="monotone"
              dataKey="health_score"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3B82F6" }}
              activeDot={{ r: 6, fill: "#2563EB" }}
            />
          </LineChart>
        </ResponsiveContainer>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-xs text-gray-500">Average</div>
              <div className="font-semibold">{stats.avg.toFixed(0)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Min</div>
              <div className="font-semibold text-red-500">{stats.min}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Max</div>
              <div className="font-semibold text-green-500">{stats.max}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
