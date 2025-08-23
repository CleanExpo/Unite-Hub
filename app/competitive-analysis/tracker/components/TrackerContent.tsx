'use client';

import { motion } from 'framer-motion';
import { Activity, TrendingUp, Eye, AlertCircle, CheckCircle, ArrowRight, BarChart3, Zap, Target, Search, Calendar, Bell } from 'lucide-react';

const trackingCategories = [
  {
    title: 'Digital Marketing Performance',
    description: 'Monitor competitor digital marketing activities in real-time',
    metrics: [
      'Website traffic trends and patterns',
      'Search engine ranking changes',
      'Social media engagement metrics',
      'Content publishing frequency',
      'Advertising campaign activity',
      'Email marketing campaigns'
    ],
    alerts: [
      'Ranking position changes',
      'New advertising campaigns',
      'Content strategy shifts',
      'Website redesigns or updates'
    ]
  },
  {
    title: 'Content & SEO Monitoring',
    description: 'Track competitor content strategies and SEO performance',
    metrics: [
      'New content publication alerts',
      'Keyword ranking movements',
      'Backlink acquisition tracking',
      'Technical SEO changes',
      'Featured snippet opportunities',
      'Local SEO performance'
    ],
    alerts: [
      'New high-performing content',
      'Keyword ranking drops/gains',
      'New backlink opportunities',
      'Technical issues detected'
    ]
  },
  {
    title: 'Product & Pricing Intelligence',
    description: 'Stay informed about competitor product and pricing changes',
    metrics: [
      'Product launches and updates',
      'Pricing strategy changes',
      'Promotional campaigns',
      'Service offering modifications',
      'Feature announcements',
      'Market positioning shifts'
    ],
    alerts: [
      'Price adjustments',
      'New product releases',
      'Promotional activities',
      'Service changes'
    ]
  }
];

const trackingTools = [
  {
    category: 'Website Monitoring',
    tools: [
      { name: 'Visualping', purpose: 'Visual website change detection' },
      { name: 'Klipfolio', purpose: 'Competitive dashboard creation' },
      { name: 'SimilarWeb', purpose: 'Traffic and engagement tracking' },
      { name: 'BuiltWith', purpose: 'Technology stack monitoring' }
    ]
  },
  {
    category: 'SEO & Content',
    tools: [
      { name: 'SEMrush Position Tracking', purpose: 'Keyword ranking monitoring' },
      { name: 'Ahrefs Alerts', purpose: 'Backlink and mention tracking' },
      { name: 'Google Alerts', purpose: 'Brand and keyword mentions' },
      { name: 'BuzzSumo', purpose: 'Content performance tracking' }
    ]
  },
  {
    category: 'Social Media',
    tools: [
      { name: 'Brand24', purpose: 'Social media monitoring' },
      { name: 'Hootsuite Insights', purpose: 'Social performance tracking' },
      { name: 'Sprout Social', purpose: 'Competitor social analysis' },
      { name: 'Mention', purpose: 'Real-time social listening' }
    ]
  },
  {
    category: 'Advertising Intelligence',
    tools: [
      { name: 'Facebook Ad Library', purpose: 'Social ad monitoring' },
      { name: 'SEMrush Advertising Research', purpose: 'PPC campaign tracking' },
      { name: 'Moat Pro', purpose: 'Display advertising intelligence' },
      { name: 'AdBeat', purpose: 'Comprehensive ad tracking' }
    ]
  }
];

const trackingWorkflow = [
  {
    phase: 'Setup & Configuration',
    description: 'Establish comprehensive monitoring infrastructure',
    duration: '3-5 days',
    activities: [
      'Competitor identification and prioritization',
      'Tracking tool selection and setup',
      'Custom dashboard creation',
      'Alert system configuration',
      'Baseline data collection',
      'Team access and training'
    ]
  },
  {
    phase: 'Data Collection',
    description: 'Automated monitoring and data gathering',
    duration: 'Ongoing',
    activities: [
      'Real-time website monitoring',
      'Daily ranking position checks',
      'Social media activity tracking',
      'Content publication alerts',
      'Advertising campaign detection',
      'Technology change monitoring'
    ]
  },
  {
    phase: 'Analysis & Insights',
    description: 'Transform raw data into actionable intelligence',
    duration: 'Weekly',
    activities: [
      'Trend identification and analysis',
      'Opportunity gap assessment',
      'Threat level evaluation',
      'Strategic implication review',
      'Performance benchmark updates',
      'Competitive landscape mapping'
    ]
  },
  {
    phase: 'Reporting & Action',
    description: 'Deliver insights and strategic recommendations',
    duration: 'Bi-weekly/Monthly',
    activities: [
      'Executive dashboard updates',
      'Strategic alert notifications',
      'Detailed analysis reports',
      'Action plan development',
      'Team briefings and updates',
      'Strategy adjustment recommendations'
    ]
  }
];

