'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  HelpCircle, 
  MessageSquare, 
  CreditCard, 
  Shield, 
  Zap, 
  Database,
  Users,
  Settings,
  ArrowRight
} from 'lucide-react'

const faqCategories = [
  {
    name: 'Getting Started',
    icon: <Zap className="h-5 w-5" />,
    questions: [
      {
        question: 'How do I sign up for Unite Group services?',
        answer: 'Getting started is easy! Click the "Get Started" button on our homepage, choose your plan, and follow the simple registration process. You\'ll be up and running in minutes with our automated setup.'
      },
      {
        question: 'Is there a free trial available?',
        answer: 'Yes! We offer a 14-day free trial for all our plans. No credit card required. You can explore all features and cancel anytime during the trial period.'
      },
      {
        question: 'What kind of support do you provide during onboarding?',
        answer: 'We provide comprehensive onboarding support including dedicated account managers, video tutorials, documentation, and 24/7 live chat support to ensure a smooth start.'
      }
    ]
  },
  {
    name: 'Pricing & Billing',
    icon: <CreditCard className="h-5 w-5" />,
    questions: [
      {
        question: 'How does your pricing work?',
        answer: 'Our pricing is transparent and scalable. We offer Startup ($49/month), Growth ($299/month), and Enterprise (custom) plans. Each plan includes different features and usage limits. Visit our pricing page for detailed information.'
      },
      {
        question: 'Can I change my plan anytime?',
        answer: 'Absolutely! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll have immediate access to new features. When downgrading, changes take effect at the next billing cycle.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and wire transfers for enterprise customers. All payments are processed securely through Stripe.'
      },
      {
        question: 'Do you offer annual billing discounts?',
        answer: 'Yes! Save 20% when you pay annually. That\'s 2 months free compared to monthly billing. Contact our sales team for custom enterprise discounts.'
      }
    ]
  },
  {
    name: 'Features',
    icon: <MessageSquare className="h-5 w-5" />,
    questions: [
      {
        question: 'What is the Teams-style messaging feature?',
        answer: 'Our Teams-style messaging is a real-time collaboration platform built into the CRM. It includes channels, direct messages, file sharing, reactions, threads, and @mentions - all integrated with your customer data.'
      },
      {
        question: 'How does the AI analytics work?',
        answer: 'Our AI analytics uses machine learning to analyze your business data, predict trends, identify opportunities, and provide actionable insights. It includes predictive sales forecasting, customer behavior analysis, and automated recommendations.'
      },
      {
        question: 'Can I integrate with other tools?',
        answer: 'Yes! We offer 500+ integrations including Salesforce, HubSpot, Slack, Microsoft Teams, Google Workspace, and more. We also provide REST APIs and webhooks for custom integrations.'
      },
      {
        question: 'Is mobile access available?',
        answer: 'Yes, our platform is fully responsive and works on all devices. We also offer native iOS and Android apps with offline capabilities for enterprise customers.'
      }
    ]
  },
  {
    name: 'Security & Compliance',
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: 'How secure is my data?',
        answer: 'We use bank-level 256-bit encryption for data in transit and at rest. Our infrastructure is hosted on AWS with multiple security layers, regular security audits, and 24/7 monitoring.'
      },
      {
        question: 'Are you GDPR compliant?',
        answer: 'Yes, we are fully GDPR compliant. We provide data processing agreements, tools for data portability and deletion, and transparent privacy policies. We also comply with CCPA and other privacy regulations.'
      },
      {
        question: 'Do you have SOC2 certification?',
        answer: 'Yes, we are SOC2 Type II certified. We undergo annual audits to ensure our security controls meet the highest standards. Certificates are available upon request.'
      },
      {
        question: 'Where is my data stored?',
        answer: 'Your data is stored in secure AWS data centers. You can choose your data residency location from US, EU, or Asia-Pacific regions to meet your compliance requirements.'
      }
    ]
  },
  {
    name: 'Technical',
    icon: <Database className="h-5 w-5" />,
    questions: [
      {
        question: 'What is your uptime guarantee?',
        answer: 'We guarantee 99.9% uptime for all paid plans. Our infrastructure includes automatic failover, redundant systems, and global CDN distribution. Check our status page for real-time updates.'
      },
      {
        question: 'Do you provide API access?',
        answer: 'Yes! We provide comprehensive REST APIs with detailed documentation. Rate limits vary by plan: 1000 requests/hour for Startup, 10,000 for Growth, and unlimited for Enterprise.'
      },
      {
        question: 'Can I export my data?',
        answer: 'Absolutely. You own your data and can export it anytime. We support CSV, JSON, and SQL exports. Enterprise customers get automated daily backups to their own S3 buckets.'
      },
      {
        question: 'What browsers do you support?',
        answer: 'We support all modern browsers including Chrome, Firefox, Safari, and Edge (latest 2 versions). Our platform is built with progressive web app technology for optimal performance.'
      }
    ]
  },
  {
    name: 'Account & Team',
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        question: 'How many users can I add?',
        answer: 'User limits depend on your plan: Startup (5 users), Growth (50 users), Enterprise (unlimited). You can purchase additional user seats as needed.'
      },
      {
        question: 'How do permissions work?',
        answer: 'We offer role-based access control with predefined roles (Admin, Manager, User) and custom permission sets. You can control access to features, data, and actions at a granular level.'
      },
      {
        question: 'Can I have multiple workspaces?',
        answer: 'Yes! Growth and Enterprise plans support multiple workspaces for different teams or projects. Each workspace has its own data, settings, and user permissions.'
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to common questions about Unite Group&apos;s platform and services
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <input
                  type="text"
                  Unite Group="Search for answers..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2" aria-label="Search FAQ">
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Popular searches:</span>
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">pricing</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">security</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">integrations</Badge>
                <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">api</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + categoryIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{category.name}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((item, index) => (
                  <AccordionItem key={index} value={`${category.name}-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="font-medium text-gray-900">{item.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 pt-2 pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <Settings className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button>
                    Contact Support
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline">
                  Schedule a Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Link href="/docs" className="block">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold">Documentation</h4>
                  <p className="text-sm text-gray-600">Technical guides</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/api" className="block">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <Zap className="h-5 w-5 text-purple-600" />
                <div>
                  <h4 className="font-semibold">API Reference</h4>
                  <p className="text-sm text-gray-600">Developer resources</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/status" className="block">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-semibold">System Status</h4>
                  <p className="text-sm text-gray-600">Service health</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
