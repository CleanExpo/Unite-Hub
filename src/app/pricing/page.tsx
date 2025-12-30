/**
 * About Page - Company Story, Mission, Team
 * Dark theme, design-system compliant
 */

'use client';

import Link from 'next/link';
import { Metadata } from 'next';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold" aria-label="Unite-Hub homepage">Unite-Hub</Link>

          <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
            <Link href="/about" className="text-text-primary font-medium">About</Link>
            <Link href="/features" className="text-text-secondary hover:text-text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors">Pricing</Link>
            <Link href="/contact" className="text-text-secondary hover:text-text-primary transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link href="/login" className="px-4 py-2 bg-accent-500 text-text-primary text-sm font-medium rounded-lg hover:bg-accent-600 transition-colors">
              Start trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Built for small businesses
            <br />
            <span className="text-accent-500">who deserve better</span>
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            We're building the future of marketing automation—transparent, affordable, and powered by AI.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6">Why Unite-Hub exists</h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                Traditional marketing agencies charge $5,000-$10,000 per month. Small businesses can't afford that.
                DIY tools are overwhelming and time-consuming.
              </p>
              <p>
                We built Unite-Hub to solve this: <strong className="text-text-primary">AI automation that costs $0.05 per email</strong>,
                with 100% transparency (everything is open source on GitHub).
              </p>
              <p>
                No black boxes. No vendor lock-in. No monthly retainers eating your profits.
                Just intelligent automation that works for you.
              </p>
            </div>
          </div>

          <div className="bg-bg-subtle rounded-2xl p-8 border border-border-subtle">
            <img
              src="/generated-assets/github-social-proof.svg"
              alt="Unite-Hub open source GitHub repository powering production platform"
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-bg-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Our mission</h2>
          <p className="text-xl text-text-secondary mb-12">
            Transform marketing with <span className="text-accent-500">AI transparency</span> and
            <span className="text-accent-500"> radical affordability</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-bg-card rounded-xl border border-border-subtle">
              <div className="text-4xl mb-4">🔓</div>
              <h3 className="text-xl font-semibold mb-3">Open Source</h3>
              <p className="text-sm text-text-secondary">
                14,000+ lines of TypeScript. Every algorithm visible on GitHub. No secrets.
              </p>
            </div>

            <div className="p-6 bg-bg-card rounded-xl border border-border-subtle">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3">Fair Pricing</h3>
              <p className="text-sm text-text-secondary">
                Pay only for what you use. $0.05/email. No contracts. Cancel anytime.
              </p>
            </div>

            <div className="p-6 bg-bg-card rounded-xl border border-border-subtle">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3">AI That Works</h3>
              <p className="text-sm text-text-secondary">
                43 agents enhanced with Project Vend Phase 2. Self-improving, cost-controlled, verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Built on research, not hype</h2>
            <p className="text-xl text-text-secondary">
              Project Vend Phase 2: Implementing Anthropic's AI safety research
            </p>
          </div>

          <div className="bg-bg-subtle rounded-2xl p-8 border border-border-subtle">
            <img
              src="/generated-assets/project-vend-phase2-overview.svg"
              alt="Project Vend Phase 2 showing 5 optimization systems: Metrics, Rules, Verification, Escalations, and Cost Control enhancing 43 AI agents"
              className="w-full h-auto"
            />
          </div>

          <div className="mt-8 text-center">
            <Link href="/agents" className="inline-block px-6 py-3 bg-accent-500 text-text-primary font-medium rounded-lg hover:bg-accent-600 transition-colors">
              View Live Agent Dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border-subtle">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to transform your marketing?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Join Logan, Brisbane, and Queensland businesses using AI automation
          </p>
          <Link href="/login" className="inline-block px-8 py-4 bg-accent-500 text-text-primary font-semibold rounded-lg hover:bg-accent-600 transition-colors text-lg">
            Start free trial
          </Link>
          <p className="mt-6 text-sm text-text-tertiary">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-text-secondary">
              © 2025 Unite-Hub • Logan, Brisbane, QLD • Open Source
            </div>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
              <Link href="/about" className="hover:text-text-primary transition-colors">About</Link>
              <Link href="/features" className="hover:text-text-primary transition-colors">Features</Link>
              <Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
              <Link href="/agents" className="hover:text-text-primary transition-colors">Dashboard</Link>
              <a href="https://github.com/CleanExpo/Unite-Hub" target="_blank" className="hover:text-text-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
