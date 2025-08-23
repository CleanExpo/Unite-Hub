'use client';

import { motion } from 'framer-motion';
import { BarChart3, Target, TrendingUp, Users, CheckCircle, ArrowRight, Zap, Eye, Award, Search } from 'lucide-react';

const benchmarkingAreas = [
  {
    title: 'Digital Marketing Performance',
    description: 'Compare your digital marketing metrics against industry leaders',
    metrics: [
      'Website traffic and engagement',
      'Conversion rates and funnel performance',
      'SEO rankings and organic visibility',
      'Social media engagement and reach',
      'Email marketing performance',
      'Paid advertising efficiency'
    ],
    benefits: [
      'Identify performance gaps',
      'Set realistic improvement targets',
      'Discover best practices',
      'Optimize marketing spend'
    ]
  },
  {
    title: 'Content Strategy Analysis',
    description: 'Analyze competitor content strategies and performance',
    metrics: [
      'Content publishing frequency',
      'Content format preferences',
      'Topic coverage and themes',
      'Engagement rates by content type',
      'Content distribution channels',
      'User-generated content volume'
    ],
    benefits: [
      'Identify content gaps',
      'Optimize content calendar',
      'Improve engagement rates',
      'Find trending topics'
    ]
  },
  {
    title: 'Customer Experience Benchmarks',
    description: 'Measure customer experience against industry standards',
    metrics: [
      'Website user experience scores',
      'Customer satisfaction ratings',
      'Support response times',
      'Mobile experience quality',
      'Checkout process efficiency',
      'Return and refund policies'
    ],
    benefits: [
      'Enhance customer journey',
      'Reduce friction points',
      'Improve retention rates',
      'Increase customer lifetime value'
    ]
  }
];

const benchmarkingProcess = [
  {
    step: 'Competitor Identification',
    description: 'Identify direct and indirect competitors in your market',
    duration: '2-3 days',
    activities: [
      'Market landscape analysis',
      'Competitor categorization',
      'Target audience overlap assessment',
      'Market share analysis'
    ]
  },
  {
    step: 'Data Collection',
    description: 'Gather comprehensive performance data across channels',
    duration: '5-7 days',
    activities: [
      'Website analytics collection',
      'Social media metrics gathering',
      'SEO performance analysis',
      'Advertising spend estimation'
    ]
  },
  {
    step: 'Analysis & Insights',
    description: 'Analyze data to identify trends and opportunities',
    duration: '3-5 days',
    activities: [
      'Performance gap analysis',
      'Best practice identification',
      'Opportunity mapping',
      'Strategic recommendations'
    ]
  },
  {
    step: 'Action Planning',
    description: 'Develop actionable improvement strategies',
    duration: '2-3 days',
    activities: [
      'Priority setting',
      'Resource allocation',
      'Timeline development',
      'Success metrics definition'
    ]
  }
];

const keyMetrics = [
  {
    category: 'Website Performance',
    metrics: [
      { name: 'Organic Traffic', benchmark: 'Top 25% industry average', unit: 'monthly visitors' },
      { name: 'Bounce Rate', benchmark: '< 40% for most industries', unit: 'percentage' },
      { name: 'Page Load Speed', benchmark: '< 3 seconds', unit: 'seconds' },
      { name: 'Conversion Rate', benchmark: '2-5% depending on industry', unit: 'percentage' }
    ]
  },
  {
    category: 'Social Media',
    metrics: [
      { name: 'Engagement Rate', benchmark: '1-3% on Facebook, 6% on Instagram', unit: 'percentage' },
      { name: 'Follower Growth', benchmark: '5-10% monthly growth', unit: 'percentage' },
      { name: 'Share of Voice', benchmark: 'Top 10 in your category', unit: 'ranking' },
      { name: 'Response Time', benchmark: '< 1 hour during business hours', unit: 'time' }
    ]
  },
  {
    category: 'SEO Performance',
    metrics: [
      { name: 'Keyword Rankings', benchmark: 'Top 10 for primary keywords', unit: 'position' },
      { name: 'Domain Authority', benchmark: 'Above industry median', unit: 'score' },
      { name: 'Backlink Quality', benchmark: 'High DR linking domains', unit: 'quality score' },
      { name: 'Click-Through Rate', benchmark: '2-5% for organic results', unit: 'percentage' }
    ]
  }
];

