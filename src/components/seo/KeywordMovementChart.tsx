/**
 * Keyword Movement Chart - Phase 8 Week 24
 *
 * Stacked bar chart showing keyword improvements/declines over time.
 */

"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KeywordMovementData {
  date: string;
  improved: number;
  declined: number;
  new_keywords: number;
  lost: number;
}

interface KeywordMovementChartProps {
  data: KeywordMovementData[];
  title?: string;
  height?: number;
}

export default function KeywordMovementChart({
  data,
  title = "Keyword Movements",
  height = 300,
}: KeywordMovementChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      date: new Date(point.date).toLocaleDateString("en-AU", {
        month: "short",
        day: "numeric",
      }),
      fullDate: point.date,
      // Make declines negative for visual effect
      declined_display: -point.declined,
      lost_display: -point.lost,
    }));
  }, [data]);

  // Calculate totals
  const totals = useMemo(() => {
    return data.reduce(
      (acc, point) => ({
        improved: acc.improved + point.improved,
        declined: acc.declined + point.declined,
        new_keywords: acc.new_keywords + point.new_keywords,
        lost: acc.lost + point.lost,
      }),
      { improved: 0, declined: 0, new_keywords: 0, lost: 0 }
    );
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-bg-card p-3 rounded-lg shadow-lg border border-border-subtle">
          <p className="text-sm text-gray-500 mb-2">{point.fullDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-500">
              Improved: +{point.improved}
            </p>
            <p className="text-blue-500">
              New: +{point.new_keywords}
            </p>
            <p className="text-orange-500">
              Declined: -{point.declined}
            </p>
            <p className="text-red-500">
              Lost: -{point.lost}
            </p>
          </div>
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
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-500">+{totals.improved} improved</span>
            <span className="text-red-500">-{totals.declined + totals.lost} lost</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  improved: "Improved",
                  new_keywords: "New",
                  declined_display: "Declined",
                  lost_display: "Lost",
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="improved" stackId="positive" fill="#10B981" />
            <Bar dataKey="new_keywords" stackId="positive" fill="#3B82F6" />
            <Bar dataKey="declined_display" stackId="negative" fill="#F59E0B" />
            <Bar dataKey="lost_display" stackId="negative" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border-subtle">
          <div className="text-center">
            <div className="text-xs text-gray-500">Improved</div>
            <div className="font-semibold text-green-500">+{totals.improved}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">New</div>
            <div className="font-semibold text-blue-500">+{totals.new_keywords}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Declined</div>
            <div className="font-semibold text-orange-500">-{totals.declined}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Lost</div>
            <div className="font-semibold text-red-500">-{totals.lost}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
