'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Zap, CheckCircle, ArrowRight, Target, BarChart3, Lightbulb, Award, Calendar, Rocket } from 'lucide-react';

const caseStudies = [
  {
    company: 'TechFlow Solutions',
    industry: 'B2B SaaS',
    challenge: 'Low user activation and high churn rate',
    timeframe: '6 months',
    results: {
      userActivation: '+180%',
      churnReduction: '-65%',
      revenue: '+240%',
      customerAcquisition: '+150%'
    },
    strategies: [
      'Onboarding funnel optimization',
      'Product-led growth implementation',
      'Viral referral program launch',
      'User engagement gamification',
      'Retention email sequences',
      'Feature adoption tracking'
    ],
    keyInsights: [
      'Simplified 3-step onboarding increased activation by 180%',
      'Gamified product tours reduced time-to-value by 70%',
      'Referral program generated 35% of new customers',
      'Predictive churn modeling enabled proactive retention'
    ],
    metrics: {
      before: {
        monthlyActiveUsers: '2,500',
        conversionRate: '2.1%',
        customerLifetimeValue: '$890',
        churnRate: '8.5%'
      },
      after: {
        monthlyActiveUsers: '7,200',
        conversionRate: '5.8%',
        customerLifetimeValue: '$2,150',
        churnRate: '3.2%'
      }
    }
  },
  {
    company: 'EcoMart Australia',
    industry: 'E-commerce',
    challenge: 'Low conversion rates and cart abandonment',
    timeframe: '4 months',
    results: {
      conversionRate: '+125%',
      cartAbandonment: '-45%',
      averageOrderValue: '+85%',
      customerRetention: '+90%'
    },
    strategies: [
      'Checkout flow optimization',
      'Personalized product recommendations',
      'Abandoned cart recovery campaigns',
      'Social proof integration',
      'Mobile experience enhancement',
      'Trust signal implementation'
    ],
    keyInsights: [
      'One-click checkout increased conversions by 60%',
      'AI-powered recommendations boosted AOV by 85%',
      'Cart abandonment emails recovered 28% of lost sales',
      'Customer reviews displayed prominently increased trust'
    ],
    metrics: {
      before: {
        conversionRate: '2.3%',
        cartAbandonmentRate: '72%',
        averageOrderValue: '$67',
        returnCustomerRate: '18%'
      },
      after: {
        conversionRate: '5.2%',
        cartAbandonmentRate: '40%',
        averageOrderValue: '$124',
        returnCustomerRate: '34%'
      }
    }
  },
  {
    company: 'HealthFirst Clinic',
    industry: 'Healthcare',
    challenge: 'Low patient acquisition and engagement',
    timeframe: '8 months',
    results: {
      patientAcquisition: '+200%',
      appointmentBookings: '+165%',
      patientRetention: '+130%',
      onlinePresence: '+300%'
    },
    strategies: [
      'Content marketing strategy',
      'SEO and local search optimization',
      'Online booking system integration',
      'Patient education content',
      'Social media engagement',
      'Referral program implementation'
    ],
    keyInsights: [
      'Educational content increased organic traffic by 300%',
      'Online booking reduced phone inquiries by 50%',
      'Patient testimonials improved conversion rates',
      'Local SEO generated 60% of new patients'
    ],
    metrics: {
      before: {
        monthlyNewPatients: '45',
        onlineBookings: '12%',
        organicTraffic: '850 visits',
        patientSatisfaction: '7.2/10'
      },
      after: {
        monthlyNewPatients: '135',
        onlineBookings: '68%',
        organicTraffic: '3,400 visits',
        patientSatisfaction: '9.1/10'
      }
    }
  }
];

