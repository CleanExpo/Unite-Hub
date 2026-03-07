"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

const SYSTEM_MODULES = [
  {
    title: "CRM & Contact Intelligence",
    description:
      "Track every contact, conversation, and opportunity. AI-powered lead scoring identifies your hottest prospects in real-time.",
    colour: "#00F5FF",
    tag: "Core",
  },
  {
    title: "Deal Pipeline",
    description:
      "Visual kanban pipeline to manage deals from lead to close. Track value, probability, and stage progression.",
    colour: "#00F5FF",
    tag: "Revenue",
  },
  {
    title: "Email Intelligence",
    description:
      "Gmail integration with AI-powered email processing, automated follow-ups, and engagement tracking.",
    colour: "#00FF88",
    tag: "Comms",
  },
  {
    title: "Campaign Automation",
    description:
      "Drip campaigns, email sequences, and A/B testing. Set it up once and let AI handle the rest.",
    colour: "#FFB800",
    tag: "Marketing",
  },
  {
    title: "SEO & Content Engine",
    description:
      "AI-driven SEO audits, keyword research, and content optimisation. Dominate search without an agency.",
    colour: "#00F5FF",
    tag: "Growth",
  },
  {
    title: "Analytics & Insights",
    description:
      "Real-time dashboards, predictive analytics, and AI-generated business insights across all ventures.",
    colour: "#00FF88",
    tag: "Intelligence",
  },
];

const CAPABILITIES = [
  {
    title: "AI Agent System",
    description:
      "Autonomous agents that plan, execute, and learn. From email processing to content generation, your AI workforce handles the repetitive work.",
    colour: "#00F5FF",
    stat: "23 Agents",
  },
  {
    title: "Multi-Business Management",
    description:
      "Run multiple businesses from one dashboard. Each with its own contacts, deals, campaigns, and analytics. Switch between them instantly.",
    colour: "#00FF88",
    stat: "Unlimited",
  },
  {
    title: "Cognitive Twin",
    description:
      "An AI model of your decision patterns and business knowledge. Get advice based on your own expertise and historical decisions.",
    colour: "#FF00FF",
    stat: "Extended Thinking",
  },
  {
    title: "Client Portal",
    description:
      "Clients get their own branded portal to track project progress, submit requests, and communicate — without accessing your internal tools.",
    colour: "#FFB800",
    stat: "White-Label",
  },
];

const METRICS = [
  { label: "Intelligence", value: "AI-First" },
  { label: "Businesses", value: "Multi-Biz" },
  { label: "Automation", value: "24/7" },
  { label: "Security", value: "Enterprise" },
];

