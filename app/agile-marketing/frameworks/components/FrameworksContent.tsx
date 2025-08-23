'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  GitBranch, 
  Users, 
  Calendar, 
  Repeat, 
  CheckCircle,
  ArrowRight,
  Clock,
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react';

export default function FrameworksContent() {
  const frameworks = [
    {
      name: 'Scrum for Marketing',
      icon: Target,
      description: 'Sprint-based approach with defined roles, ceremonies, and artifacts adapted for marketing teams',
      bestFor: ['Campaign-driven teams', 'Complex projects', 'Cross-functional collaboration'],
      keyPrinciples: [
        'Marketing sprints (1-4 weeks)',
        'Daily standups for alignment',
        'Sprint planning and review',
        'Retrospectives for improvement'
      ],
      roles: [
        { title: 'Product Owner', description: 'Marketing leader who defines priorities and outcomes' },
        { title: 'Scrum Master', description: 'Facilitator who removes blockers and coaches the team' },
        { title: 'Marketing Team', description: 'Cross-functional members who execute campaigns' }
      ],
      ceremonies: [
        { name: 'Sprint Planning', frequency: 'Start of each sprint', purpose: 'Define sprint goals and select backlog items' },
        { name: 'Daily Standup', frequency: 'Daily (15 min)', purpose: 'Sync on progress and identify blockers' },
        { name: 'Sprint Review', frequency: 'End of sprint', purpose: 'Demo completed work and gather feedback' },
        { name: 'Retrospective', frequency: 'After sprint review', purpose: 'Reflect and improve processes' }
      ],
      benefits: [
        'Clear accountability and ownership',
        'Regular feedback and adaptation',
        'Improved team collaboration',
        'Faster time-to-market for campaigns'
      ]
    },
    {
      name: 'Kanban Marketing',
      icon: BarChart3,
      description: 'Visual workflow management focusing on continuous flow and limiting work in progress',
      bestFor: ['Ongoing marketing activities', 'Support teams', 'Variable workloads'],
      keyPrinciples: [
        'Visualize marketing workflow',
        'Limit work in progress (WIP)',
        'Manage and measure flow',
        'Continuous improvement'
      ],
      boardColumns: [
        { name: 'Backlog', description: 'All potential marketing tasks and campaigns' },
        { name: 'Ready', description: 'Tasks with clear requirements and resources' },
        { name: 'In Progress', description: 'Active work items (WIP limited)' },
        { name: 'Review', description: 'Completed work awaiting feedback' },
        { name: 'Done', description: 'Completed and approved deliverables' }
      ],
      metrics: [
        { name: 'Lead Time', description: 'Time from request to completion' },
        { name: 'Cycle Time', description: 'Time spent actively working on tasks' },
        { name: 'Throughput', description: 'Number of tasks completed per period' },
        { name: 'WIP Age', description: 'How long items stay in progress' }
      ],
      benefits: [
        'Visual clarity of all marketing work',
        'Reduced context switching',
        'Improved flow efficiency',
        'Better capacity planning'
      ]
    },
    {
      name: 'Lean Marketing',
      icon: GitBranch,
      description: 'Eliminate waste and maximize value delivery through continuous improvement',
      bestFor: ['Process optimization', 'Resource efficiency', 'Value-focused teams'],
      keyPrinciples: [
        'Define customer value clearly',
        'Map marketing value streams',
        'Create flow and pull systems',
        'Pursue continuous improvement'
      ],
      wasteTypes: [
        { name: 'Overproduction', example: 'Creating content without clear demand or purpose' },
        { name: 'Waiting', example: 'Delays in approvals, reviews, or resource allocation' },
        { name: 'Transportation', example: 'Unnecessary handoffs between teams or departments' },
        { name: 'Overprocessing', example: 'Excessive meetings, reports, or approval layers' },
        { name: 'Inventory', example: 'Unused content, designs, or campaign materials' },
        { name: 'Motion', example: 'Looking for files, tools, or information' },
        { name: 'Defects', example: 'Errors in campaigns requiring rework or fixes' }
      ],
      tools: [
        { name: 'Value Stream Mapping', purpose: 'Visualize and analyze marketing processes' },
        { name: '5S Methodology', purpose: 'Organize marketing workspace and digital assets' },
        { name: 'Kaizen Events', purpose: 'Focused improvement workshops' },
        { name: 'A3 Problem Solving', purpose: 'Structured approach to addressing challenges' }
      ],
      benefits: [
        'Reduced waste and inefficiency',
        'Faster delivery of marketing value',
        'Improved quality and consistency',
        'Enhanced team engagement'
      ]
    }
  ];

  const implementationSteps = [
    {
      phase: 'Assessment',
      duration: '1-2 weeks',
      activities: [
        'Evaluate current marketing processes',
        'Identify team readiness and skills',
        'Analyze organizational culture',
        'Select appropriate framework'
      ]
    },
    {
      phase: 'Planning',
      duration: '1 week',
      activities: [
        'Design framework implementation',
        'Create training materials',
        'Set up tools and workflows',
        'Define success metrics'
      ]
    },
    {
      phase: 'Training',
      duration: '2-3 weeks',
      activities: [
        'Conduct framework training sessions',
        'Practice with pilot projects',
        'Coach team members',
        'Establish new habits'
      ]
    },
    {
      phase: 'Implementation',
      duration: '4-6 weeks',
      activities: [
        'Launch framework with full team',
        'Monitor and adjust processes',
        'Gather feedback and iterate',
        'Celebrate early wins'
      ]
    }
  ];

  return (
    <div className="prose prose-invert max-w-none">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 id="introduction" className="text-3xl font-bold text-white mb-6">
          Introduction to Agile Marketing Frameworks
        </h2>
        <p className="text-gray-300 text-lg leading-relaxed mb-6">
          Agile marketing frameworks provide structured approaches to implementing agile principles 
          in marketing teams. These proven methodologies help teams become more responsive, collaborative, 
          and efficient while delivering better results for customers and stakeholders.
        </p>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Framework Selection is Critical
              </h4>
              <p className="text-gray-300">
                The right framework depends on your team size, campaign complexity, organizational culture, 
                and existing processes. Most successful implementations start with one framework and evolve 
                to hybrid approaches over time.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Framework Deep Dives */}
      {frameworks.map((framework, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="mb-16"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <framework.icon className="w-6 h-6 text-purple-400" />
            </div>
            <h2 id={framework.name.toLowerCase().replace(/ /g, '-')} className="text-3xl font-bold text-white">
              {framework.name}
            </h2>
          </div>
          
          <p className="text-gray-300 text-lg mb-8">{framework.description}</p>

          {/* Best For */}
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Best For:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {framework.bestFor.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Key Principles */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Key Principles:</h4>
            <div className="space-y-3">
              {framework.keyPrinciples.map((principle, principleIndex) => (
                <div key={principleIndex} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-400 text-sm font-semibold">{principleIndex + 1}</span>
                  </div>
                  <span className="text-gray-300">{principle}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Framework-specific content */}
          {framework.name === 'Scrum for Marketing' && (
            <>
              {/* Roles */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Scrum Roles in Marketing:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {framework.roles?.map((role, roleIndex) => (
                    <div key={roleIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <h5 className="text-lg font-semibold text-white mb-2">{role.title}</h5>
                      <p className="text-gray-300 text-sm">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ceremonies */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Marketing Scrum Ceremonies:</h4>
                <div className="space-y-4">
                  {framework.ceremonies?.map((ceremony, ceremonyIndex) => (
                    <div key={ceremonyIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-lg font-semibold text-white">{ceremony.name}</h5>
                        <span className="text-purple-400 text-sm font-medium">{ceremony.frequency}</span>
                      </div>
                      <p className="text-gray-300 text-sm">{ceremony.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {framework.name === 'Kanban Marketing' && (
            <>
              {/* Board Columns */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Kanban Board Structure:</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {framework.boardColumns?.map((column, columnIndex) => (
                    <div key={columnIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <h5 className="text-lg font-semibold text-white mb-2">{column.name}</h5>
                      <p className="text-gray-300 text-sm">{column.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Key Kanban Metrics:</h4>
                <div className="space-y-4">
                  {framework.metrics?.map((metric, metricIndex) => (
                    <div key={metricIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <h5 className="text-lg font-semibold text-white mb-2">{metric.name}</h5>
                      <p className="text-gray-300 text-sm">{metric.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {framework.name === 'Lean Marketing' && (
            <>
              {/* Waste Types */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Seven Wastes in Marketing:</h4>
                <div className="space-y-4">
                  {framework.wasteTypes?.map((waste, wasteIndex) => (
                    <div key={wasteIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <h5 className="text-lg font-semibold text-white mb-2">{waste.name}</h5>
                      <p className="text-gray-300 text-sm">{waste.example}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lean Tools */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold text-white mb-4">Lean Marketing Tools:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {framework.tools?.map((tool, toolIndex) => (
                    <div key={toolIndex} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
                      <h5 className="text-lg font-semibold text-white mb-2">{tool.name}</h5>
                      <p className="text-gray-300 text-sm">{tool.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Benefits */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold text-white mb-4">Key Benefits:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {framework.benefits.map((benefit, benefitIndex) => (
                <div key={benefitIndex} className="flex items-center text-gray-300">
                  <TrendingUp className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Implementation Guide */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 id="implementation" className="text-3xl font-bold text-white mb-6">
          Framework Implementation Guide
        </h2>
        <p className="text-gray-300 text-lg mb-8">
          Successfully implementing an agile marketing framework requires careful planning, proper training, 
          and ongoing support. Here's our proven approach to framework adoption.
        </p>

        <div className="space-y-8">
          {implementationSteps.map((step, index) => (
            <div key={index} className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-purple-400 font-semibold">{index + 1}</span>
                </div>
                <h4 className="text-xl font-semibold text-white">{step.phase}</h4>
                <span className="text-purple-400 font-medium">({step.duration})</span>
              </div>
              
              <div className="space-y-2">
                {step.activities.map((activity, activityIndex) => (
                  <div key={activityIndex} className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                    {activity}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Best Practices */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 id="best-practices" className="text-3xl font-bold text-white mb-6">
          Framework Implementation Best Practices
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
            <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Do's
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li>• Start with a pilot team and small campaigns</li>
              <li>• Provide comprehensive training and coaching</li>
              <li>• Establish clear metrics and success criteria</li>
              <li>• Celebrate early wins and learn from failures</li>
              <li>• Adapt the framework to your team's needs</li>
              <li>• Maintain regular retrospectives and improvements</li>
            </ul>
          </div>
          
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
            <h4 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-400" />
              Don'ts
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li>• Implement multiple frameworks simultaneously</li>
              <li>• Skip training and expect immediate adoption</li>
              <li>• Force the framework without team buy-in</li>
              <li>• Ignore feedback and resistance signals</li>
              <li>• Abandon the framework after initial challenges</li>
              <li>• Measure success only by traditional metrics</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Conclusion */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 id="conclusion" className="text-3xl font-bold text-white mb-6">
          Choosing Your Framework
        </h2>
        <p className="text-gray-300 text-lg mb-6">
          The most successful agile marketing teams often start with one framework and evolve their 
          approach based on experience and changing needs. The key is to begin with proper training, 
          maintain consistency in implementation, and continuously improve based on results and feedback.
        </p>
        
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
          <h4 className="text-xl font-semibold text-white mb-4">
            Ready to implement agile marketing frameworks?
          </h4>
          <p className="text-gray-300 mb-6">
            Our team of certified agile marketing coaches can help you select and implement the 
            right framework for your organization. We provide training, tools, and ongoing support 
            to ensure your transformation succeeds.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Get Framework Consultation
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}