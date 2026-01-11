/**
 * E.E.A.T. Breakdown Component
 * Displays E.E.A.T. scores (Expertise, Authority, Trust) with bar chart
 *
 * Features:
 * - Recharts bar chart
 * - Orange gradient (#ff6b35 → #ffad80)
 * - Individual metric cards
 */

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface EEATBreakdownProps {
  eeat: {
    expertise: number;
    authority: number;
    trust: number;
  };
}

export function EEATBreakdown({ eeat }: EEATBreakdownProps) {
  const data = [
    { name: 'Expertise', score: eeat.expertise, fill: '#ff6b35' },
    { name: 'Authority', score: eeat.authority, fill: '#ff8c5a' },
    { name: 'Trust', score: eeat.trust, fill: '#ffad80' },
  ];

  const average = Math.round((eeat.expertise + eeat.authority + eeat.trust) / 3);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className="bg-bg-card rounded-lg border border-border p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-6">E.E.A.T. Breakdown</h2>

      {/* Bar Chart */}
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="var(--color-text-secondary)"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[0, 100]}
              stroke="var(--color-text-secondary)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
              }}
              labelStyle={{ color: 'var(--color-text-primary)' }}
              formatter={(value) => `${value}/100`}
            />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Metric Cards */}
      <div className="space-y-3">
        {/* Expertise */}
        <div className="flex items-between justify-between p-3 bg-bg-primary rounded-lg border border-border">
          <div>
            <div className="text-sm font-semibold text-text-primary">Expertise</div>
            <div className="text-xs text-text-secondary">Author knowledge & credentials</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-accent-500">{eeat.expertise}</div>
            <div className="text-xs text-text-secondary">{getScoreLabel(eeat.expertise)}</div>
          </div>
        </div>

        {/* Authority */}
        <div className="flex items-between justify-between p-3 bg-bg-primary rounded-lg border border-border">
          <div>
            <div className="text-sm font-semibold text-text-primary">Authority</div>
            <div className="text-xs text-text-secondary">Reputation & link profile</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-accent-500">{eeat.authority}</div>
            <div className="text-xs text-text-secondary">{getScoreLabel(eeat.authority)}</div>
          </div>
        </div>

        {/* Trust */}
        <div className="flex items-between justify-between p-3 bg-bg-primary rounded-lg border border-border">
          <div>
            <div className="text-sm font-semibold text-text-primary">Trust</div>
            <div className="text-xs text-text-secondary">Reliability & transparency</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-accent-500">{eeat.trust}</div>
            <div className="text-xs text-text-secondary">{getScoreLabel(eeat.trust)}</div>
          </div>
        </div>
      </div>

      {/* Average Score */}
      <div className="mt-6 p-4 bg-accent-500/10 border border-accent-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">E.E.A.T. Average</span>
          <span className="text-2xl font-bold text-accent-500">{average}</span>
        </div>
        <div className="text-xs text-text-secondary mt-1">
          {average >= 80
            ? 'Excellent E.E.A.T. profile'
            : average >= 60
              ? 'Good E.E.A.T. profile'
              : 'Work on strengthening E.E.A.T. signals'}
        </div>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        {`E.E.A.T. Breakdown: Expertise ${eeat.expertise}, Authority ${eeat.authority}, Trust ${eeat.trust}. Average score ${average}.`}
      </div>
    </div>
  );
}
