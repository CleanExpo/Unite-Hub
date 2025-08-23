'use client';

import { motion } from 'framer-motion';
import { BarChart3, Users, Globe, TrendingUp, Target, Eye, Search, Sparkles } from 'lucide-react';

const services = [
  {
    icon: BarChart3,
    title: 'Market Size & Opportunity Analysis',
    description: 'Comprehensive market sizing, growth forecasting, and opportunity assessment for strategic planning',
    features: ['Total Addressable Market (TAM)', 'Market growth projections', 'Opportunity segmentation', 'Revenue potential analysis'],
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Users,
    title: 'Consumer Behavior Research',
    description: 'Deep insights into consumer preferences, behaviors, and decision-making processes',
    features: ['Consumer journey mapping', 'Purchase behavior analysis', 'Brand perception studies', 'Usage & attitude research'],
    color: 'from-teal-500 to-cyan-500'
  },
  {
    icon: Target,
    title: 'Customer Segmentation & Profiling',
    description: 'Advanced segmentation analysis to identify and profile your most valuable customer segments',
    features: ['Demographic segmentation', 'Psychographic profiling', 'Behavioral clustering', 'Persona development'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: Globe,
    title: 'Market Entry & Expansion Research',
    description: 'Strategic research for entering new markets or expanding into new geographic regions',
    features: ['Market feasibility studies', 'Regulatory landscape analysis', 'Cultural adaptation insights', 'Entry strategy recommendations'],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    icon: TrendingUp,
    title: 'Industry Trends & Forecasting',
    description: 'Comprehensive trend analysis and future market predictions to guide long-term strategy',
    features: ['Industry trend monitoring', 'Technology impact assessment', 'Market disruption analysis', 'Future scenario modeling'],
    color: 'from-purple-500 to-violet-500'
  },
  {
    icon: Eye,
    title: 'Brand & Product Research',
    description: 'In-depth research on brand positioning, product development, and market fit validation',
    features: ['Brand health tracking', 'Product concept testing', 'Price sensitivity analysis', 'Feature prioritization'],
    color: 'from-green-500 to-emerald-500'
  }
];

export default function MarketResearchServices() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Research & Intelligence Services</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Market Research <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Services</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive research solutions that provide deep market insights and strategic intelligence for informed decision-making
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                  '--tw-gradient-from': service.color.split(' ')[1],
                  '--tw-gradient-to': service.color.split(' ')[3],
                } as any}
              />
              
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-emerald-500/50 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${service.color} mb-6`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Search className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Research Methodologies Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Research Methodologies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Quantitative Surveys', description: 'Large-scale statistical research' },
              { name: 'Qualitative Interviews', description: 'In-depth exploratory research' },
              { name: 'Focus Groups', description: 'Group dynamic insights' },
              { name: 'Observational Studies', description: 'Behavioral analysis research' },
              { name: 'Data Analytics', description: 'Big data pattern analysis' },
              { name: 'Experimental Design', description: 'Controlled testing methods' },
              { name: 'Ethnographic Research', description: 'Cultural immersion studies' },
              { name: 'Secondary Research', description: 'Existing data synthesis' }
            ].map((method, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-all duration-300">
                <h4 className="text-white font-semibold mb-2">{method.name}</h4>
                <p className="text-xs text-gray-400">{method.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Industries & Sectors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-2xl p-8 border border-emerald-500/20"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Industries We Research</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Technology & Software',
              'Healthcare & Pharma',
              'Financial Services',
              'Retail & E-commerce',
              'Manufacturing',
              'Education & Training',
              'Real Estate',
              'Hospitality & Tourism',
              'Automotive',
              'Energy & Utilities',
              'Food & Beverage',
              'Media & Entertainment'
            ].map((industry, index) => (
              <div key={index} className="text-center p-3 bg-slate-900/50 rounded-lg">
                <span className="text-gray-300 text-sm">{industry}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-12">Our Research Capabilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50K+', label: 'Survey Responses' },
              { number: '100+', label: 'Countries Covered' },
              { number: '25+', label: 'Languages Supported' },
              { number: '99.5%', label: 'Data Accuracy Rate' }
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