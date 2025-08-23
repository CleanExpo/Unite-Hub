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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-3xl" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative bg-slate-900/80 backdrop-blur-sm border border-blue-500/20 rounded-3xl p-12 md:p-16">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: "spring" }}
                className="inline-flex p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 mb-6"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Dominate Social Media?</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of businesses that have transformed their social presence and achieved remarkable growth with our data-driven advertising strategies
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link
                  href="/contact?service=social-advertising"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                >
                  Launch Your Campaign
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                
                <Link
                  href="/consultation"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-300"
                >
                  <Calendar className="mr-2 w-5 h-5" />
                  Free Strategy Session
                </Link>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center pt-8 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  <Link href="/social-advertising/guide" className="text-blue-400 hover:text-blue-300 transition-colors">
                    Download Social Advertising Guide
                  </Link>
                </div>
                
                <div className="text-gray-400">
                  Or call us: <a href="tel:+61730000000" className="text-white hover:text-blue-400 transition-colors">+61 7 3000 0000</a>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-12 pt-8 border-t border-slate-800">
                <p className="text-sm text-gray-400 mb-4">Proven results across industries</p>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">8.7x</p>
                    <p className="text-xs text-gray-400">Average ROAS</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">$50M+</p>
                    <p className="text-xs text-gray-400">Ad Spend Managed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">2.5M+</p>
                    <p className="text-xs text-gray-400">Customers Acquired</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-xs text-gray-400">Campaigns Launched</p>
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