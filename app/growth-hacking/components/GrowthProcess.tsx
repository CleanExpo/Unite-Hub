'use client';

import { motion } from 'framer-motion';
import { Search, Lightbulb, Rocket, BarChart, RefreshCw } from 'lucide-react';

const processSteps = [
  {
    icon: Search,
    phase: 'Phase 1',
    title: 'Growth Audit',
    description: 'Deep dive into your metrics, identify bottlenecks, and uncover hidden growth opportunities',
    duration: 'Week 1',
    deliverables: ['Current state analysis', 'Growth opportunities map', 'Benchmark report', 'Priority matrix']
  },
  {
    icon: Lightbulb,
    phase: 'Phase 2',
    title: 'Hypothesis Design',
    description: 'Formulate data-driven hypotheses and design experiments for maximum impact',
    duration: 'Week 2',
    deliverables: ['Experiment backlog', 'ICE prioritization', 'Test protocols', 'Success metrics']
  },
  {
    icon: Rocket,
    phase: 'Phase 3',
    title: 'Rapid Testing',
    description: 'Launch multiple experiments simultaneously and gather actionable insights',
    duration: 'Weeks 3-4',
    deliverables: ['A/B test results', 'User behavior data', 'Conversion insights', 'Quick wins']
  },
  {
    icon: BarChart,
    phase: 'Phase 4',
    title: 'Scale Winners',
    description: 'Double down on successful experiments and scale proven growth tactics',
    duration: 'Weeks 5-8',
    deliverables: ['Scaling playbook', 'Growth automation', 'Channel optimization', 'ROI tracking']
  },
  {
    icon: RefreshCw,
    phase: 'Phase 5',
    title: 'Iterate & Optimize',
    description: 'Continuous improvement through ongoing experimentation and optimization',
    duration: 'Ongoing',
    deliverables: ['Monthly reports', 'New experiments', 'Optimization cycles', 'Growth forecasts']
  }
];

export default function GrowthProcess() {
  return (
    <section className="py-20 bg-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The Growth Hacking <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Process</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Our proven 5-phase methodology for achieving sustainable, exponential growth
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-purple-500 via-pink-500 to-cyan-500 opacity-20" />

          <div className="space-y-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              >
                <div className="relative w-full lg:w-5/12">
                  <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="text-sm text-purple-400 font-semibold">{step.phase}</span>
                        <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{step.description}</p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm text-purple-300">
                        {step.duration}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-300">Key Deliverables:</p>
                      <ul className="grid grid-cols-2 gap-2">
                        {step.deliverables.map((deliverable, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex items-start gap-1">
                            <span className="text-purple-400 mt-1">•</span>
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:right-[-2.5rem] w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}