"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  Mail,
  BarChart3,
  Clock,
  Shield,
  Check,
  Menu,
  X,
  Bot,
  Workflow,
  Target,
  TrendingUp,
  MessageSquare,
  Calendar,
  Play,
  Star,
  ChevronRight,
  Brain,
  Gauge,
  LineChart,
  MousePointerClick,
  Send,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Floating particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [null, Math.random() * -200 - 100],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(8, 145, 178, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      <FloatingParticles />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a1f2e]/80 backdrop-blur-xl border-b border-cyan-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image
                src="/logos/unite-hub-logo.png"
                alt="Unite-Hub Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Unite-Hub
                </span>
                <span className="text-xs text-gray-400 hidden sm:block">AI-Powered CRM</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                Pricing
              </a>

              {loading ? (
                <div className="h-10 w-28 bg-cyan-900/30 rounded-lg animate-pulse"></div>
              ) : user ? (
                <>
                  <Link href="/dashboard/overview">
                    <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-semibold shadow-lg shadow-cyan-500/30">
                      Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-cyan-900/30"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-cyan-900/30">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold shadow-lg shadow-lime-500/30">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-cyan-900/30 hover:bg-cyan-900/50 transition-colors text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-[#0a1f2e]/95 backdrop-blur-xl border-t border-cyan-800/20"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                Testimonials
              </a>
              <a href="#pricing" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                Pricing
              </a>

              {loading ? (
                <div className="h-10 bg-cyan-900/30 rounded-lg animate-pulse"></div>
              ) : user ? (
                <>
                  <Link href="/dashboard/overview" className="block">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-black font-semibold">
                      Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    className="w-full text-gray-300 hover:text-white hover:bg-cyan-900/30"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-cyan-900/30">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login" className="block">
                    <Button className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Social Proof Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 border-2 border-[#071318]"
                  />
                ))}
              </div>
              <span className="text-sm text-cyan-300">Trusted by 1,000+ businesses</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </motion.div>

            {/* Animated Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent block">
                AI-Powered CRM
              </span>
              <span className="relative">
                <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent animate-gradient-x">
                  That Thinks For You
                </span>
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="absolute bottom-2 left-0 h-1 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              Stop managing contacts. Start closing deals. Unite-Hub uses AI to score leads,
              write emails, and automate your entire sales pipeline.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold shadow-2xl shadow-lime-500/30 text-lg px-8 py-6 group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-cyan-700 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 text-lg px-8 py-6 group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap justify-center items-center gap-6 pt-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Setup in 2 minutes</span>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 sm:mt-20 relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 blur-3xl" />

            {/* Main dashboard mockup */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-800/30 shadow-2xl shadow-cyan-500/20 bg-[#0a1f2e]/80 backdrop-blur-xl">
              {/* Browser chrome */}
              <div className="bg-[#0d2137] px-4 py-3 border-b border-cyan-800/30 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-[#071318] rounded-lg px-4 py-1.5 text-xs text-gray-400 flex items-center gap-2">
                    <Shield className="h-3 w-3 text-emerald-400" />
                    app.unite-hub.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-12 gap-4">
                  {/* Sidebar */}
                  <div className="hidden lg:block col-span-2 space-y-2">
                    {["Overview", "Contacts", "Campaigns", "Analytics", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          i === 0
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "text-gray-400 hover:bg-cyan-900/20"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Main content area */}
                  <div className="col-span-12 lg:col-span-10 space-y-4">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Total Contacts", value: "2,847", change: "+12%", icon: Users },
                        { label: "Hot Leads", value: "156", change: "+23%", icon: TrendingUp },
                        { label: "Emails Sent", value: "12.4k", change: "+8%", icon: Send },
                        { label: "AI Score Avg", value: "78", change: "+5%", icon: Brain }
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-[#0d2137]/60 rounded-xl p-4 border border-cyan-900/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <stat.icon className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs text-emerald-400">{stat.change}</span>
                          </div>
                          <div className="text-2xl font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-gray-400">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Charts and activity */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Chart area */}
                      <div className="md:col-span-2 bg-[#0d2137]/60 rounded-xl p-4 border border-cyan-900/30">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-white">Lead Score Trends</span>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Activity className="h-3 w-3" />
                            Live
                          </div>
                        </div>
                        {/* Fake chart bars */}
                        <div className="flex items-end gap-2 h-24">
                          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-cyan-500/60 to-teal-500/60 rounded-t"
                              style={{ height: `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Hot leads list */}
                      <div className="bg-[#0d2137]/60 rounded-xl p-4 border border-cyan-900/30">
                        <div className="text-sm font-medium text-white mb-3">Hot Leads</div>
                        <div className="space-y-2">
                          {[
                            { name: "Sarah Chen", score: 94, company: "TechCorp" },
                            { name: "Mike Johnson", score: 89, company: "StartupXYZ" },
                            { name: "Emily Davis", score: 86, company: "AgencyPro" }
                          ].map((lead) => (
                            <div
                              key={lead.name}
                              className="flex items-center justify-between py-2 border-b border-cyan-900/20 last:border-0"
                            >
                              <div>
                                <div className="text-sm text-white">{lead.name}</div>
                                <div className="text-xs text-gray-400">{lead.company}</div>
                              </div>
                              <div className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded">
                                {lead.score}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating UI elements */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -left-4 top-1/4 hidden xl:block"
            >
              <div className="bg-[#0d2137]/90 backdrop-blur-xl rounded-xl p-4 border border-cyan-800/30 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">AI Assistant</div>
                    <div className="text-sm text-white">Drafting email...</div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 }}
              className="absolute -right-4 top-1/3 hidden xl:block"
            >
              <div className="bg-[#0d2137]/90 backdrop-blur-xl rounded-xl p-4 border border-emerald-800/30 shadow-xl">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm text-white">Lead scored: 92</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 border-y border-cyan-800/20 bg-[#0a1f2e]/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: 50000, suffix: "+", label: "Emails Sent Monthly" },
              { value: 99.9, suffix: "%", label: "Uptime SLA" },
              { value: 2.5, suffix: "x", label: "Faster Lead Response" },
              { value: 35, suffix: "%", label: "Higher Conversion" }
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-400 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
              Features
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              Everything you need to
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> close more deals</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
              Powerful AI-driven features that automate your workflow and help you focus on what matters.
            </p>
          </motion.div>

          {/* Bento Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Large feature card */}
            <motion.div
              variants={scaleIn}
              className="md:col-span-2 lg:col-span-2 group relative bg-gradient-to-br from-[#0d2137]/80 to-[#0a1f2e]/80 backdrop-blur-sm rounded-2xl p-8 border border-cyan-900/30 hover:border-cyan-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Lead Intelligence</h3>
                <p className="text-gray-400 text-lg mb-6">
                  Our AI automatically scores every lead based on engagement, sentiment, and behavior patterns.
                  Focus on the hottest prospects while AI nurtures the rest.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {["Sentiment Analysis", "Intent Detection", "Score Prediction"].map((item) => (
                    <div key={item} className="bg-[#071318]/50 rounded-lg p-3 text-center">
                      <div className="text-sm text-cyan-400 font-medium">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Small feature card */}
            <motion.div
              variants={scaleIn}
              className="group relative bg-gradient-to-br from-[#0d2137]/80 to-[#0a1f2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-900/30 hover:border-teal-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-colors" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-teal-500/30">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Smart Email Campaigns</h3>
                <p className="text-gray-400">
                  AI writes personalized emails that sound like you. A/B test automatically and optimize for opens and clicks.
                </p>
              </div>
            </motion.div>

            {/* More feature cards */}
            <motion.div
              variants={scaleIn}
              className="group relative bg-gradient-to-br from-[#0d2137]/80 to-[#0a1f2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-900/30 hover:border-orange-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                  <Workflow className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Visual Workflows</h3>
                <p className="text-gray-400">
                  Drag-and-drop automation builder. Create complex sequences without writing a single line of code.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className="group relative bg-gradient-to-br from-[#0d2137]/80 to-[#0a1f2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-900/30 hover:border-emerald-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/30">
                  <LineChart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Real-time Analytics</h3>
                <p className="text-gray-400">
                  Track every metric that matters. Custom dashboards show you exactly how your campaigns perform.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              className="md:col-span-2 lg:col-span-1 group relative bg-gradient-to-br from-[#0d2137]/80 to-[#0a1f2e]/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-900/30 hover:border-purple-500/50 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise Security</h3>
                <p className="text-gray-400">
                  SOC 2 Type II compliant. End-to-end encryption and row-level security keep your data safe.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#0a1f2e]/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Loved by teams
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> worldwide</span>
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                quote: "Unite-Hub transformed our sales process. The AI lead scoring alone saved us 20 hours per week in manual qualification.",
                author: "Sarah Chen",
                role: "VP of Sales, TechCorp",
                avatar: "SC"
              },
              {
                quote: "The email automation is incredible. Our response rates jumped 45% after implementing AI-written sequences.",
                author: "Marcus Johnson",
                role: "Growth Lead, StartupXYZ",
                avatar: "MJ"
              },
              {
                quote: "Finally, a CRM that actually helps instead of creating more work. The AI insights are genuinely actionable.",
                author: "Emily Rodriguez",
                role: "Founder, AgencyPro",
                avatar: "ER"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-[#0d2137]/60 backdrop-blur-sm rounded-2xl p-6 border border-cyan-900/30 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-sm font-medium text-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-medium">{testimonial.author}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Company logos */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-16 pt-12 border-t border-cyan-800/20"
          >
            <p className="text-center text-sm text-gray-400 mb-8">Trusted by innovative companies</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50">
              {["TechCorp", "StartupXYZ", "AgencyPro", "DataFlow", "CloudBase", "ScaleUp"].map((company) => (
                <div key={company} className="text-xl font-bold text-gray-400">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-4">
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Simple, transparent
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> pricing</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you&apos;re ready. No hidden fees, no surprises.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Starter Plan */}
            <motion.div
              variants={scaleIn}
              className="relative bg-[#0d2137]/60 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-cyan-900/30"
            >
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <p className="text-gray-400 text-sm mb-4">Perfect for small teams getting started</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 1,000 contacts",
                  "Basic AI lead scoring",
                  "Email campaigns",
                  "Standard analytics",
                  "Email support"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-cyan-700 text-cyan-400 hover:bg-cyan-900/30">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            {/* Pro Plan - Highlighted */}
            <motion.div
              variants={scaleIn}
              className="relative bg-gradient-to-br from-cyan-900/40 to-teal-900/40 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-lime-500 to-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-gray-400 text-sm mb-4">For growing teams that need more power</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$79</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Up to 10,000 contacts",
                  "Advanced AI intelligence",
                  "Automated workflows",
                  "A/B testing",
                  "Priority support",
                  "Custom integrations"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/login" className="block">
                <Button className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold shadow-lg shadow-lime-500/30">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              variants={scaleIn}
              className="relative bg-[#0d2137]/60 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-cyan-900/30"
            >
              <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
              <p className="text-gray-400 text-sm mb-4">For large teams with custom needs</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited contacts",
                  "Custom AI models",
                  "Dedicated account manager",
                  "SLA guarantee",
                  "SSO & advanced security",
                  "Custom contracts"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-cyan-700 text-cyan-400 hover:bg-cyan-900/30">
                Contact Sales
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-8 sm:p-12 lg:p-16 text-center shadow-2xl"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6"
              >
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">Limited Time Offer</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to transform your sales?
              </h2>
              <p className="text-lg sm:text-xl text-cyan-100 mb-8 max-w-2xl mx-auto">
                Join 1,000+ businesses already using Unite-Hub. Start your free trial today and see results in 48 hours.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-cyan-600 hover:bg-cyan-50 shadow-xl font-semibold text-lg px-8 py-6 group"
                  >
                    Start Free Trial - No Card Required
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-cyan-100/80">
                14-day free trial / Cancel anytime / Full access to all features
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-cyan-800/20 bg-[#0a1f2e]/50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src="/logos/unite-hub-logo.png"
                  alt="Unite-Hub Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
                <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Unite-Hub
                </span>
              </Link>
              <p className="text-sm text-gray-400 mb-4">
                AI-powered CRM that helps you close more deals.
              </p>
              <div className="flex gap-4">
                <a href="https://twitter.com/unitehub" className="text-gray-400 hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://github.com/CleanExpo/Unite-Hub" className="text-gray-400 hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://linkedin.com/company/unite-hub" className="text-gray-400 hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links columns */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a></li>
                <li><Link href="/dashboard/integrations" className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-cyan-400 transition-colors">Security</Link></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-cyan-800/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              2025 Unite-Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for gradient animation */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
}
