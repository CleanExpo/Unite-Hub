"use client"

/**
 * HeroSection Component
 *
 * Premium landing page hero section with animated gradient background,
 * floating elements, and call-to-action buttons.
 * Inspired by StyleUI patterns with Synthex design tokens.
 *
 * @example
 * <HeroSection
 *   title="Build something amazing"
 *   subtitle="Start your journey with our platform"
 *   primaryCTA={{ label: "Get Started", href: "/signup" }}
 *   secondaryCTA={{ label: "Learn More", href: "/docs" }}
 * />
 */

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  /** Main headline */
  title: string
  /** Subtitle or description */
  subtitle?: string
  /** Primary call-to-action button */
  primaryCTA?: {
    label: string
    href: string
    onClick?: () => void
  }
  /** Secondary call-to-action button */
  secondaryCTA?: {
    label: string
    href: string
    onClick?: () => void
  }
  /** Badge text above title */
  badge?: string
  /** Custom className */
  className?: string
  /** Variant style */
  variant?: "default" | "centered" | "split"
  /** Show animated background */
  animatedBackground?: boolean
  /** Children for custom content */
  children?: React.ReactNode
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
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

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export function HeroSection({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  badge,
  className,
  variant = "default",
  animatedBackground = true,
  children,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative min-h-[80vh] w-full overflow-hidden",
        "bg-bg-base",
        className
      )}
    >
      {/* Animated gradient background */}
      {animatedBackground && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Primary gradient orb */}
          <motion.div
            className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent-500/20 blur-[100px]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Secondary gradient orb */}
          <motion.div
            className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-accent-600/15 blur-[80px]"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>
      )}

      {/* Content container */}
      <motion.div
        className={cn(
          "relative z-10 mx-auto flex min-h-[80vh] max-w-7xl flex-col px-4 py-20 sm:px-6 lg:px-8",
          variant === "centered" && "items-center justify-center text-center",
          variant === "default" && "items-start justify-center",
          variant === "split" && "items-center justify-center lg:flex-row lg:items-center lg:justify-between"
        )}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div
          className={cn(
            "max-w-2xl",
            variant === "split" && "lg:max-w-xl"
          )}
        >
          {/* Badge */}
          {badge && (
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5 text-sm font-medium text-accent-400">
                <Sparkles className="h-4 w-4" />
                {badge}
              </span>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            className={cn(
              "mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl",
              "bg-gradient-to-br from-text-primary via-text-primary to-text-secondary bg-clip-text"
            )}
            variants={itemVariants}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              className="mt-6 text-lg leading-8 text-text-secondary sm:text-xl"
              variants={itemVariants}
            >
              {subtitle}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {(primaryCTA || secondaryCTA) && (
            <motion.div
              className="mt-10 flex flex-wrap items-center gap-4"
              variants={itemVariants}
            >
              {primaryCTA && (
                <Button
                  size="lg"
                  className="group"
                  onClick={primaryCTA.onClick}
                  asChild={!primaryCTA.onClick}
                >
                  {primaryCTA.onClick ? (
                    <>
                      {primaryCTA.label}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    <a href={primaryCTA.href}>
                      {primaryCTA.label}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  )}
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={secondaryCTA.onClick}
                  asChild={!secondaryCTA.onClick}
                >
                  {secondaryCTA.onClick ? (
                    secondaryCTA.label
                  ) : (
                    <a href={secondaryCTA.href}>{secondaryCTA.label}</a>
                  )}
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* Custom children / right side content for split variant */}
        {children && (
          <motion.div
            className={cn(
              "mt-16",
              variant === "split" && "lg:mt-0 lg:ml-16"
            )}
            variants={floatingVariants}
            animate="animate"
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}

HeroSection.displayName = "HeroSection"

export default HeroSection
