/**
 * Chart Components
 *
 * Simple, accessible chart components for data visualization.
 * Includes Bar Chart, Line Chart, and Pie Chart variants.
 *
 * @example
 * <BarChart
 *   data={[
 *     { label: 'Jan', value: 400 },
 *     { label: 'Feb', value: 300 },
 *   ]}
 *   height={300}
 * />
 *
 * @example
 * <LineChart
 *   data={[
 *     { label: 'Week 1', value: 65 },
 *     { label: 'Week 2', value: 75 },
 *   ]}
 *   showLegend
 * />
 *
 * @example
 * <PieChart
 *   data={[
 *     { label: 'Product A', value: 400 },
 *     { label: 'Product B', value: 300 },
 *     { label: 'Product C', value: 300 },
 *   ]}
 *   height={300}
 * />
 */

import { forwardRef, ReactNode, HTMLAttributes, useState } from 'react';

export interface ChartData {
  /** Data label */
  label: string;

  /** Data value */
  value: number;

  /** Optional color (uses design tokens) */
  color?: string;

  /** Optional icon or additional metadata */
  metadata?: ReactNode;
}

export interface ChartBaseProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of data points */
  data: ChartData[];

  /** Chart height in pixels */
  height?: number;

  /** Show legend below chart */
  showLegend?: boolean;

  /** Custom CSS class */
  className?: string;
}

/**
 * Bar Chart Component
 *
 * Uses design tokens:
 * - Bars: bg-accent-500, bg-success-500, bg-warning-500, bg-error-500
 * - Grid: border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 * - Hover: opacity effects
 */
export const BarChart = forwardRef<HTMLDivElement, ChartBaseProps>(
  (
    {
      data,
      height = 300,
      showLegend = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ height }}>
          <p className="text-text-secondary">No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = height - (showLegend ? 60 : 0);
    const barWidth = 100 / data.length;
    const padding = 8;

    const colors = [
      'bg-accent-500',
      'bg-success-500',
      'bg-warning-500',
      'bg-error-500',
      'bg-neutral-500',
    ];

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Chart */}
        <div
          className="relative bg-bg-card border border-border-subtle rounded-lg p-4"
          style={{ height: `${chartHeight}px` }}
        >
          <div className="flex items-end justify-between h-full gap-2">
            {data.map((item, index) => {
              const percentage = (item.value / maxValue) * 100;
              const color = item.color || colors[index % colors.length];
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="img"
                  aria-label={`${item.label}: ${item.value}`}
                >
                  {/* Bar */}
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={`w-full ${color} rounded-t-lg transition-all duration-fast ${
                        isHovered ? 'opacity-100 shadow-lg' : 'opacity-80'
                      }`}
                      style={{
                        height: `${percentage}%`,
                        minHeight: '4px',
                      }}
                    >
                      {/* Value Label on Hover */}
                      {isHovered && (
                        <div className="text-white text-xs font-bold text-center -translate-y-6">
                          {item.value}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Label */}
                  <span className="text-xs text-text-secondary whitespace-nowrap text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded ${item.color || colors[index % colors.length]}`}
                />
                <span className="text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

BarChart.displayName = 'BarChart';

/**
 * Line Chart Component
 *
 * Uses design tokens:
 * - Line: stroke-accent-500
 * - Points: bg-accent-500
 * - Grid: border-border-subtle
 * - Text: text-text-primary, text-text-secondary
 */
export const LineChart = forwardRef<HTMLDivElement, ChartBaseProps>(
  (
    {
      data,
      height = 300,
      showLegend = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ height }}>
          <p className="text-text-secondary">No data available</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;
    const chartHeight = height - (showLegend ? 60 : 0);
    const pointSpacing = 100 / (data.length - 1 || 1);

    // Calculate points for line
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return { x, y, ...item };
    });

    // Generate SVG path
    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Chart */}
        <div
          className="relative bg-bg-card border border-border-subtle rounded-lg p-4"
          style={{ height: `${chartHeight}px` }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ padding: '16px' }}
            preserveAspectRatio="none"
          >
            {/* Line */}
            <polyline
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="rgb(var(--accent-500))"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="animate-in stroke-in"
            />

            {/* Area under line */}
            <polygon
              points={`0,100 ${points.map(p => `${p.x},${p.y}`).join(' ')} 100,100`}
              fill="url(#gradient)"
              opacity="0.1"
            />

            {/* Gradient */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(var(--accent-500))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(var(--accent-500))" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="white"
                stroke="rgb(var(--accent-500))"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                role="button"
                tabIndex={0}
                aria-label={`${point.label}: ${point.value}`}
              />
            ))}
          </svg>

          {/* Hover Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute bg-text-primary text-white px-3 py-2 rounded text-sm z-10 pointer-events-none"
              style={{
                left: `${points[hoveredIndex].x}%`,
                top: `${points[hoveredIndex].y}%`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-8px',
              }}
            >
              <div className="font-medium">{points[hoveredIndex].label}</div>
              <div className="text-white/80">{points[hoveredIndex].value}</div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

LineChart.displayName = 'LineChart';

/**
 * Pie Chart Component
 *
 * Uses design tokens:
 * - Segments: semantic colors (accent, success, warning, error, neutral)
 * - Text: text-text-primary, text-text-secondary
 * - Hover: opacity effects
 */
export const PieChart = forwardRef<HTMLDivElement, ChartBaseProps>(
  (
    {
      data,
      height = 300,
      showLegend = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!data || data.length === 0) {
      return (
        <div className={`flex items-center justify-center ${className}`} style={{ height }}>
          <p className="text-text-secondary">No data available</p>
        </div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = [
      '#3b82f6', // accent-500
      '#10b981', // success-500
      '#f59e0b', // warning-500
      '#ef4444', // error-500
      '#6b7280', // neutral-500
    ];

    const chartHeight = height - (showLegend ? 60 : 0);
    let currentAngle = -90;

    const segments = data.map((item, index) => {
      const sliceAngle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = Math.cos(startRad);
      const y1 = Math.sin(startRad);
      const x2 = Math.cos(endRad);
      const y2 = Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;

      const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        pathData,
        color: item.color || colors[index % colors.length],
        percentage: ((item.value / total) * 100).toFixed(1),
        index,
        ...item,
      };
    });

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {/* Chart */}
        <div
          className="relative flex items-center justify-center bg-bg-card border border-border-subtle rounded-lg"
          style={{ height: `${chartHeight}px` }}
        >
          <svg
            className="w-48 h-48"
            viewBox="-1.2 -1.2 2.4 2.4"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
          >
            {segments.map((segment, index) => (
              <g
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
                role="img"
                tabIndex={0}
                aria-label={`${segment.label}: ${segment.value} (${segment.percentage}%)`}
              >
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.6}
                  className="transition-opacity duration-fast"
                />
              </g>
            ))}
          </svg>

          {/* Center Percentage */}
          {hoveredIndex !== null && (
            <div className="absolute text-center pointer-events-none">
              <div className="text-2xl font-bold text-text-primary">
                {segments[hoveredIndex].percentage}%
              </div>
              <div className="text-sm text-text-secondary">
                {segments[hoveredIndex].label}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center text-sm">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-text-secondary">{segment.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

PieChart.displayName = 'PieChart';

export default { BarChart, LineChart, PieChart };
