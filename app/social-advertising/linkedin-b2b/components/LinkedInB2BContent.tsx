'use client';

import { motion } from 'framer-motion';
import { Briefcase, Target, TrendingUp, Users, CheckCircle, ArrowRight, Building, MessageSquare, Award } from 'lucide-react';

const linkedInStrategies = [
  {
    title: 'B2B Lead Generation',
    description: 'Generate high-quality leads from decision-makers and executives',
    strategies: [
      'Sponsored Content campaigns targeting job titles',
      'Lead Gen Forms with progressive profiling',
      'Account-Based Marketing (ABM) strategies',
      'Executive targeting with seniority filters',
      'Industry-specific audience segmentation',
      'Company size and revenue targeting'
    ],
    results: [
      'Increase qualified leads by 300%',
      'Reduce cost per lead by 40%',
      'Improve lead quality scores',
      'Generate enterprise-level prospects'
    ]
  },
  {
    title: 'Thought Leadership & Brand Awareness',
    description: 'Position your brand as an industry authority',
    strategies: [
      'Content marketing with industry insights',
      'Executive thought leadership posts',
      'Video testimonials and case studies',
      'Webinar promotion and registration',
      'Industry report amplification',
      'Company page optimization'
    ],
    results: [
      'Increase brand awareness by 250%',
      'Boost employee advocacy engagement',
      'Establish thought leadership position',
      'Build trust with key stakeholders'
    ]
  },
  {
    title: 'Account-Based Marketing (ABM)',
    description: 'Target specific high-value accounts with personalized campaigns',
    strategies: [
      'Matched Audience targeting from CRM data',
      'Company list targeting for key accounts',
      'Personalized messaging for different stakeholders',
      'Multi-touch campaign sequences',
      'Sales and marketing alignment',
      'Account-specific content creation'
    ],
    results: [
      'Increase deal sizes by 180%',
      'Accelerate sales cycles by 35%',
      'Improve account penetration',
      'Higher ROI on marketing spend'
    ]
  }
];

const linkedInAdFormats = [
  {
    format: 'Sponsored Content',
    description: 'Native posts that appear in the LinkedIn feed',
    bestFor: ['Brand awareness', 'Content promotion', 'Engagement'],
    metrics: { engagement: '+120%', reach: 'Broad', conversion: 'Medium' }
  },
  {
    format: 'Message Ads',
    description: 'Direct messages sent to targeted professionals',
    bestFor: ['Personalized outreach', 'Event invites', 'High-value offers'],
    metrics: { engagement: '+80%', reach: 'Targeted', conversion: 'High' }
  },
  {
    format: 'Lead Gen Forms',
    description: 'Forms pre-filled with LinkedIn profile data',
    bestFor: ['Lead capture', 'Newsletter signups', 'Demo requests'],
    metrics: { engagement: '+200%', reach: 'Medium', conversion: 'Very High' }
  },
  {
    format: 'Video Ads',
    description: 'Engaging video content for professional audiences',
    bestFor: ['Product demos', 'Testimonials', 'Company culture'],
    metrics: { engagement: '+150%', reach: 'High', conversion: 'High' }
  }
];

const b2bTargetingOptions = [
  {
    category: 'Professional Targeting',
    options: [
      'Job title and function',
      'Seniority level',
      'Years of experience',
      'Skills and expertise',
      'Professional interests',
      'Groups and associations'
    ]
  },
  {
    category: 'Company Targeting',
    options: [
      'Company name (ABM)',
      'Industry classification',
      'Company size (employees)',
      'Revenue range',
      'Growth rate',
      'Company type (public/private)'
    ]
  },
  {
    category: 'Demographic Targeting',
    options: [
      'Location (city, state, country)',
      'Age and gender',
      'Education level',
      'Field of study',
      'School attended',
      'Language preferences'
    ]
  }
];

const australianB2BInsights = [
  {
    insight: 'B2B Decision Makers',
    data: '2.5M+ Australian professionals in senior roles on LinkedIn',
    actionable: 'Target C-level executives and VPs for maximum impact'
  },
  {
    insight: 'Industry Presence',
    data: 'Financial services and technology are most active sectors',
    actionable: 'Tailor content to these high-engagement industries'
  },
  {
    insight: 'Content Consumption',
    data: 'Business professionals consume content during business hours',
    actionable: 'Schedule campaigns for weekdays 9 AM - 5 PM AEST'
  },
  {
    insight: 'Mobile Usage',
    data: '67% of B2B professionals access LinkedIn via mobile',
    actionable: 'Optimize all content and forms for mobile devices'
  }
];