const australianMarketBenchmarks = [
  {
    industry: 'E-commerce',
    metrics: {
      conversionRate: '2.8%',
      avgOrderValue: '$89',
      bounceRate: '42%',
      emailOpenRate: '22.1%'
    }
  },
  {
    industry: 'Professional Services',
    metrics: {
      conversionRate: '4.2%',
      avgOrderValue: '$1,850',
      bounceRate: '38%',
      emailOpenRate: '24.8%'
    }
  },
  {
    industry: 'Healthcare',
    metrics: {
      conversionRate: '3.1%',
      avgOrderValue: '$275',
      bounceRate: '45%',
      emailOpenRate: '26.2%'
    }
  },
  {
    industry: 'Real Estate',
    metrics: {
      conversionRate: '1.9%',
      avgOrderValue: 'N/A',
      bounceRate: '48%',
      emailOpenRate: '21.7%'
    }
  }
];

export default function BenchmarkingContent() {
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
            Competitive Benchmarking Excellence
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Gain a competitive edge with comprehensive benchmarking analysis. Compare your performance 
            against industry leaders, identify improvement opportunities, and develop data-driven strategies 
            to outperform your competition in the Brisbane market.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: BarChart3, label: 'Performance Insights', value: '50+ metrics' },
            { icon: Target, label: 'Accuracy Rate', value: '95%+' },
            { icon: TrendingUp, label: 'Improvement Ideas', value: '20+ strategies' },
            { icon: Users, label: 'Competitor Coverage', value: '10-15 brands' }
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

      {/* Benchmarking Areas */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">What We Benchmark</h2>
        <div className="space-y-8">
          {benchmarkingAreas.map((area, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{area.title}</h3>
              <p className="text-gray-300 mb-6">{area.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Metrics</h4>
                  <ul className="space-y-2">
                    {area.metrics.map((metric, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Business Benefits</h4>
                  <ul className="space-y-2">
                    {area.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benchmarking Process */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Benchmarking Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {benchmarkingProcess.map((phase, index) => (
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
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Activities:</h4>
                    <ul className="flex flex-wrap gap-2">
                      {phase.activities.map((activity, i) => (
                        <li key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {activity}
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

      {/* Key Performance Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Industry Benchmark Metrics</h2>
        <div className="space-y-8">
          {keyMetrics.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{category.category}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {category.metrics.map((metric, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-2">{metric.name}</h4>
                    <p className="text-blue-300 font-semibold mb-1">{metric.benchmark}</p>
                    <p className="text-sm text-gray-400">Unit: {metric.unit}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Market Benchmarks */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Industry Benchmarks</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Industry</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Conversion Rate</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Avg Order Value</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Bounce Rate</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Email Open Rate</th>
                </tr>
              </thead>
              <tbody>
                {australianMarketBenchmarks.map((industry, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="border-t border-slate-700"
                  >
                    <td className="px-6 py-4 text-white font-medium">{industry.industry}</td>
                    <td className="px-6 py-4 text-center text-green-400 font-semibold">{industry.metrics.conversionRate}</td>
                    <td className="px-6 py-4 text-center text-blue-400 font-semibold">{industry.metrics.avgOrderValue}</td>
                    <td className="px-6 py-4 text-center text-yellow-400 font-semibold">{industry.metrics.bounceRate}</td>
                    <td className="px-6 py-4 text-center text-purple-400 font-semibold">{industry.metrics.emailOpenRate}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Competitive Intelligence Tools */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Intelligence Tools</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              tool: 'SEMrush & Ahrefs',
              description: 'Advanced SEO and competitive analysis',
              features: ['Keyword gap analysis', 'Backlink profiling', 'Traffic estimation', 'Ad intelligence'],
              icon: Search
            },
            {
              tool: 'SimilarWeb',
              description: 'Website traffic and audience insights',
              features: ['Traffic sources', 'Audience overlap', 'Engagement metrics', 'Industry benchmarks'],
              icon: BarChart3
            },
            {
              tool: 'Social Analytics',
              description: 'Social media competitive intelligence',
              features: ['Content performance', 'Engagement rates', 'Posting frequency', 'Audience growth'],
              icon: Users
            }
          ].map((tool, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <tool.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">{tool.tool}</h3>
              <p className="text-gray-300 mb-4">{tool.description}</p>
              <ul className="space-y-2">
                {tool.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}