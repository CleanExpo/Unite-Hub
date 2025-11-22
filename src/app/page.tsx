"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                How it Works
              </a>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
                Pricing
              </Link>

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
          <div className="md:hidden bg-[#0a1f2e]/95 backdrop-blur-xl border-t border-cyan-800/20">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                How it Works
              </a>
              <Link href="/pricing" className="block text-gray-300 hover:text-cyan-400 transition-colors">
                Pricing
              </Link>

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
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
              <span className="text-xs sm:text-sm text-cyan-300">AI-Powered CRM</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight px-2 sm:px-0">
              <span className="bg-gradient-to-r from-white via-cyan-100 to-teal-100 bg-clip-text text-transparent block">
                Transform Your
              </span>
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent block mt-2">
                Customer Relationships
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Unite-Hub combines the power of AI with intuitive CRM tools to help you manage contacts,
              automate campaigns, and grow your business faster than ever.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center pt-2 sm:pt-4 px-4 sm:px-0">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold shadow-2xl shadow-lime-500/30 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-cyan-700 text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                Watch Demo
                <Zap className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-gray-400 px-4 sm:px-0">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-12 sm:mt-16 md:mt-20 relative px-2 sm:px-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 blur-3xl"></div>
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-cyan-800/30 shadow-2xl shadow-cyan-500/10">
              <div className="bg-[#0a1f2e]/60 backdrop-blur-xl p-4 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Preview Cards */}
                  <div className="bg-[#0d2137]/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-cyan-900/30">
                    <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-cyan-400 mb-3 sm:mb-4" />
                    <h3 className="text-white font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Smart Analytics</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">AI-powered insights into your customer data</p>
                  </div>
                  <div className="bg-[#0d2137]/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-cyan-900/30">
                    <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-teal-400 mb-3 sm:mb-4" />
                    <h3 className="text-white font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Email Automation</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Personalized campaigns at scale</p>
                  </div>
                  <div className="bg-[#0d2137]/60 backdrop-blur-sm rounded-lg p-4 sm:p-5 md:p-6 border border-cyan-900/30 sm:col-span-2 md:col-span-1">
                    <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-400 mb-3 sm:mb-4" />
                    <h3 className="text-white font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Contact Management</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Organize and segment with AI</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#0a1f2e]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-2 sm:px-0">
              Everything you need to
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> succeed</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 sm:px-0">
              Powerful features designed to help you manage customers, automate workflows, and grow your business.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: Bot,
                title: "AI Contact Intelligence",
                description: "Automatically score and prioritize leads with advanced AI algorithms",
                color: "from-cyan-500 to-teal-500"
              },
              {
                icon: Mail,
                title: "Smart Email Campaigns",
                description: "Create personalized email sequences that convert",
                color: "from-teal-500 to-emerald-500"
              },
              {
                icon: Workflow,
                title: "Automation Workflows",
                description: "Set up complex workflows without writing code",
                color: "from-orange-500 to-amber-500"
              },
              {
                icon: BarChart3,
                title: "Advanced Analytics",
                description: "Get deep insights into your sales and marketing performance",
                color: "from-emerald-500 to-green-500"
              },
              {
                icon: MessageSquare,
                title: "Team Collaboration",
                description: "Work together seamlessly with built-in communication tools",
                color: "from-cyan-500 to-blue-500"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and compliance certifications",
                color: "from-gray-500 to-slate-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-[#0d2137]/40 backdrop-blur-sm rounded-xl p-5 sm:p-6 md:p-8 border border-cyan-900/20 hover:border-cyan-500/30 transition-all hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 px-2 sm:px-0">
              Get started in
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent"> minutes</span>
            </h2>
            <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto px-4 sm:px-0">
              Three simple steps to transform your customer relationships
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-8">
            {[
              {
                step: "01",
                title: "Sign Up & Connect",
                description: "Create your account and connect your email in under 60 seconds",
                icon: Target
              },
              {
                step: "02",
                title: "Import & Organize",
                description: "Import contacts and let AI automatically categorize and score them",
                icon: Users
              },
              {
                step: "03",
                title: "Automate & Grow",
                description: "Set up campaigns and watch your business scale on autopilot",
                icon: TrendingUp
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-5 sm:mb-6 relative">
                    <div className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <item.icon className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#071318] border-2 border-cyan-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-400">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4 px-2 sm:px-0">{item.title}</h3>
                  <p className="text-gray-400 text-sm sm:text-base px-4 sm:px-0">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 p-6 sm:p-8 md:p-10 lg:p-12 text-center shadow-2xl shadow-cyan-500/30">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 md:mb-6 px-2 sm:px-0">
                Ready to transform your business?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-cyan-100 mb-6 sm:mb-7 md:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
                Join thousands of businesses already using Unite-Hub to manage their customer relationships.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2 sm:px-0">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-cyan-600 hover:bg-cyan-50 shadow-xl font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6">
                  Schedule Demo
                  <Calendar className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-cyan-800/20 bg-[#0a1f2e]/50 py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><Link href="#features" className="hover:text-cyan-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard/integrations" className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><a href="https://unite-hub.com/about" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">About</a></li>
                <li><a href="https://unite-hub.com/blog" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">Blog</a></li>
                <li><a href="https://unite-hub.com/careers" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><a href="https://help.unite-hub.com" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">Help Center</a></li>
                <li><a href="mailto:support@unite-hub.com" className="hover:text-cyan-400 transition-colors">Contact</a></li>
                <li><a href="https://status.unite-hub.com" className="hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-cyan-400 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-cyan-800/20 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-1">
              <Image
                src="/logos/unite-hub-logo.png"
                alt="Unite-Hub Logo"
                width={32}
                height={32}
                className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              />
              <span className="text-gray-400 text-xs sm:text-sm">© 2025 Unite-Hub. All rights reserved.</span>
            </div>
            <div className="flex gap-4 sm:gap-6 order-1 sm:order-2">
              <a href="https://twitter.com/unitehub" className="text-gray-400 hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://github.com/CleanExpo/Unite-Hub" className="text-gray-400 hover:text-cyan-400 transition-colors" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">GitHub</span>
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
