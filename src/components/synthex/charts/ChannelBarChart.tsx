'use client';

/**
 * ChannelBarChart Component
 * Phase: B8 - Synthex Real-Time Channel Analytics
 *
 * Displays channel totals comparison using Recharts bar chart.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

interface ChannelBarChartData {
  channel: string;
  total: number;
  sends: number;
  opens: number;
  clicks: number;
  conversions: number;
}

interface ChannelBarChartProps {
  data: ChannelBarChartData[];
  height?: number;
  dataKey?: 'total' | 'sends' | 'opens' | 'clicks' | 'conversions';
  showGrid?: boolean;
}

// Channel colors for each bar
const CHANNEL_COLORS: Record<string, string> = {
  Email: '#8884d8',
  Sms: '#82ca9d',
  Social: '#ff7300',
  Push: '#00C49F',
  Web: '#FFBB28',
  Webhook: '#FF8042',
  Other: '#9CA3AF',
};

const getChannelColor = (channel: string): string => {
  return CHANNEL_COLORS[channel] || '#8884d8';
};

export default function ChannelBarChart({
  data,
  height = 300,
  dataKey = 'total',
  showGrid = true,
}: ChannelBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        )}
        <XAxis
          dataKey="channel"
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
          formatter={(value: number) => [value.toLocaleString(), dataKey.charAt(0).toUpperCase() + dataKey.slice(1)]}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getChannelColor(entry.channel)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
