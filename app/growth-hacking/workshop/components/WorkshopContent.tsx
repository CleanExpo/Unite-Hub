'use client';

import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp, Users, CheckCircle, ArrowRight, Lightbulb, Rocket, BarChart3 } from 'lucide-react';

const workshopModules = [
  {
    title: 'Growth Mindset & Strategy',
    duration: '2 hours',
    description: 'Develop the foundational thinking for sustainable growth',
    topics: [
      'Growth hacking vs traditional marketing',
      'Building experimentation culture',
      'Setting growth objectives and KPIs',
      'Creating growth hypothesis frameworks'
    ],
    outcomes: [
      'Shift to growth-first mindset',
      'Define clear growth metrics',
      'Build hypothesis testing skills',
      'Create growth strategy blueprint'
    ]
  },
  {
    title: 'Customer Acquisition Mastery',
    duration: '3 hours',
    description: 'Advanced techniques for acquiring customers at scale',
    topics: [
      'Viral loops and referral systems',
      'Content marketing for growth',
      'Paid acquisition optimization',
      'Partnership and collaboration strategies'
    ],
    outcomes: [
      'Design viral acquisition funnels',
      'Create scalable content systems',
      'Optimize customer acquisition cost',
      'Build strategic partnerships'
    ]
  },
  {
    title: 'Retention & Engagement Hacks',
    duration: '2.5 hours',
    description: 'Keep customers engaged and coming back for more',
    topics: [
      'Onboarding optimization',
      'Email automation sequences',
      'Product-led growth strategies',
      'Community building tactics'
    ],
    outcomes: [
      'Reduce churn by 40%+',
      'Increase customer lifetime value',
      'Build engaged user communities',
      'Create product stickiness'
    ]
  },
  {
    title: 'Data-Driven Experimentation',
    duration: '2 hours',
    description: 'Scientific approach to growth experiments',
    topics: [
      'A/B testing frameworks',
      'Analytics setup and tracking',
      'Statistical significance understanding',
      'Rapid experimentation processes'
    ],
    outcomes: [
      'Design valid experiments',
      'Interpret test results correctly',
      'Scale winning experiments',
      'Build experimentation systems'
    ]
  }
];

const growthTactics = [
  {
    category: 'Viral Growth',
    tactics: [
      { name: 'Referral Programs', difficulty: 'Medium', impact: 'High', timeframe: '2-4 weeks' },
      { name: 'Social Sharing Features', difficulty: 'Low', impact: 'Medium', timeframe: '1-2 weeks' },
      { name: 'Network Effects', difficulty: 'High', impact: 'Very High', timeframe: '3-6 months' },
      { name: 'User-Generated Content', difficulty: 'Medium', impact: 'High', timeframe: '2-6 weeks' }
    ]
  },
  {
    category: 'Content Marketing',
    tactics: [
      { name: 'SEO Content Scaling', difficulty: 'Medium', impact: 'High', timeframe: '3-6 months' },
      { name: 'Video Marketing Funnels', difficulty: 'Medium', impact: 'High', timeframe: '4-8 weeks' },
      { name: 'Podcast Guest Strategy', difficulty: 'Low', impact: 'Medium', timeframe: '2-4 weeks' },
      { name: 'Interactive Content', difficulty: 'High', impact: 'High', timeframe: '6-10 weeks' }
    ]
  },
  {
    category: 'Product-Led Growth',
    tactics: [
      { name: 'Freemium Models', difficulty: 'High', impact: 'Very High', timeframe: '2-4 months' },
      { name: 'Onboarding Optimization', difficulty: 'Medium', impact: 'High', timeframe: '2-4 weeks' },
      { name: 'Feature-Based Acquisition', difficulty: 'High', impact: 'High', timeframe: '3-6 months' },
      { name: 'Usage Analytics', difficulty: 'Low', impact: 'Medium', timeframe: '1-2 weeks' }
    ]
  }
];

const australianGrowthCases = [
  {
    company: 'Canva',
    strategy: 'Freemium + Social Sharing',
    result: '75M+ users globally from Sydney startup',
    keyTactic: 'Made design accessible to everyone with viral sharing features'
  },
  {
    company: 'Atlassian',
    strategy: 'Product-Led Growth',
    result: '$2.1B revenue with minimal sales team',
    keyTactic: 'Self-serve product with built-in collaboration features'
  },
  {
    company: 'SafetyCulture',
    strategy: 'Industry-Specific PLG',
    result: '35,000+ customers in safety industry',
    keyTactic: 'Solved specific workplace safety problems with mobile-first approach'
  },
  {
    company: 'Deputy',
    strategy: 'SMB Focus + Referrals',
    result: '320,000+ locations using the platform',
    keyTactic: 'Word-of-mouth growth in small business community'
  }
];

