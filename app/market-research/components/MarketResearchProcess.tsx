'use client';

import { motion } from 'framer-motion';
import { Target, Search, Users, BarChart3, Lightbulb, FileText } from 'lucide-react';

const processSteps = [
  {
    icon: Target,
    step: '01',
    title: 'Research Planning & Objectives',
    description: 'Define research objectives, methodology, and success metrics aligned with business goals',
    details: [
      'Objective definition & scoping',
      'Research question formulation',
      'Methodology selection',
      'Timeline & budget planning'
    ],
    duration: '1 week'
  },
  {
    icon: Search,
    step: '02',
    title: 'Data Collection Design',
    description: 'Design comprehensive data collection strategies using multiple research methodologies',
    details: [
      'Survey instrument design',
      'Sample size calculation',
      'Participant recruitment strategy',
      'Data collection protocols'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: Users,
    step: '03',
    title: 'Primary Research Execution',
    description: 'Execute primary research including surveys, interviews, and focus groups',
    details: [
      'Survey deployment & monitoring',
      'Qualitative interviews',
      'Focus group facilitation',
      'Data quality assurance'
    ],
    duration: '3-6 weeks'
  },
  {
    icon: BarChart3,
    step: '04',
    title: 'Data Analysis & Processing',
    description: 'Advanced statistical analysis and data processing to extract meaningful insights',
    details: [
      'Statistical analysis',
      'Pattern recognition',
      'Trend identification',
      'Cross-tabulation analysis'
    ],
    duration: '2-3 weeks'
  },
  {
    icon: Lightbulb,
    step: '05',
    title: 'Insight Generation',
    description: 'Transform raw data into actionable insights and strategic recommendations',
    details: [
      'Key finding identification',
      'Insight synthesis',
      'Opportunity mapping',
      'Risk assessment'
    ],
    duration: '1-2 weeks'
  },
  {
    icon: FileText,
    step: '06',
    title: 'Reporting & Presentation',
    description: 'Comprehensive reporting with actionable recommendations and strategic implications',
    details: [
      'Executive summary creation',
      'Detailed report compilation',
      'Visual data presentation',
      'Strategic recommendations'
    ],
    duration: '1 week'
  }
];

export default function MarketResearchProcess() {
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
            Our Research <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Process</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            A systematic approach to market research that ensures reliable, actionable insights for strategic decision-making
          </p>
        </motion.div>

        <div className="relative">
          {/* Process Flow Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 h-full hidden lg:block" />
          
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
                      <span className="text-2xl font-bold text-emerald-400">{step.step}</span>
                      <span className="text-sm text-gray-400 bg-slate-800 px-2 py-1 rounded">{step.duration}</span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 mb-6">{step.description}</p>
                    
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-lg opacity-50" />
                  <div className="relative w-20 h-20 bg-slate-900 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 lg:max-w-md hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quality Assurance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl p-8 border border-emerald-500/20"
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">Quality Assurance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Data Validation',
                description: 'Multi-point verification of all collected data'
              },
              {
                title: 'Statistical Rigor',
                description: 'Advanced statistical methods and significance testing'
              },
              {
                title: 'Bias Mitigation',
                description: 'Systematic approaches to minimize research bias'
              },
              {
                title: 'Peer Review',
                description: 'Expert review of methodology and findings'
              }
            ].map((item, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300">
                <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Deliverables & Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Deliverables */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Research Deliverables</h3>
              <div className="space-y-4">
                {[
                  'Executive Summary Report',
                  'Detailed Research Findings',
                  'Data Visualization Dashboard',
                  'Strategic Recommendations',
                  'Raw Data & Methodology',
                  'Presentation Materials'
                ].map((deliverable, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span className="text-gray-300">{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Project Timeline</h3>
              <div className="text-center space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">8-12 Weeks</div>
                  <p className="text-gray-300">Comprehensive Research Project</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-teal-400 mb-2">4-6 Weeks</div>
                  <p className="text-gray-300">Focused Research Study</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">2-3 Weeks</div>
                  <p className="text-gray-300">Quick Insights Project</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}