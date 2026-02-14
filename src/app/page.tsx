"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  Globe,
  Layers,
  Mail,
  Megaphone,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard/overview");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Unite-Hub
            </span>
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <a href="#services" className="text-sm text-slate-300 hover:text-white transition-colors">
              Services
            </a>
            <a href="#capabilities" className="text-sm text-slate-300 hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#about" className="text-sm text-slate-300 hover:text-white transition-colors">
              About
            </a>
          </nav>

          <div className="flex gap-3">
            {loading ? (
              <div className="h-10 w-20 bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all"
                >
                  Client Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">AI-Powered Business Hub</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your Business.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              One Hub.
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Manage contacts, deals, campaigns, and operations across all your
            businesses from one intelligent dashboard. Powered by AI that works
            for you.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-all shadow-lg shadow-blue-600/25"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 font-semibold text-lg transition-all"
            >
              Our Services
            </a>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="border-y border-slate-700/50 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-400">AI-First</div>
            <div className="text-sm text-slate-400 mt-1">Intelligence Built In</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400">Multi-Biz</div>
            <div className="text-sm text-slate-400 mt-1">All Businesses, One View</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-400">24/7</div>
            <div className="text-sm text-slate-400 mt-1">Always-On Automation</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400">Secure</div>
            <div className="text-sm text-slate-400 mt-1">Enterprise-Grade Security</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We Do</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Full-service business management powered by AI. From first contact to closed deal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <ServiceCard
              icon={<Users className="w-6 h-6" />}
              title="CRM & Contact Management"
              description="Track every contact, conversation, and opportunity. AI-powered lead scoring identifies your hottest prospects."
            />
            <ServiceCard
              icon={<Briefcase className="w-6 h-6" />}
              title="Deal Pipeline"
              description="Visual kanban pipeline to manage deals from lead to close. Track value, probability, and stage progression."
            />
            <ServiceCard
              icon={<Mail className="w-6 h-6" />}
              title="Email Intelligence"
              description="Gmail integration with AI-powered email processing, automated follow-ups, and engagement tracking."
            />
            <ServiceCard
              icon={<Megaphone className="w-6 h-6" />}
              title="Campaign Automation"
              description="Drip campaigns, email sequences, and A/B testing. Set it up once and let AI handle the rest."
            />
            <ServiceCard
              icon={<Globe className="w-6 h-6" />}
              title="SEO & Marketing"
              description="AI-driven SEO audits, keyword research, and content optimization. Dominate search without an agency."
            />
            <ServiceCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analytics & Insights"
              description="Real-time dashboards, predictive analytics, and AI-generated business insights across all your ventures."
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Founders</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              This isn&apos;t a generic SaaS tool. It&apos;s a personal command center built
              to run your businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <CapabilityCard
              icon={<Bot className="w-8 h-8 text-blue-400" />}
              title="AI Agent System"
              description="Autonomous agents that plan, execute, and learn. From email processing to content generation, your AI workforce handles the repetitive work."
            />
            <CapabilityCard
              icon={<Layers className="w-8 h-8 text-cyan-400" />}
              title="Multi-Business Management"
              description="Run multiple businesses from one dashboard. Each with its own contacts, deals, campaigns, and analytics. Switch between them instantly."
            />
            <CapabilityCard
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="Cognitive Twin"
              description="An AI model of your decision patterns and business knowledge. Get advice based on your own expertise and historical decisions."
            />
            <CapabilityCard
              icon={<Shield className="w-8 h-8 text-green-400" />}
              title="Client Portal"
              description="Clients get their own branded portal to track project progress, submit requests, and communicate — without accessing your internal tools."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">About Unite-Hub</h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-8">
            Unite-Hub is a personal AI-powered Business Hub built for founders who
            run multiple businesses. It combines CRM, email, campaigns, analytics,
            and AI agents into one system designed to give you complete control over
            your operations.
          </p>
          <p className="text-slate-400 leading-relaxed">
            No subscriptions for sale. No public signups. This is a private business
            tool. If you&apos;re a client, use the Client Portal to access your project
            dashboard.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Unite-Hub
            </span>
            <span className="text-sm text-slate-500">Business Hub</span>
          </div>

          <div className="flex gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
          </div>

          <div className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Unite-Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all">
      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function CapabilityCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-5 p-6 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
