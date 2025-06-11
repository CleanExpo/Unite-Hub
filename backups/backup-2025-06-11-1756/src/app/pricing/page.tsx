'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const pricingPlans = [
  {
    name: 'Startup',
    description: 'Perfect for small businesses and startups',
    price: {
      monthly: 299,
      annually: 2990
    },
    features: [
      'CRM for up to 10 users',
      'Cloud infrastructure setup',
      'Basic AI analytics',
      '24/7 email support',
      '5GB storage',
      'Mobile app access',
      'Basic integrations',
      'Monthly reports'
    ],
    notIncluded: [
      'Custom AI solutions',
      'Dedicated account manager',
      'Advanced security features',
      'Custom integrations'
    ],
    popular: false,
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    description: 'Ideal for growing businesses',
    price: {
      monthly: 799,
      annually: 7990
    },
    features: [
      'CRM for up to 50 users',
      'Advanced cloud solutions',
      'AI-powered analytics & insights',
      '24/7 priority support',
      '50GB storage',
      'Mobile app access',
      'Advanced integrations',
      'Weekly reports',
      'Custom workflows',
      'API access',
      'Team collaboration tools',
      'Data backup & recovery'
    ],
    notIncluded: [
      'White-label options',
      'On-premise deployment'
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: {
      monthly: 'Custom',
      annually: 'Custom'
    },
    features: [
      'Unlimited users',
      'Full cloud infrastructure',
      'Custom AI solutions',
      'Dedicated account manager',
      'Unlimited storage',
      'Mobile app access',
      'Custom integrations',
      'Real-time analytics',
      'Advanced security features',
      'SLA guarantee',
      'On-premise options',
      'White-label solutions',
      'Custom training',
      'Compliance support',
      '24/7 dedicated support'
    ],
    notIncluded: [],
    popular: false,
    cta: 'Contact Sales'
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include our core features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-4 py-2 rounded-md transition-colors ${
                billingCycle === 'annually'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annually
              <Badge className="ml-2" variant="secondary">Save 20%</Badge>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className={`relative h-full ${plan.popular ? 'border-blue-500 shadow-xl' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    {typeof plan.price.monthly === 'number' ? (
                      <>
                        <span className="text-4xl font-bold">
                          ${billingCycle === 'monthly' ? plan.price.monthly : Math.floor((plan.price.annually as number) / 12)}
                        </span>
                        <span className="text-gray-600">/month</span>
                        {billingCycle === 'annually' && (
                          <p className="text-sm text-gray-500 mt-1">
                            ${plan.price.annually} billed annually
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl font-bold">Custom Pricing</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button 
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    asChild
                  >
                    <Link href={plan.cta === 'Contact Sales' ? '/contact' : '/register'}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                  <div className="space-y-4 pt-6">
                    <h4 className="font-medium text-gray-900">What&apos;s included:</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.notIncluded.length > 0 && (
                      <>
                        <div className="pt-4 border-t border-gray-200">
                          <ul className="space-y-3">
                            {plan.notIncluded.map((feature) => (
                              <li key={feature} className="flex items-start">
                                <X className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-500 text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Can I change my plan later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate any differences.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Do you offer a free trial?</h3>
              <p className="text-gray-600">
                Yes! All our plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, bank transfers, and can arrange custom billing for enterprise clients.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Is there a setup fee?</h3>
              <p className="text-gray-600">
                No setup fees for any of our plans. You only pay for the subscription.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16 bg-blue-50 rounded-2xl p-12"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to transform your business?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join over 500+ companies already using Unite Group to power their growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
