'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Phone, Mail, Calendar, CheckCircle, Zap, Users, Target } from 'lucide-react';

export default function CTA() {
  const benefits = [
    {
      icon: Zap,
      text: 'Get your first agile sprint running in 2 weeks'
    },
    {
      icon: Users,
      text: 'Transform team collaboration and productivity'
    },
    {
      icon: Target,
      text: 'Achieve measurable improvements in 30 days'
    }
  ];

  const offerings = [
    {
      title: 'Free Consultation',
      description: 'Get expert advice on your agile marketing journey',
      action: 'Schedule Now',
      link: '/contact',
      highlight: false
    },
    {
      title: 'Quick Assessment',
      description: 'Discover your team\'s agile readiness in 15 minutes',
      action: 'Take Assessment',
      link: '/agile-marketing/assessment',
      highlight: true
    },
    {
      title: 'Download Guide',
      description: 'Free agile marketing implementation playbook',
      action: 'Download Now',
      link: '/agile-marketing/guide',
      highlight: false
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-slate-950 to-cyan-900/30" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Marketing Team?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join 150+ Brisbane businesses that have revolutionized their marketing with agile methodologies. 
            Start your transformation today and see results in weeks, not months.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center gap-3 text-gray-300"
              >
                <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <benefit.icon className="w-4 h-4 text-purple-400" />
                </div>
                <span>{benefit.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
            >
              Start Your Transformation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="tel:+61730407375"
              className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              <Phone className="mr-2 w-5 h-5" />
              Call (07) 3040 7375
            </Link>
          </motion.div>

          {/* Trust Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400 text-sm"
          >
            ⭐⭐⭐⭐⭐ Trusted by 150+ Brisbane businesses • Free consultation • No obligation
          </motion.div>
        </motion.div>

        {/* Three-Column Offerings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {offerings.map((offering, index) => (
            <div
              key={index}
              className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-8 text-center transition-all duration-300 hover:border-purple-500/50 ${
                offering.highlight 
                  ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-pink-900/20' 
                  : 'border-slate-800'
              }`}
            >
              {offering.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-white mb-3">{offering.title}</h3>
              <p className="text-gray-300 mb-6">{offering.description}</p>
              <Link
                href={offering.link as any}
                className={`inline-flex items-center px-6 py-3 font-semibold rounded-lg transition-all duration-300 ${
                  offering.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-purple-500/25'
                    : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20'
                }`}
              >
                {offering.action}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ))}
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Phone className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
              <p className="text-gray-300">(07) 3040 7375</p>
              <p className="text-gray-400 text-sm">Mon-Fri 9AM-5PM AEST</p>
            </div>
            
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Mail className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
              <p className="text-gray-300">hello@unitegroup.com.au</p>
              <p className="text-gray-400 text-sm">We respond within 2 hours</p>
            </div>
            
            <div>
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Book Meeting</h3>
              <p className="text-gray-300">Free 30-min consultation</p>
              <p className="text-gray-400 text-sm">Available this week</p>
            </div>
          </div>
        </motion.div>

        {/* Final Urgency Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center px-6 py-3 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-300 text-sm font-medium">
            <Zap className="w-4 h-4 mr-2" />
            Limited spots available for Q1 2025 transformations
          </div>
        </motion.div>
      </div>
    </section>
  );
}