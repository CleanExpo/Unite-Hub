"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Mail, Lock, User, Sparkles, ArrowRight, Shield, Zap, Users, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);

      if (error) {
        setError(error.message || "Failed to create account");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(error.message || "Failed to sign up with Google");
        setGoogleLoading(false);
        return;
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setGoogleLoading(false);
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
            Start your journey to
            <span className="text-[#00F5FF]"> smarter customer relationships</span>
          </h1>
          <p className="text-xl text-white/50 leading-relaxed">
            Join thousands of businesses using AI to transform how they manage customers.
          </p>

          {/* Benefits */}
          <div className="space-y-4 pt-8">
            {[
              "14-day free trial, no credit card required",
              "AI-powered automation from day one",
              "Enterprise-grade security & compliance",
              "24/7 support from our team"
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-[#00F5FF]" />
                </div>
                <p className="text-white/60 font-mono text-sm">{benefit}</p>
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

      {/* Right Side - Register Form */}
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
            <h2 className="text-3xl font-mono font-bold text-white/90">Create your account</h2>
            <p className="text-white/40 mt-2 font-mono text-sm">Start your 14-day free trial today</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm flex items-center gap-3 text-sm text-[#FF4444]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-12 bg-white/[0.04] hover:bg-white/[0.06] text-white/70 border border-white/[0.06] hover:border-white/[0.12] font-mono text-sm font-semibold rounded-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing up with Google...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#050505] text-white/30 font-mono">Or continue with email</span>
            </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-mono font-medium text-white/50">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-mono font-medium text-white/50">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs font-mono text-white/30">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-mono font-medium text-white/50">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 accent-[#00F5FF] border-white/[0.06] mt-1"
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
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
            <span>Protected by enterprise-grade security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
