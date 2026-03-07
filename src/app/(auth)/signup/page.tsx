"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Building, User, ArrowRight, Sparkles, Shield, Zap, Users, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate password length
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            business_name: formData.businessName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!data.user) {
        throw new Error("Failed to create account");
      }

      // Get the session to call initialize-user
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData.session) {
        // Initialize user profile and organization
        const initResponse = await fetch("/api/auth/initialize-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            businessName: formData.businessName,
          }),
        });

        if (!initResponse.ok) {
          console.error("Failed to initialize user, but account created");
        }
      }

      // Redirect to onboarding
      router.push("/onboarding/step-1-info");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050505] border-r border-white/[0.06] p-12 flex-col justify-between relative overflow-hidden">
        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-[#00F5FF]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-mono font-bold text-white/90">
                Unite-Group
              </span>
              <span className="text-sm font-mono text-white/40">AI-Powered CRM</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <h1 className="text-5xl font-mono font-bold text-white/90 leading-tight">
            Transform your business with
            <span className="text-[#00F5FF]"> intelligent automation</span>
          </h1>
          <p className="text-xl text-white/50 leading-relaxed">
            Join thousands of businesses using AI to streamline their customer relationships and drive growth.
          </p>

          {/* Benefits */}
          <div className="space-y-4 pt-8">
            {[
              "Free 14-day trial with all premium features",
              "AI-powered contact intelligence from day one",
              "No credit card required to get started",
              "24/7 support and onboarding assistance"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-[#00F5FF]" />
                </div>
                <p className="text-white/60 font-mono text-sm">{benefit}</p>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { icon: Zap, label: "AI Automation" },
              { icon: Users, label: "Smart CRM" },
              { icon: Shield, label: "Secure" }
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center gap-2 p-4 rounded-sm bg-white/[0.02] border border-white/[0.06]">
                <item.icon className="h-6 w-6 text-[#00F5FF]" />
                <span className="text-sm font-mono text-white/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-sm font-mono text-white/30">
          <span>© 2025 Unite-Group</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#00F5FF] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#00F5FF] transition-colors">Terms</Link>
            <a href="https://help.unite-group.in" className="hover:text-[#00F5FF] transition-colors" target="_blank" rel="noopener noreferrer">Help</a>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#050505]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-[#00F5FF]" />
            </div>
            <span className="text-2xl font-mono font-bold text-white/90">
              Unite-Group
            </span>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-mono font-bold text-white/90">Start Your Free Trial</h2>
            <p className="text-white/40 mt-2 font-mono text-sm">Get started in less than 2 minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm px-4 py-3 text-sm font-mono text-[#FF4444]">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-mono font-medium text-white/50">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="businessName" className="block text-sm font-mono font-medium text-white/50">Business Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="businessName"
                  type="text"
                  placeholder="Your Business"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="organization"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-mono font-medium text-white/50">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@business.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-mono font-medium text-white/50">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs font-mono text-white/30">Must be at least 8 characters</p>
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 accent-[#00F5FF] mt-1"
              />
              <label htmlFor="terms" className="ml-2 text-sm font-mono text-white/40">
                I agree to the{" "}
                <Link href="/terms" className="text-[#00F5FF] hover:text-[#00F5FF]/80 font-semibold">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-[#00F5FF] hover:text-[#00F5FF]/80 font-semibold">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm font-mono">
            <span className="text-white/40">Already have an account? </span>
            <Link href="/login" className="text-[#00F5FF] hover:text-[#00F5FF]/80 font-semibold">
              Sign in
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-white/30 pt-4">
            <Shield className="h-4 w-4" />
            <span>No credit card required • Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
