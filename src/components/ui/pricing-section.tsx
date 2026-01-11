"use client"

/**
 * PricingSection Component
 *
 * Premium pricing cards with feature lists and CTA buttons.
 * Supports highlight for recommended plan and toggle for monthly/annual.
 * Inspired by StyleUI patterns with Synthex design tokens.
 *
 * @example
 * <PricingSection
 *   plans={[
 *     {
 *       name: "Starter",
 *       price: { monthly: 29, annually: 24 },
 *       features: ["Feature 1", "Feature 2"],
 *       cta: { label: "Get Started", href: "/signup" }
 *     },
 *     {
 *       name: "Pro",
 *       price: { monthly: 79, annually: 66 },
 *       features: ["All Starter features", "Feature 3"],
 *       highlighted: true,
 *       cta: { label: "Get Started", href: "/signup" }
 *     }
 *   ]}
 * />
 */

import * as React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface PricingPlan {
  /** Plan name */
  name: string
  /** Plan description */
  description?: string
  /** Price object with monthly and annually options */
  price: {
    monthly: number
    annually: number
  }
  /** Currency symbol */
  currency?: string
  /** Billing period label */
  period?: string
  /** Array of feature strings */
  features: string[]
  /** Whether this plan is highlighted/recommended */
  highlighted?: boolean
  /** CTA button config */
  cta: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Badge text (e.g., "Most Popular") */
  badge?: string
}

interface PricingSectionProps {
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** Array of pricing plans */
  plans: PricingPlan[]
  /** Custom className */
  className?: string
  /** Show billing toggle */
  showToggle?: boolean
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

const cardVariants = {
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

export function PricingSection({
  title = "Simple, transparent pricing",
  subtitle = "Choose the plan that's right for you",
  plans,
  className,
  showToggle = true,
}: PricingSectionProps) {
  const [isAnnual, setIsAnnual] = React.useState(true)

  return (
    <section className={cn("py-20", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-text-secondary">
              {subtitle}
            </p>
          )}

          {/* Billing toggle */}
          {showToggle && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  !isAnnual ? "text-text-primary" : "text-text-muted"
                )}
              >
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label="Toggle annual billing"
              />
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isAnnual ? "text-text-primary" : "text-text-muted"
                )}
              >
                Annually
                <span className="ml-1.5 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs font-medium text-accent-500">
                  Save 20%
                </span>
              </span>
            </div>
          )}
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          className={cn(
            "mt-16 grid gap-8",
            plans.length === 2 && "mx-auto max-w-4xl grid-cols-1 md:grid-cols-2",
            plans.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            plans.length >= 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan}
              isAnnual={isAnnual}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function PricingCard({
  plan,
  isAnnual,
}: {
  plan: PricingPlan
  isAnnual: boolean
}) {
  const price = isAnnual ? plan.price.annually : plan.price.monthly
  const currency = plan.currency || "$"
  const period = plan.period || "/month"

  return (
    <motion.div
      className={cn(
        "relative flex flex-col rounded-2xl p-8",
        "border transition-all duration-300",
        plan.highlighted
          ? "border-accent-500 bg-accent-500/5 shadow-xl shadow-accent-500/10"
          : "border-border-subtle bg-bg-card hover:border-border-subtle/80"
      )}
      variants={cardVariants}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex rounded-full bg-accent-500 px-4 py-1 text-xs font-semibold text-white">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-text-primary">
          {plan.name}
        </h3>
        {plan.description && (
          <p className="mt-2 text-sm text-text-secondary">
            {plan.description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="mt-6 text-center">
        <div className="flex items-baseline justify-center">
          <span className="text-4xl font-bold tracking-tight text-text-primary">
            {currency}{price}
          </span>
          <span className="ml-1 text-sm text-text-muted">
            {period}
          </span>
        </div>
        {isAnnual && (
          <p className="mt-1 text-xs text-text-muted">
            Billed annually ({currency}{price * 12}/year)
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mt-8 flex-1 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 shrink-0 text-accent-500" />
            <span className="text-sm text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
          onClick={plan.cta.onClick}
          asChild={!plan.cta.onClick && !!plan.cta.href}
        >
          {plan.cta.onClick ? (
            plan.cta.label
          ) : plan.cta.href ? (
            <a href={plan.cta.href}>{plan.cta.label}</a>
          ) : (
            plan.cta.label
          )}
        </Button>
      </div>
    </motion.div>
  )
}

PricingSection.displayName = "PricingSection"

export default PricingSection
