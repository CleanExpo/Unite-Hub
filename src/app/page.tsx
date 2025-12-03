/* eslint-disable no-undef, no-console */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  FloatingGradientBalls,
  ScrollReveal,
  AnimatedGradientText,
  AnimatedCounter,
  HoverLift,
  Parallax,
} from "@/components/AnimatedElements";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebSiteSchema,
  FAQSchema,
  HowToSchema,
} from "@/components/seo/JsonLd";
import { seoConfig } from "@/lib/seo/seoConfig";
import { PersonaVisual } from "@/components/marketing/PersonaVisual";
import { detectPersonaFromContext } from "@/lib/visual/visualPersonas";
import ThreeDPhotoCarousel from "@/components/ui/three-d-carousel";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { MobileNav } from "@/components/mobile-nav";
import { HeroVideoPlayer } from "@/components/hero-video-player";
import { CaseStudyCard } from "@/components/landing/CaseStudyCard";
import { IntegrationCard, GmailIcon, SlackIcon, ZapierIcon, HubSpotIcon, StripeIcon, SalesforceIcon, MailchimpIcon, PipedriveIcon } from "@/components/landing/IntegrationCard";
import { FAQAccordion, FAQSchemaMarkup, faqData } from "@/components/landing/FAQAccordion";
import { FeatureVideoCarousel } from "@/components/landing/FeatureVideoCarousel";
import { VeoVideoShowcase } from "@/components/video/VeoVideoShowcase";
import { caseStudies, integrations } from "@/data/landing-data";
import { featureVideos } from "@/data/feature-videos-data";
import { getFeaturedVideos } from "@/data/veo-videos-data";

