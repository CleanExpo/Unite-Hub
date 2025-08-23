'use client';

import { motion } from 'framer-motion';
import { Zap, Users, Target, BarChart3, CheckCircle, ArrowRight, Calendar, Lightbulb, Award, TrendingUp, RefreshCw, Clock } from 'lucide-react';

const transformationStages = [
  {
    stage: 'Assessment & Planning',
    description: 'Evaluate current marketing operations and define transformation roadmap',
    duration: '2-3 weeks',
    outcomes: [
      'Current state analysis and capability assessment',
      'Agile readiness evaluation across teams',
      'Stakeholder alignment and buy-in secured',
      'Custom transformation roadmap created',
      'Success metrics and KPIs defined',
      'Change management strategy developed'
    ],
    activities: [
      'Marketing process audit',
      'Team structure analysis',
      'Technology stack evaluation',
      'Culture assessment survey',
      'Leadership interviews',
      'Goal setting workshops'
    ]
  },
  {
    stage: 'Foundation Building',
    description: 'Establish agile frameworks, team structures, and essential practices',
    duration: '4-6 weeks',
    outcomes: [
      'Agile team structures implemented',
      'Sprint planning processes established',
      'Collaboration tools deployed and configured',
      'Initial training programs completed',
      'Communication protocols defined',
      'Performance measurement systems setup'
    ],
    activities: [
      'Cross-functional team formation',
      'Scrum master training',
      'Tool implementation (Jira, Slack, etc.)',
      'Sprint ceremony establishment',
      'Backlog creation and prioritization',
      'Performance dashboard creation'
    ]
  },
  {
    stage: 'Pilot Implementation',
    description: 'Execute initial agile sprints with selected marketing initiatives',
    duration: '6-8 weeks',
    outcomes: [
      'First agile marketing campaigns launched',
      'Sprint retrospectives conducted and learnings captured',
      'Team velocity and performance metrics established',
      'Process refinements based on real-world application',
      'Stakeholder confidence and support gained',
      'Success stories and case studies developed'
    ],
    activities: [
      '2-3 pilot sprint execution',
      'Daily standups and sprint reviews',
      'Continuous feedback collection',
      'Process optimization',
      'Performance tracking and reporting',
      'Team coaching and mentoring'
    ]
  },
  {
    stage: 'Scale & Optimize',
    description: 'Expand agile practices across all marketing functions and optimize performance',
    duration: '8-12 weeks',
    outcomes: [
      'Organization-wide agile marketing adoption',
      'Optimized workflows and processes',
      'Advanced collaboration and efficiency',
      'Measurable performance improvements',
      'Self-organizing, high-performing teams',
      'Sustainable agile marketing culture'
    ],
    activities: [
      'Full team onboarding',
      'Advanced training and certification',
      'Process automation implementation',
      'Advanced analytics and reporting',
      'Continuous improvement programs',
      'Culture reinforcement initiatives'
    ]
  }
];

const transformationBenefits = [
  {
    category: 'Speed & Efficiency',
    benefits: [
      { benefit: 'Campaign Launch Speed', improvement: '+75% faster', description: 'Reduced time from concept to market' },
      { benefit: 'Decision Making Time', improvement: '+60% faster', description: 'Quicker consensus and approval processes' },
      { benefit: 'Resource Allocation', improvement: '+40% efficiency', description: 'Better utilization of team and budget' },
      { benefit: 'Project Delivery', improvement: '+85% on-time', description: 'Improved delivery predictability' }
    ]
  },
  {
    category: 'Quality & Innovation',
    benefits: [
      { benefit: 'Campaign Performance', improvement: '+45% better', description: 'Higher engagement and conversion rates' },
      { benefit: 'Creative Output', improvement: '+65% increase', description: 'More creative concepts and variations' },
      { benefit: 'A/B Testing Volume', improvement: '+120% increase', description: 'More experiments and optimizations' },
      { benefit: 'Innovation Rate', improvement: '+55% increase', description: 'New ideas and approaches implemented' }
    ]
  },
  {
    category: 'Team & Culture',
    benefits: [
      { benefit: 'Employee Satisfaction', improvement: '+35% increase', description: 'Higher engagement and job satisfaction' },
      { benefit: 'Cross-team Collaboration', improvement: '+80% improvement', description: 'Better teamwork and communication' },
      { benefit: 'Skill Development', improvement: '+50% increase', description: 'Enhanced team capabilities and growth' },
      { benefit: 'Retention Rate', improvement: '+25% improvement', description: 'Reduced turnover and better retention' }
    ]
  }
];

