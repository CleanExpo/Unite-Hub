'use client';

import { motion } from 'framer-motion';
import { Search, Target, Palette, Rocket, BarChart3, RefreshCw } from 'lucide-react';

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Discovery & Audit',
    description: 'Deep dive into your brand, audience, and competitive landscape to identify opportunities',
    details: [
      'Brand positioning analysis',
      'Audience research & persona development',
      'Competitive intelligence gathering',
      'Current performance audit'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: Target,
    step: '02',
    title: 'Strategy Development',
    description: 'Create a comprehensive social advertising strategy tailored to your objectives',
    details: [
      'Platform selection & prioritization',
      'Campaign objective mapping',
      'Budget allocation strategy',
      'KPI definition & tracking setup'
    ],
    duration: '1 week'
  },
  {
    icon: Palette,
    step: '03',
    title: 'Creative Production',
    description: 'Develop high-converting ad creatives that resonate with your target audience',
    details: [
      'Creative concept development',
      'Video & static asset production',
      'Copy & messaging optimization',
      'A/B testing variants creation'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Campaign Launch',
    description: 'Execute campaigns with precision targeting and optimal budget distribution',
    details: [
      'Audience setup & targeting',
      'Campaign structure optimization',
      'Bid strategy implementation',
      'Conversion tracking setup'
    ],
    duration: '3-5 days'
  },
  {
    icon: BarChart3,
    step: '05',
    title: 'Performance Monitoring',
    description: 'Real-time tracking and analysis of campaign performance across all metrics',
    details: [
      'Daily performance monitoring',
      'Real-time optimization alerts',
      'Audience behavior analysis',
      'Creative performance tracking'
    ],
    duration: 'Ongoing'
  },
  {
    icon: RefreshCw,
    step: '06',
    title: 'Optimization & Scaling',
    description: 'Continuous improvement and scaling of high-performing campaigns',
    details: [
      'Performance-based optimizations',
      'Budget reallocation to winners',
      'New audience testing',
      'Creative refresh cycles'
    ],
    duration: 'Ongoing'
  }
];

export default function SocialAdvertisingProcess() {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Proven <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Process</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A systematic approach to social advertising that delivers consistent results and scalable growth
          </p>
        </motion.div>

        <div className="relative">
          {/* Process Flow Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-500 to-purple-500 h-full hidden lg:block" />
          
          <div className="space-y-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className="flex-1 lg:max-w-md">
                  <div className={`text-center lg:text-${index % 2 === 0 ? 'right' : 'left'}`}>
                    <div className="inline-flex items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-blue-400">{step.step}</span>
                      <span className="text-sm text-gray-400 bg-slate-800 px-2 py-1 rounded">{step.duration}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 mb-6">{step.description}</p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50" />
                  <div className="relative w-20 h-20 bg-slate-900 border-2 border-blue-500 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 lg:max-w-md hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Results Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-8 border border-blue-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-4">What You Can Expect</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">30 Days</div>
              <p className="text-gray-300">Initial results and optimization insights</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">90 Days</div>
              <p className="text-gray-300">Significant performance improvements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">6 Months</div>
              <p className="text-gray-300">Scalable, profitable campaigns</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}