const growthFrameworks = [
  {
    framework: 'AARRR (Pirate Metrics)',
    description: 'Customer lifecycle optimization framework',
    stages: [
      { stage: 'Acquisition', focus: 'Attracting users and customers', tactics: ['SEO optimization', 'Paid advertising', 'Content marketing', 'Referral programs'] },
      { stage: 'Activation', focus: 'Delivering initial value experience', tactics: ['Onboarding optimization', 'Product tours', 'Quick wins', 'User education'] },
      { stage: 'Retention', focus: 'Keeping users engaged long-term', tactics: ['Email campaigns', 'Push notifications', 'Feature releases', 'Community building'] },
      { stage: 'Referral', focus: 'Users recommending to others', tactics: ['Referral programs', 'Social sharing', 'Incentive systems', 'Word-of-mouth'] },
      { stage: 'Revenue', focus: 'Monetization optimization', tactics: ['Pricing strategy', 'Upselling', 'Cross-selling', 'Subscription models'] }
    ]
  },
  {
    framework: 'ICE Prioritization',
    description: 'Impact, Confidence, and Ease scoring for growth experiments',
    components: [
      { component: 'Impact', description: 'Potential effect on key metrics', scoring: '1-10 scale based on expected improvement' },
      { component: 'Confidence', description: 'Likelihood of success', scoring: '1-10 scale based on data and evidence' },
      { component: 'Ease', description: 'Resource requirements', scoring: '1-10 scale based on time and complexity' }
    ],
    application: 'Multiply Impact × Confidence × Ease to prioritize experiments with highest scores first'
  },
  {
    framework: 'North Star Framework',
    description: 'Single metric that captures core value delivered to customers',
    elements: [
      { element: 'North Star Metric', description: 'Primary growth indicator', examples: ['Monthly Active Users', 'Revenue per Customer', 'Time to Value'] },
      { element: 'Input Metrics', description: 'Leading indicators that drive the North Star', examples: ['Sign-up Rate', 'Feature Adoption', 'Customer Satisfaction'] },
      { element: 'Guardrail Metrics', description: 'Metrics to ensure healthy growth', examples: ['Churn Rate', 'Customer Support Tickets', 'User Experience Score'] }
    ]
  }
];

const experimentTypes = [
  {
    type: 'A/B Testing',
    description: 'Compare two versions to determine which performs better',
    applications: [
      'Landing page optimization',
      'Email subject line testing',
      'CTA button variations',
      'Pricing strategy testing',
      'Product feature comparisons',
      'User interface improvements'
    ],
    bestPractices: [
      'Test one variable at a time',
      'Ensure statistical significance',
      'Run tests for full business cycles',
      'Consider external factors',
      'Document learnings thoroughly',
      'Implement winners systematically'
    ]
  },
  {
    type: 'Multivariate Testing',
    description: 'Test multiple variables simultaneously to find optimal combinations',
    applications: [
      'Complex page optimization',
      'Email template testing',
      'Product configuration',
      'User flow optimization',
      'Content personalization',
      'Feature interaction analysis'
    ],
    bestPractices: [
      'Requires larger sample sizes',
      'Plan for statistical power',
      'Focus on high-impact elements',
      'Analyze interaction effects',
      'Consider implementation complexity',
      'Validate results with follow-up tests'
    ]
  },
  {
    type: 'Cohort Analysis',
    description: 'Track user behavior over time to identify patterns and trends',
    applications: [
      'User retention analysis',
      'Feature adoption tracking',
      'Customer lifetime value',
      'Churn prediction modeling',
      'Product usage patterns',
      'Marketing campaign effectiveness'
    ],
    bestPractices: [
      'Define cohorts meaningfully',
      'Track relevant time periods',
      'Account for seasonal effects',
      'Segment by user characteristics',
      'Compare cohort performance',
      'Act on identified trends'
    ]
  }
];

