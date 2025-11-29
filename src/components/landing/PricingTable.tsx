'use client';

import { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PricingFeature {
  name: string;
  included: boolean;
}

export interface PricingTier {
  name: string;
  description: string;
  monthlyPrice?: number;
  annualPrice?: number;
  currency?: string;
  features: PricingFeature[];
  cta: string;
  ctaHref?: string;
  popular?: boolean;
  enterprise?: boolean;
}

export interface PricingTableProps {
  tiers: PricingTier[];
  defaultCycle?: 'monthly' | 'annual';
  annualSavingsPercent?: number;
  showBillingToggle?: boolean;
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Pricing Table Component
 *
 * Three-tier pricing table with monthly/annual toggle.
 * Matches migration 401 pricing structure.
 *
 * @example
 * ```tsx
 * <PricingTable
 *   title="Simple, Transparent Pricing"
 *   subtitle="Start with a 14-day trial, then choose your plan"
 *   tiers={[
 *     {
 *       name: 'Starter',
 *       description: 'Perfect for solo entrepreneurs',
 *       monthlyPrice: 495,
 *       annualPrice: 412,
 *       currency: 'AUD',
 *       features: [
 *         { name: '500 contacts', included: true },
 *         { name: 'API access', included: false }
 *       ],
 *       cta: 'Start Trial',
 *       ctaHref: '/signup?plan=starter'
 *     }
 *   ]}
 *   defaultCycle="annual"
 *   annualSavingsPercent={17}
 * />
 * ```
 */
export function PricingTable({
  tiers,
  defaultCycle = 'annual',
  annualSavingsPercent = 17,
  showBillingToggle = true,
  title,
  subtitle,
  className = '',
}: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(defaultCycle);

  return (
    <div className={`container mx-auto py-16 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-16">
            {title && <h1 className="text-5xl font-bold mb-6">{title}</h1>}
            {subtitle && (
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                {subtitle}
              </p>
            )}

            {/* Billing Toggle */}
            {showBillingToggle && (
              <div className="inline-flex items-center gap-4 bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-background shadow-sm font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-background shadow-sm font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  Annual
                  {annualSavingsPercent > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      Save {annualSavingsPercent}%
                    </Badge>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  {tier.enterprise ? (
                    <span className="text-4xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">
                        {tier.currency || '$'}
                        {billingCycle === 'monthly'
                          ? tier.monthlyPrice?.toLocaleString()
                          : tier.annualPrice?.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {billingCycle === 'annual' && tier.annualPrice && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed annually ({tier.currency || '$'}
                          {(tier.annualPrice * 12).toLocaleString()}/year)
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <a href={tier.ctaHref || '/signup'}>
                    {tier.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
