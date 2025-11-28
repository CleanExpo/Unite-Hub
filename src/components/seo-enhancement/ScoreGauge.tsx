'use client';

import { cn } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export function ScoreGauge({
  score,
  maxScore = 100,
  size = 'md',
  showLabel = true,
  label,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  const getColor = () => {
    if (percentage >= 80) return { stroke: '#22c55e', bg: 'bg-green-50' };
    if (percentage >= 60) return { stroke: '#eab308', bg: 'bg-yellow-50' };
    if (percentage >= 40) return { stroke: '#f97316', bg: 'bg-orange-50' };
    return { stroke: '#ef4444', bg: 'bg-red-50' };
  };

  const getLabel = () => {
    if (label) return label;
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Poor';
  };

  const sizes = {
    sm: { width: 80, strokeWidth: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 120, strokeWidth: 8, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 160, strokeWidth: 10, fontSize: 'text-4xl', labelSize: 'text-base' },
  };

  const { width, strokeWidth, fontSize, labelSize } = sizes[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', fontSize)}>
            {Math.round(score)}
          </span>
          {showLabel && (
            <span className={cn('text-muted-foreground', labelSize)}>
              {getLabel()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
