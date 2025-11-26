"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle, Zap, BarChart3, MessageSquare } from "lucide-react";
import {
  FloatingGradientBalls,
  ScrollReveal,
  AnimatedGradientText,
  AnimatedCounter,
  HoverLift,
  PulsingDot,
  Parallax,
} from "@/components/AnimatedElements";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebSiteSchema,
  FAQSchema,
  HowToSchema,
  BreadcrumbSchema,
} from "@/components/seo/JsonLd";
import { seoConfig } from "@/lib/seo/seoConfig";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [discountSlotsLeft, setDiscountSlotsLeft] = useState(50);
  const [discountSlotsLeft25, setDiscountSlotsLeft25] = useState(50);

  // Fetch live offer counter
  useEffect(() => {
    const fetchOfferData = async () => {
      try {
        const response = await fetch('/api/synthex/offer/summary');
        if (response.ok) {
          const data = await response.json();
          setDiscountSlotsLeft(data.remaining_50_off || 50);
          setDiscountSlotsLeft25(data.remaining_25_off || 50);
        }
      } catch (error) {
        console.error('Failed to fetch offer data:', error);
      }
    };
    fetchOfferData();
  }, []);

  const nextSlide = () => {
    if (currentSlide < 2) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] overflow-x-hidden">
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
      {discountSlotsLeft > 0 && (
        <div className="fixed top-20 right-5 z-40 bg-gradient-to-r from-[#ff5722] to-[#ff784e] text-white rounded-lg p-4 shadow-lg max-w-xs">
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
              Finally, an AI platform built for REAL small businesses.
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Marketing, SEO & AI.<br />
              <AnimatedGradientText text="Without the Agency Bill." className="bg-gradient-to-r from-[#347bf7] to-[#00d4aa]" />
            </h1>
          </ScrollReveal>

          <p className="text-xl opacity-90 max-w-[700px] mx-auto mb-12 leading-relaxed">
            For trades, local services, non-profits, coaches, and online businesses. Get your website, SEO, branding, and social media handled by AI. No monthly retainer. No confusing tools.
          </p>

          <ScrollReveal delay={200}>
            <div className="flex flex-col md:flex-row justify-center gap-5 mb-16">
              <HoverLift className="w-full md:w-auto">
                <Link
                  href="/login"
                  className="block bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white py-4 px-8 rounded-lg text-base font-semibold border-none shadow-[0_4px_15px_rgba(52,123,247,0.4)] hover:shadow-[0_6px_20px_rgba(52,123,247,0.6)] transition-all"
                >
                  Start My AI Marketing Trial
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
                "Synthex has given us back 20 hours a week that we used to spend on marketing. The AI just works." — Phill McGurk, CARSI
              </p>
              <p className="text-xs text-white/60">
                Built with real restoration & education backgrounds. We know small business challenges.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Who We Help Section */}
      <section id="who-we-help" className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
              Built for Small Businesses That Are Busy
            </h2>
            <p className="text-xl text-[#666] max-w-[700px] mx-auto">
              Whether you're swamped with jobs or managing multiple locations, Synthex handles your marketing so you can focus on what you do best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Trades & Contractors */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#ff5722] to-[#ff784e] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🔨</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Trades & Contractors</h3>
                  <p className="text-[#666] mb-4">
                    Plumbers, electricians, builders. Get more local jobs without spending $500+ monthly on ads or hiring a marketer.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Local SEO & Google Maps ranking
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Before/after galleries auto-created
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Review generation & management
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Local Services */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#00b386] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🏢</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Local Services & Salons</h3>
                  <p className="text-[#666] mb-4">
                    Hair salons, spas, cleaning services. Attract more customers in your neighborhood with AI marketing.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Geo-targeted social posts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Appointment reminders & follow-ups
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Customer retention campaigns
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Non-Profits */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">❤️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Non-Profits & Churches</h3>
                  <p className="text-[#666] mb-4">
                    Tell your story and grow your community without hiring an agency or burning volunteer hours on social media.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Donor & volunteer recruitment
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Event promotion & registration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Impact storytelling
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Coaches & Consultants */}
            <ScrollReveal delay={300}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🎓</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Coaches & Consultants</h3>
                  <p className="text-[#666] mb-4">
                    Grow your online coaching or consulting business with consistent, professional content that attracts qualified clients.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Lead magnets & email sequences
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Social proof & testimonials
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Webinar & launch automation
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* E-Commerce */}
            <ScrollReveal delay={400}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#ef4444] to-[#dc2626] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🛍️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">E-Commerce & Online Stores</h3>
                  <p className="text-[#666] mb-4">
                    Sell more online with product photography, descriptions, and targeted social ads—all automated by AI.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Product image enhancement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Social commerce integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Abandoned cart recovery
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Agencies & Resellers */}
            <ScrollReveal delay={500}>
              <HoverLift className="h-full">
                <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] transition-colors h-full bg-white">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#06b6d4] to-[#0891b2] flex items-center justify-center mb-4">
                    <span className="text-white text-xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Agencies & Resellers</h3>
                  <p className="text-[#666] mb-4">
                    White-label Synthex for your clients. Deliver premium marketing services without the overhead or team.
                  </p>
                  <ul className="space-y-2 text-sm text-[#666]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Client branding & reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Unlimited seats per client
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#347bf7]">✓</span> Reseller margins available
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 bg-gradient-to-br from-[#051224] to-[#0a1e3b] text-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The Small Business Marketing Problem
            </h2>
            <p className="text-xl text-white/80 max-w-[700px] mx-auto">
              You're great at your business. Marketing shouldn't be your second job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                {/* Problem 1 */}
                <ScrollReveal delay={0}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Too Many Fragmented Tools</h3>
                      <p className="text-white/70">
                        Website platform, email tool, social media scheduler, analytics dashboard, CRM... How are you supposed to manage all of this?
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 2 */}
                <ScrollReveal delay={100}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Agencies Cost a Fortune</h3>
                      <p className="text-white/70">
                        $2,000–$10,000+ per month for someone to manage your marketing. That's $24,000–$120,000 per year. For most small businesses, that's not realistic.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 3 */}
                <ScrollReveal delay={200}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">You Don't Have Time</h3>
                      <p className="text-white/70">
                        Between running your business and serving customers, you barely have time to think about marketing, let alone execute it.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Problem 4 */}
                <ScrollReveal delay={300}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[#ff5722]/20">
                        <span className="text-[#ff5722] text-xl">✕</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">AI Tools Are Confusing</h3>
                      <p className="text-white/70">
                        ChatGPT is great, but it's just a chatbot. You need marketing strategy + content + technical execution—not just AI text generation.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>

            <ScrollReveal delay={100}>
              <Parallax offset={30}>
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                    alt="Stressed business owner"
                    className="rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3b]/50 to-transparent rounded-xl"></div>
                </div>
              </Parallax>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* How Synthex Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
              How Synthex Works
            </h2>
            <p className="text-xl text-[#666] max-w-[700px] mx-auto">
              Four simple steps to automate your marketing and get back 10+ hours per week.
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
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Connect Your Business</h3>
                  <p className="text-[#666] mb-6">
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
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Synthex Diagnoses Your Business</h3>
                  <p className="text-[#666] mb-6">
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
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">AI Generates Your Strategy</h3>
                  <p className="text-[#666] mb-6">
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
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">Launch & Monitor</h3>
                  <p className="text-[#666] mb-6">
                    Approve, schedule, and publish. Watch real-time analytics and A/B test everything.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 bg-gradient-to-b from-[#f4f7fa] to-[#e8ecf1]">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
              What You Get
            </h2>
            <p className="text-xl text-[#666] max-w-[700px] mx-auto">
              Synthex includes everything you need to be found online and convert customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Website Enhancements */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#347bf7]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">🌐</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Website Optimization</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>SEO-optimized homepage copy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Service/product page generation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Trust signals & testimonials</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>CTA optimization</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* SEO & Geo Strategy */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📍</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">SEO & Local Dominance</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Local SEO setup & optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Google Business Profile management</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Geo-targeted keyword research</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Monthly ranking tracking</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Social Content Generation */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#ff5722]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Social Media Automation</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Platform-specific content (8+ platforms)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>AI-generated graphics & videos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Auto-scheduler (optimal posting times)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Engagement monitoring</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Email Marketing */}
            <ScrollReveal delay={300}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Email & Automation</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Drip campaign templates</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Lead nurture sequences</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>A/B testing & optimization</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Performance tracking</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* AI Marketing Assistants */}
            <ScrollReveal delay={400}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">AI Marketing Assistants</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>AI copywriter (unlimited content)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Graphic designer (images & videos)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Content strategist (planning)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Data analyst (insights & reporting)</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Reporting & Analytics */}
            <ScrollReveal delay={500}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow h-full">
                  <div className="h-12 w-12 rounded-lg bg-[#ef4444]/10 flex items-center justify-center mb-5">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Monthly Reporting</h3>
                  <ul className="space-y-3 text-[#666]">
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Custom performance dashboards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>ROI tracking & attribution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Competitor benchmarking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#347bf7] font-bold mt-1">✓</span>
                      <span>Monthly strategy updates</span>
                    </li>
                  </ul>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="text-center pb-20 bg-gradient-to-b from-[#051224] via-[#051224] to-[#f4f7fa]" style={{ paddingTop: '1px' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-white text-3xl font-bold mb-12 pt-12">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Starter Plan */}
            <ScrollReveal delay={0}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] h-full">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📱</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Starter</h3>
                  <div className="text-[42px] font-extrabold text-[#1a1a1a] mb-2">
                    $197<span className="text-base text-[#666] font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-[#999] mb-8">Billed monthly • 50% founder discount</p>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Website optimization
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Basic SEO setup
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      4 social posts/week (auto-generated)
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Email support
                    </li>
                  </ul>
                  <Link
                    href="/login"
                    className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </HoverLift>
            </ScrollReveal>

            {/* Professional Plan (Highlighted) */}
            <ScrollReveal delay={100}>
              <HoverLift className="h-full">
                <div className="bg-[#0a1e3b] rounded-[20px] p-10 text-center text-white scale-100 md:scale-105 border-2 border-[#ff5722] shadow-[0_0_30px_rgba(255,87,34,0.3)] hover:shadow-[0_0_50px_rgba(255,87,34,0.5)] z-10 h-full transition-shadow">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-[#0a1e3b] border-2 border-[#ff5722] flex items-center justify-center">
                    <span className="text-[#ff5722] font-bold text-lg">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Professional</h3>
                  <div className="text-[42px] font-extrabold mb-2">
                    $297<span className="text-base text-white/70 font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-white/70 mb-8">Billed monthly • 50% founder discount</p>
                  <div className="inline-block bg-[#ff5722] text-white px-3 py-1 rounded-full text-xs font-bold mb-4">MOST POPULAR</div>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Everything in Starter, plus:
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Full local SEO optimization
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      10 social posts/week + AI graphics
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Monthly SEO & performance reports
                    </li>
                    <li className="text-white/90 flex items-center">
                      <span className="text-[#ff5722] text-xl mr-2.5">✓</span>
                      Priority support
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

            {/* Enterprise Plan */}
            <ScrollReveal delay={200}>
              <HoverLift className="h-full">
                <div className="bg-white rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] h-full">
                  <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#347bf7] to-[#5a9dff] flex items-center justify-center">
                    <span className="text-white font-bold text-lg">⭐</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Agency</h3>
                  <div className="text-[42px] font-extrabold text-[#1a1a1a] mb-2">
                    $797<span className="text-base text-[#666] font-medium">/mo</span>
                  </div>
                  <p className="text-sm text-[#999] mb-8">For agencies & high-volume needs</p>
                  <ul className="text-left inline-block mb-9 space-y-3">
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Everything in Professional, plus:
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      White-label branding
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Unlimited client sub-accounts
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      Dedicated account manager
                    </li>
                    <li className="text-[#666] flex items-center">
                      <span className="text-[#347bf7] text-xl mr-2.5">✓</span>
                      API access & integrations
                    </li>
                  </ul>
                  <Link
                    href="/login"
                    className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
                  >
                    Contact Sales
                  </Link>
                </div>
              </HoverLift>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Synthex Features Carousel */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#1a1a1a] mb-4">
              Synthex in Action
            </h2>
            <p className="text-xl text-[#666] max-w-[700px] mx-auto">
              See how Synthex transforms small businesses with real results.
            </p>
          </div>

          <div className="relative max-w-[1400px] mx-auto flex items-center justify-center">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(${currentSlide === 0 ? '630px' : currentSlide === 1 ? '0px' : '-630px'})`
              }}
            >
              {/* Card 1 - Website Transformation */}
              <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${currentSlide === 0 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=840&fit=crop"
                  alt="Website transformation showing modern design with enhanced copy and SEO"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Website Enhanced</h3>
                    <p className="text-white/80">AI-optimized copy, SEO-ready structure, conversion-focused design</p>
                  </div>
                </div>
              </div>

              {/* Card 2 - Social Media Growth */}
              <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${currentSlide === 1 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=840&fit=crop"
                  alt="Social media analytics dashboard showing engagement and reach growth"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1e3b]/90 to-[#0a1e3b]/40 flex items-end p-8">
                  <div>
                    <div className="inline-block bg-[#00d4aa] text-white text-sm font-semibold px-3 py-1 rounded mb-4">
                      10x Social Posts
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Social Media Automation</h3>
                    <p className="text-white/70">AI writes, designs, and schedules posts across all platforms</p>
                  </div>
                </div>
              </div>

              {/* Card 3 - Rankings & Traffic */}
              <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${currentSlide === 2 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=840&fit=crop"
                  alt="Business growth charts showing traffic and ranking improvements"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-8">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Measurable Results</h3>
                    <p className="text-white/80">Google rankings, local leads, website traffic—tracked in real-time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex justify-center items-center mt-8 gap-5">
            <button
              type="button"
              onClick={prevSlide}
              className="w-10 h-10 bg-[#e0e5ec] rounded-full flex items-center justify-center cursor-pointer text-[#1a1a1a] hover:bg-[#d0dbe7] transition-colors"
              title="Previous slide"
              aria-label="View previous feature"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  className={`rounded-full cursor-pointer transition-colors ${currentSlide === i ? 'w-3 h-3 bg-[#0056b3]' : 'w-2.5 h-2.5 bg-[#ccc]'}`}
                  title={`Go to slide ${i + 1}`}
                  aria-label={`Go to feature ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={nextSlide}
              className="w-10 h-10 bg-[#e0e5ec] rounded-full flex items-center justify-center cursor-pointer text-[#1a1a1a] hover:bg-[#d0dbe7] transition-colors"
              title="Next slide"
              aria-label="View next feature"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
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
