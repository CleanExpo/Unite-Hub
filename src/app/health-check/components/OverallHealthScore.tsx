/**
 * Overall Health Score Component
 * Displays radial progress chart for 0-100 health score
 *
 * Features:
 * - Recharts radial bar chart
 * - Accent-500 color fill
 * - Center label showing score
 * - Historical trend (7 days)
 */

'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OverallHealthScoreProps {
  score: number;
  historicalScores: Array<{ overall_score: number; created_at: string }>;
}

export function OverallHealthScore({ score, historicalScores }: OverallHealthScoreProps) {
  // Prepare historical data
  const trendData = historicalScores
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((item, idx) => ({
      name: `Day ${historicalScores.length - idx}`,
      score: item.overall_score,
      date: new Date(item.created_at).toLocaleDateString(),
    }))
    .reverse();

  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'; // Green
    if (s >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Good';
    if (s >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const radialData = [{ score, fill: '#ff6b35' }];

  return (
    <div className="bg-bg-card rounded-lg border border-border p-6 md:p-8">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Overall Health Score</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Radial Chart */}
        <div className="flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              data={radialData}
              innerRadius="70%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                angleAxisId={0}
                dataKey="score"
                fill="#ff6b35"
                cornerRadius={10}
                label={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Score Display */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-5xl md:text-6xl font-bold text-accent-500">{score}</div>
            <div className="text-text-secondary text-sm mt-2">{getScoreLabel(score)}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-4">
          {/* Score Range */}
          <div className="bg-bg-primary p-4 rounded-lg border border-border">
            <div className="text-sm text-text-secondary mb-2">Score Range</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">80-100</span>
                <div className="text-xs font-medium text-green-600">Excellent</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">60-79</span>
                <div className="text-xs font-medium text-amber-600">Good</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">40-59</span>
                <div className="text-xs font-medium text-orange-600">Fair</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">0-39</span>
                <div className="text-xs font-medium text-red-600">Needs Improvement</div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-bg-primary p-4 rounded-lg border border-border space-y-3">
            <div>
              <div className="text-xs text-text-secondary mb-1">Last Updated</div>
              <div className="text-sm font-medium text-text-primary">Just now</div>
            </div>
            {trendData.length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mb-1">7-Day Trend</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {trendData[0].score} → {trendData[trendData.length - 1].score}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      trendData[trendData.length - 1].score > trendData[0].score
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {trendData[trendData.length - 1].score > trendData[0].score ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {trendData.length > 1 && (
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Score Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <YAxis domain={[0, 100]} stroke="var(--color-text-secondary)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                }}
                labelStyle={{ color: 'var(--color-text-primary)' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#ff6b35"
                strokeWidth={2}
                dot={{ fill: '#ff6b35', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accessibility */}
      <span className="sr-only">{`Overall website health score is ${score} out of 100. ${getScoreLabel(score)}.`}</span>
    </div>
  );
}
