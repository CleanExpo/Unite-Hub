'use client';

/**
 * Animation Style Wizard Page
 *
 * Interactive wizard to help clients discover their ideal animation styles.
 * Produces a StyleProfile for use by sales and orchestrator.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AnimationStyleWizard } from '@/components/visual/AnimationStyleWizard';
import { StyleProfile } from '@/lib/visual/styleProfile';

export default function AnimationStyleWizardPage() {
  const [completedProfile, setCompletedProfile] = useState<StyleProfile | null>(null);

  const handleComplete = (profile: StyleProfile) => {
    setCompletedProfile(profile);
    // Could save to localStorage or send to API
    localStorage.setItem('animation-style-profile', JSON.stringify(profile));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
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
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-white font-medium">Style Wizard</span>
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
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Find Your Perfect Animation Style
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Answer 5 quick questions and we'll recommend the animation styles
              that best match your brand and audience.
            </p>
          </motion.div>

          {/* Wizard Component */}
          <AnimationStyleWizard
            onComplete={handleComplete}
            clientName="Your Brand"
          />

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-white/40">
              Your preferences are saved locally. No account required.
            </p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white/30">
              <span>50+ Animation Styles</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>6 Audience Personas</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Instant Recommendations</span>
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
