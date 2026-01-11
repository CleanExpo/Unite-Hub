"use client"

/**
 * AnimatedStats Component
 *
 * Dashboard stats section with animated count-up numbers and icons.
 * Includes hover effects and micro-interactions.
 * Inspired by KokonutUI patterns with Synthex design tokens.
 *
 * @example
 * <AnimatedStats
 *   stats={[
 *     { label: "Active Users", value: 12500, icon: <Users /> },
 *     { label: "Revenue", value: 45000, prefix: "$", icon: <DollarSign /> },
 *     { label: "Growth", value: 23.5, suffix: "%", icon: <TrendingUp /> }
 *   ]}
 * />
 */

import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"

import { cn } from "@/lib/utils"

interface Stat {
  /** Stat label */
  label: string
  /** Numeric value to display */
  value: number
  /** Prefix (e.g., "$") */
  prefix?: string
  /** Suffix (e.g., "%", "K") */
  suffix?: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Trend direction for visual indicator */
  trend?: "up" | "down" | "neutral"
  /** Trend value (e.g., "+12%") */
  trendValue?: string
  /** Description text */
  description?: string
}

interface AnimatedStatsProps {
  /** Array of stats to display */
  stats: Stat[]
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4
  /** Custom className */
  className?: string
  /** Animation duration in seconds */
  animationDuration?: number
  /** Decimal places for number display */
  decimals?: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

function AnimatedNumber({
  value,
  duration = 2,
  decimals = 0,
}: {
  value: number
  duration?: number
  decimals?: number
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) =>
    decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toLocaleString()
  )
  const [displayValue, setDisplayValue] = React.useState("0")

  React.useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(
          decimals > 0
            ? latest.toFixed(decimals)
            : Math.round(latest).toLocaleString()
        )
      },
    })

    return () => controls.stop()
  }, [value, duration, decimals, count])

  return <span>{displayValue}</span>
}

export function AnimatedStats({
  stats,
  columns = 4,
  className,
  animationDuration = 2,
  decimals = 0,
}: AnimatedStatsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }

  return (
    <motion.div
      className={cn("grid gap-4 sm:gap-6", gridCols[columns], className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          stat={stat}
          animationDuration={animationDuration}
          decimals={decimals}
        />
      ))}
    </motion.div>
  )
}

function StatCard({
  stat,
  animationDuration,
  decimals,
}: {
  stat: Stat
  animationDuration: number
  decimals: number
}) {
  const trendColors = {
    up: "text-success bg-success/10",
    down: "text-error bg-error/10",
    neutral: "text-text-muted bg-bg-hover",
  }

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-xl p-6",
        "bg-bg-card border border-border-subtle",
        "transition-all duration-300",
        "hover:border-accent-500/30 hover:shadow-lg hover:shadow-accent-500/5"
      )}
      variants={itemVariants}
      whileHover={{ y: -2 }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Header with icon and trend */}
        <div className="flex items-center justify-between">
          {stat.icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 transition-colors group-hover:bg-accent-500 group-hover:text-white">
              {stat.icon}
            </div>
          )}
          {stat.trend && stat.trendValue && (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                trendColors[stat.trend]
              )}
            >
              {stat.trend === "up" && "↑"}
              {stat.trend === "down" && "↓"}
              {stat.trendValue}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-4">
          <p className="text-3xl font-bold tracking-tight text-text-primary">
            {stat.prefix}
            <AnimatedNumber
              value={stat.value}
              duration={animationDuration}
              decimals={decimals}
            />
            {stat.suffix}
          </p>
        </div>

        {/* Label */}
        <p className="mt-1 text-sm text-text-secondary">{stat.label}</p>

        {/* Description */}
        {stat.description && (
          <p className="mt-2 text-xs text-text-muted">{stat.description}</p>
        )}
      </div>

      {/* Animated border gradient */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-accent-500/0"
        whileHover={{ borderColor: "rgba(255, 107, 53, 0.2)" }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}

AnimatedStats.displayName = "AnimatedStats"

export default AnimatedStats
