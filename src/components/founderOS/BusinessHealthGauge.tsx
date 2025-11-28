"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface BusinessHealthGaugeProps {
  score: number;
  title?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function BusinessHealthGauge({
  score,
  title = "Health Score",
  showDetails = true,
  size = "md",
  animated = true,
}: BusinessHealthGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animated]);

  const getHealthStatus = (score: number) => {
    if (score >= 70) return { label: "Excellent", color: "green", icon: TrendingUp };
    if (score >= 40) return { label: "Good", color: "yellow", icon: Minus };
    return { label: "Needs Attention", color: "red", icon: TrendingDown };
  };

  const getColor = (score: number) => {
    if (score >= 70) return "#22c55e"; // green-500
    if (score >= 40) return "#eab308"; // yellow-500
    return "#ef4444"; // red-500
  };

  const getSizeConfig = (size: string) => {
    switch (size) {
      case "sm":
        return { radius: 60, strokeWidth: 8, fontSize: "text-2xl" };
      case "lg":
        return { radius: 100, strokeWidth: 12, fontSize: "text-5xl" };
      default:
        return { radius: 80, strokeWidth: 10, fontSize: "text-4xl" };
    }
  };

  const status = getHealthStatus(score);
  const config = getSizeConfig(size);
  const circumference = 2 * Math.PI * config.radius;
  const progress = (displayScore / 100) * circumference;
  const dashOffset = circumference - progress;

  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {/* Circular Gauge */}
        <div className="relative" style={{ width: config.radius * 2 + 40, height: config.radius * 2 + 40 }}>
          <svg
            width={config.radius * 2 + 40}
            height={config.radius * 2 + 40}
            className="transform -rotate-90"
          >
            {/* Background Circle */}
            <circle
              cx={config.radius + 20}
              cy={config.radius + 20}
              r={config.radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={config.strokeWidth}
              className="text-muted/20"
            />
            {/* Progress Circle */}
            <circle
              cx={config.radius + 20}
              cy={config.radius + 20}
              r={config.radius}
              fill="none"
              stroke={getColor(score)}
              strokeWidth={config.strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold ${config.fontSize}`} style={{ color: getColor(score) }}>
              {displayScore}
            </div>
            <div className="text-sm text-muted-foreground">/ 100</div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="w-full mt-6 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <StatusIcon
                className="h-5 w-5"
                style={{ color: getColor(score) }}
              />
              <span className="font-medium" style={{ color: getColor(score) }}>
                {status.label}
              </span>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-500">
                  {score < 40 ? "1" : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Critical</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-yellow-500">
                  {score >= 40 && score < 70 ? "1" : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Warning</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-500">
                  {score >= 70 ? "1" : "0"}
                </div>
                <div className="text-xs text-muted-foreground">Healthy</div>
              </div>
            </div>

            {/* Health Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Health Range</span>
                <span>{score}%</span>
              </div>
              <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ width: "100%" }}
                />
                <div
                  className="absolute top-0 h-full w-1 bg-white shadow-lg transition-all duration-1000"
                  style={{ left: `${displayScore}%`, transform: "translateX(-50%)" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>40</span>
                <span>70</span>
                <span>100</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
