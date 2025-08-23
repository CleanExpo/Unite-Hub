'use client';

import { motion } from 'framer-motion';
import { Search, Target, BarChart3, Shield, Eye, FileText } from 'lucide-react';

const processSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Market Landscape Mapping',
    description: 'Comprehensive identification and categorization of all competitive players in your market',
    details: [
      'Direct competitor identification',
      'Indirect competitor mapping',
      'Emerging threat assessment',
      'Market ecosystem analysis'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: Target,
    step: '02',
    title: 'Data Collection & Intelligence',
    description: 'Systematic gathering of competitive intelligence from multiple sources and channels',
    details: [
      'Public data aggregation',
      'Digital footprint analysis',
      'Financial performance review',
      'Customer feedback analysis'
    ],
    duration: '2-3 weeks'
  },
  {
    icon: BarChart3,
    step: '03',
    title: 'Performance Benchmarking',
    description: 'Detailed analysis and comparison of competitor performance across key metrics',
    details: [
      'Revenue & growth analysis',
      'Market share assessment',
      'Operational efficiency review',
      'Customer satisfaction metrics'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: Eye,
    step: '04',
    title: 'Strategic Analysis',
    description: 'Deep dive into competitor strategies, positioning, and tactical approaches',
    details: [
      'Strategy framework analysis',
      'Value proposition review',
      'Positioning assessment',
      'Go-to-market evaluation'
    ],
    duration: '2 weeks'
  },
  {
    icon: Shield,
    step: '05',
    title: 'SWOT & Gap Analysis',
    description: 'Comprehensive strengths, weaknesses, opportunities, and threats assessment',
    details: [
      'Competitive SWOT analysis',
      'Performance gap identification',
      'Opportunity mapping',
      'Threat level assessment'
    ],
    duration: '1 week'
  },
  {
    icon: FileText,
    step: '06',
    title: 'Insights & Recommendations',
    description: 'Strategic recommendations and actionable insights based on comprehensive analysis',
    details: [
      'Strategic recommendations',
      'Action plan development',
      'Competitive positioning strategy',
      'Ongoing monitoring framework'
    ],
    duration: '1 week'
  }
];

export default function CompetitiveAnalysisProcess() {
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
            Our Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Process</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A systematic approach to competitive intelligence that uncovers strategic opportunities and market advantages
          </p>
        </motion.div>

        <div className="relative">
          {/* Process Flow Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-orange-500 to-red-500 h-full hidden lg:block" />
          
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
                      <span className="text-2xl font-bold text-orange-400">{step.step}</span>
                      <span className="text-sm text-gray-400 bg-slate-800 px-2 py-1 rounded">{step.duration}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 mb-6">{step.description}</p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-lg opacity-50" />
                  <div className="relative w-20 h-20 bg-slate-900 border-2 border-orange-500 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-orange-400" />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 lg:max-w-md hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Deliverables Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-2xl p-8 border border-orange-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">What You'll Receive</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Comprehensive Report',
                description: 'Detailed analysis covering all aspects of competitive landscape'
              },
              {
                title: 'Executive Summary',
                description: 'High-level insights and key findings for leadership team'
              },
              {
                title: 'Competitor Profiles',
                description: 'In-depth profiles of key competitors with strategic insights'
              },
              {
                title: 'SWOT Analysis',
                description: 'Strengths, weaknesses, opportunities, and threats matrix'
              },
              {
                title: 'Strategic Recommendations',
                description: 'Actionable strategies based on competitive intelligence'
              },
              {
                title: 'Monitoring Dashboard',
                description: 'Ongoing competitive intelligence tracking system'
              }
            ].map((deliverable, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300">
                <h4 className="text-lg font-semibold text-white mb-2">{deliverable.title}</h4>
                <p className="text-gray-400 text-sm">{deliverable.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Timeline Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">Project Timeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">6-8 Weeks</div>
              <p className="text-gray-300">Complete Analysis</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">2 Weeks</div>
              <p className="text-gray-300">Initial Findings</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">Ongoing</div>
              <p className="text-gray-300">Monitoring & Updates</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}