export default function LinkedInB2BContent() {
  return (
    <div className="space-y-16">
      {/* Overview */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            LinkedIn B2B Advertising Excellence
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Reach decision-makers where they make decisions. Our LinkedIn B2B advertising strategies 
            connect Brisbane businesses with the right professionals, generating quality leads and 
            building lasting business relationships.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Briefcase, label: 'B2B Professionals', value: '900M+ users' },
            { icon: Target, label: 'Lead Quality', value: '3x higher' },
            { icon: TrendingUp, label: 'Conversion Rate', value: '6.1% average' },
            { icon: Building, label: 'Australian Reach', value: '11M+ professionals' }
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-blue-500/20 rounded-lg p-6 text-center"
            >
              <benefit.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-1">{benefit.label}</p>
              <p className="text-xl font-bold text-white">{benefit.value}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LinkedIn B2B Strategies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our LinkedIn B2B Strategies</h2>
        <div className="space-y-8">
          {linkedInStrategies.map((strategy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{strategy.title}</h3>
              <p className="text-gray-300 mb-6">{strategy.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Strategies</h4>
                  <ul className="space-y-2">
                    {strategy.strategies.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Expected Results</h4>
                  <ul className="space-y-2">
                    {strategy.results.map((result, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LinkedIn Ad Formats */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">LinkedIn Ad Formats</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {linkedInAdFormats.map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-bold text-white mb-3">{format.format}</h3>
              <p className="text-gray-300 mb-4">{format.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Best For:</h4>
                <div className="flex flex-wrap gap-2">
                  {format.bestFor.map((use, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                      {use}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm text-gray-400">Engagement</p>
                  <p className="text-lg font-bold text-green-400">{format.metrics.engagement}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Reach</p>
                  <p className="text-lg font-bold text-blue-400">{format.metrics.reach}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Conversion</p>
                  <p className="text-lg font-bold text-purple-400">{format.metrics.conversion}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Targeting Options */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Advanced B2B Targeting</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {b2bTargetingOptions.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">{category.category}</h3>
              <ul className="space-y-2">
                {category.options.map((option, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                    <span className="text-sm">{option}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian B2B Market Insights */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian B2B Market Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {australianB2BInsights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-bold text-white mb-3">{insight.insight}</h3>
              <p className="text-blue-300 mb-3 font-semibold">{insight.data}</p>
              <p className="text-gray-300 text-sm">{insight.actionable}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Campaign Process */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">B2B Campaign Development Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {[
              {
                step: 'Audience Research',
                description: 'Identify and map your ideal customer profiles',
                duration: '2-3 days',
                deliverables: ['Buyer personas', 'Account lists', 'Targeting strategy']
              },
              {
                step: 'Content Strategy',
                description: 'Develop compelling B2B content and messaging',
                duration: '3-5 days',
                deliverables: ['Content calendar', 'Ad copy variations', 'Visual assets']
              },
              {
                step: 'Campaign Setup',
                description: 'Configure targeting, budgets, and tracking',
                duration: '1-2 days',
                deliverables: ['Campaign structure', 'Lead forms', 'Conversion tracking']
              },
              {
                step: 'Launch & Optimize',
                description: 'Monitor performance and scale successful campaigns',
                duration: 'Ongoing',
                deliverables: ['Performance reports', 'A/B testing results', 'Scale recommendations']
              }
            ].map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative flex gap-6 items-start"
              >
                <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{phase.step}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{phase.description}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Deliverables:</h4>
                    <ul className="flex flex-wrap gap-2">
                      {phase.deliverables.map((deliverable, i) => (
                        <li key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Success Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">B2B Performance Metrics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              metric: 'Cost Per Lead (CPL)',
              description: 'Average cost to generate a qualified lead',
              benchmark: '$30 - $100',
              icon: Target
            },
            {
              metric: 'Lead Quality Score',
              description: 'Percentage of leads that become opportunities',
              benchmark: '15% - 25%',
              icon: Award
            },
            {
              metric: 'Click-Through Rate',
              description: 'Percentage of professionals who engage',
              benchmark: '0.4% - 0.8%',
              icon: MessageSquare
            },
            {
              metric: 'Conversion Rate',
              description: 'Visitors who complete desired actions',
              benchmark: '2% - 6%',
              icon: TrendingUp
            },
            {
              metric: 'Cost Per Acquisition',
              description: 'Total cost to acquire a customer',
              benchmark: 'Varies by LTV',
              icon: Briefcase
            },
            {
              metric: 'Sales Velocity',
              description: 'Time from lead to closed deal',
              benchmark: '3-6 months B2B',
              icon: Users
            }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <metric.icon className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{metric.metric}</h3>
              <p className="text-gray-300 text-sm mb-3">{metric.description}</p>
              <div className="text-sm">
                <span className="text-gray-400">Benchmark: </span>
                <span className="text-green-400 font-semibold">{metric.benchmark}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}