const agileFrameworks = [
  {
    framework: 'Marketing Scrum',
    description: 'Adapted Scrum methodology specifically for marketing teams and campaigns',
    components: [
      { name: 'Sprint Planning', description: 'Plan marketing activities for 2-4 week sprints', duration: '2-4 hours' },
      { name: 'Daily Standups', description: 'Quick team alignment on progress and blockers', duration: '15 minutes' },
      { name: 'Sprint Review', description: 'Demonstrate completed marketing work to stakeholders', duration: '1-2 hours' },
      { name: 'Retrospective', description: 'Reflect on process and identify improvements', duration: '1 hour' }
    ],
    roles: [
      { role: 'Product Owner', responsibility: 'Defines marketing priorities and requirements' },
      { role: 'Scrum Master', responsibility: 'Facilitates process and removes impediments' },
      { role: 'Marketing Team', responsibility: 'Executes marketing activities and campaigns' }
    ]
  },
  {
    framework: 'Marketing Kanban',
    description: 'Visual workflow management for continuous marketing operations',
    components: [
      { name: 'Kanban Board', description: 'Visual representation of work in progress', usage: 'Continuous monitoring' },
      { name: 'WIP Limits', description: 'Constraints on work in progress to optimize flow', usage: 'Ongoing enforcement' },
      { name: 'Flow Metrics', description: 'Measure lead time, cycle time, and throughput', usage: 'Weekly review' },
      { name: 'Daily Review', description: 'Quick check on board status and priorities', usage: '10 minutes daily' }
    ],
    principles: [
      { principle: 'Visualize Workflow', benefit: 'Clear visibility into all marketing activities' },
      { principle: 'Limit WIP', benefit: 'Improved focus and faster completion times' },
      { principle: 'Measure Flow', benefit: 'Data-driven process optimization' },
      { principle: 'Continuous Improvement', benefit: 'Regular enhancement of processes' }
    ]
  },
  {
    framework: 'Growth-Driven Design (GDD)',
    description: 'Agile approach to website and digital asset development',
    phases: [
      { phase: 'Strategy', description: 'Research, planning, and goal setting', timeline: '2-4 weeks' },
      { phase: 'Launch Pad', description: 'Quick MVP website launch', timeline: '4-6 weeks' },
      { phase: 'Continuous Improvement', description: 'Ongoing optimization based on data', timeline: 'Ongoing' }
    ],
    benefits: [
      { benefit: 'Faster Time to Market', description: 'Launch quickly and improve iteratively' },
      { benefit: 'Data-Driven Decisions', description: 'Use real user data to guide improvements' },
      { benefit: 'Reduced Risk', description: 'Smaller iterations minimize potential failures' },
      { benefit: 'Better ROI', description: 'Focus resources on proven improvements' }
    ]
  }
];

const australianTransformationCases = [
  {
    company: 'Melbourne Financial Services',
    industry: 'Financial Services',
    challenge: 'Slow campaign delivery and poor cross-team collaboration',
    transformation: [
      'Implemented Marketing Scrum across 3 teams',
      'Established cross-functional campaign squads',
      'Deployed integrated project management tools',
      'Created unified performance dashboard'
    ],
    results: {
      campaignSpeed: '+80% faster delivery',
      teamSatisfaction: '+45% improvement',
      campaignPerformance: '+35% better ROI',
      processEfficiency: '+60% reduction in bottlenecks'
    },
    timeline: '16 weeks transformation'
  },
  {
    company: 'Sydney Tech Startup',
    industry: 'Technology',
    challenge: 'Lack of marketing-product alignment and slow feature adoption',
    transformation: [
      'Created integrated product-marketing teams',
      'Implemented Growth-Driven Design for website',
      'Established continuous A/B testing culture',
      'Built real-time analytics dashboard'
    ],
    results: {
      productAlignment: '+90% better coordination',
      featureAdoption: '+65% faster uptake',
      conversionRate: '+45% improvement',
      experimentation: '+150% more tests'
    },
    timeline: '12 weeks transformation'
  },
  {
    company: 'Brisbane E-commerce',
    industry: 'Retail/E-commerce',
    challenge: 'Seasonal demand fluctuations and inventory marketing alignment',
    transformation: [
      'Implemented flexible Kanban workflow',
      'Created demand forecasting integration',
      'Established rapid response teams',
      'Built automated campaign triggers'
    ],
    results: {
      responseTime: '+70% faster to market changes',
      inventoryAlignment: '+85% better coordination',
      seasonalPerformance: '+50% revenue increase',
      teamAgility: '+95% flexibility improvement'
    },
    timeline: '14 weeks transformation'
  }
];