const experimentFramework = [
  {
    step: 'Hypothesize',
    description: 'Form clear, testable hypotheses based on data',
    process: [
      'Identify growth bottlenecks',
      'Research user behavior data',
      'Formulate specific predictions',
      'Define success metrics'
    ]
  },
  {
    step: 'Prioritize',
    description: 'Rank experiments by potential impact and effort',
    process: [
      'Score impact potential (1-10)',
      'Estimate resource requirements',
      'Assess confidence level',
      'Calculate ICE score'
    ]
  },
  {
    step: 'Test',
    description: 'Run controlled experiments with proper methodology',
    process: [
      'Set up tracking and analytics',
      'Define test parameters',
      'Run for statistical significance',
      'Monitor for external factors'
    ]
  },
  {
    step: 'Analyze',
    description: 'Interpret results and extract actionable insights',
    process: [
      'Check statistical significance',
      'Analyze secondary metrics',
      'Document learnings',
      'Plan next iterations'
    ]
  }
];

export default function WorkshopContent() {
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
            Growth Hacking Workshop
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Master the art and science of growth hacking with our intensive workshop. Learn proven 
            strategies, frameworks, and tactics used by Brisbane's fastest-growing companies to 
            achieve explosive, sustainable growth.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Zap, label: 'Growth Rate', value: '10x faster' },
            { icon: Target, label: 'Success Rate', value: '85% of tactics' },
            { icon: TrendingUp, label: 'ROI Improvement', value: '+340%' },
            { icon: Users, label: 'Participants Trained', value: '500+' }
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

      {/* Workshop Modules */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Workshop Modules</h2>
        <div className="space-y-8">
          {workshopModules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-white">{module.title}</h3>
                <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                  {module.duration}
                </span>
              </div>
              <p className="text-gray-300 mb-6">{module.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">What You'll Learn</h4>
                  <ul className="space-y-2">
                    {module.topics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Expected Outcomes</h4>
                  <ul className="space-y-2">
                    {module.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Growth Tactics Library */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Growth Tactics You'll Master</h2>
        <div className="space-y-8">
          {growthTactics.map((category, index) => (
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
                {category.tactics.map((tactic, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-3">{tactic.name}</h4>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400 block">Difficulty</span>
                        <span className={`font-semibold ${
                          tactic.difficulty === 'Low' ? 'text-green-400' :
                          tactic.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {tactic.difficulty}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Impact</span>
                        <span className={`font-semibold ${
                          tactic.impact === 'Medium' ? 'text-yellow-400' :
                          tactic.impact === 'High' ? 'text-blue-400' : 'text-purple-400'
                        }`}>
                          {tactic.impact}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Timeline</span>
                        <span className="text-gray-300 font-semibold">{tactic.timeframe}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Growth Case Studies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Growth Success Stories</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {australianGrowthCases.map((caseStudy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-8 h-8 text-blue-400" />
                <h3 className="text-xl font-bold text-white">{caseStudy.company}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Strategy: </span>
                  <span className="text-blue-300 font-semibold">{caseStudy.strategy}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Result: </span>
                  <span className="text-green-400 font-semibold">{caseStudy.result}</span>
                </div>
                <p className="text-gray-300 text-sm">{caseStudy.keyTactic}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Experiment Framework */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Growth Experiment Framework</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {experimentFramework.map((step, index) => (
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
                  <h3 className="text-xl font-bold text-white mb-3">{step.step}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Process Steps:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {step.process.map((process, i) => (
                        <li key={i} className="text-xs px-2 py-1 bg-slate-800 text-gray-300 rounded">
                          {process}
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

      {/* Workshop Formats */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Workshop Formats</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              format: 'One-Day Intensive',
              duration: '8 hours',
              description: 'Complete growth hacking bootcamp in one day',
              includes: ['All 4 modules', 'Hands-on exercises', 'Growth toolkit', 'Follow-up consultation'],
              price: '$1,200',
              bestFor: 'Executives and founders'
            },
            {
              format: 'Weekly Series',
              duration: '4 weeks',
              description: 'Deep-dive sessions with implementation time',
              includes: ['2 hours per week', 'Implementation assignments', 'Peer group access', '3-month support'],
              price: '$800',
              bestFor: 'Marketing teams'
            },
            {
              format: 'Custom Corporate',
              duration: 'Flexible',
              description: 'Tailored workshop for your organization',
              includes: ['Custom content', 'On-site delivery', 'Team exercises', 'Ongoing mentorship'],
              price: 'From $5,000',
              bestFor: 'Large organizations'
            }
          ].map((format, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6"
            >
              <div className="text-center mb-4">
                <Lightbulb className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">{format.format}</h3>
                <p className="text-blue-300 font-semibold">{format.duration}</p>
              </div>
              <p className="text-gray-300 mb-4">{format.description}</p>
              <ul className="space-y-2 mb-4">
                {format.includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Best for: {format.bestFor}</span>
                  <span className="text-lg font-bold text-white">{format.price}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}