'use client';

/**
 * Visual Experience Engine - Marketing Launch Page
 *
 * Showcases what Unite-Hub can do for client websites:
 * - Hero with ambient animation
 * - "What your site could look like" section
 * - "Choose your style" CTA to wizard
 * - "Show, don't explain" demo grid
 * - "Done-for-you packs" pricing/packages
 * - Final CTA
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Play,
  Check,
  Zap,
  Eye,
  Palette,
  MousePointer,
  Layers,
  Video,
  Wand2,
  Download,
  ChevronRight,
  Star,
} from 'lucide-react';

// ============================================================================
// DEMO STYLES DATA
// ============================================================================

const demoStyles = [
  {
    id: 'beam-sweep',
    name: 'Beam Sweep',
    description: 'Subtle light sweep that guides the eye',
    mood: 'Professional',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'quantum-glow',
    name: 'Quantum Glow',
    description: 'Ethereal pulsing for tech products',
    mood: 'Futuristic',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'soft-morph',
    name: 'Soft Morph',
    description: 'Gentle organic transitions',
    mood: 'Trustworthy',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'split-reveal',
    name: 'Split Reveal',
    description: 'Dramatic before/after presentations',
    mood: 'Impactful',
    color: 'from-orange-500 to-red-500',
  },
];

const features = [
  {
    icon: Eye,
    title: '50+ Animation Styles',
    description: 'Curated library of professional animations ready to deploy',
  },
  {
    icon: Palette,
    title: 'Persona-Matched',
    description: 'Styles tailored for trades, corporate, SaaS, creative, and more',
  },
  {
    icon: MousePointer,
    title: 'Interactive Effects',
    description: 'Cursor spotlights, magnetic elements, and hover magic',
  },
  {
    icon: Layers,
    title: 'Accessibility First',
    description: 'All animations respect reduced motion and avoid triggers',
  },
];

const packages = [
  {
    name: 'Starter',
    price: '495',
    description: 'Essential animations for small business sites',
    features: [
      '5 animation styles',
      'Hero section animation',
      'Card hover effects',
      'Basic transitions',
      'Mobile optimized',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: '895',
    description: 'Complete visual overhaul for growing brands',
    features: [
      '15 animation styles',
      'Full page animations',
      'Cursor spotlight effect',
      'Scroll-triggered reveals',
      'Custom timing presets',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '1,295',
    description: 'Premium experience for maximum impact',
    features: [
      'All 50+ animation styles',
      '3D visual elements',
      'Video backgrounds',
      'Custom style development',
      'Performance optimization',
      'Dedicated support',
      'Quarterly updates',
    ],
    popular: false,
  },
];

// ============================================================================
// HERO SECTION
// ============================================================================

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

      {/* Animated Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-white/80">Visual Experience Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Make Your Website{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Unforgettable
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-10">
            Premium animations that captivate visitors, build trust, and convert.
            No design skills needed. Just pick your style.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/wizard/animation-style"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              Find Your Style
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/inspiration"
              className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              <Play className="w-5 h-5" />
              Browse Gallery
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <div className="w-1.5 h-3 rounded-full bg-white/40" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// WHAT YOUR SITE COULD LOOK LIKE
// ============================================================================

function TransformationSection() {
  const [activeStyle, setActiveStyle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStyle((prev) => (prev + 1) % demoStyles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            What Your Site Could Look Like
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            See how different animation styles transform the same content
          </p>
        </motion.div>

        {/* Demo Display */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Preview Window */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/10"
          >
            {/* Browser Chrome */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800/50 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4">
                <div className="h-5 bg-slate-700/50 rounded-lg" />
              </div>
            </div>

            {/* Animated Content */}
            <div className="absolute inset-0 pt-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStyle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-full p-8 flex flex-col justify-center"
                >
                  <motion.div
                    className={`h-2 w-24 rounded-full bg-gradient-to-r ${demoStyles[activeStyle].color} mb-4`}
                    initial={{ width: 0 }}
                    animate={{ width: 96 }}
                    transition={{ duration: 0.8 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white mb-2"
                  >
                    Your Business Name
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/60 mb-6"
                  >
                    Premium services for discerning clients
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className={`inline-flex px-6 py-2 rounded-lg bg-gradient-to-r ${demoStyles[activeStyle].color} text-white font-medium w-fit`}
                  >
                    Get Started
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Style Selector */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {demoStyles.map((style, index) => (
              <button
                key={style.id}
                onClick={() => setActiveStyle(index)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activeStyle === index
                    ? 'bg-white/10 border border-white/20'
                    : 'bg-white/5 border border-transparent hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${style.color}`}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">{style.name}</div>
                    <div className="text-sm text-white/50">{style.description}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/40">
                    {style.mood}
                  </span>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES GRID
// ============================================================================

function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            A complete animation system designed for real business results
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-white/50">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// DEMO GRID (Show, don't explain)
// ============================================================================

function DemoGridSection() {
  return (
    <section className="py-24 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Show, Don't Explain
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Browse our library of ready-to-use animation demos
          </p>
        </motion.div>

        {/* Demo Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Hero Animations', count: 12, icon: Zap },
            { title: 'Card Effects', count: 15, icon: Layers },
            { title: 'Page Transitions', count: 10, icon: ArrowRight },
            { title: 'Cursor Effects', count: 7, icon: MousePointer },
            { title: 'Background FX', count: 9, icon: Video },
            { title: 'Scroll Reveals', count: 8, icon: Eye },
          ].map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 cursor-pointer"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                <category.icon className="w-10 h-10 text-white/20 group-hover:text-indigo-400 transition-colors mb-4" />
                <h3 className="text-xl font-semibold text-white mb-1">
                  {category.title}
                </h3>
                <p className="text-white/40">{category.count} animations</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/inspiration"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            View Full Gallery
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================

function PricingSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Done-For-You Animation Packs
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Professional animations implemented on your site. One-time investment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                pkg.popular
                  ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/10 border-2 border-indigo-500/50'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-white mb-2">{pkg.name}</h3>
                <p className="text-white/50 text-sm mb-4">{pkg.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">${pkg.price}</span>
                  <span className="text-white/40">AUD</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-white/70">
                    <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-white/40 text-sm mt-8">
          All prices in AUD. One-time payment. No monthly fees.
        </p>
      </div>
    </section>
  );
}

// ============================================================================
// FINAL CTA
// ============================================================================

function FinalCTASection() {
  return (
    <section className="py-24 bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-8">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Website?
          </h2>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Take our 2-minute style quiz and discover the perfect animations
            for your brand.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/wizard/animation-style"
              className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              Start the Style Quiz
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#"
              className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Style Guide
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function VisualExperienceEnginePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold">Unite-Hub</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/inspiration" className="text-white/60 hover:text-white transition-colors">
              Gallery
            </Link>
            <Link href="/wizard/animation-style" className="text-white/60 hover:text-white transition-colors">
              Style Quiz
            </Link>
            <a href="#pricing" className="text-white/60 hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <Link
            href="/wizard/animation-style"
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Sections */}
      <HeroSection />
      <TransformationSection />
      <FeaturesSection />
      <DemoGridSection />
      <section id="pricing">
        <PricingSection />
      </section>
      <FinalCTASection />

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center text-white/40 text-sm">
          <p>&copy; {new Date().getFullYear()} Unite-Hub. All animations designed with accessibility in mind.</p>
        </div>
      </footer>
    </div>
  );
}
