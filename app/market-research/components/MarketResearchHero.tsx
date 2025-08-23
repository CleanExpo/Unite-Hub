'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BarChart3, Users, Globe } from 'lucide-react';

export default function MarketResearchHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-950 to-teal-900/20" />
        
        {/* Animated Research Data Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="research-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="25" cy="25" r="2" fill="rgba(16, 185, 129, 0.4)"/>
              <circle cx="75" cy="25" r="3" fill="rgba(16, 185, 129, 0.3)"/>
              <circle cx="25" cy="75" r="2.5" fill="rgba(16, 185, 129, 0.5)"/>
              <circle cx="75" cy="75" r="2" fill="rgba(16, 185, 129, 0.3)"/>
              <path d="M 25 25 L 75 25 L 75 75 L 25 75 Z" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1"/>
              <path d="M 50 10 L 50 90" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1"/>
              <path d="M 10 50 L 90 50" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#research-grid)" />
        </svg>
        
        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/30 rounded-full blur-3xl"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-8"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">1M+ Data Points Analyzed</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Uncover Market Insights
          </span>
          <br />
          <span className="text-white">Drive Strategic Decisions</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Comprehensive market research and consumer insights that transform data into actionable strategies for sustainable business growth
        </motion.p>

        {/* Key Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
        >
          {[
            { icon: BarChart3, text: 'Data-Driven Insights', metric: '99.5% Accuracy' },
            { icon: Users, text: 'Consumer Intelligence', metric: '50K+ Surveys' },
            { icon: Globe, text: 'Global Market Coverage', metric: '100+ Countries' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <item.icon className="w-5 h-5 text-emerald-400" />
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
            href="/contact?service=market-research"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          >
            Start Your Research
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="#case-studies"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
          >
            View Research Reports
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-sm text-gray-400 mb-4">Trusted by data-driven organizations</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['InsightCorp', 'DataDriven', 'ResearchPro', 'MarketLeader', 'AnalyticEdge'].map((company) => (
              <span key={company} className="text-gray-300 font-semibold">{company}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}