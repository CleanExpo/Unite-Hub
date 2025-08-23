'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Shield, Users, Zap, DollarSign, BarChart3 } from 'lucide-react';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Increased Brand Awareness',
    description: 'Reach millions of potential customers and build brand recognition across social platforms',
    metric: '300%',
    metricLabel: 'Average reach increase'
  },
  {
    icon: Target,
    title: 'Precise Audience Targeting',
    description: 'Connect with your ideal customers using advanced targeting and AI-driven audience insights',
    metric: '95%',
    metricLabel: 'Targeting accuracy'
  },
  {
    icon: DollarSign,
    title: 'Improved ROI',
    description: 'Maximize your advertising budget with data-driven optimization and performance tracking',
    metric: '8.7x',
    metricLabel: 'Average ROAS'
  },
  {
    icon: Clock,
    title: 'Faster Results',
    description: 'See immediate impact with campaigns that can be launched and optimized in real-time',
    metric: '24h',
    metricLabel: 'Campaign launch time'
  },
  {
    icon: Users,
    title: 'Enhanced Engagement',
    description: 'Create meaningful connections with your audience through compelling, shareable content',
    metric: '450%',
    metricLabel: 'Engagement rate boost'
  },
  {
    icon: BarChart3,
    title: 'Measurable Results',
    description: 'Track every click, conversion, and customer interaction with comprehensive analytics',
    metric: '100%',
    metricLabel: 'Attribution accuracy'
  }
];

const additionalBenefits = [
  {
    title: 'Scale Your Business',
    description: 'Reach new markets and customer segments to drive sustainable business growth',
    icon: Zap
  },
  {
    title: 'Brand Authority',
    description: 'Establish thought leadership and build trust through strategic social presence',
    icon: Shield
  },
  {
    title: 'Customer Insights',
    description: 'Gain valuable insights into customer behavior, preferences, and buying patterns',
    icon: Users
  },
  {
    title: 'Competitive Advantage',
    description: 'Stay ahead of competitors with cutting-edge advertising strategies and tactics',
    icon: Target
  }
];

export default function SocialAdvertisingBenefits() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Advertising?</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform your business with the power of social media advertising and reach your growth objectives faster
          </p>
        </motion.div>

        {/* Main Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                {/* Icon */}
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400 mb-6">{benefit.description}</p>
                
                {/* Metric */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {benefit.metric}
                  </div>
                  <p className="text-sm text-gray-400">{benefit.metricLabel}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-blue-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Additional Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/20">
                  <benefit.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Success Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-12">Success by the Numbers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Successful Campaigns' },
              { number: '$50M+', label: 'Ad Spend Managed' },
              { number: '2.5M+', label: 'Customers Acquired' },
              { number: '95%', label: 'Client Retention Rate' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <p className="text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}