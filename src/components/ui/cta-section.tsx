"use client"

/**
 * CTASection Component
 *
 * Call-to-action section with gradient background and buttons.
 * Perfect for conversion-focused landing page sections.
 * Inspired by StyleUI patterns with Synthex design tokens.
 *
 * @example
 * <CTASection
 *   title="Ready to get started?"
 *   description="Join thousands of happy customers today."
 *   primaryCTA={{ label: "Start Free Trial", href: "/signup" }}
 *   secondaryCTA={{ label: "Contact Sales", href: "/contact" }}
 * />
 */

import * as React from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CTASectionProps {
  /** Main headline */
  title: string
  /** Description text */
  description?: string
  /** Primary CTA button */
  primaryCTA?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Secondary CTA button */
  secondaryCTA?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Custom className */
  className?: string
  /** Background variant */
  variant?: "default" | "gradient" | "bordered"
  /** Alignment */
  align?: "left" | "center"
}

export function CTASection({
  title,
  description,
  primaryCTA,
  secondaryCTA,
  className,
  variant = "gradient",
  align = "center",
}: CTASectionProps) {
  const bgStyles = {
    default: "bg-bg-card",
    gradient: "bg-gradient-to-br from-accent-500/10 via-bg-card to-accent-600/5",
    bordered: "bg-bg-card border border-border-subtle",
  }

  return (
    <section className={cn("py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className={cn(
            "relative overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16",
            bgStyles[variant]
          )}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Background decorations for gradient variant */}
          {variant === "gradient" && (
            <>
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent-600/10 blur-3xl" />
            </>
          )}

          <div
            className={cn(
              "relative z-10",
              align === "center" && "text-center",
              align === "left" && "max-w-2xl"
            )}
          >
            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl lg:text-4xl">
              {title}
            </h2>

            {/* Description */}
            {description && (
              <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                {description}
              </p>
            )}

            {/* CTA Buttons */}
            {(primaryCTA || secondaryCTA) && (
              <div
                className={cn(
                  "mt-8 flex flex-wrap gap-4",
                  align === "center" && "justify-center",
                  align === "left" && "justify-start"
                )}
              >
                {primaryCTA && (
                  <Button
                    size="lg"
                    className="group"
                    onClick={primaryCTA.onClick}
                    asChild={!primaryCTA.onClick && !!primaryCTA.href}
                  >
                    {primaryCTA.onClick ? (
                      <>
                        {primaryCTA.label}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    ) : primaryCTA.href ? (
                      <a href={primaryCTA.href}>
                        {primaryCTA.label}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    ) : (
                      primaryCTA.label
                    )}
                  </Button>
                )}
                {secondaryCTA && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={secondaryCTA.onClick}
                    asChild={!secondaryCTA.onClick && !!secondaryCTA.href}
                  >
                    {secondaryCTA.onClick ? (
                      secondaryCTA.label
                    ) : secondaryCTA.href ? (
                      <a href={secondaryCTA.href}>{secondaryCTA.label}</a>
                    ) : (
                      secondaryCTA.label
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

CTASection.displayName = "CTASection"

export default CTASection
