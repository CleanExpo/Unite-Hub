'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, BarChart3, Lightbulb, Shield, Globe, Zap } from 'lucide-react';

const benefits = [
  {
    icon: Target,
    title: 'Informed Decision Making',
    description: 'Make strategic decisions based on solid data and comprehensive market intelligence',
    metric: '90%',
    metricLabel: 'Improvement in decision accuracy'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Growth',
    description: 'Identify new opportunities and optimize strategies to drive sustainable revenue growth',
    metric: '35%',
    metricLabel: 'Average revenue increase'
  },
  {
    icon: Users,
    title: 'Customer Understanding',
    description: 'Gain deep insights into customer needs, preferences, and behaviors',
    metric: '85%',
    metricLabel: 'Better customer targeting'
  },
  {
    icon: BarChart3,
    title: 'Market Positioning',
    description: 'Optimize your market position and competitive advantage through strategic insights',
    metric: '3x',
    metricLabel: 'Competitive advantage improvement'
  },
  {
    icon: Lightbulb,
    title: 'Innovation Guidance',
    description: 'Discover unmet needs and innovation opportunities in your target markets',
    metric: '60%',
    metricLabel: 'Faster product development'
  },
  {
    icon: Shield,
    title: 'Risk Mitigation',
    description: 'Identify potential risks and market threats before they impact your business',
    metric: '70%',
    metricLabel: 'Risk reduction'
  }
];

const additionalBenefits = [
  {
    title: 'Market Entry Strategy',
    description: 'Develop data-driven strategies for entering new markets successfully',
    icon: Globe
  },
  {
    title: 'Product Development',
    description: 'Guide product development with customer insights and market validation',
    icon: Lightbulb
  },
  {
    title: 'Pricing Optimization',
    description: 'Optimize pricing strategies based on market research and competitor analysis',
    icon: TrendingUp
  },
  {
    title: 'Marketing Effectiveness',
    description: 'Improve marketing ROI with targeted messaging and channel optimization',
    icon: Target
  }
];

export default function MarketResearchBenefits() {
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
            Why Market Research <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Matters?</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform your business strategy with data-driven insights that reduce risk, identify opportunities, and drive sustainable growth
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
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                {/* Icon */}
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-6">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{benefit.title}</h3>
                <p className="text-gray-400 mb-6">{benefit.description}</p>
                
                {/* Metric */}
                <div className="border-t border-slate-800 pt-4">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
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
          className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl p-8 border border-emerald-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Strategic Applications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {additionalBenefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 rounded-lg bg-emerald-500/20">
                  <benefit.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Business Impact Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Research Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Market Share Growth',
                description: 'Average market share increase after implementing research insights',
                metric: '+25%',
                icon: TrendingUp
              },
              {
                title: 'Customer Satisfaction',
                description: 'Improvement in customer satisfaction through better understanding',
                metric: '40%',
                icon: Users
              },
              {
                title: 'Product Success Rate',
                description: 'Higher success rate for products developed with research insights',
                metric: '75%',
                icon: Lightbulb
              }
            ].map((impact, index) => (
              <div key={index} className="text-center bg-slate-900/50 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-4">
                  <impact.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  {impact.metric}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{impact.title}</h4>
                <p className="text-gray-400 text-sm">{impact.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ROI & Value Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Research ROI</h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { number: '8:1', label: 'Average ROI Ratio' },
                { number: '6 Months', label: 'Payback Period' },
                { number: '95%', label: 'Implementation Success' },
                { number: '99.5%', label: 'Data Accuracy' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Success Stories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-12">Research by the Numbers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '1M+', label: 'Data Points Analyzed' },
              { number: '50K+', label: 'Survey Responses' },
              { number: '100+', label: 'Industries Researched' },
              { number: '500+', label: 'Successful Projects' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
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