'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  ArrowDown,
  Calendar,
  BarChart3,
  Repeat,
  Lightbulb
} from 'lucide-react';

export default function AgileTransformation() {
  const transformationSteps = [
    {
      phase: 1,
      title: 'Current State Assessment',
      duration: '1-2 weeks',
      description: 'Comprehensive analysis of your current marketing processes, team structure, and capabilities.',
      activities: [
        'Team skills assessment',
        'Process mapping workshop',
        'Technology audit',
        'Culture evaluation',
        'Stakeholder interviews'
      ],
      deliverables: ['Current state report', 'Gap analysis', 'Readiness assessment']
    },
    {
      phase: 2,
      title: 'Agile Strategy Design',
      duration: '1-2 weeks',
      description: 'Create a customized agile transformation roadmap aligned with your business objectives.',
      activities: [
        'Agile framework selection',
        'Team structure design',
        'Process redesign',
        'Tool stack planning',
        'Change management strategy'
      ],
      deliverables: ['Transformation roadmap', 'Implementation plan', 'Success metrics']
    },
    {
      phase: 3,
      title: 'Pilot Implementation',
      duration: '4-6 weeks',
      description: 'Launch agile practices with a pilot team to validate approach and refine processes.',
      activities: [
        'Pilot team training',
        'Sprint execution',
        'Tool implementation',
        'Process refinement',
        'Success measurement'
      ],
      deliverables: ['Pilot results', 'Process documentation', 'Lessons learned']
    },
    {
      phase: 4,
      title: 'Full-Scale Rollout',
      duration: '6-12 weeks',
      description: 'Scale agile practices across the entire marketing organization with ongoing support.',
      activities: [
        'Organization-wide training',
        'Process standardization',
        'Tool deployment',
        'Performance monitoring',
        'Continuous improvement'
      ],
      deliverables: ['Training materials', 'Standard processes', 'Performance dashboard']
    }
  ];

  const successMetrics = [
    {
      metric: 'Team Velocity',
      description: 'Story points or tasks completed per sprint',
      target: '25-40% increase within 3 months',
      icon: TrendingUp
    },
    {
      metric: 'Cycle Time',
      description: 'Time from idea to campaign launch',
      target: '50-70% reduction in delivery time',
      icon: Target
    },
    {
      metric: 'Team Satisfaction',
      description: 'Employee engagement and satisfaction scores',
      target: '20+ point improvement in surveys',
      icon: Users
    },
    {
      metric: 'Campaign Performance',
      description: 'ROI and conversion rate improvements',
      target: '30-50% improvement in key metrics',
      icon: BarChart3
    }
  ];

  const challenges = [
    {
      challenge: 'Resistance to Change',
      solution: 'Gradual implementation with strong change management and communication',
      icon: Users
    },
    {
      challenge: 'Legacy Processes',
      solution: 'Process mapping and gradual transition with hybrid approaches',
      icon: Repeat
    },
    {
      challenge: 'Tool Integration',
      solution: 'Careful tool selection and phased implementation with training',
      icon: Target
    },
    {
      challenge: 'Measuring Success',
      solution: 'Clear metrics definition and dashboard implementation',
      icon: BarChart3
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
            Agile Marketing Transformation Journey
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A structured approach to implementing agile marketing practices across your organization, 
            ensuring sustainable change and measurable results.
          </p>
        </motion.div>

        {/* Transformation Steps */}
        <div className="space-y-12 mb-20">
          {transformationSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < transformationSteps.length - 1 && (
                <div className="absolute left-8 top-20 w-1 h-20 bg-gradient-to-b from-purple-500 to-cyan-500 rounded-full" />
              )}
              
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Phase Number */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                    {step.phase}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-grow bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Info */}
                    <div className="lg:w-1/2">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm font-semibold rounded-full">
                          {step.duration}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-6">{step.description}</p>
                      
                      <h4 className="text-lg font-semibold text-white mb-3">Key Activities:</h4>
                      <ul className="space-y-2">
                        {step.activities.map((activity, activityIndex) => (
                          <li key={activityIndex} className="flex items-center text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Deliverables */}
                    <div className="lg:w-1/2">
                      <h4 className="text-lg font-semibold text-white mb-4">Deliverables:</h4>
                      <div className="space-y-3">
                        {step.deliverables.map((deliverable, deliverableIndex) => (
                          <div key={deliverableIndex} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-purple-400 font-medium">{deliverable}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Success Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Measuring Transformation Success
          </h3>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            We track specific metrics to ensure your agile transformation delivers tangible business value.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {successMetrics.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{item.metric}</h4>
                <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                <div className="text-green-400 font-semibold text-sm">{item.target}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Common Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Overcoming Common Challenges
          </h3>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            We've helped numerous organizations navigate typical agile transformation challenges.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">{item.challenge}</h4>
                    <p className="text-gray-300">{item.solution}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline Overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Typical Transformation Timeline
          </h3>
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">3-6</div>
                <div className="text-gray-300">Months for full transformation</div>
              </div>
              <ArrowDown className="w-6 h-6 text-gray-500 rotate-90 md:rotate-0" />
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">4-6</div>
                <div className="text-gray-300">Weeks to see initial results</div>
              </div>
              <ArrowDown className="w-6 h-6 text-gray-500 rotate-90 md:rotate-0" />
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">12+</div>
                <div className="text-gray-300">Months of ongoing improvement</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}