const transformationChallenges = [
  {
    challenge: 'Cultural Resistance',
    description: 'Teams resistant to change from traditional marketing approaches',
    solutions: [
      'Executive sponsorship and visible leadership support',
      'Gradual implementation with pilot programs',
      'Success story sharing and celebration',
      'Training and skill development programs',
      'Clear communication of benefits and rationale',
      'Involving skeptics in solution design'
    ],
    successFactors: [
      'Strong change management approach',
      'Regular communication and updates',
      'Quick wins to build momentum',
      'Addressing concerns proactively'
    ]
  },
  {
    challenge: 'Process Complexity',
    description: 'Overwhelming complexity of existing marketing processes and approvals',
    solutions: [
      'Process mapping and simplification',
      'Elimination of redundant approvals',
      'Automated workflow implementation',
      'Clear role and responsibility definition',
      'Decision authority delegation',
      'Exception handling procedures'
    ],
    successFactors: [
      'Executive decision-making authority',
      'Process redesign expertise',
      'Technology enablement',
      'Clear governance framework'
    ]
  },
  {
    challenge: 'Technology Integration',
    description: 'Lack of integrated tools and systems for agile collaboration',
    solutions: [
      'Marketing technology stack audit',
      'Integration platform implementation',
      'Single source of truth establishment',
      'Automated reporting and dashboards',
      'Mobile-first collaboration tools',
      'API-based system connections'
    ],
    successFactors: [
      'IT partnership and support',
      'User-friendly tool selection',
      'Comprehensive training programs',
      'Gradual rollout approach'
    ]
  },
  {
    challenge: 'Measurement & Analytics',
    description: 'Difficulty measuring agile marketing performance and ROI',
    solutions: [
      'Agile-specific KPI development',
      'Real-time dashboard creation',
      'Velocity and burndown tracking',
      'Customer impact measurement',
      'Team performance metrics',
      'Continuous improvement indicators'
    ],
    successFactors: [
      'Clear metric definitions',
      'Regular review and adjustment',
      'Stakeholder metric alignment',
      'Data quality assurance'
    ]
  }
];

const transformationTools = [
  {
    category: 'Project Management',
    tools: [
      { tool: 'Jira', purpose: 'Sprint planning and task management', features: ['Backlog management', 'Sprint boards', 'Burndown charts', 'Custom workflows'] },
      { tool: 'Asana', purpose: 'Team collaboration and project tracking', features: ['Team boards', 'Timeline view', 'Goal tracking', 'Automation rules'] },
      { tool: 'Monday.com', purpose: 'Visual project management', features: ['Customizable boards', 'Automation', 'Time tracking', 'Reporting'] }
    ]
  },
  {
    category: 'Communication',
    tools: [
      { tool: 'Slack', purpose: 'Team communication and integration', features: ['Channel organization', 'App integrations', 'Workflow automation', 'Video calls'] },
      { tool: 'Microsoft Teams', purpose: 'Integrated collaboration platform', features: ['Chat and channels', 'File sharing', 'Video meetings', 'App ecosystem'] },
      { tool: 'Zoom', purpose: 'Video conferencing and collaboration', features: ['HD video meetings', 'Screen sharing', 'Breakout rooms', 'Recording'] }
    ]
  },
  {
    category: 'Analytics & Reporting',
    tools: [
      { tool: 'Google Analytics 4', purpose: 'Web and app analytics', features: ['Real-time reporting', 'Custom dashboards', 'Audience insights', 'Goal tracking'] },
      { tool: 'Tableau', purpose: 'Data visualization and business intelligence', features: ['Interactive dashboards', 'Data connections', 'Real-time updates', 'Mobile access'] },
      { tool: 'Power BI', purpose: 'Business analytics platform', features: ['Self-service BI', 'Data modeling', 'AI insights', 'Collaboration'] }
    ]
  }
];