export default function Home() {
  const { user, loading } = useAuth();
  const [discountSlotsLeft, setDiscountSlotsLeft] = useState(50);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect persona from URL params/context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const detected = detectPersonaFromContext({
        queryParam: urlParams.get("persona"),
        utm_campaign: urlParams.get("utm_campaign"),
        referrer: document.referrer,
      });
      setPersonaId(detected);
    }
  }, []);

  // Fetch live offer counter
  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        const response = await fetch('/api/synthex/offer/summary');
        if (response.ok) {
          const data = await response.json();
          setDiscountSlotsLeft(data.remaining_50_off || 50);
        }
      } catch (error) {
        console.error('Failed to fetch offer data:', error);
      }
    };
    fetchOfferData();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="absolute top-0 left-0 w-full z-50 py-5 bg-transparent">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between items-center">
          <Link href="/" className="logo">
            <div className="text-white font-bold text-2xl">Synthex.social</div>
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <a href="#how-it-works" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
              How it Works
            </a>
            <a href="#who-we-help" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
              Who We Help
            </a>
            <a href="#pricing" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
              Pricing
            </a>
          </nav>

          <MobileNav user={user} loading={loading} />

          <div className="hidden md:flex gap-4">
            {loading ? (
              <div className="h-10 w-20 bg-white/20 rounded animate-pulse" />
            ) : user ? (
              <Link
                href="/synthex/dashboard"
                className="px-6 py-2.5 rounded-md font-semibold text-sm bg-[#007bff] border border-[#007bff] text-white hover:-translate-y-0.5 transition-transform"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-md font-semibold text-sm bg-transparent border border-white/50 text-white hover:-translate-y-0.5 transition-transform"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-md font-semibold text-sm bg-[#007bff] border border-[#007bff] text-white hover:-translate-y-0.5 transition-transform"
                >
                  Start Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Discount Banner */}
      {discountSlotsLeft > 0 && !isDismissed && (
        <div className="fixed top-20 right-5 z-40 hidden md:block bg-gradient-to-r from-[#ff5722] to-[#ff784e] text-white rounded-lg p-4 shadow-lg max-w-xs">
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 text-white/70 hover:text-white text-xl leading-none"
            aria-label="Close discount banner"
          >
            ×
          </button>
          <div className="text-sm font-bold mb-1">🚀 Limited Founder Offer</div>
          <div className="text-xs mb-2">{discountSlotsLeft} spots left at 50% off</div>
          <Link href="/login" className="text-xs underline font-semibold">Claim your spot →</Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-[radial-gradient(circle_at_center_top,#0d2a5c_0%,#051224_70%)] text-white pt-40 pb-20 text-center overflow-hidden">
        {/* Animated Floating Gradient Balls */}
        <FloatingGradientBalls />

        {/* Wave pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, transparent 2px, transparent 100px)'
          }}
        />

        <div className="max-w-[1200px] mx-auto px-5 relative">
          <ScrollReveal>
            <div className="inline-block bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
              For the 73% of small businesses who've been burned by marketing.
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-white">Stop Bleeding Money on Marketing</span>
              <br />
              <AnimatedGradientText text="That Doesn't Work." className="bg-gradient-to-r from-[#00d4aa] to-[#ff5722]" />
            </h1>
          </ScrollReveal>

          <p className="text-xl opacity-90 max-w-[700px] mx-auto mb-12 leading-relaxed">
            You've probably spent thousands on agencies that ghosted you. Or bought courses you never finished. Or paid for tools you barely use. We've heard it all. Synthex is different — it actually does the work.
          </p>

          <ScrollReveal delay={150}>
            <HeroVideoPlayer />
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="flex flex-col md:flex-row justify-center gap-5 mb-16">
              <HoverLift className="w-full md:w-auto">
                <Link
                  href="/login"
                  className="block bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white py-4 px-8 rounded-lg text-base font-semibold border-none shadow-[0_4px_15px_rgba(52,123,247,0.4)] hover:shadow-[0_6px_20px_rgba(52,123,247,0.6)] transition-all"
                >
                  Start Free Trial
                </Link>
              </HoverLift>
              <HoverLift className="w-full md:w-auto">
                <a
                  href="#how-it-works"
                  className="block bg-white/10 backdrop-blur-sm text-white py-4 px-8 rounded-lg text-base font-semibold border border-white/30 hover:border-white/60 transition-all text-center"
                >
                  See How It Works
                </a>
              </HoverLift>
            </div>
          </ScrollReveal>

          {/* Trust Elements */}
          <ScrollReveal delay={300}>
            <div className="max-w-[600px] mx-auto bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:border-white/30 transition-colors">
              <p className="text-sm text-white/80 mb-4">
                "I spent $30,000 on a marketing agency over 18 months. Got nothing. Synthex did more in the first week than they did the entire time." — Tradie, Brisbane
              </p>
              <p className="text-xs text-white/60">
                Built by founders who've been scammed by agencies too. We built what we wished existed.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who We Help Section */}
      <section id="who-we-help" className="py-20 bg-bg-raised">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Built for People Who've Given Up on Marketing
            </h2>
            <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
              You've tried agencies. You've bought courses. You've signed up for tools you forgot existed. None of it worked. We get it — because we've been there too.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Trades & Contractors */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🔨</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Tradies & Contractors</h3>
                  <p className="text-text-secondary mb-4">
                    "I've been burned by Hipages, ServiceSeeking, and two different agencies. $100k down the drain." Sound familiar? We fix that.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Your own leads, not shared with 10 competitors
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Before/after galleries that sell for you
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Google Maps ranking without the agency fees
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Local Services */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">💇</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Salons & Local Services</h3>
                  <p className="text-text-secondary mb-4">
                    You've got 47 unfinished modules in that Instagram course you bought. Your "marketing hour" never happens. We get it.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Posts created for you (not another course)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Clients who forget to rebook get reminded
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Reviews that actually get asked for
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Non-Profits */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">❤️</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Non-Profits & Churches</h3>
                  <p className="text-text-secondary mb-4">
                    Your cause matters more than your marketing budget. Stop losing volunteers to "we'll post on Facebook eventually."
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Stories that move people (not marketing speak)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Events that fill seats automatically
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Donor outreach that doesn't feel salesy
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Coaches & Consultants */}
            <ScrollReveal delay={300}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🎓</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Coaches & Consultants</h3>
                  <p className="text-text-secondary mb-4">
                    That $297 "signature system" course is gathering digital dust. You know marketing matters but hate doing it. Same.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Content that sounds like you (not ChatGPT)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Leads that are actually qualified
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Consistent posting without the guilt
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* E-Commerce */}
            <ScrollReveal delay={400}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-error-500 to-error-600 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🛍️</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">E-Commerce Stores</h3>
                  <p className="text-text-secondary mb-4">
                    You're paying for 3 different email platforms you barely use. Your Facebook ads guy ghosted. Been there.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Product descriptions that actually sell
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Abandoned carts that recover themselves
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Social ads without the agency markup
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Agencies & Resellers */}
            <ScrollReveal delay={500}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-border-base hover:border-accent-500 transition-colors h-full bg-bg-card">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-info-500 to-info-600 flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Agencies & Resellers</h3>
                  <p className="text-text-secondary mb-4">
                    The SMMA model is broken. 90% of agencies can't deliver. Use Synthex to actually get results for clients.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> White-label with your branding
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Actually deliver on promises
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-accent-500">✓</span> Scale without hiring
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="py-20 bg-bg-base">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                What Happens When Marketing Actually Works
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
                These businesses tried everything else first. Then they tried Synthex.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.map((study, idx) => (
              <ScrollReveal key={study.company} delay={idx * 100}>
                <CaseStudyCard {...study} delay={idx * 100} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-bg-raised border-y border-border-base">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Trusted by Businesses Across Industries</p>
          </div>
          <InfiniteSlider gap={40} duration={25} pauseOnHover>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">🏗️ Construction</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">💇 Hair & Beauty</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">🔧 Trades</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">🏥 Healthcare</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">📚 Education</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">🛍️ Retail</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">❤️ Non-Profit</div>
            <div className="flex items-center justify-center h-12 px-4 text-text-secondary font-semibold whitespace-nowrap">🎓 Coaching</div>
          </InfiniteSlider>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-gradient-to-br from-[#051224] to-[#0a1e3b] text-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              We've Heard Your Stories
            </h2>
            <p className="text-xl text-white/80 max-w-[700px] mx-auto">
              Real frustrations from real business owners. Sound familiar?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                {/* Problem 1 - Agency Scams */}
                <ScrollReveal delay={0}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">"Marketing agencies are a scam"</h3>
                      <p className="text-white/70">
                        <em>"I've been burned by two agencies. $30,000 over 18 months, got nothing. They promised the world and delivered excuses."</em> — Plumber, Sydney
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 2 - Lead Platforms */}
                <ScrollReveal delay={100}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">"$100k+ on platforms that share your leads"</h3>
                      <p className="text-white/70">
                        <em>"Hipages, ServiceSeeking, Adwords — burned through $100k over 5 years. Every lead goes to 10 competitors. It's a race to the bottom."</em> — Builder, Melbourne
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 3 - Unfinished Courses */}
                <ScrollReveal delay={200}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">"47 unfinished course modules"</h3>
                      <p className="text-white/70">
                        <em>"I've got $3,000 in marketing courses I've never finished. The $297 'signature system' is gathering dust. I just don't have time."</em> — Coach, Brisbane
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 4 - Tool Overload */}
                <ScrollReveal delay={300}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">"Paying for tools I barely use"</h3>
                      <p className="text-white/70">
                        <em>"I'm paying for Mailchimp, Canva Pro, Hootsuite, and two other things I forgot about. None of them talk to each other. It's a mess."</em> — Salon Owner, Perth
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <ScrollReveal delay={100}>
              <Parallax offset={30}>
                <div className="relative rounded-xl shadow-2xl overflow-hidden">
                  <PersonaVisual
                    sectionId="hero_main"
                    personaId={personaId || undefined}
                    width={600}
                    height={600}
                    alt="Business owner discovering AI marketing automation"
                    className="w-full h-auto"
                    overlay
                    overlayOpacity={0.3}
                  />
                </div>
              </Parallax>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How Synthex Works Section */}
      <section id="how-it-works" className="py-20 bg-bg-card">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              It Actually Does the Work For You
            </h2>
            <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
              No courses to complete. No tools to learn. No agencies to manage. Synthex just... does it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <ScrollReveal delay={0}>
              <div className="relative">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center text-white font-bold text-2xl">
                    <AnimatedCounter end={1} duration={800} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Connect Your Business</h3>
                  <p className="text-text-secondary mb-6">
                    Link your website, social media, Google Analytics, and email. Takes 5 minutes.
                  </p>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-8 left-[calc(50%+30px)] w-[calc(100%-60px)] h-0.5 bg-gradient-to-r from-[#347bf7] to-transparent"></div>
              </div>
            </ScrollReveal>

            {/* Step 2 */}
            <ScrollReveal delay={100}>
              <div className="relative">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center text-white font-bold text-2xl">
                    <AnimatedCounter end={2} duration={800} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Synthex Diagnoses Your Business</h3>
                  <p className="text-text-secondary mb-6">
                    AI analyzes your website, competition, and market. Identifies your biggest opportunities.
                  </p>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-8 left-[calc(50%+30px)] w-[calc(100%-60px)] h-0.5 bg-gradient-to-r from-[#347bf7] to-transparent"></div>
              </div>
            </ScrollReveal>

            {/* Step 3 */}
            <ScrollReveal delay={200}>
              <div className="relative">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center text-white font-bold text-2xl">
                    <AnimatedCounter end={3} duration={800} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">AI Generates Your Strategy</h3>
                  <p className="text-text-secondary mb-6">
                    Website copy, blog posts, social content, email sequences, ad graphics—AI writes it all, on brand.
                  </p>
                </div>
                {/* Connector Line */}
                <div className="hidden md:block absolute top-8 left-[calc(50%+30px)] w-[calc(100%-60px)] h-0.5 bg-gradient-to-r from-[#347bf7] to-transparent"></div>
              </div>
            </ScrollReveal>

            {/* Step 4 */}
            <ScrollReveal delay={300}>
              <div className="relative">
                <div className="text-center">
                  <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center text-white font-bold text-2xl">
                    <AnimatedCounter end={4} duration={800} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-3">Launch & Monitor</h3>
                  <p className="text-text-secondary mb-6">
                    Approve, schedule, and publish. Watch real-time analytics and A/B test everything.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-bg-raised">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Everything the Agency Promised (But Actually Delivered)
            </h2>
            <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
              All the services you've paid thousands for — website, SEO, social, email — now handled by AI that actually shows up.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Website Enhancements */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-accent-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">Website Optimization</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>SEO-optimized homepage copy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Service/product page generation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Trust signals & testimonials</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>CTA optimization</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* SEO & Geo Strategy */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-success-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">SEO & Local Dominance</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Local SEO setup & optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Google Business Profile management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Geo-targeted keyword research</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Monthly ranking tracking</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Social Content Generation */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-accent-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">Social Media Automation</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Platform-specific content (8+ platforms)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>AI-generated graphics & videos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Auto-scheduler (optimal posting times)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Engagement monitoring</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Email Marketing */}
            <ScrollReveal delay={300}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">Email & Automation</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Drip campaign templates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Lead nurture sequences</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>A/B testing & optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Performance tracking</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* AI Marketing Assistants */}
            <ScrollReveal delay={400}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-warning-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">AI Marketing Assistants</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>AI copywriter (unlimited content)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Graphic designer (images & videos)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Content strategist (planning)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Data analyst (insights & reporting)</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Reporting & Analytics */}
            <ScrollReveal delay={500}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full border border-border-base">
                  <div className="h-12 w-12 rounded-lg bg-error-500/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-4">Monthly Reporting</h3>
                  <ul className="space-y-3 text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Custom performance dashboards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>ROI tracking & attribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Competitor benchmarking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-accent-500 font-bold mt-1">✓</span>
                      <span>Monthly strategy updates</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-bg-card">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Works With Your Stack
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
                Connect the tools you already use
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration, idx) => {
              const iconMap: Record<string, React.ReactNode> = {
                gmail: <GmailIcon />,
                slack: <SlackIcon />,
                zapier: <ZapierIcon />,
                hubspot: <HubSpotIcon />,
                stripe: <StripeIcon />,
                salesforce: <SalesforceIcon />,
                mailchimp: <MailchimpIcon />,
                pipedrive: <PipedriveIcon />,
              };

              return (
                <ScrollReveal key={integration.name} delay={idx * 50}>
                  <IntegrationCard
                    {...integration}
                    icon={iconMap[integration.iconName]}
                    delay={idx * 50}
                  />
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="text-center pb-20 bg-gradient-to-b from-[#051224] via-[#051224] to-bg-base" style={{ paddingTop: '1px' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-white text-3xl font-bold mb-4 pt-12">Less Than Your Failed Agency. More Results.</h2>
          <p className="text-white/70 text-lg mb-12 max-w-[600px] mx-auto">Most agencies charge $2,000-$5,000/month and deliver excuses. Synthex costs less and actually works.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Starter Plan - A$495/mo (Canonical from pricing-config.ts) */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-shadow hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] h-full border border-border-base">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📱</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-text-primary">Starter</h3>
                  <div className="text-[42px] font-extrabold text-text-primary mb-2">
                    A$495<span className="text-base text-text-secondary font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-text-muted mb-8">GST inclusive • 14-day free trial</p>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      500 contacts
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      20,000 AI tokens/month
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      2 website audits/month
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      Email support
                    </li>
                  </ul>
                  <Link
                    href="/login"
                    className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-text-primary text-text-primary hover:bg-accent-500 hover:border-accent-500 hover:text-white transition-all"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Pro Plan (Highlighted) - A$895/mo (Canonical from pricing-config.ts) */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="bg-[#0a1e3b] rounded-[20px] p-10 text-center text-white scale-100 md:scale-105 border-2 border-[#ff5722] shadow-[0_0_30px_rgba(255,87,34,0.3)] hover:shadow-[0_0_50px_rgba(255,87,34,0.5)] z-10 h-full transition-shadow">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-[#0a1e3b] border-2 border-[#ff5722] flex items-center justify-center">
                    <span className="text-[#ff5722] font-bold text-lg">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Pro</h3>
                  <div className="text-[42px] font-extrabold mb-2">
                    A$895<span className="text-base text-white/70 font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-white/70 mb-8">GST inclusive • 14-day free trial</p>
                  <div className="inline-block bg-[#ff5722] text-white px-3 py-1 rounded-full text-xs font-bold mb-4">MOST POPULAR</div>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      5,000 contacts
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      250,000 AI tokens/month
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      20 website audits/month
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Unlimited campaigns
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Priority support + API access
                    </li>
                  </ul>
                  <Link
                    href="/login"
                    className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-gradient-to-r from-[#ff5722] to-[#ff784e] text-white border-none shadow-[0_4px_15px_rgba(255,87,34,0.4)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.6)] transition-all"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Elite Plan - A$1,295/mo (Canonical from pricing-config.ts) */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="bg-bg-card rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-shadow hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] h-full border border-border-base">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-accent-500 to-accent-400 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">⭐</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-text-primary">Elite</h3>
                  <div className="text-[42px] font-extrabold text-text-primary mb-2">
                    A$1,295<span className="text-base text-text-secondary font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-text-muted mb-8">GST inclusive • For agencies & scale</p>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      Unlimited contacts
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      2,000,000 AI tokens/month
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      100 website audits/month
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      White label + custom branding
                    </li>
                    <li className="text-text-secondary flex items-center">
                      <span className="text-accent-500 text-xl mr-2.5">✓</span>
                      10 team seats + agency tools
                    </li>
                  </ul>
                  <Link
                    href="/contact"
                    className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-text-primary text-text-primary hover:bg-accent-500 hover:border-accent-500 hover:text-white transition-all"
                  >
                    Contact Sales
                  </Link>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Synthex Features - 3D Carousel */}
      <section className="py-20 bg-bg-raised overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Synthex in Action
            </h2>
            <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
              See how Synthex transforms small businesses with real results.
            </p>
          </div>

          <div className="max-w-[900px] mx-auto">
            <ThreeDPhotoCarousel
              autoPlay={true}
              autoPlayInterval={6000}
              showTitles={true}
              showDescriptions={true}
              images={[
                {
                  id: "1",
                  src: "/images/generated/carousel-crm-intelligence.jpg",
                  alt: "Business owner using CRM intelligence dashboard to understand customers",
                  title: "CRM Intelligence",
                  description: "Know your customers better with AI-powered contact insights and lead scoring"
                },
                {
                  id: "2",
                  src: "/images/generated/carousel-email-automation.jpg",
                  alt: "Marketing automation showing email sequences running automatically",
                  title: "Email Automation",
                  description: "Your marketing runs itself with smart drip campaigns and automated follow-ups"
                },
                {
                  id: "3",
                  src: "/images/generated/carousel-social-media.jpg",
                  alt: "Social media content calendar with AI-generated posts scheduled",
                  title: "Social Media Success",
                  description: "Post consistently across platforms with AI-generated content that resonates"
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Feature Video Carousel Section */}
      <section className="py-24 bg-bg-base">
        <div className="max-w-[1400px] mx-auto px-5">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                See Features in Action
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
                30-second walkthroughs of Synthex's most powerful features
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={200}>
            <FeatureVideoCarousel videos={featureVideos} />
          </ScrollReveal>
        </div>
      </section>

      {/* VEO Video Showcase Section - Professional 4K Marketing Videos */}
      <section className="py-24 bg-bg-card">
        <div className="max-w-[1400px] mx-auto px-5">
          <ScrollReveal>
            <VeoVideoShowcase
              videos={getFeaturedVideos()}
              title="Real Problems. Real Solutions."
              subtitle="Watch how Synthex solves the biggest marketing challenges facing small businesses today. Each video is 30 seconds."
              defaultView="carousel"
              showFilters={true}
              autoPlay={false}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-bg-raised">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                "Okay, But..." (Your Questions Answered)
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <p className="text-xl text-text-secondary max-w-[700px] mx-auto">
                You've been burned before. You're skeptical. Good. Here's the truth.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={200}>
            <FAQAccordion
              items={faqData}
              categories={['Getting Started', 'Platform & Security', 'ROI & Results']}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#051224] text-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div>
              <Link href="/" className="logo mb-4 block">
                <div className="text-white font-bold text-xl">Synthex.social</div>
              </Link>
              <p className="text-white/70 text-sm">
                AI marketing platform built for real small businesses.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#pricing" className="text-white/70 hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#who-we-help" className="text-white/70 hover:text-white transition-colors">
                    Who We Help
                  </a>
                </li>
                <li>
                  <Link href="/synthex/dashboard" className="text-white/70 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-white/70 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-white/70 hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/70 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@synthex.social" className="text-white/70 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-white/70 hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-5">
            <p className="text-white/60 text-sm">
              © 2025 Synthex.social. All rights reserved. Built for small business owners.
            </p>
            <div className="flex gap-5">
              <a href="https://twitter.com" className="text-white/60 hover:text-white transition-colors" title="Twitter">
                <span className="text-sm font-medium">Twitter</span>
              </a>
              <a href="https://linkedin.com" className="text-white/60 hover:text-white transition-colors" title="LinkedIn">
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a href="https://instagram.com" className="text-white/60 hover:text-white transition-colors" title="Instagram">
                <span className="text-sm font-medium">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebSiteSchema />
      <SoftwareApplicationSchema ratingValue="4.8" ratingCount="128" />
      <FAQSchema faqItems={seoConfig.commonFAQs} />
      <FAQSchemaMarkup items={faqData} />
      <HowToSchema
        howto={{
          name: 'How to Automate Your Marketing with Synthex',
          description: 'Four simple steps to automate your marketing and get back 10+ hours per week',
          image: '/how-to-synthex.png',
          totalTime: 'PT5M',
          steps: [
            {
              name: 'Connect Your Business',
              text: 'Link your website, social media, Google Analytics, and email. Takes 5 minutes.',
            },
            {
              name: 'Synthex Diagnoses Your Business',
              text: 'AI analyzes your website, competition, and market. Identifies your biggest opportunities.',
            },
            {
              name: 'AI Generates Your Strategy',
              text: 'Website copy, blog posts, social content, email sequences, ad graphics—AI writes it all, on brand.',
            },
            {
              name: 'Launch & Monitor',
              text: 'Approve, schedule, and publish. Watch real-time analytics and A/B test everything.',
            },
          ],
        }}
      />
    </div>
  );
}
