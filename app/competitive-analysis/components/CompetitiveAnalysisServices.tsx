'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, BarChart3, Target, Shield, Zap, Eye, TrendingUp, Sparkles, Brain, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: Brain,
    title: 'AI-Powered SEO Synthesizer',
    description: 'Advanced AI analysis using machine learning for deep competitor content insights and strategy generation',
    features: ['Semantic content clustering', 'Topic modeling & knowledge graphs', 'Automated content briefs', 'AI-driven opportunity identification'],
    color: 'from-blue-500 to-purple-500',
    isNew: true,
    href: '/seo-synthesizer'
  },
  {
    icon: Search,
    title: 'Competitor Identification & Mapping',
    description: 'Comprehensive identification of direct, indirect, and emerging competitors in your market space',
    features: ['Direct competitor analysis', 'Indirect competitor mapping', 'Emerging threat identification', 'Market position assessment'],
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: BarChart3,
    title: 'Performance Benchmarking',
    description: 'Detailed analysis of competitor performance metrics, market share, and growth trajectories',
    features: ['Revenue analysis', 'Market share tracking', 'Growth rate comparison', 'Performance gap analysis'],
    color: 'from-red-500 to-pink-500'
  },
  {
    icon: Target,
    title: 'Strategy & Positioning Analysis',
    description: 'Deep dive into competitor strategies, positioning, and value propositions',
    features: ['Strategic positioning assessment', 'Value proposition analysis', 'Go-to-market strategies', 'Differentiation opportunities'],
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: Eye,
    title: 'Digital Presence Audit',
    description: 'Comprehensive analysis of competitor digital marketing, SEO, and online presence',
    features: ['Website traffic analysis', 'SEO performance review', 'Social media presence', 'Content strategy analysis'],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    icon: Shield,
    title: 'SWOT Analysis & Threat Assessment',
    description: 'Detailed strengths, weaknesses, opportunities, and threats analysis for strategic planning',
    features: ['Comprehensive SWOT analysis', 'Threat level assessment', 'Competitive advantages', 'Vulnerability identification'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: TrendingUp,
    title: 'Market Intelligence & Reporting',
    description: 'Ongoing monitoring and intelligence gathering with actionable insights and recommendations',
    features: ['Monthly intelligence reports', 'Trend analysis', 'Strategic recommendations', 'Opportunity identification'],
    color: 'from-teal-500 to-cyan-500'
  }
];

export default function CompetitiveAnalysisServices() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">Intelligence & Analysis Services</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Competitive Analysis <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Services</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Strategic intelligence services that give you the competitive edge needed to dominate your market
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const CardContent = (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': service.color.split(' ')[1],
                    '--tw-gradient-to': service.color.split(' ')[3],
                  } as any}
                />
                
                <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-orange-500/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${service.color}`}>
                      <service.icon className="w-6 h-6 text-white" />
                    </div>
                    {service.isNew && (
                      <span className="px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                  <p className="text-gray-400 mb-6">{service.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {service.href && (
                    <div className="flex items-center text-blue-400 hover:text-blue-300 transition-colors group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium">Try it now</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  )}
                </div>
              </div>
            );

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                {service.href ? (
                  <Link href={service.href as any} className="block h-full">
                    {CardContent}
                  </Link>
                ) : (
                  CardContent
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Analysis Frameworks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Analysis Frameworks We Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { name: 'SWOT Analysis', description: 'Strengths, Weaknesses, Opportunities, Threats' },
              { name: 'Porter\'s 5 Forces', description: 'Industry structure analysis' },
              { name: 'BCG Matrix', description: 'Portfolio positioning analysis' },
              { name: 'Value Chain Analysis', description: 'Operational advantage identification' },
              { name: 'Blue Ocean Strategy', description: 'Uncontested market space discovery' }
            ].map((framework, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-orange-500/50 transition-all duration-300">
                <h4 className="text-white font-semibold mb-2">{framework.name}</h4>
                <p className="text-xs text-gray-400">{framework.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Industries Covered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-2xl p-8 border border-orange-500/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Industries We Analyze</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Technology & SaaS',
              'E-commerce & Retail',
              'Healthcare & Biotech',
              'Financial Services',
              'Manufacturing',
              'Professional Services',
              'Education & E-learning',
              'Real Estate'
            ].map((industry, index) => (
              <div key={index} className="text-center p-3 bg-slate-900/50 rounded-lg">
                <span className="text-gray-300 text-sm">{industry}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}