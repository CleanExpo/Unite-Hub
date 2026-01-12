'use client';

/**
 * Animation Demos Page
 *
 * Showcases all video demonstrations of animation styles.
 * Filterable by category and audience persona.
 */

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Video } from 'lucide-react';
import { VideoDemoGrid } from '@/components/visual/VideoDemoGrid';

export default function DemosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-indigo-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/inspiration"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Gallery</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Video className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-white font-medium">Animation Demos</span>
          </div>

          <Link
            href="/visual-experience-engine"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Learn More
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-white/80">Video Demonstrations</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              See Animations in Action
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Watch short demonstrations of each animation style.
              See how they look on real websites before you choose.
            </p>
          </motion.div>

          {/* Demo Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <VideoDemoGrid showFilters={true} columns={3} />
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex flex-col sm:flex-row gap-4">
              <Link
                href="/wizard/animation-style"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Find Your Style
              </Link>
              <Link
                href="/visual-experience-engine"
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                View Packages
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
