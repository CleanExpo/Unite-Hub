'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign,
  Zap,
  Shield,
  ArrowRight,
  BarChart3,
  Building2,
  Rocket
} from 'lucide-react'

const caseStudies = [
  {
    id: 1,
    company: 'TechStart Solutions',
    industry: 'Technology',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=TechStart',
    title: 'Scaling from Startup to Enterprise with Unite Group CRM',
    challenge: 'TechStart was struggling with disparate systems and manual processes that couldn\'t scale with their rapid growth.',
    solution: 'Implemented Unite Group\'s CRM with AI-powered analytics and automated workflows across sales, marketing, and support.',
    results: [
      { metric: 'Sales Efficiency', improvement: '+300%', icon: <TrendingUp className="h-5 w-5" /> },
      { metric: 'Customer Satisfaction', improvement: '+45%', icon: <Users className="h-5 w-5" /> },
      { metric: 'Response Time', improvement: '-75%', icon: <Clock className="h-5 w-5" /> },
      { metric: 'Revenue Growth', improvement: '+250%', icon: <DollarSign className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'Unite Group transformed our operations completely. Their AI-powered solutions increased our operational efficiency by 300%.',
      author: 'Sarah Mitchell',
      role: 'CEO, TechStart Solutions'
    },
    featured: true
  },
  {
    id: 2,
    company: 'Global Logistics Inc.',
    industry: 'Logistics',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=GlobalLogistics',
    title: 'Revolutionizing Supply Chain Management with AI',
    challenge: 'Managing complex global supply chains with legacy systems led to inefficiencies and poor visibility.',
    solution: 'Deployed Unite Group\'s cloud infrastructure with real-time tracking and predictive analytics.',
    results: [
      { metric: 'Delivery Time', improvement: '-40%', icon: <Clock className="h-5 w-5" /> },
      { metric: 'Cost Savings', improvement: '$2.5M/year', icon: <DollarSign className="h-5 w-5" /> },
      { metric: 'Accuracy', improvement: '+95%', icon: <Shield className="h-5 w-5" /> },
      { metric: 'Efficiency', improvement: '+200%', icon: <Zap className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'The CRM system Unite Group implemented has revolutionized how we manage client relationships.',
      author: 'David Chen',
      role: 'Operations Director'
    },
    featured: false
  },
  {
    id: 3,
    company: 'FinTech Pioneers',
    industry: 'Finance',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=FinTech',
    title: 'Achieving 95% Prediction Accuracy with AI Analytics',
    challenge: 'Needed advanced analytics to predict market trends and manage risk in real-time.',
    solution: 'Built custom AI models integrated with Unite Group\'s platform for predictive analytics.',
    results: [
      { metric: 'Prediction Accuracy', improvement: '95%', icon: <BarChart3 className="h-5 w-5" /> },
      { metric: 'Risk Reduction', improvement: '-60%', icon: <Shield className="h-5 w-5" /> },
      { metric: 'Trading Volume', improvement: '+400%', icon: <TrendingUp className="h-5 w-5" /> },
      { metric: 'ROI', improvement: '350%', icon: <DollarSign className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'The AI predictive analytics platform Unite Group built for us has given us a competitive edge.',
      author: 'Michael Thompson',
      role: 'CTO'
    },
    featured: false
  },
  {
    id: 4,
    company: 'HealthTech Innovations',
    industry: 'Healthcare',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=HealthTech',
    title: 'HIPAA-Compliant Digital Transformation',
    challenge: 'Required secure, compliant systems while improving patient care and operational efficiency.',
    solution: 'Implemented Unite Group\'s healthcare-specific solutions with end-to-end encryption.',
    results: [
      { metric: 'System Performance', improvement: '+200%', icon: <Zap className="h-5 w-5" /> },
      { metric: 'Compliance Score', improvement: '100%', icon: <Shield className="h-5 w-5" /> },
      { metric: 'Patient Satisfaction', improvement: '+85%', icon: <Users className="h-5 w-5" /> },
      { metric: 'Cost Reduction', improvement: '-45%', icon: <DollarSign className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'Unite Group\'s expertise in healthcare technology is exceptional.',
      author: 'Lisa Wang',
      role: 'Founder & CEO'
    },
    featured: false
  },
  {
    id: 5,
    company: 'Innovate Retail',
    industry: 'Retail',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=InnovateRetail',
    title: 'Cloud Migration Saves 40% on IT Costs',
    challenge: 'On-premise infrastructure was costly and couldn\'t handle peak shopping seasons.',
    solution: 'Migrated to Unite Group\'s cloud platform with auto-scaling and optimization.',
    results: [
      { metric: 'IT Cost Savings', improvement: '40%', icon: <DollarSign className="h-5 w-5" /> },
      { metric: 'Uptime', improvement: '99.99%', icon: <Shield className="h-5 w-5" /> },
      { metric: 'Page Load Speed', improvement: '-70%', icon: <Zap className="h-5 w-5" /> },
      { metric: 'Conversion Rate', improvement: '+35%', icon: <TrendingUp className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'Working with Unite Group was a game-changer. Their cloud migration service was seamless.',
      author: 'Emma Rodriguez',
      role: 'Marketing Director'
    },
    featured: false
  },
  {
    id: 6,
    company: 'EduTech Solutions',
    industry: 'Education',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=EduTech',
    title: 'Transforming Education with Custom LMS',
    challenge: 'Needed a scalable learning platform to support millions of students worldwide.',
    solution: 'Developed custom learning management system on Unite Group\'s platform.',
    results: [
      { metric: 'Student Engagement', improvement: '+180%', icon: <Users className="h-5 w-5" /> },
      { metric: 'Platform Uptime', improvement: '99.9%', icon: <Shield className="h-5 w-5" /> },
      { metric: 'Course Completion', improvement: '+65%', icon: <TrendingUp className="h-5 w-5" /> },
      { metric: 'Support Tickets', improvement: '-80%', icon: <Clock className="h-5 w-5" /> }
    ],
    testimonial: {
      quote: 'The custom learning management system Unite Group developed has transformed our business.',
      author: 'James Anderson',
      role: 'VP of Engineering'
    },
    featured: false
  }
]

export default function CaseStudiesPage() {
  const featuredStudy = caseStudies.find(study => study.featured)
  const otherStudies = caseStudies.filter(study => !study.featured)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl font-bold mb-6">
              Real Results, Real Impact
            </h1>
            <p className="text-xl opacity-90">
              Discover how leading companies transformed their operations and achieved 
              exceptional results with Unite Group&apos;s solutions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Happy Clients</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-green-600 mb-2">300%</div>
              <p className="text-gray-600">Average ROI</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">$10M+</div>
              <p className="text-gray-600">Client Savings</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
              <p className="text-gray-600">Client Satisfaction</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      {featuredStudy && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="mb-4">Featured Success Story</Badge>
              <h2 className="text-3xl font-bold">
                {featuredStudy.title}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 lg:p-12">
                    <div className="flex items-center mb-6">
                      <img 
                        src={featuredStudy.logo} 
                        alt={featuredStudy.company} 
                        className="w-16 h-16 mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-semibold">{featuredStudy.company}</h3>
                        <p className="text-gray-600">{featuredStudy.industry}</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">The Challenge</h4>
                        <p className="text-gray-600">{featuredStudy.challenge}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution</h4>
                        <p className="text-gray-600">{featuredStudy.solution}</p>
                      </div>

                      <blockquote className="border-l-4 border-blue-500 pl-4 italic">
                        <p className="text-gray-700 mb-2">&ldquo;{featuredStudy.testimonial.quote}&rdquo;</p>
                        <footer className="text-sm text-gray-600">
                          — {featuredStudy.testimonial.author}, {featuredStudy.testimonial.role}
                        </footer>
                      </blockquote>

                      <Link href={`/case-studies/${featuredStudy.id}`}>
                        <Button>
                          Read Full Case Study
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 lg:p-12">
                    <h4 className="font-semibold text-gray-900 mb-6">Key Results</h4>
                    <div className="space-y-4">
                      {featuredStudy.results.map((result, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-center bg-white p-4 rounded-lg shadow-sm"
                        >
                          <div className="text-blue-600 mr-4">{result.icon}</div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">{result.metric}</div>
                            <div className="text-xl font-semibold text-gray-900">{result.improvement}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Other Case Studies */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">More Success Stories</h2>
            <p className="text-xl text-gray-600">
              See how we&apos;ve helped businesses across industries achieve their goals
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {otherStudies.map((study, index) => (
              <motion.div
                key={study.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <img 
                        src={study.logo} 
                        alt={study.company} 
                        className="w-12 h-12 mr-3"
                      />
                      <div>
                        <CardTitle className="text-lg">{study.company}</CardTitle>
                        <Badge variant="secondary">{study.industry}</Badge>
                      </div>
                    </div>
                    <CardDescription className="text-base font-medium text-gray-900">
                      {study.title}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">{study.challenge}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {study.results.slice(0, 4).map((result, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{result.improvement}</div>
                          <div className="text-xs text-gray-600">{result.metric}</div>
                        </div>
                      ))}
                    </div>

                    <Link href={`/case-studies/${study.id}`}>
                      <Button variant="outline" className="w-full">
                        View Case Study
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Rocket className="h-16 w-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Write Your Success Story?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of companies that have transformed their business with Unite Group.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Our Solutions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
