'use client';

import { useState } from 'react';
import { Check, X, Zap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * PRICING SOURCE: src/lib/billing/pricing-config.ts (CANONICAL)
 * All prices in AUD, GST inclusive
 *
 * Starter: $495/mo, $4,950/yr (12 months for 10)
 * Pro: $895/mo, $8,950/yr (12 months for 10)
 * Elite: $1,295/mo, $12,950/yr (12 months for 10)
 */

const pricingTiers = [
  {
    name: 'Starter',
    description: 'Perfect for solo entrepreneurs and small teams',
    monthlyPrice: 495,
    annualPrice: 412, // $4,950/year = ~$412/mo (17% savings)
    currency: 'AUD',
    features: [
      { name: '500 contacts', included: true },
      { name: '1 team seat', included: true },
      { name: '20,000 AI tokens/month', included: true },
      { name: '2 website audits/month', included: true },
      { name: '5 email campaigns', included: true },
      { name: 'Basic AI workspace', included: true },
      { name: 'Email support', included: true },
      { name: 'Core dashboard', included: true },
      { name: 'Priority support', included: false },
      { name: 'API access', included: false },
      { name: 'Custom integrations', included: false },
    ],
    cta: 'Start 14-Day Trial',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For growing teams and agencies',
    monthlyPrice: 895,
    annualPrice: 746, // $8,950/year = ~$746/mo (17% savings)
    currency: 'AUD',
    features: [
      { name: '5,000 contacts', included: true },
      { name: '3 team seats', included: true },
      { name: '250,000 AI tokens/month', included: true },
      { name: '20 website audits/month', included: true },
      { name: 'Unlimited campaigns', included: true },
      { name: 'Full NEXUS AI workspace', included: true },
      { name: 'Drip campaigns', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: true },
      { name: 'A/B testing', included: true },
      { name: 'Custom integrations', included: false },
    ],
    cta: 'Start 14-Day Trial',
    popular: true,
  },
  {
    name: 'Elite',
    description: 'For large organizations with custom needs',
    monthlyPrice: 1295,
    annualPrice: 1079, // $12,950/year = ~$1,079/mo (17% savings)
    currency: 'AUD',
    features: [
      { name: 'Unlimited contacts', included: true },
      { name: '10 team seats', included: true },
      { name: '2,000,000 AI tokens/month', included: true },
      { name: '100 website audits/month', included: true },
      { name: 'Unlimited campaigns', included: true },
      { name: 'Dedicated AI agent', included: true },
      { name: 'Custom brand model', included: true },
      { name: 'A/B testing', included: true },
      { name: 'White label options', included: true },
      { name: 'Agency integration', included: true },
      { name: 'Custom integrations', included: true },
    ],
    cta: 'Start 14-Day Trial',
    popular: false,
  },
];

const faqs = [
  {
    question: 'How does the trial and activation work?',
    answer: 'Every plan begins with a 14-day guided trial for platform setup and initial testing. Then enters a 90-day activation program where you\'ll see real results. No credit card required for trial. 90-day minimum commitment after trial ends.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate your billing accordingly.',
  },
  {
    question: 'What happens when I exceed my contact limit?',
    answer: 'You\'ll receive a notification when you approach your limit. You can either upgrade to a higher plan or archive inactive contacts to stay within your tier.',
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees. Ever. Pay only for the plan you choose.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) and ACH payments for annual plans.',
  },
  {
    question: 'What about the 90-day commitment?',
    answer: 'After your 14-day trial, plans have a 90-day minimum lock-in to ensure meaningful results. Real SEO and marketing traction requires consistent effort over 90+ days. You can cancel after the initial 90 days with 30-day notice.',
  },
  {
    question: 'Are prices GST-inclusive?',
    answer: 'Yes, all displayed prices include GST (10% for Australian customers). Enterprise pricing is discussed individually.',
  },
  {
    question: 'What\'s included in Enterprise support?',
    answer: 'Enterprise customers get a dedicated account manager, 24/7 priority support, custom onboarding, and a 99.9% uptime SLA.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="container mx-auto py-16">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Every plan starts with a 14-day guided trial, then a 90-day activation program.
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-8">
            All prices GST-inclusive • 90-day minimum after trial • Real results take time
          </p>

          {/* Billing Toggle */}
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
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pricingTiers.map((tier) => (
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
                  {tier.monthlyPrice ? (
                    <>
                      <span className="text-4xl font-bold">
                        A$
                        {billingCycle === 'monthly'
                          ? tier.monthlyPrice.toLocaleString()
                          : tier.annualPrice.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {billingCycle === 'annual' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Billed annually (A${(tier.annualPrice! * 12).toLocaleString()}/year)
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Custom</span>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-2">
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
                  {tier.monthlyPrice ? (
                    <a href="/dashboard/overview">
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  ) : (
                    <a href="/contact">
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mb-20">
          <div className="flex flex-wrap justify-center gap-8 items-center text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>14-day guided trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>No credit card for trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>90-day activation program</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span>GST-inclusive pricing</span>
            </div>
          </div>
        </div>

        {/* Trial Experience Section */}
        <div className="mb-20 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-4">Your 14-Day Trial Experience</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-8">
            Start free—no credit card required. Get full access to core features while we learn your needs.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Trial Limits */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Trial Limits (25% Capacity)</CardTitle>
                <CardDescription>Conservative limits for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                    <span>50,000 AI tokens/month (soft cap - warn but allow)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">🔒</span>
                    <span>10 visual generations maximum (hard cap - blocked)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">🔒</span>
                    <span>5 blueprints maximum (hard cap - blocked)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">🚫</span>
                    <span>Production jobs disabled</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-600 dark:text-orange-400">⚡</span>
                    <span>5 modules limited, 5 disabled</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* What You Get */}
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">Still Included in Trial</CardTitle>
                <CardDescription>Full access to core tools</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Website audit & analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Brand persona builder</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>90-day roadmap generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Analytics overview (read-only)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Email support during trial</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-900">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Our Honest Promise:</strong> We show upgrade prompts when you hit limits, but never nag. No surprise charges.
              Trial period lasts exactly 14 days. You choose if/when to upgrade. All limits are displayed in your dashboard.
            </p>
          </div>
        </div>

        {/* Marketing Honesty Statement */}
        <div className="mb-20 bg-muted/30 border rounded-lg p-8">
          <h3 className="text-xl font-bold text-center mb-4">Our Honest Marketing Commitment</h3>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-6">
            We don't promise overnight SEO results or viral campaigns. Real marketing success takes 90+ days of consistent effort.
            Our platform provides the tools and data—your results depend on quality content and realistic expectations.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <span>📊 Real metrics only</span>
            <span>⏱️ Honest timelines</span>
            <span>🎯 No vanity numbers</span>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="mb-20 bg-muted/50 border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Available Add-ons
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Extra Contacts</h3>
              <p className="text-sm text-muted-foreground mb-3">
                $10 per 1,000 contacts
              </p>
              <p className="text-xs text-muted-foreground">
                Scale beyond your plan limits
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Additional Transcription</h3>
              <p className="text-sm text-muted-foreground mb-3">
                $15 per 10 hours
              </p>
              <p className="text-xs text-muted-foreground">
                Process more audio/video content
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Premium Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                A$99/month
              </p>
              <p className="text-xs text-muted-foreground">
                Add to any plan for priority support (GST inclusive)
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the perfect plan for your needs.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="/contact">Contact Sales</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/features">Explore Features</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
