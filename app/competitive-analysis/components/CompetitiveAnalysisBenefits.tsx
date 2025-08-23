'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Shield, Eye, Zap, BarChart3, Users, Lightbulb } from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'Strategic Advantage',
    description: 'Gain deep insights into competitor strategies and identify opportunities for competitive differentiation',
    metric: '85%',
    metricLabel: 'Success rate in outperforming competitors'
  },
  {
    icon: Eye,
    title: 'Market Intelligence',
    description: 'Stay ahead with comprehensive market intelligence and early identification of threats and opportunities',
    metric: '360°',
    metricLabel: 'Market visibility coverage'
  },
  {
    icon: TrendingUp,
    title: 'Improved Performance',
    description: 'Benchmark against best-in-class competitors and optimize your performance across key metrics',
    metric: '3x',
    metricLabel: 'Average performance improvement'
  },
  {
    icon: Shield,
    title: 'Risk Mitigation',
    description: 'Identify potential threats early and develop defensive strategies to protect market position',
    metric: '75%',
    metricLabel: 'Reduction in competitive threats'
  },
  {
    icon: Lightbulb,
    title: 'Innovation Insights',
    description: 'Discover innovation gaps and opportunities based on competitor analysis and market trends',
    metric: '45%',
    metricLabel: 'Faster innovation cycles'
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Decisions',
    description: 'Make informed strategic decisions based on comprehensive competitive intelligence and analysis',
    metric: '90%',
    metricLabel: 'Decision accuracy improvement'
  }
];

const additionalBenefits = [
  {
    title: 'Market Positioning',
    description: 'Optimize your market position based on competitive landscape analysis',
    icon: Target
  },
  {
    title: 'Pricing Strategy',
    description: 'Develop competitive pricing strategies based on market intelligence',
    icon: TrendingUp
  },
  {
    title: 'Product Development',
    description: 'Guide product roadmap with insights from competitor product analysis',
    icon: Lightbulb
  },
  {
    title: 'Sales Intelligence',
    description: 'Equip sales teams with competitive intelligence for better conversions',
    icon: Users
  }
];

export default function CompetitiveAnalysisBenefits() {
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
            Why Competitive <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Analysis Matters?</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform your strategic planning with deep competitive intelligence and gain the insights needed to dominate your market
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
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
                {/* Icon */}
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 mb-6">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400 mb-6">{benefit.description}</p>
                
                {/* Metric */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
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
          className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-2xl p-8 border border-orange-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Strategic Applications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-orange-500/20">
                  <benefit.icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Business Impact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Business Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Revenue Growth',
                description: 'Average revenue increase after implementing competitive strategies',
                metric: '35%',
                icon: TrendingUp
              },
              {
                title: 'Market Share',
                description: 'Improvement in market position within 12 months',
                metric: '+15%',
                icon: Target
              },
              {
                title: 'Competitive Wins',
                description: 'Increase in competitive win rate against key rivals',
                metric: '60%',
                icon: Shield
              }
            ].map((impact, index) => (
              <div key={index} className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-orange-500/50 transition-all duration-300">
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 mb-4">
                  <impact.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
                  {impact.metric}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{impact.title}</h4>
                <p className="text-gray-400 text-sm">{impact.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Success Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-12">Analysis by the Numbers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Competitors Analyzed' },
              { number: '50+', label: 'Industries Covered' },
              { number: '1000+', label: 'Strategic Reports Delivered' },
              { number: '98%', label: 'Client Satisfaction Rate' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">
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