'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Brain, 
  Cloud, 
  Shield, 
  Zap, 
  BarChart3,
  Users,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'Teams-Style Messaging',
    description: 'Real-time collaboration with channels, threads, and file sharing',
    badge: 'New',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    icon: <Brain className="h-8 w-8" />,
    title: 'AI-Powered Analytics',
    description: 'Predictive insights and automated decision-making powered by advanced AI',
    badge: 'Popular',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    icon: <Cloud className="h-8 w-8" />,
    title: 'Cloud Infrastructure',
    description: 'Scalable, secure cloud solutions with 99.9% uptime guarantee',
    badge: null,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SSO, and compliance certifications',
    badge: 'SOC2',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Lightning Fast',
    description: 'Optimized performance with sub-second response times',
    badge: null,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Advanced Reporting',
    description: 'Comprehensive dashboards and custom report generation',
    badge: null,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Team Collaboration',
    description: 'Built for teams with role-based access and permissions',
    badge: null,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  {
    icon: <Lock className="h-8 w-8" />,
    title: 'Data Privacy',
    description: 'GDPR compliant with full data ownership and control',
    badge: 'GDPR',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: 'Global Scale',
    description: 'Multi-region deployment with localization support',
    badge: null,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  }
]

export default function FeatureShowcase() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-2 bg-blue-100 rounded-full mb-4">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Enterprise-Grade Solutions for Digital Excellence
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unite Group delivers cutting-edge technology solutions that empower businesses to 
            achieve operational excellence, drive innovation, and accelerate growth in today's competitive market.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-gray-100">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <div className={feature.color}>{feature.icon}</div>
                    </div>
                    {feature.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Plus Many More Features
          </h3>
          <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
            API integrations, webhook support, custom workflows, mobile apps, 
            and everything else you need to run your business efficiently.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {['API Access', 'Webhooks', 'Mobile Apps', 'Custom Fields', 'Automation', 'Integrations'].map((item) => (
              <Badge key={item} variant="secondary" className="bg-white/20 text-white border-white/30">
                {item}
              </Badge>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