const STATUS_READOUTS = [
  { label: "AI Agents", value: "Online", colour: "#00FF88" },
  { label: "Email Intel", value: "Active", colour: "#00F5FF" },
  { label: "Analytics", value: "Live", colour: "#00F5FF" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard/overview");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[0.5px] border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <motion.div
              className="h-2 w-2 rounded-full bg-[#00F5FF]"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-base font-light tracking-[0.15em] text-white/90 uppercase">
              Unite<span className="text-[#00F5FF]">Group</span>
            </span>
          </Link>

          <nav className="hidden md:flex gap-10 items-center">
            {["System", "Capabilities", "Access"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex gap-3 items-center">
            {loading ? (
              <div className="h-9 w-24 border-[0.5px] border-white/[0.06] bg-white/[0.02] animate-pulse rounded-sm" />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] border-[0.5px] border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 rounded-sm transition-colors duration-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] bg-[#00F5FF]/10 border-[0.5px] border-[#00F5FF]/30 text-[#00F5FF] hover:bg-[#00F5FF]/20 rounded-sm transition-colors duration-300"
                >
                  Client Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero — asymmetric 60/40 split */}
      <section className="pt-40 pb-32 px-8">
        <div className="max-w-7xl mx-auto flex gap-16 items-start">
          {/* Copy block */}
          <div className="flex-[3]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-6">
                AI-Powered Control Platform
              </p>
              <h1 className="text-6xl md:text-8xl font-extralight tracking-tight text-white/90 leading-[0.95] mb-8">
                Your Business.
                <br />
                <span className="text-[#00F5FF]">One Platform.</span>
              </h1>
              <p className="text-base text-white/50 max-w-xl leading-relaxed mb-12 font-light">
                Manage contacts, deals, campaigns, and operations across all your
                businesses from one intelligent command centre. Powered by AI
                that works for you.
              </p>
              <div className="flex gap-6 items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#00F5FF]/10 border-[0.5px] border-[#00F5FF]/40 text-[#00F5FF] text-[11px] uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 rounded-sm transition-colors duration-300"
                >
                  Open Dashboard
                  <span className="text-[#00F5FF]/60">→</span>
                </Link>
                <a
                  href="#system"
                  className="text-[11px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors duration-300"
                >
                  View System
                </a>
              </div>
            </motion.div>
          </div>

          {/* Breathing orb + status readouts */}
          <motion.div
            className="flex-[2] flex flex-col items-center gap-8 pt-4"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE_OUT_EXPO }}
          >
            {/* Central orb */}
            <div
              className="h-48 w-48 flex items-center justify-center rounded-full border-[0.5px]"
              style={{
                borderColor: "rgba(0, 245, 255, 0.15)",
                backgroundColor: "rgba(0, 245, 255, 0.02)",
                boxShadow: "0 0 80px rgba(0, 245, 255, 0.12)",
              }}
            >
              <div
                className="h-16 w-16 flex items-center justify-center rounded-full border-[0.5px]"
                style={{
                  borderColor: "rgba(0, 245, 255, 0.3)",
                  backgroundColor: "rgba(0, 245, 255, 0.06)",
                }}
              >
                <motion.div
                  className="h-6 w-6 rounded-full bg-[#00F5FF]"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                    boxShadow: [
                      "0 0 0px rgba(0,245,255,0)",
                      "0 0 28px rgba(0,245,255,0.5)",
                      "0 0 0px rgba(0,245,255,0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Status readouts */}
            <div className="w-full space-y-2">
              {STATUS_READOUTS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 border-[0.5px] border-white/[0.06] bg-white/[0.01]"
                >
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: item.colour }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: item.colour }}
                    >
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Data Strip — metrics */}
      <section className="border-y border-[0.5px] border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex divide-x divide-white/[0.06]">
            {METRICS.map((metric, index) => (
              <motion.div
                key={metric.label}
                className="flex-1 px-8 py-10 flex flex-col gap-2"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 + index * 0.08,
                  ease: EASE_OUT_EXPO,
                }}
              >
                <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  {metric.label}
                </span>
                <span className="font-mono text-xl text-[#00F5FF] font-medium tabular-nums">
                  {metric.value}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System — timeline layout */}
      <section id="system" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">
              System Architecture
            </p>
            <h2 className="text-4xl font-extralight tracking-tight text-white/90">
              What We Do
            </h2>
          </motion.div>

          <div className="relative pl-10">
            {/* Vertical spine */}
            <div className="absolute top-0 bottom-0 left-[9px] w-px bg-gradient-to-b from-[#00F5FF]/20 via-[#00F5FF]/08 to-transparent" />

            <div className="space-y-8">
              {SYSTEM_MODULES.map((mod, index) => (
                <motion.div
                  key={mod.title}
                  className="relative flex gap-8 items-start"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.07,
                    ease: EASE_OUT_EXPO,
                  }}
                >
                  {/* Timeline node */}
                  <div
                    className="absolute left-[-5px] top-4 h-3 w-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: mod.colour,
                      boxShadow: `0 0 10px ${mod.colour}50`,
                    }}
                  />

                  {/* Content */}
                  <div className="flex-1 border-[0.5px] border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] hover:border-white/10 transition-colors duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-light text-white/90">
                        {mod.title}
                      </h3>
                      <span
                        className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border-[0.5px] ml-4 flex-shrink-0"
                        style={{
                          color: mod.colour,
                          borderColor: `${mod.colour}40`,
                        }}
                      >
                        {mod.tag}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section
        id="capabilities"
        className="py-32 px-8 border-t border-[0.5px] border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-4">
              Founder-Grade Capabilities
            </p>
            <h2 className="text-4xl font-extralight tracking-tight text-white/90">
              Built for Founders
            </h2>
          </motion.div>

          <div className="space-y-4">
            {CAPABILITIES.map((cap, index) => (
              <motion.div
                key={cap.title}
                className="flex border-[0.5px] border-white/[0.06] hover:border-white/10 transition-colors duration-300"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.09,
                  ease: EASE_OUT_EXPO,
                }}
              >
                {/* Colour accent strip */}
                <div
                  className="w-[2px] flex-shrink-0"
                  style={{ backgroundColor: `${cap.colour}30` }}
                />

                <div className="flex-1 flex items-center gap-8 px-8 py-6">
                  {/* Breathing orb */}
                  <div
                    className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full border-[0.5px]"
                    style={{
                      borderColor: `${cap.colour}30`,
                      backgroundColor: `${cap.colour}06`,
                    }}
                  >
                    <motion.div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cap.colour }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                      transition={{
                        duration: 2.5 + index * 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-light text-white/90 mb-1.5">
                      {cap.title}
                    </h3>
                    <p className="text-[12px] text-white/40 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>

                  {/* Stat */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className="font-mono text-[11px] uppercase tracking-[0.1em]"
                      style={{ color: cap.colour }}
                    >
                      {cap.stat}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Access — asymmetric 60/40 */}
      <section
        id="access"
        className="py-32 px-8 border-t border-[0.5px] border-white/[0.06]"
      >
        <div className="max-w-7xl mx-auto flex gap-16 items-start">
          {/* About copy */}
          <div className="flex-[3]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-6">
                About Unite-Group
              </p>
              <h2 className="text-4xl font-extralight tracking-tight text-white/90 mb-6">
                Private. Precise.
                <br />
                <span className="text-[#00F5FF]">Powerful.</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-4 max-w-lg font-light">
                Unite-Group is a central AI-powered control platform built for
                founders who run multiple businesses. It combines CRM, email,
                campaigns, analytics, and AI agents into one system designed to
                give you complete control.
              </p>
              <p className="text-[12px] text-white/30 leading-relaxed max-w-lg">
                No public subscriptions. No generic SaaS. This is a private
                command centre. If you&apos;re a client, use the Client Portal
                to access your project dashboard.
              </p>
            </motion.div>
          </div>

          {/* Portal access panel */}
          <motion.div
            className="flex-[2]"
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
          >
            <div className="border-[0.5px] border-white/[0.06] p-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-6">
                Portal Access
              </p>
              <div className="space-y-3 mb-8">
                {[
                  { label: "Staff Dashboard", href: "/login", colour: "#00F5FF" },
                  { label: "Client Portal", href: "/login", colour: "#00FF88" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between p-4 border-[0.5px] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02] transition-colors duration-300 group"
                  >
                    <span className="text-[11px] uppercase tracking-[0.15em] text-white/60 group-hover:text-white/90 transition-colors duration-300">
                      {link.label}
                    </span>
                    <span style={{ color: link.colour }}>→</span>
                  </Link>
                ))}
              </div>
              <p className="text-[10px] text-white/20 leading-relaxed">
                Authorised access only. Contact the administrator for
                credentials.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[0.5px] border-white/[0.06] py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-[#00F5FF]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              Unite<span className="text-[#00F5FF]/80">Group</span>
            </span>
            <span className="text-[10px] text-white/20">Control Platform</span>
          </div>

          <div className="flex gap-8">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Support", href: "/support" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] uppercase tracking-[0.2em] text-white/20 hover:text-white/50 transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="font-mono text-[10px] text-white/20">
            © {new Date().getFullYear()} Unite-Group
          </div>
        </div>
      </footer>
    </div>
  );
}
