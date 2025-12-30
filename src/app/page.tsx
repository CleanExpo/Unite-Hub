/**
 * Professional SaaS Landing Page
 * Inspired by Linear, Vercel, Stripe
 * Modern, minimal, high-converting
 */

'use client';

import Link from 'next/link';

export default function ProfessionalLanding() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header - Minimal like Linear */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold" aria-label="Unite-Hub homepage">Unite-Hub</Link>

          <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
            <a href="#product" className="text-text-secondary hover:text-text-primary transition-colors">Product</a>
            <a href="#technology" className="text-text-secondary hover:text-text-primary transition-colors">Technology</a>
            <a href="/agents" className="text-text-secondary hover:text-text-primary transition-colors">Dashboard</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="px-4 py-2 bg-bg-card text-text-primary text-sm font-medium rounded-lg hover:bg-bg-subtle transition-colors border border-border-base" aria-label="Start your free trial">
              Start trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Clean like Vercel */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-subtle border border-border-subtle text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
              <span className="text-text-secondary">43 AI Agents • Enhanced with Project Vend Phase 2</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1]">
            <span className="block">Marketing automation</span>
            <span className="block bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 bg-clip-text text-transparent">
              for $0.05 per email
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-xl text-text-secondary max-w-2xl mx-auto mb-12">
            Stop paying agencies $5,000/month. AI processes your emails, generates content, and runs campaigns automatically.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/login" className="px-6 py-3 bg-accent-500 text-text-primary font-medium rounded-lg hover:bg-accent-600 transition-all" aria-label="Start your 14-day free trial">
              Start free trial →
            </Link>
            <Link href="/agents" className="px-6 py-3 border border-border-base text-text-primary font-medium rounded-lg hover:bg-bg-subtle transition-all" aria-label="View our live agent performance dashboard">
              View live dashboard
            </Link>
          </div>

          {/* Hero Visual - Comparison */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 via-accent-400/20 to-accent-600/20 blur-3xl"></div>

            {/* Visual */}
            <div className="relative bg-bg-subtle backdrop-blur-sm border border-border-subtle rounded-2xl p-8">
              <img
                src="/generated-assets/client-vs-agency-comparison.svg"
                alt="Cost comparison showing traditional marketing agencies at $5,000 per month versus Unite-Hub AI automation at only $0.05 per email processed"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip - Clean */}
      <section className="border-y border-border-subtle py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">43</div>
              <div className="text-sm text-text-secondary">AI Agents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">$0.05</div>
              <div className="text-sm text-text-secondary">Per Email</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-sm text-text-secondary">Open Source</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">Real-time</div>
              <div className="text-sm text-text-secondary">Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Minimal */}
      <section id="product" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-20 text-center">
            Set up in <span className="text-blue-400">15 minutes</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: '/generated-assets/step-1-connect-gmail.svg', title: 'Connect', desc: '2 min' },
              { icon: '/generated-assets/step-2-ai-analyzes.svg', title: 'AI analyzes', desc: 'Automatic' },
              { icon: '/generated-assets/step-4-generate-responses.svg', title: 'Generate', desc: 'Automatic' },
              { icon: '/generated-assets/step-5-track-performance.svg', title: 'Monitor', desc: 'Real-time' }
            ].map((step, i) => (
              <div key={i} className="group">
                <div className="mb-6 p-6 bg-bg-subtle rounded-2xl border border-border-subtle group-hover:bg-white/10 group-hover:border-border-base transition-all">
                  <img src={step.icon} alt={step.title} className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture - Clean */}
      <section id="technology" className="py-24 px-6 border-t border-border-subtle">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Enterprise technology,
              <br />
              <span className="text-text-secondary">small business pricing</span>
            </h2>
          </div>

          {/* Architecture Diagram */}
          <div className="bg-bg-subtle rounded-2xl p-8 border border-border-subtle mb-16">
            <img
              src="/generated-assets/unite-hub-architecture.svg"
              alt="Architecture"
              className="w-full h-auto"
            />
          </div>

          {/* Tech Stack */}
          <div className="grid grid-cols-3 gap-6">
            <div className="p-6 bg-bg-subtle rounded-xl border border-border-subtle">
              <div className="text-sm text-blue-400 font-medium mb-2">Layer 1</div>
              <h3 className="text-lg font-semibold mb-2">Next.js 16</h3>
              <p className="text-sm text-text-secondary">App Router, React 19, 100+ API routes</p>
            </div>

            <div className="p-6 bg-bg-subtle rounded-xl border border-border-subtle">
              <div className="text-sm text-purple-400 font-medium mb-2">Layer 2</div>
              <h3 className="text-lg font-semibold mb-2">43 AI Agents</h3>
              <p className="text-sm text-text-secondary">Email, Content, Orchestration + Phase 2</p>
            </div>

            <div className="p-6 bg-bg-subtle rounded-xl border border-border-subtle">
              <div className="text-sm text-pink-400 font-medium mb-2">Layer 3</div>
              <h3 className="text-lg font-semibold mb-2">Supabase</h3>
              <p className="text-sm text-text-secondary">PostgreSQL, RLS, Real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Vend Phase 2 - Visual */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built on Anthropic's research
            </h2>
            <p className="text-xl text-text-secondary">
              Project Vend Phase 2: Self-improving autonomous system
            </p>
          </div>

          <div className="bg-bg-subtle rounded-2xl p-8 border border-border-subtle">
            <img
              src="/generated-assets/project-vend-phase2-overview.svg"
              alt="Project Vend Phase 2"
              className="w-full h-auto"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-6 mt-12">
            {[
              { label: 'Metrics', value: '✓' },
              { label: 'Rules', value: '✓' },
              { label: 'Verification', value: '✓' },
              { label: 'Escalations', value: '✓' },
              { label: 'Budgets', value: '✓' }
            ].map((item, i) => (
              <div key={i} className="text-center p-4 bg-bg-subtle rounded-lg border border-border-subtle">
                <div className="text-2xl mb-2">{item.value}</div>
                <div className="text-sm text-text-secondary">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub - Clean */}
      <section className="py-24 px-6 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Open source from day one
            </h2>
            <p className="text-xl text-text-secondary">
              14,000+ lines of TypeScript. 136 tests. Production-ready.
            </p>
          </div>

          <div className="bg-bg-subtle rounded-2xl p-8 border border-border-subtle mb-8">
            <img
              src="/generated-assets/github-social-proof.svg"
              alt="GitHub"
              className="w-full h-auto"
            />
          </div>

          <div className="text-center">
            <a
              href="https://github.com/CleanExpo/Unite-Hub"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-text-primary font-medium rounded-lg hover:bg-accent-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Simple Pricing */}
      <section className="py-24 px-6 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple pricing
          </h2>
          <p className="text-xl text-text-secondary mb-16">
            No contracts. Cancel anytime.
          </p>

          <div className="inline-block p-12 bg-bg-subtle rounded-2xl border border-border-subtle">
            <div className="text-6xl font-bold mb-2">
              $0.05
              <span className="text-2xl text-text-secondary font-normal">/email</span>
            </div>
            <p className="text-text-secondary mb-8">Plus AI costs (~$0.01/email)</p>

            <div className="space-y-3 text-left mb-8">
              {[
                'All 43 AI agents included',
                'Unlimited emails',
                'Real-time dashboard',
                'Full GitHub access',
                'Cancel anytime'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-text-secondary">{feature}</span>
                </div>
              ))}
            </div>

            <Link href="/login" className="block w-full px-6 py-3 bg-accent-500 text-text-primary font-semibold rounded-lg hover:bg-accent-600 transition-colors">
              Start 14-day free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA - Clean */}
      <section className="py-32 px-6 border-t border-border-subtle">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Start automating today
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join Logan, Brisbane, and Queensland businesses using AI
          </p>
          <Link href="/login" className="inline-block px-8 py-4 bg-accent-500 text-text-primary font-semibold rounded-lg hover:bg-accent-600 transition-colors text-lg">
            Start free trial
          </Link>
          <p className="mt-6 text-sm text-text-tertiary">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-border-subtle py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-text-secondary">
              © 2025 Unite-Hub • Logan, Brisbane, QLD • Open Source
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/agents" className="hover:text-text-primary transition-colors">Dashboard</Link>
              <a href="https://github.com/CleanExpo/Unite-Hub" target="_blank" className="hover:text-text-primary transition-colors">GitHub</a>
              <Link href="/login" className="hover:text-text-primary transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
