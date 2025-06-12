'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PricingTier {
  name: string
  price: {
    monthly: number
    annually: number
  }
  description: string
  features: string[]
  limitations?: string[]
  popular?: boolean
  cta: string
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    price: {
      monthly: 29,
      annually: 290
    },
    description: 'Perfect for small businesses getting started',
    features: [
      'Up to 5 team members',
      'Basic CRM functionality',
      'Email support',
      '10GB storage',
      'Basic reporting',
      'Mobile app access'
    ],
    limitations: [
      'Limited integrations',
      'Basic customization'
    ],
    cta: 'Start Free Trial'
  },
  {
    name: 'Professional',
    price: {
      monthly: 79,
      annually: 790
    },
    description: 'Ideal for growing businesses',
    features: [
      'Up to 25 team members',
      'Advanced CRM features',
      'Priority email support',
      '100GB storage',
      'Advanced reporting & analytics',
      'API access',
      'Custom fields',
      'Workflow automation',
      'Third-party integrations'
    ],
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    name: 'Enterprise',
    price: {
      monthly: 199,
      annually: 1990
    },
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited team members',
      'Full CRM suite',
      '24/7 phone & email support',
      'Unlimited storage',
      'Custom reporting & dashboards',
      'Advanced API access',
      'Custom integrations',
      'Advanced security features',
      'Dedicated account manager',
      'Custom training sessions',
      'SLA guarantee'
    ],
    cta: 'Contact Sales'
  }
]

const faqs = [
  {
    question: 'Can I change my plan at any time?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, we offer a 14-day free trial for all plans. No credit card required to start.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
  },
  {
    question: 'Do you offer custom enterprise solutions?',
    answer: 'Yes, we work with enterprise clients to create custom solutions that meet their specific needs. Contact our sales team for more information.'
  }
]

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly')

  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'monthly' ? tier.price.monthly : tier.price.annually
  }

  const getSavings = (tier: PricingTier) => {
    const monthlyCost = tier.price.monthly * 12
    const annualCost = tier.price.annually
    const savings = monthlyCost - annualCost
    const percentage = Math.round((savings / monthlyCost) * 100)
    return { amount: savings, percentage }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Choose the perfect plan for your business. All plans include our core features with no hidden fees.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            className="flex items-center justify-center space-x-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annually' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                billingCycle === 'annually' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'annually' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annually' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              Annually
            </span>
            {billingCycle === 'annually' && (
              <Badge className="bg-green-100 text-green-800 ml-2">
                Save up to 20%
              </Badge>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className={`relative h-full ${tier.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {tier.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${getPrice(tier)}
                      </span>
                      <span className="text-gray-500 ml-1">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    
                    {billingCycle === 'annually' && (
                      <div className="mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          Save ${getSavings(tier).amount} ({getSavings(tier).percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {tier.limitations && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Limitations:
                      </h4>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="flex items-start">
                            <X className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300 text-sm">
                              {limitation}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-6">
                    <Button 
                      className={`w-full ${tier.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      variant={tier.popular ? 'default' : 'outline'}
                    >
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                All Plans Include
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">99.9% Uptime</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Reliable service with guaranteed uptime
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">SSL Security</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Enterprise-grade security for your data
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Regular Backups</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Automatic daily backups of your data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">
                Ready to get started?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of businesses already using our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Contact Sales
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
