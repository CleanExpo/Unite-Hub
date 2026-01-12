/**
 * Synthex.social Landing Page
 * AI Marketing for Small Businesses
 * Light theme, SMB-focused, Queensland market
 */

'use client';

import Link from 'next/link';

export default function SynthexLanding() {
  return (
    <div className="min-h-screen bg-white text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-text-primary" aria-label="Synthex.social homepage">
            Synthex<span className="text-accent-500">.social</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Main navigation">
            <a href="#how-it-works" className="text-text-muted hover:text-text-primary transition-colors">How It Works</a>
            <a href="#business-types" className="text-text-muted hover:text-text-primary transition-colors">For Your Business</a>
            <a href="#pricing" className="text-text-muted hover:text-text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-text-muted hover:text-text-primary transition-colors">
              Sign in
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-accent-500 text-white text-sm font-medium rounded-lg hover:bg-accent-600 transition-colors shadow-sm"
              aria-label="Start your 14-day free trial"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-orange-200 text-sm shadow-sm">
              <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></div>
              <span className="text-text-secondary font-medium">AI Marketing for Australia & New Zealand</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] text-text-primary">
            No agency bill.
            <br />
            <span className="text-accent-500">No complexity.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-center text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-12">
            AI creates your social posts, manages your content, and handles your marketing — automatically.
            <br />
            <span className="font-semibold text-text-primary">From A$495/month.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="px-8 py-4 bg-accent-500 text-white text-lg font-semibold rounded-lg hover:bg-accent-600 transition-all shadow-lg hover:shadow-xl"
              aria-label="Start your 14-day free trial"
            >
              Start 14-Day Free Trial →
            </Link>
            <Link
              href="#pricing"
              className="px-8 py-4 border-2 border-border-subtle text-text-primary text-lg font-semibold rounded-lg hover:border-border hover:bg-bg-hover transition-all"
            >
              View Pricing
            </Link>
          </div>

          {/* Hero Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-orange-300/30 to-orange-200/30 blur-3xl"></div>
            <div className="relative bg-white rounded-2xl p-4 shadow-2xl border border-border">
              <img
                src="/synthex-assets/synthex-hero-dashboard.svg"
                alt="Synthex dashboard showing AI content generation, social media scheduling, and analytics for small businesses"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border py-12 px-6 bg-bg-hover">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-text-primary mb-1">$5K+</div>
              <div className="text-sm text-text-muted">Traditional Agency Cost</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-500 mb-1">A$495</div>
              <div className="text-sm text-text-muted">Synthex Starter Plan</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-text-primary mb-1">14 Days</div>
              <div className="text-sm text-text-muted">Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-text-primary mb-1">No Lock-In</div>
              <div className="text-sm text-text-muted">Cancel Anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Transformation */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              From marketing chaos to <span className="text-accent-500">automated success</span>
            </h2>
            <p className="text-xl text-text-muted">
              See how Australian & NZ businesses transformed their marketing
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-border">
            <img
              src="/synthex-assets/synthex-before-after-transformation.svg"
              alt="Before and after comparison showing manual marketing chaos versus automated Synthex system for small businesses"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-bg-hover">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-text-primary">
            Set up in <span className="text-accent-500">15 minutes</span>
          </h2>
          <p className="text-xl text-text-muted text-center mb-16">
            No technical skills required. We guide you through everything.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Tell us about your business',
                desc: 'Trades, salon, coaching, or restaurant? We customize for you.',
                icon: '🏢'
              },
              {
                step: '2',
                title: 'AI learns your style',
                desc: 'Our AI understands your brand voice and creates content automatically.',
                icon: '🤖'
              },
              {
                step: '3',
                title: 'Marketing runs itself',
                desc: 'Social posts, SEO, content — all handled. You focus on your business.',
                icon: '🚀'
              }
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-8 shadow-md border border-border hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{item.icon}</div>
                <div className="text-sm font-semibold text-accent-500 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold mb-3 text-text-primary">{item.title}</h3>
                <p className="text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Types */}
      <section id="business-types" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Built for <span className="text-accent-500">your</span> business
            </h2>
            <p className="text-xl text-text-muted">
              Synthex adapts to your industry and customer base
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🔨', title: 'Trades & Contractors', desc: 'Plumbers, electricians, builders' },
              { icon: '💇', title: 'Salons & Spas', desc: 'Hair, beauty, wellness' },
              { icon: '📚', title: 'Coaches & Consultants', desc: 'Business, life, fitness' },
              { icon: '🍽️', title: 'Restaurants & Cafes', desc: 'Food service, hospitality' }
            ].map((biz, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border-2 border-border hover:border-accent-500 transition-all">
                <div className="text-4xl mb-3">{biz.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">{biz.title}</h3>
                <p className="text-sm text-text-muted">{biz.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-bg-hover">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-text-muted">
              All prices include GST. 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-border hover:border-accent-500 transition-all">
              <div className="text-sm font-semibold text-text-muted mb-2">STARTER</div>
              <div className="text-5xl font-bold mb-2 text-text-primary">
                A$495
                <span className="text-xl text-text-muted font-normal">/month</span>
              </div>
              <p className="text-text-muted mb-6">Perfect for getting started</p>

              <ul className="space-y-3 mb-8">
                {[
                  'AI content generation',
                  '10 social posts/week',
                  'Basic SEO tools',
                  'Email support',
                  '1 business location'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full text-center px-6 py-3 bg-bg-base text-white font-semibold rounded-lg hover:bg-bg-raised transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-accent-500 hover:shadow-3xl transition-all relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>

              <div className="text-sm font-semibold text-accent-500 mb-2">PROFESSIONAL</div>
              <div className="text-5xl font-bold mb-2 text-text-primary">
                A$895
                <span className="text-xl text-text-muted font-normal">/month</span>
              </div>
              <p className="text-text-muted mb-6">For growing businesses</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Starter',
                  '25 social posts/week',
                  'Advanced SEO & analytics',
                  'Priority support',
                  '3 business locations',
                  'Video generation',
                  'Custom branding'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full text-center px-6 py-3 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Elite */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-border hover:border-accent-500 transition-all">
              <div className="text-sm font-semibold text-text-muted mb-2">ELITE</div>
              <div className="text-5xl font-bold mb-2 text-text-primary">
                A$1,295
                <span className="text-xl text-text-muted font-normal">/month</span>
              </div>
              <p className="text-text-muted mb-6">Maximum automation</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Everything in Professional',
                  'Unlimited social posts',
                  'Multi-channel campaigns',
                  'Dedicated account manager',
                  'Unlimited locations',
                  'API access',
                  'White-label options',
                  'Custom integrations'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-success-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block w-full text-center px-6 py-3 bg-bg-base text-white font-semibold rounded-lg hover:bg-bg-raised transition-colors">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            Trusted across Australia & New Zealand
          </h2>
          <p className="text-xl text-text-muted mb-16">
            Join trades, salons, and local services from Sydney to Auckland
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { metric: '100+', label: 'Active Businesses' },
              { metric: '10K+', label: 'Posts Generated' },
              { metric: '4.9/5', label: 'Customer Rating' }
            ].map((stat, i) => (
              <div key={i} className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8 border border-orange-200">
                <div className="text-5xl font-bold text-accent-500 mb-2">{stat.metric}</div>
                <div className="text-text-secondary font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-text-primary">
            Ready to automate your marketing?
          </h2>
          <p className="text-xl text-text-muted mb-8">
            Start your 14-day free trial. No credit card required.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-5 bg-accent-500 text-white font-bold rounded-lg hover:bg-accent-600 transition-all text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            Start Free Trial →
          </Link>
          <p className="mt-6 text-sm text-text-muted">
            14-day free trial • No credit card required • Cancel anytime • AU/NZ support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-bg-hover">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-text-muted">
              © 2025 Synthex.social • Australia & New Zealand • All rights reserved
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/login" className="text-text-muted hover:text-text-primary transition-colors">Sign in</Link>
              <a href="#pricing" className="text-text-muted hover:text-text-primary transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-text-muted hover:text-text-primary transition-colors">How It Works</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
