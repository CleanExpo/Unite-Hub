'use client';

/**
 * SendTimeHeatmap Component
 * Phase: B9 - Synthex Predictive Intelligence
 *
 * Displays a heatmap of engagement scores by hour and day.
 * Uses a custom implementation since react-grid-heatmap may not be installed.
 */

interface SendTimeHeatmapProps {
  data: number[][];  // 7 rows (days) x 24 cols (hours)
  bestHour?: number;
  bestDay?: number;  // 0-6 for Mon-Sun
  height?: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color scale from cool (low) to warm (high)
function getColor(value: number): string {
  if (value <= 0.2) return '#1e3a5f';  // Dark blue
  if (value <= 0.4) return '#2d6a4f';  // Dark green
  if (value <= 0.6) return '#55a630';  // Green
  if (value <= 0.8) return '#f9c74f';  // Yellow
  return '#f94144';  // Red (best)
}

export default function SendTimeHeatmap({
  data,
  bestHour,
  bestDay,
  height = 280,
}: SendTimeHeatmapProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
      >
        No heatmap data available
      </div>
    );
  }

  // Ensure we have 7 days x 24 hours
  const normalizedData = DAYS.map((_, dayIndex) => {
    const dayData = data[dayIndex] || [];
    return HOURS.map((hour) => dayData[hour] ?? 0);
  });

  const cellWidth = 100 / 24;  // percentage
  const cellHeight = (height - 40) / 7;  // pixels, minus header

  return (
    <div className="w-full" style={{ height }}>
      {/* Hour labels */}
      <div className="flex pl-10">
        {[0, 6, 12, 18, 23].map((hour) => (
          <div
            key={hour}
            className="text-xs text-gray-400"
            style={{
              width: `${cellWidth * (hour === 0 ? 1 : hour === 23 ? 1 : 6)}%`,
              textAlign: hour === 0 ? 'left' : hour === 23 ? 'right' : 'center',
            }}
          >
            {hour === 0 ? '12am' : hour === 6 ? '6am' : hour === 12 ? '12pm' : hour === 18 ? '6pm' : '11pm'}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex flex-col gap-0.5 mt-1">
        {normalizedData.map((dayData, dayIndex) => (
          <div key={DAYS[dayIndex]} className="flex items-center gap-1">
            {/* Day label */}
            <div className="w-10 text-xs text-gray-400 text-right pr-2">
              {DAYS[dayIndex]}
            </div>

            {/* Hour cells */}
            <div className="flex flex-1 gap-0.5">
              {dayData.map((value, hourIndex) => {
                const isBest = bestHour === hourIndex && bestDay === dayIndex;
                return (
                  <div
                    key={hourIndex}
                    className={`flex-1 rounded-sm transition-all hover:ring-2 hover:ring-white/30 ${
                      isBest ? 'ring-2 ring-yellow-400' : ''
                    }`}
                    style={{
                      height: `${cellHeight}px`,
                      backgroundColor: getColor(value),
                      opacity: value > 0 ? 0.8 + value * 0.2 : 0.3,
                    }}
                    title={`${DAYS[dayIndex]} ${hourIndex}:00 - Score: ${(value * 100).toFixed(0)}%`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#1e3a5f' }} />
          <span className="text-xs text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#55a630' }} />
          <span className="text-xs text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#f94144' }} />
          <span className="text-xs text-gray-400">High</span>
        </div>
        {bestHour !== undefined && bestDay !== undefined && (
          <div className="flex items-center gap-1 ml-4">
            <div className="w-4 h-3 rounded-sm ring-2 ring-yellow-400" style={{ backgroundColor: '#f94144' }} />
            <span className="text-xs text-yellow-400">Best Time</span>
          </div>
        )}
      </div>
    </div>
  );
}
