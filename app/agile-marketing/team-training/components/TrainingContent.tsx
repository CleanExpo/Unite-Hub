'use client';

import { motion } from 'framer-motion';
import { Users, Target, Zap, Award, CheckCircle, ArrowRight } from 'lucide-react';

const trainingModules = [
  {
    title: 'Agile Fundamentals for Marketers',
    duration: '2 days',
    level: 'Foundation',
    topics: [
      'Understanding Agile principles and values',
      'Scrum vs Kanban for marketing teams',
      'Sprint planning and execution',
      'Daily standups and retrospectives',
      'User stories for marketing tasks'
    ],
    outcomes: [
      'Master core Agile concepts',
      'Choose the right framework',
      'Run effective ceremonies',
      'Build marketing backlogs'
    ]
  },
  {
    title: 'Advanced Sprint Marketing',
    duration: '3 days',
    level: 'Advanced',
    topics: [
      'Campaign sprint methodology',
      'Rapid experimentation frameworks',
      'A/B testing at scale',
      'Marketing velocity metrics',
      'Cross-functional collaboration'
    ],
    outcomes: [
      'Launch campaigns 3x faster',
      'Implement test-and-learn culture',
      'Measure marketing velocity',
      'Optimize team performance'
    ]
  },
  {
    title: 'Marketing Team Leadership',
    duration: '2 days',
    level: 'Leadership',
    topics: [
      'Building self-organizing teams',
      'Servant leadership principles',
      'Coaching and mentoring',
      'Change management strategies',
      'Stakeholder alignment'
    ],
    outcomes: [
      'Lead high-performing teams',
      'Drive organizational change',
      'Manage stakeholder expectations',
      'Build agile culture'
    ]
  },
  {
    title: 'Data-Driven Marketing Sprints',
    duration: '2 days',
    level: 'Specialized',
    topics: [
      'Marketing analytics in sprints',
      'Real-time performance tracking',
      'Predictive modeling basics',
      'Attribution in agile context',
      'Reporting and dashboards'
    ],
    outcomes: [
      'Make data-driven decisions',
      'Track sprint performance',
      'Predict campaign outcomes',
      'Build effective dashboards'
    ]
  }
];

const certificationPath = [
  {
    stage: 'Foundation',
    description: 'Core Agile Marketing principles',
    duration: '2 days',
    certification: 'Agile Marketing Practitioner'
  },
  {
    stage: 'Intermediate',
    description: 'Advanced frameworks and tools',
    duration: '3 days',
    certification: 'Certified Agile Marketer'
  },
  {
    stage: 'Advanced',
    description: 'Leadership and transformation',
    duration: '5 days',
    certification: 'Agile Marketing Master'
  },
  {
    stage: 'Expert',
    description: 'Organizational coaching',
    duration: '10 days',
    certification: 'Enterprise Agile Coach'
  }
];

export default function TrainingContent() {
  return (
    <div className="space-y-16">
      {/* Training Overview */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6">
            Comprehensive Training Programs
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Transform your marketing team with our expert-led Agile training programs. 
            From foundational concepts to advanced leadership skills, we provide the 
            knowledge and tools your team needs to excel in Agile marketing.
          </p>
        </motion.div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Users, label: 'Team Alignment', value: '95% improvement' },
            { icon: Zap, label: 'Faster Delivery', value: '3x velocity' },
            { icon: Target, label: 'Better Results', value: '85% success rate' },
            { icon: Award, label: 'Certification', value: 'Industry recognized' }
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

      {/* Training Modules */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Training Modules</h2>
        <div className="space-y-8">
          {trainingModules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
            >
              <div className="flex flex-wrap items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{module.title}</h3>
                  <div className="flex gap-4">
                    <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                      {module.duration}
                    </span>
                    <span className="text-sm px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                      {module.level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Topics Covered</h4>
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
                  <h4 className="text-lg font-semibold text-white mb-4">Learning Outcomes</h4>
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

      {/* Certification Path */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Certification Path</h2>
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500 hidden md:block" />
          
          <div className="space-y-6">
            {certificationPath.map((stage, index) => (
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
                  <h3 className="text-xl font-bold text-white mb-2">{stage.stage}</h3>
                  <p className="text-gray-300 mb-3">{stage.description}</p>
                  <div className="flex flex-wrap gap-4">
                    <span className="text-sm text-gray-400">
                      Duration: <span className="text-white font-semibold">{stage.duration}</span>
                    </span>
                    <span className="text-sm text-gray-400">
                      Certification: <span className="text-blue-400 font-semibold">{stage.certification}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Formats */}
      <section>
        <h2 className="text-3xl font-bold text-white mb-8">Training Formats</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'On-Site Training',
              description: 'Customized training delivered at your location with hands-on workshops',
              features: ['Tailored content', 'Team workshops', 'Real project work', 'Immediate application']
            },
            {
              title: 'Virtual Training',
              description: 'Interactive online sessions with live instruction and collaboration',
              features: ['Flexible scheduling', 'Remote participation', 'Recorded sessions', 'Online resources']
            },
            {
              title: 'Hybrid Programs',
              description: 'Combination of self-paced learning and instructor-led sessions',
              features: ['Self-paced modules', 'Live Q&A sessions', 'Peer collaboration', 'Ongoing support']
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
              <h3 className="text-xl font-bold text-white mb-3">{format.title}</h3>
              <p className="text-gray-300 mb-4">{format.description}</p>
              <ul className="space-y-2">
                {format.features.map((feature, i) => (
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