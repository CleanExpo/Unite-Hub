'use client';

import { motion } from 'framer-motion';
import { Zap, Beaker, Share2, BarChart3, Magnet, RefreshCw, Target, Sparkles } from 'lucide-react';

const services = [
  {
    icon: Beaker,
    title: 'Rapid Experimentation',
    description: 'A/B testing, multivariate testing, and continuous optimization across all touchpoints',
    features: ['Weekly experiments', 'Statistical significance', 'Conversion optimization', 'User behavior analysis'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Share2,
    title: 'Viral Marketing Loops',
    description: 'Engineer viral mechanics and referral programs that drive exponential user growth',
    features: ['Referral programs', 'Social sharing optimization', 'Viral coefficient tracking', 'Network effects'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: BarChart3,
    title: 'Growth Analytics',
    description: 'Advanced analytics setup with cohort analysis, attribution modeling, and predictive insights',
    features: ['Pirate metrics (AARRR)', 'Cohort analysis', 'Attribution modeling', 'Predictive analytics'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Magnet,
    title: 'Product-Led Growth',
    description: 'Transform your product into your primary growth engine with PLG strategies',
    features: ['Freemium optimization', 'Onboarding flows', 'Feature adoption', 'Usage expansion'],
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: RefreshCw,
    title: 'Retention & Engagement',
    description: 'Maximize LTV through scientific retention strategies and engagement optimization',
    features: ['Churn prediction', 'Re-engagement campaigns', 'Habit formation', 'Loyalty programs'],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Target,
    title: 'Acquisition Channels',
    description: 'Identify and scale your most efficient customer acquisition channels',
    features: ['Channel testing', 'CAC optimization', 'Paid growth strategies', 'Organic growth tactics'],
    color: 'from-pink-500 to-rose-500'
  }
];

export default function GrowthServices() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Our Growth Arsenal</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Growth Hacking <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Services</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Scientific methodologies and battle-tested strategies to accelerate your growth trajectory
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                  '--tw-gradient-from': service.color.split(' ')[1],
                  '--tw-gradient-to': service.color.split(' ')[3],
                } as any}
              />
              
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${service.color} mb-6`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}