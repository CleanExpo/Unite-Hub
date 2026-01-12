 
"use client"

import { AnimatedNumber } from "./animated-number"

export interface MetricsCardProps {
  label: string
  value: number
  suffix?: string
  prefix?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

export function MetricsCard({
  label,
  value,
  suffix = "",
  prefix = "",
  icon,
  trend,
}: MetricsCardProps) {
  return (
    <div className="bg-bg-card rounded-lg border border-border-subtle p-6 hover:border-border-medium transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{label}</h3>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        {prefix && <span className="text-sm font-semibold text-text-secondary">{prefix}</span>}
        <div className="text-3xl font-bold text-text-primary">
          <AnimatedNumber
            value={value}
            precision={0}
            duration={0.8}
            mass={1}
            stiffness={100}
            damping={30}
          />
        </div>
        {suffix && <span className="text-sm font-semibold text-text-secondary">{suffix}</span>}
      </div>

      {trend && (
        <p className={`text-sm font-medium ${trend.direction === "up" ? "text-success-600" : "text-error-600"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
        </p>
      )}
    </div>
  )
}
