'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Megaphone } from 'lucide-react';

export default function SocialAdvertisingHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
        
        {/* Animated Social Network Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="social-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="2" fill="rgba(59, 130, 246, 0.3)"/>
              <path d="M 30 15 L 45 30 L 30 45 L 15 30 Z" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#social-grid)" />
        </svg>
        
        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Metrics Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-8"
        >
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">8.7x Average ROAS Achieved</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dominate Social Media
          </span>
          <br />
          <span className="text-white">With Precision Advertising</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Data-driven social advertising campaigns that convert audiences into customers across Facebook, Instagram, LinkedIn, TikTok, and more
        </motion.p>

        {/* Key Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
        >
          {[
            { icon: Users, text: 'Precision Targeting', metric: '99% Relevance' },
            { icon: TrendingUp, text: 'ROI Optimization', metric: '8.7x ROAS' },
            { icon: Megaphone, text: 'Multi-Platform', metric: '15+ Channels' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <item.icon className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="text-sm text-gray-400">{item.text}</p>
                <p className="text-lg font-bold text-white">{item.metric}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/contact?service=social-advertising"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            Launch Your Campaign
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="#case-studies"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
          >
            View Campaign Results
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-sm text-gray-400 mb-4">Trusted by leading brands</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['Fashion Forward', 'TechCorp', 'HealthPlus', 'RetailMax', 'ServicePro'].map((company) => (
              <span key={company} className="text-gray-300 font-semibold">{company}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}