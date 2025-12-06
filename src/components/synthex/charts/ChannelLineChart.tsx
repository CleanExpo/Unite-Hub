'use client';

/**
 * ChannelLineChart Component
 * Phase: B8 - Synthex Real-Time Channel Analytics
 *
 * Displays daily channel activity trends over time using Recharts.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ChannelLineChartData {
  date: string;
  email: number;
  sms: number;
  social: number;
  push: number;
  web: number;
}

interface ChannelLineChartProps {
  data: ChannelLineChartData[];
  height?: number;
  showGrid?: boolean;
}

// Channel colors matching the design system
const CHANNEL_COLORS = {
  email: '#8884d8', // Purple
  sms: '#82ca9d',   // Green
  social: '#ff7300', // Orange
  push: '#00C49F',  // Teal
  web: '#FFBB28',   // Yellow
};

export default function ChannelLineChart({
  data,
  height = 300,
  showGrid = true,
}: ChannelLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={formattedData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        )}
        <XAxis
          dataKey="displayDate"
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#9CA3AF"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6',
          }}
          labelStyle={{ color: '#F3F4F6' }}
        />
        <Legend
          wrapperStyle={{ color: '#9CA3AF' }}
          formatter={(value: string) =>
            value.charAt(0).toUpperCase() + value.slice(1)
          }
        />
        <Line
          type="monotone"
          dataKey="email"
          name="Email"
          stroke={CHANNEL_COLORS.email}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="sms"
          name="SMS"
          stroke={CHANNEL_COLORS.sms}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="social"
          name="Social"
          stroke={CHANNEL_COLORS.social}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="push"
          name="Push"
          stroke={CHANNEL_COLORS.push}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="web"
          name="Web"
          stroke={CHANNEL_COLORS.web}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
