'use client';

/**
 * ChannelPieChart Component
 * Phase: B8 - Synthex Real-Time Channel Analytics
 *
 * Displays channel distribution as a pie/donut chart.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChannelPieChartData {
  channel: string;
  total: number;
}

interface ChannelPieChartProps {
  data: ChannelPieChartData[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

// Channel colors
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

export default function ChannelPieChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
}: ChannelPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available
      </div>
    );
  }

  // Filter out zero values
  const filteredData = data.filter((d) => d.total > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No activity recorded
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="total"
          nameKey="channel"
          label={({ channel, percent }) =>
            `${channel} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {filteredData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getChannelColor(entry.channel)}
              stroke="#1F2937"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F3F4F6',
          }}
          labelStyle={{ color: '#F3F4F6' }}
          formatter={(value: number) => [value.toLocaleString(), 'Events']}
        />
        <Legend
          wrapperStyle={{ color: '#9CA3AF' }}
          formatter={(value: string) => (
            <span className="text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
