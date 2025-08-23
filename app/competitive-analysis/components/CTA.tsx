'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Calendar, Download, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 via-red-900/20 to-pink-900/20 rounded-3xl" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
          
          <div className="relative bg-slate-900/80 backdrop-blur-sm border border-orange-500/20 rounded-3xl p-12 md:p-16">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 mb-6"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Outsmart Your Competition?</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8">
                Gain the strategic advantage you need to dominate your market with comprehensive competitive intelligence and actionable insights
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/contact?service=competitive-analysis"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-orange-500/25"
                >
                  Start Your Analysis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
                >
                  <Calendar className="mr-2 w-5 h-5" />
                  Schedule Strategy Call
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-orange-400" />
                  <Link href="/competitive-analysis/guide" className="text-orange-400 hover:text-orange-300 transition-colors">
                    Download Competitive Analysis Guide
                  </Link>
                </div>
                
                <div className="text-gray-400">
                  Or call us: <a href="tel:+61730000000" className="text-white hover:text-orange-400 transition-colors">+61 7 3000 0000</a>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-12 pt-8 border-t border-slate-800">
                <p className="text-sm text-gray-400 mb-4">Trusted by market leaders across industries</p>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-xs text-gray-400">Competitors Analyzed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">85%</p>
                    <p className="text-xs text-gray-400">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">50+</p>
                    <p className="text-xs text-gray-400">Industries Covered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">98%</p>
                    <p className="text-xs text-gray-400">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}