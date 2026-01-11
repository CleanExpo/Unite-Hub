"use client"

/**
 * FeatureGrid Component
 *
 * Premium feature showcase grid with hover animations and icons.
 * Inspired by StyleUI/KokonutUI patterns with Synthex design tokens.
 *
 * @example
 * <FeatureGrid
 *   title="Everything you need"
 *   subtitle="Built for modern teams"
 *   features={[
 *     { icon: <Zap />, title: "Fast", description: "Lightning quick" },
 *     { icon: <Shield />, title: "Secure", description: "Enterprise grade" },
 *   ]}
 * />
 */

import * as React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface Feature {
  /** Icon component */
  icon: React.ReactNode
  /** Feature title */
  title: string
  /** Feature description */
  description: string
  /** Optional link */
  href?: string
}

interface FeatureGridProps {
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Array of features to display */
  features: Feature[]
  /** Number of columns (2, 3, or 4) */
  columns?: 2 | 3 | 4
  /** Custom className */
  className?: string
  /** Card style variant */
  variant?: "default" | "bordered" | "filled"
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

export function FeatureGrid({
  title,
  subtitle,
  features,
  columns = 3,
  className,
  variant = "default",
}: FeatureGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }

  const cardStyles = {
    default: "bg-transparent hover:bg-bg-hover/50",
    bordered: "border border-border-subtle bg-bg-card hover:border-accent-500/50",
    filled: "bg-bg-card hover:bg-bg-hover",
  }

  return (
    <section className={cn("py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        {(title || subtitle) && (
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-lg text-text-secondary">
                {subtitle}
              </p>
            )}
          </motion.div>
        )}

        {/* Features grid */}
        <motion.div
          className={cn(
            "mt-16 grid gap-8",
            gridCols[columns]
          )}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              feature={feature}
              variant={variant}
              cardStyles={cardStyles}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCard({
  feature,
  variant,
  cardStyles,
}: {
  feature: Feature
  variant: "default" | "bordered" | "filled"
  cardStyles: Record<string, string>
}) {
  const CardWrapper = feature.href ? motion.a : motion.div

  return (
    <CardWrapper
      href={feature.href}
      className={cn(
        "group relative rounded-xl p-6 transition-all duration-300",
        cardStyles[variant],
        feature.href && "cursor-pointer"
      )}
      variants={itemVariants}
      whileHover={{ y: -4 }}
    >
      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-500/10 text-accent-500 transition-colors group-hover:bg-accent-500 group-hover:text-white">
        {feature.icon}
      </div>

      {/* Content */}
      <h3 className="mt-4 text-lg font-semibold text-text-primary">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        {feature.description}
      </p>

      {/* Hover indicator for linked cards */}
      {feature.href && (
        <div className="mt-4 flex items-center text-sm font-medium text-accent-500 opacity-0 transition-opacity group-hover:opacity-100">
          Learn more
          <svg
            className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      )}

      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-accent-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </CardWrapper>
  )
}

FeatureGrid.displayName = "FeatureGrid"

export default FeatureGrid
