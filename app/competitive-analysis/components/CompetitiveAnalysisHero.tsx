'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Search, Shield, Trophy } from 'lucide-react';

export default function CompetitiveAnalysisHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-slate-950 to-red-900/20" />
        
        {/* Animated Analysis Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="analysis-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect x="20" y="20" width="40" height="40" fill="none" stroke="rgba(249, 115, 22, 0.3)" strokeWidth="1"/>
              <circle cx="40" cy="40" r="3" fill="rgba(249, 115, 22, 0.4)"/>
              <path d="M 40 20 L 60 40 L 40 60 L 20 40 Z" fill="none" stroke="rgba(249, 115, 22, 0.2)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#analysis-grid)" />
        </svg>
        
        {/* Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/30 rounded-full blur-3xl"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full mb-8"
        >
          <Search className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-orange-300">500+ Competitor Profiles Analyzed</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6"
        >
          <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
            Know Your Competition
          </span>
          <br />
          <span className="text-white">Win The Market</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Deep competitive intelligence and strategic analysis to uncover opportunities, threats, and winning strategies in your market
        </motion.p>

        {/* Key Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto"
        >
          {[
            { icon: Search, text: 'Deep Market Intelligence', metric: '360° Analysis' },
            { icon: Shield, text: 'Strategic Advantage', metric: '85% Win Rate' },
            { icon: Trophy, text: 'Market Leadership', metric: '3x Growth' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
              <item.icon className="w-5 h-5 text-orange-400" />
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
            href="/seo-synthesizer"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
          >
            Try AI Synthesizer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/contact?service=competitive-analysis"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
          >
            Custom Analysis
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="#case-studies"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
          >
            View Reports
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-white/10"
        >
          <p className="text-sm text-gray-400 mb-4">Trusted by market leaders</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {['MarketLeader', 'InnovateCorp', 'StrategyPro', 'CompetitiveEdge', 'WinTech'].map((company) => (
              <span key={company} className="text-gray-300 font-semibold">{company}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}