const australianGrowthTrends = [
  {
    trend: 'Sustainability-Driven Growth',
    description: 'Australian consumers increasingly value environmentally responsible businesses',
    impact: 'High',
    opportunities: [
      'Green product line development',
      'Carbon-neutral operations',
      'Sustainable packaging solutions',
      'Environmental impact transparency',
      'Community environmental initiatives',
      'B-Corp certification pursuit'
    ],
    examples: [
      'Patagonia Australia\'s environmental activism',
      'KeepCup\'s reusable coffee cup movement',
      'Koala\'s sustainable furniture approach'
    ]
  },
  {
    trend: 'Voice Search Optimization',
    description: 'Growing adoption of voice assistants and smart speakers in Australian homes',
    impact: 'Medium-High',
    opportunities: [
      'Voice search SEO optimization',
      'Conversational content creation',
      'Local voice search targeting',
      'Voice commerce capabilities',
      'Smart speaker skill development',
      'Audio content marketing'
    ],
    examples: [
      'Domino\'s voice ordering integration',
      'Commonwealth Bank\'s voice banking',
      'Woolworths\' voice shopping features'
    ]
  },
  {
    trend: 'Micro-Moment Marketing',
    description: 'Capturing intent-driven moments when customers make quick decisions',
    impact: 'High',
    opportunities: [
      'Mobile-first experience design',
      'Real-time personalization',
      'Location-based targeting',
      'Instant gratification features',
      'Quick decision tools',
      'Just-in-time content delivery'
    ],
    examples: [
      'Uber\'s instant ride booking',
      'Afterpay\'s instant purchase approval',
      'Gumtree\'s quick listing features'
    ]
  }
];

const growthMetrics = [
  {
    category: 'Acquisition Metrics',
    metrics: [
      { metric: 'Customer Acquisition Cost (CAC)', description: 'Total cost to acquire a new customer', benchmark: 'Should be 3:1 ratio to CLV' },
      { metric: 'Conversion Rate', description: 'Percentage of visitors who become customers', benchmark: '2-5% depending on industry' },
      { metric: 'Traffic Sources', description: 'Breakdown of where customers come from', benchmark: 'Diversified across 3-5 channels' },
      { metric: 'Lead Quality Score', description: 'Likelihood of leads to convert', benchmark: 'Above 70% for qualified leads' }
    ]
  },
  {
    category: 'Activation Metrics',
    metrics: [
      { metric: 'Time to Value', description: 'How quickly users experience value', benchmark: 'Under 24 hours for most products' },
      { metric: 'Activation Rate', description: 'Users who complete key actions', benchmark: '40-60% within first week' },
      { metric: 'Feature Adoption', description: 'Usage of core product features', benchmark: '80%+ adoption of key features' },
      { metric: 'User Onboarding Completion', description: 'Percentage completing setup', benchmark: '70%+ completion rate' }
    ]
  },
  {
    category: 'Retention Metrics',
    metrics: [
      { metric: 'Churn Rate', description: 'Percentage of customers who leave', benchmark: 'Under 5% monthly for SaaS' },
      { metric: 'Customer Lifetime Value (CLV)', description: 'Total value per customer', benchmark: '3x higher than CAC' },
      { metric: 'Net Promoter Score (NPS)', description: 'Customer satisfaction and loyalty', benchmark: 'Above 50 is excellent' },
      { metric: 'Engagement Score', description: 'How actively customers use product', benchmark: 'Increasing trend month-over-month' }
    ]
  }
];

