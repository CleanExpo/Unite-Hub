"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Inbox, Workflow, Users, Clock, CheckCircle2, Menu, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!loading && user) {
      router.push("/dashboard/overview");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-[#030711] text-white font-sans antialiased">
      <div className="w-full bg-[radial-gradient(circle_at_10%_0%,#1f2937_0,#020617_40%,#020617_100%)]">
        {/* Header */}
        <header className="border-b border-slate-700/70 bg-slate-950/80 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.65)]">
          <div className="mx-auto max-w-6xl px-5 lg:px-6 flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-slate-900 border border-slate-500/80 overflow-hidden flex items-center justify-center shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_10px_25px_rgba(0,0,0,0.85)]">
                <Image
                  src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=300&q=80"
                  alt="Unite-Hub logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => router.push("/")}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[18px] md:text-[20px] font-medium tracking-tight bg-[conic-gradient(from_210deg_at_50%_50%,#0ea5e9,#38bdf8,#22c55e,#f97316,#0ea5e9)] bg-clip-text text-transparent">
                  Unite-Hub
                </span>
                <span className="text-[11px] md:text-[12px] text-slate-300/70">
                  Finally feel in control of your business again
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6 text-[13px] text-slate-200/70">
              <button type="button" className="hover:text-white transition-colors">Is this for me?</button>
              <button type="button" className="hover:text-white transition-colors">Problems we solve</button>
              <button type="button" className="hover:text-white transition-colors">How it works</button>
              <Link href="/login">
                <button type="button" className="rounded-full border border-slate-500/80 bg-slate-900/80 px-3 py-1.5 text-[12px] font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-[0_0_0_1px_rgba(148,163,184,0.3),0_8px_20px_rgba(15,23,42,0.8)]">
                  Get Started
                </button>
              </Link>
            </div>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-500/80 text-slate-200/80 hover:bg-slate-900/70 shadow-[0_0_0_1px_rgba(148,163,184,0.4)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 lg:px-6">
          {/* Section 1: Hero */}
          <section className="w-full py-16 md:py-20 flex flex-col items-center text-center -mx-6">
            <div className="mx-auto max-w-6xl px-5 lg:px-6">
              <div className="flex flex-col items-center">
                {/* Logo above heading */}
                <div className="relative flex flex-col items-center">
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-slate-950 border border-slate-500/90 shadow-[0_0_0_1px_rgba(148,163,184,0.7),0_18px_40px_rgba(0,0,0,0.85)] overflow-hidden flex items-center justify-center">
                    <Image
                      src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=400&q=80"
                      alt="Unite-Hub logo"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="mt-3 inline-flex items-center rounded-full border border-slate-500/70 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-100/80 shadow-[0_0_0_1px_rgba(148,163,184,0.5)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    For owners who are tired of juggling everything alone
                  </span>
                </div>

                {/* Heading */}
                <h1 className="mt-6 text-[40px] md:text-[46px] lg:text-[52px] font-semibold tracking-tight text-slate-50 max-w-3xl">
                  Overwhelmed by marketing, clients, and follow‑ups?{" "}
                  <span className="bg-[conic-gradient(from_210deg_at_50%_50%,#0ea5e9,#22d3ee,#22c55e,#f59e0b,#0ea5e9)] bg-clip-text text-transparent">
                    We turn that chaos into one clear hub.
                  </span>
                </h1>

                {/* Paragraph */}
                <p className="mt-4 md:mt-5 text-[17px] md:text-[19px] leading-relaxed text-slate-200/90 max-w-[720px]">
                  If you're running a small business and feel like you're drowning in
                  messages, missed leads, and "one more tool" to manage—Unite‑Hub pulls
                  everything into one place, gives you simple next steps, and helps you
                  win back your time without hiring a full team.
                </p>

                {/* CTA Button */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                  <Link href="/login">
                    <button type="button" className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-[14px] font-medium tracking-tight text-slate-950 bg-[radial-gradient(circle_at_10%_0%,#e5e7eb_0,#cbd5f5_40%,#9ca3af_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.9)] hover:brightness-110 border border-slate-500/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] focus-visible:ring-sky-400">
                      See how we'd fix your day
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </Link>
                  <button type="button" className="inline-flex items-center justify-center rounded-lg px-5 py-3 text-[13px] font-medium tracking-tight text-slate-100/90 bg-slate-900/80 border border-slate-600/90 hover:bg-slate-800 transition-colors shadow-[0_0_0_1px_rgba(148,163,184,0.6),0_14px_35px_rgba(15,23,42,0.9)]">
                    Watch a 2‑minute overview
                  </button>
                </div>

                {/* Hero Dashboard Mock */}
                <HeroDashboardMock />
              </div>
            </div>
          </section>

          {/* Section 2: Who & Core Pillars */}
          <WhoCoreSection />

          {/* Section 3: Daily Benefits */}
          <DailyBenefitsSection />

          {/* Section 4: How It Works */}
          <HowItWorksSection />

          {/* Section 5: Why Choose */}
          <WhyChooseSection />

          {/* Footer */}
          <footer className="border-t border-slate-800/80 bg-slate-950/90 mt-10">
            <div className="mx-auto max-w-6xl px-5 lg:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">©</span>
                <span>Unite-Hub</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Helping owners feel back in control</span>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-slate-200">Privacy</a>
                <a href="#" className="hover:text-slate-200">Terms</a>
                <a href="#" className="hover:text-slate-200">Status</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Hero Dashboard Mock Component
function HeroDashboardMock() {
  return (
    <div className="mt-10 md:mt-12 w-full flex justify-center">
      <div className="relative w-full max-w-[900px] rounded-[16px] overflow-hidden border border-slate-500/80 bg-slate-950/95 shadow-[0_26px_80px_rgba(0,0,0,0.95)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(249,115,22,0.16),transparent_55%)] pointer-events-none"></div>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500/90"></span>
              <span className="h-2 w-2 rounded-full bg-amber-400/90"></span>
              <span className="h-2 w-2 rounded-full bg-emerald-400/90"></span>
            </div>
            <span className="ml-2 text-[11px] font-medium tracking-tight text-slate-200">
              Your hub – custom‑wired to your business
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"></span>
              AI-Powered CRM · 6 active agents
            </span>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 space-y-4">
          {/* Metrics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              label="Monthly revenue"
              value="$42.9k"
              trend="Up 18%"
              description="Based on your pricing & job types"
              color="emerald"
            />
            <MetricCard
              label="New leads"
              value="143"
              description="From: Email, Social, Website"
              color="sky"
            />
            <MetricCard
              label="Today's focus"
              value="7 key tasks"
              description="Highest impact follow‑ups & quotes"
              color="emerald"
            />
            <MetricCard
              label="AI helpers"
              value="6 active"
              description="Following up so you don't have to"
              color="amber"
            />
          </div>

          {/* AI assistant strip */}
          <div className="rounded-xl border border-slate-800/90 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-sky-500/10 border border-sky-400/80 flex items-center justify-center text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Your "do it for me" button
                </div>
                <div className="mt-0.5 text-[12px] text-slate-100">
                  "Find today's hottest leads, send the follow‑ups, and show me what matters most."
                </div>
              </div>
            </div>
            <button type="button" className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[11px] text-slate-100 hover:border-sky-400/80 hover:text-sky-100 transition-all">
              See this workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, trend, description, color }: {
  label: string;
  value: string;
  trend?: string;
  description: string;
  color: "emerald" | "sky" | "amber";
}) {
  const colorClasses = {
    emerald: "text-emerald-400 from-emerald-400 to-sky-400",
    sky: "text-sky-400 bg-sky-400",
    amber: "text-amber-400 bg-amber-400"
  };

  return (
    <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</span>
        {trend && (
          <span className={`text-[10px] ${colorClasses[color]}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[18px] font-semibold tracking-tight text-slate-50">
        {value}
      </div>
      <div className="mt-1 text-[10px] text-slate-400">
        {description}
      </div>
    </div>
  );
}

// Who & Core Pillars Section
function WhoCoreSection() {
  return (
    <section className="w-full py-16 md:py-18 -mx-6">
      <div className="mx-auto max-w-6xl px-5 lg:px-6">
        <div className="grid gap-10 md:gap-12 md:grid-cols-2">
          {/* Column: Who Unite-Hub Is For */}
          <div className="border border-slate-600/80 rounded-2xl p-6 md:p-7 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.18),rgba(15,23,42,0.95))] shadow-[0_18px_60px_rgba(0,0,0,0.9)]">
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight text-slate-50">
              If this sounds like you, you're in the right place
            </h2>
            <p className="mt-4 text-[15px] md:text-[16px] leading-relaxed text-slate-200/90">
              You're the owner who's answering DMs at night, forgetting who to
              follow up with, and bouncing between apps just to keep up. You know
              you need systems, but you don't have the time (or desire) to become
              a "software person".
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-500/70 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-100/80 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]">
                You sell services, not software
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-500/70 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-100/80 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]">
                Local & GEO‑based businesses
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-500/70 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-100/80 shadow-[0_0_0_1px_rgba(148,163,184,0.6)]">
                Solo owners & small teams
              </span>
            </div>
          </div>

          {/* Column: Core Pillars */}
          <div className="border border-slate-600/80 rounded-2xl p-6 md:p-7 bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,0.18),rgba(15,23,42,0.95))] shadow-[0_18px_60px_rgba(0,0,0,0.9)]">
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-tight text-slate-50">
              How we solve your "too many things" problem
            </h2>
            <ul className="mt-4 space-y-3 text-[15px] md:text-[16px] text-slate-200/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]"></span>
                <span><span className="font-medium text-slate-50">Agent Orchestration:</span> AI helpers that execute tasks you'd normally do yourself.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]"></span>
                <span><span className="font-medium text-slate-50">Client CRM:</span> Every client, message, and promise in one clean timeline.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"></span>
                <span><span className="font-medium text-slate-50">Automations & Triggers:</span> Follow‑ups and reminders that happen even when you're busy.</span>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-slate-500/70 flex flex-wrap gap-6 text-xs text-slate-100/80">
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400/80">
                  Before Unite‑Hub
                </div>
                <div className="mt-1 font-medium text-slate-50">6+ tools, still feeling behind</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400/80">
                  After Unite‑Hub
                </div>
                <div className="mt-1 font-medium text-slate-50">One hub, clear daily focus</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Daily Benefits Section
function DailyBenefitsSection() {
  const benefits = [
    {
      icon: Inbox,
      text: "One inbox for email, DMs, and enquiries—so you never wonder who you forgot to answer.",
      color: "sky" as const
    },
    {
      icon: Workflow,
      text: "AI agents quietly handle the boring stuff—reminders, updates, follow‑ups—while you handle the human parts.",
      color: "cyan" as const
    },
    {
      icon: Users,
      text: "Every client's story in one place, so you walk into every call knowing exactly what's happening.",
      color: "emerald" as const
    },
    {
      icon: Clock,
      text: "Follow‑ups, check‑ins, and polite nudges that go out automatically—so you stop leaving money on the table.",
      color: "amber" as const
    }
  ];

  return (
    <section className="w-full py-18 md:py-20 -mx-6">
      <div className="mx-auto max-w-4xl px-5 lg:px-6">
        <h2 className="text-center text-[28px] md:text-[32px] font-semibold tracking-tight text-slate-50">
          What your days start to feel like with Unite‑Hub
        </h2>

        <div className="mt-8 md:mt-10 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} />
            ))}
          </div>

          <div className="mt-2 flex items-start gap-3 rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3.5 hover:border-sky-400/80 hover:bg-slate-900 transition-colors shadow-[0_0_25px_rgba(15,23,42,0.9)]">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10 text-sky-300 border border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.7)]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-[14px] md:text-[15px] leading-relaxed text-slate-100">
              One screen that tells you: "Here's what's happening, here's what's at risk, and here's what to do next."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// Benefit Card Component
function BenefitCard({ icon: Icon, text, color }: {
  icon: any;
  text: string;
  color: "sky" | "cyan" | "emerald" | "amber";
}) {
  const colorClasses = {
    sky: "bg-sky-500/10 text-sky-300 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.7)] hover:border-sky-400/80",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.7)] hover:border-cyan-400/80",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.7)] hover:border-emerald-400/80",
    amber: "bg-amber-500/10 text-amber-300 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.7)] hover:border-amber-400/80"
  };

  return (
    <div className={`flex items-start gap-3 rounded-xl border border-slate-600/80 bg-slate-900/90 px-4 py-3.5 transition-colors shadow-[0_0_25px_rgba(15,23,42,0.9)] ${colorClasses[color]}`}>
      <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-md ${colorClasses[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[14px] md:text-[15px] leading-relaxed text-slate-100">
        {text}
      </p>
    </div>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: "1. Tell us how your business runs",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      description: "We map out your leads, bookings, client communication, and hand that to agents designed to work the way you already do."
    },
    {
      number: "2. See every client clearly",
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
      description: "Your CRM becomes a living history of each relationship—messages, notes, quotes, and next steps, all in one view."
    },
    {
      number: "3. Automate the routine, keep the human",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
      description: "We set automations to catch leads, send reminders, and keep jobs moving—so you spend time where it actually matters."
    }
  ];

  return (
    <section className="w-full py-18 md:py-20 -mx-6">
      <div className="mx-auto max-w-6xl px-5 lg:px-6">
        <h2 className="text-center text-[28px] md:text-[32px] font-semibold tracking-tight text-slate-50">
          In 3 steps: from "I'm behind" to "I've got this"
        </h2>

        <div className="mt-10 grid gap-8 md:gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Step Card Component
function StepCard({ number, image, description }: {
  number: string;
  image: string;
  description: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-600/80 bg-slate-950/80 overflow-hidden shadow-[0_22px_60px_rgba(0,0,0,0.95)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={number}
          width={400}
          height={300}
          className="h-full w-full object-cover grayscale-[0.1] contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-50 border border-slate-500/80 shadow-[0_0_0_1px_rgba(148,163,184,0.7)]">
          {number}
        </div>
      </div>
      <div className="flex-1 px-4 pb-4 pt-3.5">
        <p className="text-[14px] md:text-[15px] text-slate-200/90">
          {description}
        </p>
      </div>
    </div>
  );
}

// Why Choose Section
function WhyChooseSection() {
  const reasons = [
    "Built for real small businesses, not tech teams or hobby projects.",
    "One place instead of a maze of apps, logins, and spreadsheets.",
    "You always know \"What matters most today?\" when you open it.",
    "Grows with you—from \"just me\" to a small, efficient team."
  ];

  return (
    <section className="w-full py-18 md:py-20 -mx-6">
      <div className="mx-auto max-w-4xl px-5 lg:px-6">
        <h2 className="text-center text-[28px] md:text-[32px] font-semibold tracking-tight text-slate-50">
          Why owners choose Unite‑Hub instead of "one more tool"
        </h2>

        <div className="mt-8 md:mt-10 grid gap-4 md:grid-cols-2">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-slate-600/80 bg-slate-950/80 px-4 py-3.5 hover:border-emerald-400/80 hover:bg-slate-900 transition-colors shadow-[0_14px_45px_rgba(0,0,0,0.9)]"
            >
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"></span>
              <p className="text-[14px] md:text-[15px] text-slate-100">
                {reason}
              </p>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-600/80 bg-[radial-gradient(circle_at_0%_0%,rgba(148,163,184,0.3),rgba(15,23,42,0.95))] px-4 py-4 text-center md:flex-row md:text-left shadow-[0_18px_60px_rgba(0,0,0,0.95)]">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-9 w-9 rounded-full bg-slate-950 border border-slate-500/80 overflow-hidden shadow-[0_0_0_1px_rgba(148,163,184,0.7)]">
              <Image
                src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=200&q=80"
                alt="Unite-Hub logo small"
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-[13px] uppercase tracking-[0.14em] text-slate-300/80">
                Your first impression with us
              </div>
              <div className="mt-1.5 text-[15px] text-slate-100">
                Share how your days actually look—we'll show you exactly how Unite‑Hub would fix it.
              </div>
            </div>
          </div>
          <Link href="/login">
            <button type="button" className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-[14px] font-medium tracking-tight text-slate-950 bg-[radial-gradient(circle_at_10%_0%,#f9fafb_0,#e5e7eb_30%,#a5b4fc_100%)] hover:brightness-110 border border-slate-400/90 shadow-[0_16px_45px_rgba(15,23,42,0.9)] transition-colors transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 focus-visible:ring-sky-400">
              Talk through your situation
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
