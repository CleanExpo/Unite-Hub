'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Users, 
  Target, 
  BarChart3, 
  Cog, 
  BookOpen, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function AgileServices() {
  const services = [
    {
      icon: Target,
      title: 'Agile Framework Implementation',
      description: 'Transform your marketing team with proven agile methodologies tailored to your organization.',
      features: [
        'Scrum & Kanban setup',
        'Sprint planning processes',
        'Agile tool configuration',
        'Team role definition',
        'Workflow optimization'
      ],
      link: '/agile-marketing/frameworks',
      duration: '4-6 weeks',
      investment: 'From $8,500',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Team Training & Coaching',
      description: 'Comprehensive training programs to build agile marketing capabilities within your team.',
      features: [
        'Agile marketing workshops',
        'Role-specific training',
        'Hands-on coaching',
        'Certification programs',
        'Ongoing mentorship'
      ],
      link: '/agile-marketing/team-training',
      duration: '2-3 weeks',
      investment: 'From $5,500',
      color: 'cyan'
    },
    {
      icon: TrendingUp,
      title: 'Agile Transformation',
      description: 'End-to-end organizational change management for sustainable agile marketing adoption.',
      features: [
        'Change management strategy',
        'Cultural transformation',
        'Process redesign',
        'Performance measurement',
        'Continuous improvement'
      ],
      link: '/agile-marketing/transformation',
      duration: '3-6 months',
      investment: 'From $15,000',
      color: 'green'
    },
    {
      icon: BarChart3,
      title: 'Agile Analytics Setup',
      description: 'Implement metrics and dashboards to track agile marketing performance and team velocity.',
      features: [
        'Velocity tracking setup',
        'Sprint burndown charts',
        'KPI dashboard creation',
        'Reporting automation',
        'Performance insights'
      ],
      link: '/contact',
      duration: '2-4 weeks',
      investment: 'From $4,500',
      color: 'pink'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Faster Time-to-Market',
      description: 'Launch campaigns 3x faster with sprint-based execution',
      metric: '65% reduction in campaign launch time'
    },
    {
      icon: Users,
      title: 'Improved Collaboration',
      description: 'Break down silos and enhance cross-functional teamwork',
      metric: '90% increase in team satisfaction'
    },
    {
      icon: TrendingUp,
      title: 'Better Performance',
      description: 'Continuous optimization drives superior results',
      metric: '40% improvement in campaign ROI'
    },
    {
      icon: Target,
      title: 'Enhanced Agility',
      description: 'Respond quickly to market changes and opportunities',
      metric: '80% faster response to market shifts'
    }
  ];

  return (
    <section className="py-20">
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
            Our Agile Marketing Services
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive solutions to transform your marketing team with agile methodologies, 
            from initial setup to full organizational transformation.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className={`w-16 h-16 rounded-2xl bg-${service.color}-500/20 border border-${service.color}-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className={`w-8 h-8 text-${service.color}-400`} />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-gray-300 mb-6">{service.description}</p>
              
              {/* Service Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Duration</span>
                  </div>
                  <div className="text-white font-semibold">{service.duration}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Investment</span>
                  </div>
                  <div className="text-white font-semibold">{service.investment}</div>
                </div>
              </div>
              
              {/* Features List */}
              <div className="space-y-2 mb-6">
                <h4 className="text-lg font-semibold text-white">What's Included:</h4>
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
              
              <Link
                href={service.link as any}
                className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors font-semibold"
              >
                Learn More
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-4">
            Why Choose Agile Marketing?
          </h3>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Join hundreds of Brisbane businesses that have transformed their marketing with agile methodologies.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
                <p className="text-gray-300 text-sm mb-3">{benefit.description}</p>
                <div className="text-purple-400 font-semibold text-sm">{benefit.metric}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-16"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Marketing Team?
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start your agile marketing journey with a free consultation and custom transformation roadmap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Get Free Consultation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/agile-marketing/frameworks"
              className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <BookOpen className="mr-2 w-5 h-5" />
              Explore Frameworks
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}