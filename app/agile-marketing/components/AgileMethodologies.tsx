'use client';

import { motion } from 'framer-motion';
import { Target, Users, Repeat, BarChart3, Clock, GitBranch } from 'lucide-react';

export default function AgileMethodologies() {
  const methodologies = [
    {
      icon: Target,
      title: 'Scrum for Marketing',
      description: 'Implement scrum framework with marketing sprints, daily standups, and retrospectives for continuous improvement.',
      features: [
        'Sprint planning sessions',
        'Daily marketing standups',
        'Sprint reviews & demos',
        'Team retrospectives',
        'Product backlog management'
      ],
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Kanban Marketing',
      description: 'Visualize marketing workflows and optimize throughput with kanban boards and work-in-progress limits.',
      features: [
        'Visual workflow boards',
        'WIP limit optimization',
        'Continuous flow',
        'Cycle time tracking',
        'Bottleneck identification'
      ],
      color: 'cyan'
    },
    {
      icon: GitBranch,
      title: 'Lean Marketing',
      description: 'Eliminate waste and focus on value-driven activities through lean principles and continuous improvement.',
      features: [
        'Value stream mapping',
        'Waste elimination',
        'Continuous improvement',
        'Just-in-time planning',
        'Customer-centric focus'
      ],
      color: 'green'
    }
  ];

  const principles = [
    {
      title: 'Individuals and interactions',
      subtitle: 'over processes and tools',
      description: 'Foster collaboration and communication within marketing teams'
    },
    {
      title: 'Working campaigns',
      subtitle: 'over comprehensive documentation',
      description: 'Focus on delivering results rather than extensive planning'
    },
    {
      title: 'Customer collaboration',
      subtitle: 'over contract negotiation',
      description: 'Work closely with stakeholders and respond to feedback'
    },
    {
      title: 'Responding to change',
      subtitle: 'over following a plan',
      description: 'Adapt quickly to market changes and new opportunities'
    }
  ];

  return (
    <section className="py-20 bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Agile Marketing Methodologies
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the right agile framework for your marketing team's needs and culture. 
            We customize our approach based on your specific goals and challenges.
          </p>
        </motion.div>

        {/* Methodologies Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {methodologies.map((methodology, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl bg-${methodology.color}-500/20 border border-${methodology.color}-500/30 flex items-center justify-center mb-6`}>
                <methodology.icon className={`w-8 h-8 text-${methodology.color}-400`} />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">{methodology.title}</h3>
              <p className="text-gray-300 mb-6">{methodology.description}</p>
              
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-white">Key Features:</h4>
                <ul className="space-y-2">
                  {methodology.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className={`w-2 h-2 rounded-full bg-${methodology.color}-400 mr-3`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Agile Principles */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Agile Marketing Principles
          </h3>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Our approach is guided by core agile principles, adapted specifically for marketing teams and campaigns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {principles.map((principle, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <h4 className="text-xl font-bold text-white mb-2">
                  {principle.title}
                </h4>
                <p className="text-purple-400 italic mb-3">
                  {principle.subtitle}
                </p>
                <p className="text-gray-300">
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Implementation Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Implementation Timeline
          </h3>
          
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full" />
            
            <div className="space-y-12">
              {[
                { phase: 'Week 1-2', title: 'Assessment & Planning', description: 'Current state analysis and agile roadmap creation' },
                { phase: 'Week 3-4', title: 'Team Training', description: 'Agile principles and methodology training for marketing teams' },
                { phase: 'Week 5-8', title: 'Pilot Implementation', description: 'Run first agile sprints with selected campaigns' },
                { phase: 'Week 9-12', title: 'Scale & Optimize', description: 'Expand agile practices and refine processes' }
              ].map((item, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                      <div className="text-purple-400 font-semibold mb-2">{item.phase}</div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full border-4 border-slate-950 relative z-10" />
                  <div className="w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}