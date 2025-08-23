'use client';

import { motion } from 'framer-motion';
import { Star, Quote, TrendingUp, Users, Target, BarChart3 } from 'lucide-react';

export default function AgileSuccess() {
  const caseStudies = [
    {
      company: 'TechStart Brisbane',
      industry: 'SaaS Platform',
      challenge: 'Slow campaign delivery and poor cross-team collaboration',
      solution: 'Implemented Scrum for Marketing with 2-week sprints',
      results: [
        '65% faster campaign launches',
        '40% improvement in lead quality',
        '90% team satisfaction increase',
        '3x more experiments per quarter'
      ],
      testimonial: 'Agile marketing transformed our entire approach. We\'re now launching campaigns in weeks instead of months.',
      author: 'Sarah Chen, CMO',
      avatar: '/placeholder-user.jpg',
      metrics: {
        velocity: '+65%',
        satisfaction: '90%',
        experiments: '3x'
      }
    },
    {
      company: 'RetailPlus Australia',
      industry: 'E-commerce',
      challenge: 'Inability to respond quickly to market trends',
      solution: 'Kanban workflow optimization with weekly sprint reviews',
      results: [
        '50% reduction in time-to-market',
        '35% increase in campaign ROI',
        '80% faster response to trends',
        '25% more campaigns delivered'
      ],
      testimonial: 'The agile approach helped us capitalize on trending topics and seasonal opportunities like never before.',
      author: 'Michael Torres, Marketing Director',
      avatar: '/placeholder-user.jpg',
      metrics: {
        timeToMarket: '-50%',
        roi: '+35%',
        campaigns: '+25%'
      }
    }
  ];

  const testimonials = [
    {
      quote: 'Unite Group\'s agile marketing training completely revolutionized our team dynamics. We\'re more collaborative, faster, and our results speak for themselves.',
      author: 'Jessica Park',
      title: 'Head of Marketing, InnovateBrisbane',
      rating: 5
    },
    {
      quote: 'The transformation was incredible. From 3-month campaign cycles to 2-week sprints. Our agility in the market has become our competitive advantage.',
      author: 'David Kim',
      title: 'Marketing Manager, Growth Labs',
      rating: 5
    },
    {
      quote: 'Best investment we made this year. The team is happier, more productive, and our campaigns perform significantly better.',
      author: 'Amanda Rodriguez',
      title: 'VP Marketing, ScaleUp Solutions',
      rating: 5
    }
  ];

  const stats = [
    { label: 'Teams Transformed', value: '150+', icon: Users },
    { label: 'Average Velocity Increase', value: '65%', icon: TrendingUp },
    { label: 'Client Satisfaction', value: '98%', icon: Star },
    { label: 'Campaign ROI Improvement', value: '40%', icon: Target }
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
            Agile Marketing Success Stories
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how Brisbane businesses have transformed their marketing teams and achieved 
            remarkable results with our agile marketing methodologies.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <stat.icon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Case Studies */}
        <div className="space-y-16 mb-20">
          {caseStudies.map((study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Content */}
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                      {study.company.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{study.company}</h3>
                      <div className="text-purple-400">{study.industry}</div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Challenge:</h4>
                      <p className="text-gray-300">{study.challenge}</p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Solution:</h4>
                      <p className="text-gray-300">{study.solution}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <Quote className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-gray-300 italic mb-3">"{study.testimonial}"</p>
                    <div className="text-white font-semibold">{study.author}</div>
                  </div>
                </div>

                {/* Results */}
                <div className="bg-slate-950/50 p-8">
                  <h4 className="text-2xl font-bold text-white mb-6">Results Achieved:</h4>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {Object.entries(study.metrics).map(([key, value], metricIndex) => (
                      <div key={metricIndex} className="text-center">
                        <div className="text-2xl font-bold text-green-400 mb-1">{value}</div>
                        <div className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      </div>
                    ))}
                  </div>

                  {/* Detailed Results */}
                  <div className="space-y-3">
                    {study.results.map((result, resultIndex) => (
                      <div key={resultIndex} className="flex items-center text-gray-300">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-3 flex-shrink-0" />
                        {result}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Client Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8"
        >
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            What Our Clients Say
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star key={starIndex} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <Quote className="w-6 h-6 text-purple-400 mb-3" />
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="text-white font-semibold">{testimonial.author}</div>
                  <div className="text-gray-400 text-sm">{testimonial.title}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Industry Recognition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-8">
            Recognized Agile Marketing Expertise
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-white font-semibold">Certified Scrum Master</div>
              <div className="text-gray-400 text-sm">Professional Certification</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-white font-semibold">Agile Marketing Alliance</div>
              <div className="text-gray-400 text-sm">Member Organization</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-white font-semibold">Brisbane Business Awards</div>
              <div className="text-gray-400 text-sm">Innovation Category</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-white font-semibold">Marketing Institute</div>
              <div className="text-gray-400 text-sm">Certified Partner</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}