/**
 * Status Card Component
 * Displays a key metric with status indicator
 */

interface StatusCardProps {
  label: string;
  value: string | number;
  metric?: string;
  status?: 'healthy' | 'warning' | 'critical' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
}

export function StatusCard({
  label,
  value,
  metric,
  status = 'neutral',
  trend = 'stable',
  icon,
}: StatusCardProps) {
  const statusColors = {
    healthy: 'bg-bg-card border-l-4 border-success-500',
    warning: 'bg-bg-card border-l-4 border-warning-500',
    critical: 'bg-bg-card border-l-4 border-error-500',
    neutral: 'bg-bg-card border-l-4 border-border-base',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  const trendColors = {
    up: 'text-success-500',
    down: 'text-error-500',
    stable: 'text-text-muted',
  };

  return (
    <div
      className={`${statusColors[status]} rounded-lg p-6 border border-border-subtle backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm font-medium mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text-primary">{value}</span>
            {metric && <span className="text-text-muted text-sm">{metric}</span>}
          </div>
          {metric && (
            <p className={`text-sm mt-2 ${trendColors[trend]}`}>
              {trendIcons[trend]} Trend
            </p>
          )}
        </div>
        {icon && <div className="text-accent-500 text-2xl">{icon}</div>}
      </div>
    </div>
  );
}