export default function CaseStudiesContent() {
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
            Growth Hacking Success Stories
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Explore real-world case studies showcasing data-driven growth strategies that 
            delivered exceptional results for Australian businesses. Learn from proven 
            methodologies, experiment frameworks, and tactical implementations that drove 
            sustainable growth across diverse industries.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: TrendingUp, label: 'Average Growth Rate', value: '+180%' },
            { icon: Users, label: 'Customer Acquisition', value: '+165%' },
            { icon: DollarSign, label: 'Revenue Increase', value: '+240%' },
            { icon: Zap, label: 'Time to Results', value: '3-6 months' }
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

      {/* Case Studies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Detailed Case Studies</h2>
        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{study.company}</h3>
                  <div className="flex gap-4">
                    <span className="text-blue-400 font-semibold">{study.industry}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-400 font-semibold">{study.timeframe}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Challenge</p>
                  <p className="text-white font-semibold">{study.challenge}</p>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {Object.entries(study.results).map(([key, value], i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400 mb-1">{value}</p>
                    <p className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Strategies */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Growth Strategies</h4>
                  <ul className="space-y-2">
                    {study.strategies.map((strategy, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Insights */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Insights</h4>
                  <ul className="space-y-2">
                    {study.keyInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Lightbulb className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Before/After Metrics */}
              <div className="mt-8 grid md:grid-cols-2 gap-8">
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Before Implementation</h4>
                  <div className="space-y-3">
                    {Object.entries(study.metrics.before).map(([key, value], i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-red-300 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">After Implementation</h4>
                  <div className="space-y-3">
                    {Object.entries(study.metrics.after).map(([key, value], i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-green-300 font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Growth Frameworks */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Growth Hacking Frameworks</h2>
        <div className="space-y-8">
          {growthFrameworks.map((framework, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-4">{framework.framework}</h3>
              <p className="text-gray-300 mb-6">{framework.description}</p>

              {framework.stages && (
                <div className="space-y-6">
                  {framework.stages.map((stage, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-3">{stage.stage}</h4>
                      <p className="text-gray-300 mb-4">{stage.focus}</p>
                      <div className="flex flex-wrap gap-2">
                        {stage.tactics.map((tactic, j) => (
                          <span key={j} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                            {tactic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {framework.components && (
                <div className="grid md:grid-cols-3 gap-6">
                  {framework.components.map((component, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-3">{component.component}</h4>
                      <p className="text-gray-300 mb-3">{component.description}</p>
                      <p className="text-sm text-blue-300">{component.scoring}</p>
                    </div>
                  ))}
                </div>
              )}

              {framework.elements && (
                <div className="space-y-4">
                  {framework.elements.map((element, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-3">{element.element}</h4>
                      <p className="text-gray-300 mb-3">{element.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {element.examples.map((example, j) => (
                          <span key={j} className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {example}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {framework.application && (
                <div className="mt-6 bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 font-semibold">Application:</p>
                  <p className="text-gray-300 mt-2">{framework.application}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Experiment Types */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Growth Experiment Types</h2>
        <div className="space-y-6">
          {experimentTypes.map((experiment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{experiment.type}</h3>
              <p className="text-gray-300 mb-6">{experiment.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Applications</h4>
                  <ul className="space-y-2">
                    {experiment.applications.map((application, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Target className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{application}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Best Practices</h4>
                  <ul className="space-y-2">
                    {experiment.bestPractices.map((practice, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{practice}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Growth Trends */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Growth Trends</h2>
        <div className="space-y-6">
          {australianGrowthTrends.map((trend, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{trend.trend}</h3>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  trend.impact === 'High' ? 'bg-red-500/20 text-red-300' :
                  trend.impact === 'Medium-High' ? 'bg-orange-500/20 text-orange-300' :
                  'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {trend.impact} Impact
                </span>
              </div>
              
              <p className="text-gray-300 mb-6">{trend.description}</p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Growth Opportunities</h4>
                  <ul className="space-y-2">
                    {trend.opportunities.map((opportunity, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Rocket className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Success Examples</h4>
                  <ul className="space-y-2">
                    {trend.examples.map((example, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Award className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Growth Metrics */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Essential Growth Metrics</h2>
        <div className="space-y-8">
          {growthMetrics.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">{category.category}</h3>
              <div className="space-y-6">
                {category.metrics.map((metric, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-white">{metric.metric}</h4>
                      <span className="text-sm px-3 py-1 bg-green-500/20 text-green-300 rounded-full">
                        {metric.benchmark}
                      </span>
                    </div>
                    <p className="text-gray-300">{metric.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}