const alertTypes = [
  {
    type: 'Critical Alerts',
    triggers: [
      'Major ranking position losses',
      'New direct competitor entry',
      'Significant traffic changes',
      'Product launch announcements',
      'Price war initiation',
      'Major partnership announcements'
    ],
    response: 'Immediate action required within 24 hours',
    color: 'red'
  },
  {
    type: 'Opportunity Alerts',
    triggers: [
      'Competitor ranking drops',
      'Content gap identification',
      'New keyword opportunities',
      'Backlink acquisition chances',
      'Market positioning gaps',
      'Technology adoption delays'
    ],
    response: 'Strategic planning within 3-5 days',
    color: 'green'
  },
  {
    type: 'Trend Alerts',
    triggers: [
      'Industry trend emergence',
      'Content strategy changes',
      'Technology adoption patterns',
      'Marketing channel shifts',
      'Customer behavior changes',
      'Seasonal pattern variations'
    ],
    response: 'Analysis and planning within 1-2 weeks',
    color: 'blue'
  }
];

const australianCompetitorExamples = [
  {
    industry: 'Professional Services',
    competitors: [
      'Deloitte Australia',
      'PwC Australia',
      'EY Australia',
      'KPMG Australia'
    ],
    keyMetrics: [
      'Thought leadership content',
      'Industry report releases',
      'Expert commentary frequency',
      'LinkedIn engagement rates'
    ]
  },
  {
    industry: 'E-commerce',
    competitors: [
      'Kogan.com',
      'Temple & Webster',
      'Catch.com.au',
      'Booktopia'
    ],
    keyMetrics: [
      'Product catalog updates',
      'Pricing strategy changes',
      'Promotional campaign frequency',
      'Customer review management'
    ]
  },
  {
    industry: 'Technology',
    competitors: [
      'Atlassian',
      'Canva',
      'Afterpay',
      'WiseTech Global'
    ],
    keyMetrics: [
      'Product feature releases',
      'Developer community engagement',
      'Partnership announcements',
      'Market expansion activities'
    ]
  }
];

export default function TrackerContent() {
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
            Competitive Intelligence Tracking System
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Stay ahead of the competition with our comprehensive tracking system that monitors 
            competitor activities 24/7. Get real-time alerts, identify opportunities, and make 
            informed strategic decisions based on competitive intelligence in the Australian market.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Activity, label: 'Real-time Monitoring', value: '24/7' },
            { icon: Eye, label: 'Competitors Tracked', value: '10-20' },
            { icon: Bell, label: 'Daily Alerts', value: '5-15' },
            { icon: Target, label: 'Accuracy Rate', value: '98%+' }
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

      {/* What We Track */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">What We Track</h2>
        <div className="space-y-8">
          {trackingCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{category.title}</h3>
              <p className="text-gray-300 mb-6">{category.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Tracking Metrics</h4>
                  <ul className="space-y-2">
                    {category.metrics.map((metric, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Alert Triggers</h4>
                  <ul className="space-y-2">
                    {category.alerts.map((alert, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tracking Workflow */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Tracking Process</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {trackingWorkflow.map((phase, index) => (
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
                    <h3 className="text-xl font-bold text-white">{phase.phase}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {phase.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4">{phase.description}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Activities:</h4>
                    <div className="grid md:grid-cols-2 gap-2">
                      {phase.activities.map((activity, i) => (
                        <div key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alert System */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Intelligent Alert System</h2>
        <div className="space-y-6">
          {alertTypes.map((alert, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-4 h-4 rounded-full bg-${alert.color}-500`} />
                <h3 className="text-2xl font-bold text-white">{alert.type}</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Alert Triggers</h4>
                  <ul className="space-y-2">
                    {alert.triggers.map((trigger, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Response Timeline</h4>
                  <div className={`bg-${alert.color}-500/10 border border-${alert.color}-500/20 rounded-lg p-4`}>
                    <p className={`text-${alert.color}-400 font-semibold`}>{alert.response}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tracking Tools */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Our Tracking Technology Stack</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {trackingTools.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">{category.category}</h3>
              <div className="space-y-4">
                {category.tools.map((tool, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">{tool.name}</h4>
                    <p className="text-sm text-gray-400">{tool.purpose}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Market Examples */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Market Tracking Examples</h2>
        <div className="space-y-6">
          {australianCompetitorExamples.map((example, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{example.industry}</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Competitors</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {example.competitors.map((competitor, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-3 text-center">
                        <span className="text-sm text-gray-300">{competitor}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Tracking Focus</h4>
                  <ul className="space-y-2">
                    {example.keyMetrics.map((metric, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-300">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm">{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Custom Dashboard Features */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Custom Tracking Dashboard</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Real-time Widgets</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Live ranking position tracker</li>
                <li>• Traffic trend comparisons</li>
                <li>• Social media activity feed</li>
                <li>• Content publication alerts</li>
                <li>• Advertising campaign monitor</li>
                <li>• Technology change detector</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Analytics & Reports</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Weekly performance summaries</li>
                <li>• Monthly competitive reports</li>
                <li>• Quarterly strategy updates</li>
                <li>• Custom metric tracking</li>
                <li>• Trend analysis insights</li>
                <li>• Opportunity identification</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Alert Management</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Customizable alert thresholds</li>
                <li>• Multi-channel notifications</li>
                <li>• Priority-based routing</li>
                <li>• Team collaboration tools</li>
                <li>• Action item tracking</li>
                <li>• Response automation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}