export default function TransformationContent() {
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
            Agile Marketing Transformation
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Transform your marketing organization with proven agile methodologies that increase 
            speed, improve collaboration, and deliver better results. Our comprehensive 
            transformation program guides Australian businesses through every stage of agile 
            marketing adoption, from assessment to full implementation.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Zap, label: 'Speed Improvement', value: '+75% faster' },
            { icon: Users, label: 'Team Satisfaction', value: '+35% increase' },
            { icon: Target, label: 'Campaign Performance', value: '+45% better' },
            { icon: BarChart3, label: 'ROI Improvement', value: '+60% increase' }
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

      {/* Transformation Stages */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Transformation Journey</h2>
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-8">
            {transformationStages.map((stage, index) => (
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
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-bold text-white">{stage.stage}</h3>
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {stage.duration}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-6">{stage.description}</p>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Key Outcomes</h4>
                      <ul className="space-y-2">
                        {stage.outcomes.map((outcome, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Core Activities</h4>
                      <ul className="space-y-2">
                        {stage.activities.map((activity, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <ArrowRight className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Transformation Benefits */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Transformation Benefits</h2>
        <div className="space-y-8">
          {transformationBenefits.map((category, index) => (
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
                {category.benefits.map((benefit, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-semibold text-white">{benefit.benefit}</h4>
                      <span className="text-sm px-3 py-1 bg-green-500/20 text-green-300 rounded-full font-semibold">
                        {benefit.improvement}
                      </span>
                    </div>
                    <p className="text-gray-300">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agile Frameworks */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Agile Marketing Frameworks</h2>
        <div className="space-y-8">
          {agileFrameworks.map((framework, index) => (
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

              {framework.components && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Framework Components</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {framework.components.map((component, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-white">{component.name}</h5>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            {'duration' in component ? component.duration : component.usage}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{component.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {framework.roles && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Team Roles</h4>
                  <div className="space-y-3">
                    {framework.roles.map((role, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="font-semibold text-blue-400 min-w-[120px]">{role.role}:</span>
                        <span className="text-gray-300">{role.responsibility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {framework.principles && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Core Principles</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {framework.principles.map((principle, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-2">{principle.principle}</h5>
                        <p className="text-sm text-gray-300">{principle.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {framework.phases && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Implementation Phases</h4>
                  <div className="space-y-4">
                    {framework.phases.map((phase, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-white">{phase.phase}</h5>
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {phase.timeline}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{phase.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {framework.benefits && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Benefits</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {framework.benefits.map((benefit, i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4">
                        <h5 className="font-semibold text-white mb-2">{benefit.benefit}</h5>
                        <p className="text-sm text-gray-300">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Australian Case Studies */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Australian Transformation Success Stories</h2>
        <div className="space-y-8">
          {australianTransformationCases.map((case_study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{case_study.company}</h3>
                  <div className="flex gap-4">
                    <span className="text-blue-400 font-semibold">{case_study.industry}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-400 font-semibold">{case_study.timeline}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Challenge</h4>
                <p className="text-gray-300">{case_study.challenge}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Transformation Approach</h4>
                  <ul className="space-y-2">
                    {case_study.transformation.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Results Achieved</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(case_study.results).map(([key, value], i) => (
                      <div key={i} className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <p className="text-lg font-bold text-green-400 mb-1">{value}</p>
                        <p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Transformation Challenges */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Common Transformation Challenges</h2>
        <div className="space-y-6">
          {transformationChallenges.map((challenge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <h3 className="text-xl font-bold text-white mb-4">{challenge.challenge}</h3>
              <p className="text-gray-300 mb-6">{challenge.description}</p>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Solutions</h4>
                  <ul className="space-y-2">
                    {challenge.solutions.map((solution, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Success Factors</h4>
                  <ul className="space-y-2">
                    {challenge.successFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <Award className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Transformation Tools */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Essential Transformation Tools</h2>
        <div className="space-y-8">
          {transformationTools.map((category, index) => (
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
                {category.tools.map((tool, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">{tool.tool}</h4>
                    <p className="text-gray-300 mb-4">{tool.purpose}</p>
                    <div>
                      <h5 className="text-sm font-semibold text-gray-400 mb-2">Key Features:</h5>
                      <div className="flex flex-wrap gap-2">
                        {tool.features.map((feature, j) => (
                          <span key={j} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Transformation Implementation Roadmap</h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Month 1-2: Foundation</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Current state assessment</li>
                <li>• Stakeholder alignment</li>
                <li>• Team structure design</li>
                <li>• Initial tool setup</li>
                <li>• Training program launch</li>
                <li>• Pilot team selection</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Month 3-4: Implementation</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Pilot sprint execution</li>
                <li>• Process refinement</li>
                <li>• Tool optimization</li>
                <li>• Performance measurement</li>
                <li>• Success story development</li>
                <li>• Expansion planning</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Month 5-6: Scale</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Organization-wide rollout</li>
                <li>• Advanced training delivery</li>
                <li>• Culture reinforcement</li>
                <li>• Continuous improvement</li>
                <li>• Performance optimization</li>
                <li>• Sustainability planning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}