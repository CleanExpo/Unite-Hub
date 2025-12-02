/* eslint-disable no-undef */
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
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        {prefix && <span className="text-sm font-semibold text-gray-700">{prefix}</span>}
        <div className="text-3xl font-bold text-gray-900">
          <AnimatedNumber
            value={value}
            precision={0}
            duration={0.8}
            mass={1}
            stiffness={100}
            damping={30}
          />
        </div>
        {suffix && <span className="text-sm font-semibold text-gray-700">{suffix}</span>}
      </div>

      {trend && (
        <p className={`text-sm font-medium ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}>
          {trend.direction === "up" ? "↑" : "↓"} {Math.abs(trend.value)}% from last month
        </p>
      )}
    </div>
  )
}
