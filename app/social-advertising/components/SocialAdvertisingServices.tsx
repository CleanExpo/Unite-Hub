'use client';

import { motion } from 'framer-motion';
import { Target, BarChart3, Video, Users, Palette, MessageSquare, TrendingUp, Sparkles } from 'lucide-react';

const services = [
  {
    icon: Target,
    title: 'Precision Audience Targeting',
    description: 'Advanced audience segmentation using behavioral data, lookalike audiences, and AI-driven insights',
    features: ['Custom audience creation', 'Lookalike audience modeling', 'Behavioral targeting', 'Interest-based segments'],
    color: 'from-blue-500 to-indigo-500'
  },
  {
    icon: Video,
    title: 'Creative Campaign Development',
    description: 'Compelling ad creatives that stop the scroll and drive action across all social platforms',
    features: ['Video ad production', 'Static creative design', 'Carousel campaigns', 'Story ads optimization'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics & Optimization',
    description: 'Real-time campaign monitoring with continuous optimization for maximum ROI',
    features: ['Real-time tracking', 'A/B testing campaigns', 'Conversion optimization', 'Attribution modeling'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Users,
    title: 'Multi-Platform Management',
    description: 'Coordinated campaigns across Facebook, Instagram, LinkedIn, TikTok, Twitter, and emerging platforms',
    features: ['Cross-platform strategy', 'Platform-specific optimization', 'Unified reporting', 'Budget allocation'],
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: MessageSquare,
    title: 'Social Commerce Integration',
    description: 'Seamless shopping experiences with Instagram Shopping, Facebook Shops, and social commerce features',
    features: ['Product catalog setup', 'Shopping ad campaigns', 'Dynamic retargeting', 'Social checkout optimization'],
    color: 'from-teal-500 to-cyan-500'
  },
  {
    icon: TrendingUp,
    title: 'Influencer Campaign Management',
    description: 'Strategic influencer partnerships and micro-influencer campaigns for authentic brand advocacy',
    features: ['Influencer identification', 'Campaign management', 'Performance tracking', 'Content amplification'],
    color: 'from-violet-500 to-purple-500'
  }
];

export default function SocialAdvertisingServices() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Our Social Advertising Arsenal</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Social Advertising <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Services</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive social media advertising solutions that drive engagement, conversions, and sustainable growth
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
              
              <div className="relative h-full bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${service.color} mb-6`}>
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Target className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform Expertise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h3 className="text-3xl font-bold text-white mb-8">Platform Expertise</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {[
              { name: 'Facebook', users: '2.9B+' },
              { name: 'Instagram', users: '2B+' },
              { name: 'LinkedIn', users: '900M+' },
              { name: 'TikTok', users: '1B+' },
              { name: 'Twitter', users: '450M+' },
              { name: 'YouTube', users: '2.7B+' },
              { name: 'Snapchat', users: '750M+' }
            ].map((platform, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-blue-500/50 transition-all duration-300">
                <h4 className="text-white font-semibold mb-1">{platform.name}</h4>
                <p className="text-xs text-gray-400">{platform.users} users</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}