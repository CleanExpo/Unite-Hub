'use client';

/**
 * MomentumRadar Component
 *
 * Displays a radar/spider chart of momentum scores across 7 business domains.
 * Uses CSS-based rendering for simplicity (no heavy chart library).
 */

import React from 'react';

type TrendDirection = 'up' | 'down' | 'stable';

interface DomainScore {
  score: number;
  trend: TrendDirection;
}

interface MomentumRadarProps {
  scores: {
    marketing: DomainScore;
    sales: DomainScore;
    delivery: DomainScore;
    product: DomainScore;
    clients: DomainScore;
    engineering: DomainScore;
    finance: DomainScore;
  };
  className?: string;
}

const DOMAINS = [
  { key: 'marketing', label: 'Marketing', angle: 0 },
  { key: 'sales', label: 'Sales', angle: 51.43 },
  { key: 'delivery', label: 'Delivery', angle: 102.86 },
  { key: 'product', label: 'Product', angle: 154.29 },
  { key: 'clients', label: 'Clients', angle: 205.71 },
  { key: 'engineering', label: 'Engineering', angle: 257.14 },
  { key: 'finance', label: 'Finance', angle: 308.57 },
] as const;

export function MomentumRadar({ scores, className = '' }: MomentumRadarProps) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 80;

  // Calculate polygon points for the score shape
  const getPolygonPoints = (): string => {
    return DOMAINS.map((domain) => {
      const score = scores[domain.key as keyof typeof scores]?.score || 0;
      const normalizedRadius = (score / 100) * maxRadius;
      const angleRad = ((domain.angle - 90) * Math.PI) / 180;
      const x = center + normalizedRadius * Math.cos(angleRad);
      const y = center + normalizedRadius * Math.sin(angleRad);
      return `${x},${y}`;
    }).join(' ');
  };

  // Get label position
  const getLabelPosition = (angle: number) => {
    const labelRadius = maxRadius + 25;
    const angleRad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + labelRadius * Math.cos(angleRad),
      y: center + labelRadius * Math.sin(angleRad),
    };
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e'; // green
    if (score >= 60) return '#eab308'; // yellow
    if (score >= 40) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const avgScore =
    Object.values(scores).reduce((sum, d) => sum + (d?.score || 0), 0) / 7;

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto h-48 w-48"
      >
        {/* Background circles */}
        {[20, 40, 60, 80].map((radius) => (
          <circle
            key={radius}
            cx={center}
            cy={center}
            r={(radius / 100) * maxRadius}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {DOMAINS.map((domain) => {
          const angleRad = ((domain.angle - 90) * Math.PI) / 180;
          const endX = center + maxRadius * Math.cos(angleRad);
          const endY = center + maxRadius * Math.sin(angleRad);
          return (
            <line
              key={domain.key}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* Score polygon */}
        <polygon
          points={getPolygonPoints()}
          fill="hsl(var(--primary))"
          fillOpacity={0.2}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />

        {/* Score points */}
        {DOMAINS.map((domain) => {
          const score = scores[domain.key as keyof typeof scores]?.score || 0;
          const normalizedRadius = (score / 100) * maxRadius;
          const angleRad = ((domain.angle - 90) * Math.PI) / 180;
          const x = center + normalizedRadius * Math.cos(angleRad);
          const y = center + normalizedRadius * Math.sin(angleRad);
          return (
            <circle
              key={domain.key}
              cx={x}
              cy={y}
              r={4}
              fill={getScoreColor(score)}
              stroke="white"
              strokeWidth={2}
            />
          );
        })}

        {/* Center score */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-current"
        >
          {Math.round(avgScore)}
        </text>
      </svg>

      {/* Domain labels (positioned absolutely) */}
      <div className="pointer-events-none absolute inset-0">
        {DOMAINS.map((domain) => {
          const pos = getLabelPosition(domain.angle);
          const score = scores[domain.key as keyof typeof scores]?.score || 0;
          // Adjust for SVG coordinate to CSS coordinate conversion
          const leftPercent = (pos.x / size) * 100;
          const topPercent = (pos.y / size) * 100;

          return (
            <div
              key={domain.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
              }}
            >
              <span className="block text-[10px] text-muted-foreground">
                {domain.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MomentumRadar;
