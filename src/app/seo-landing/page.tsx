/**
 * Modern SaaS Landing Page - 2025 Best Practices
 * Inspired by: Airtable, Asana, Linear, Notion, Mixpanel
 * Focus: Clean, visual, high-conversion, modern aesthetics
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ModernSEOLanding() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Unite-Hub
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#demo" className="hover:text-gray-900">Demo</a>
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Modern, Clean */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              43 AI Agents • Project Vend Phase 2 Enhanced
            </div>

            {/* Headline */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Marketing automation
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                that costs $0.05/email
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Stop paying agencies $5,000/month. Our AI agents process emails, generate content, and run campaigns automatically.
              <strong className="text-gray-900"> 100% open source.</strong>
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/login" className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-600/30">
                Start free trial →
              </Link>
              <Link href="/agents" className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-xl font-semibold text-lg hover:border-gray-300 transition-all">
                View live dashboard
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>

          {/* Hero Visual - Architecture Diagram */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <img
                src="/generated-assets/unite-hub-architecture.svg"
                alt="Unite-Hub Architecture"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by businesses across Australia
          </p>
          <div className="flex items-center justify-center gap-12 opacity-50">
            <div className="text-2xl font-bold text-gray-400">Gold Coast Glass</div>
            <div className="text-2xl font-bold text-gray-400">Perth Plumbing</div>
            <div className="text-2xl font-bold text-gray-400">Melbourne Bricklaying</div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - Visual First */}
      <section id="demo" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Stop overpaying for marketing
            </h2>
            <p className="text-xl text-gray-600">
              Traditional agencies vs AI automation
            </p>
          </div>

          {/* Comparison Visual - Large and Prominent */}
          <div className="mb-12">
            <img
              src="/generated-assets/client-vs-agency-comparison.svg"
              alt="Cost comparison"
              className="w-full max-w-4xl mx-auto rounded-2xl shadow-2xl"
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">100x</div>
              <div className="text-sm text-gray-600">Cheaper than agencies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">Real-time</div>
              <div className="text-sm text-gray-600">vs 2-3 weeks</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-600 mb-2">Open</div>
              <div className="text-sm text-gray-600">Source on GitHub</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Set up in 15 minutes
            </h2>
            <p className="text-xl text-gray-600">
              Connect Gmail, AI handles the rest
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '/generated-assets/step-1-connect-gmail.svg', title: 'Connect', desc: 'Link your Gmail in 2 minutes' },
              { icon: '/generated-assets/step-2-ai-analyzes.svg', title: 'AI Analyzes', desc: 'Intent & sentiment extraction' },
              { icon: '/generated-assets/step-4-generate-responses.svg', title: 'Generate', desc: 'Personalized content creation' },
              { icon: '/generated-assets/step-5-track-performance.svg', title: 'Monitor', desc: 'Real-time performance tracking' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 p-4 bg-white rounded-2xl shadow-lg">
                  <img src={step.icon} alt={step.title} className="w-full h-full" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Transparency - Visual */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              100% open source
            </h2>
            <p className="text-xl text-gray-600">
              Every line of code on GitHub
            </p>
          </div>

          <img
            src="/generated-assets/github-social-proof.svg"
            alt="GitHub to production"
            className="w-full rounded-2xl shadow-2xl mb-12"
          />

          <div className="text-center">
            <a
              href="https://github.com/CleanExpo/Unite-Hub"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Technology - Project Vend Phase 2 */}
      <section className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Self-improving AI system
            </h2>
            <p className="text-xl text-gray-600">
              Built on Anthropic's Project Vend research
            </p>
          </div>

          <img
            src="/generated-assets/project-vend-phase2-overview.svg"
            alt="Project Vend Phase 2"
            className="w-full rounded-2xl shadow-2xl mb-12"
          />

          {/* Feature Grid - Modern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Real-time metrics', desc: 'Track every execution, cost, and success rate', color: 'blue' },
              { title: 'Business rules', desc: '18 constraints prevent naive decisions', color: 'purple' },
              { title: 'Auto verification', desc: '7 checks catch errors before applying', color: 'pink' },
              { title: 'Smart escalations', desc: 'Approval workflows for critical actions', color: 'orange' },
              { title: 'Cost control', desc: 'Budget limits prevent runaway spending', color: 'green' },
              { title: 'Self-healing', desc: 'Health monitoring with degradation detection', color: 'indigo' }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 text-center">
            <div className="mb-6">
              <div className="text-6xl font-bold text-gray-900 mb-2">
                $0.05
                <span className="text-2xl text-gray-600 font-normal">/email</span>
              </div>
              <p className="text-gray-600">Plus optional AI model costs (~$0.01/email)</p>
            </div>

            <ul className="text-left max-w-md mx-auto space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700">Unlimited agents (all 43 included)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700">Real-time dashboard & monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700">Full source code access (GitHub)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-gray-700">Cancel anytime, no contract</span>
              </li>
            </ul>

            <Link href="/login" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg">
              Start free trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to automate your marketing?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Join Logan, Brisbane, and Queensland businesses saving 20+ hours/week
          </p>
          <Link href="/login" className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-xl">
            Start free trial - no credit card required
          </Link>
          <p className="mt-6 text-sm opacity-75">
            🇦🇺 Australian company • Queensland support • 14-day free trial
          </p>
        </div>
      </section>
    </div>
  );
}
