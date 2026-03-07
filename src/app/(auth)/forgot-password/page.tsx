"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { AlertCircle, Loader2, Mail, CheckCircle, Sparkles, ArrowLeft, Shield, Zap, Lock } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
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
            Secure password
            <span className="text-[#00F5FF]"> recovery</span>
          </h1>
          <p className="text-xl text-white/50 leading-relaxed">
            We'll send you a secure link to reset your password and get you back to managing your customers.
          </p>

          {/* Features */}
          <div className="space-y-4 pt-8">
            {[
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption protects your account"
              },
              {
                icon: Zap,
                title: "Instant Recovery",
                description: "Reset link delivered in seconds"
              },
              {
                icon: Lock,
                title: "Privacy First",
                description: "Your data is always encrypted and secure"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-[#00F5FF]" />
                </div>
                <div>
                  <h3 className="text-white/90 font-mono font-semibold">{feature.title}</h3>
                  <p className="text-white/40 text-sm font-mono">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-sm font-mono text-white/30">
          <span>© 2025 Unite-Group</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#00F5FF] transition-colors">Help</a>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
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
            <h2 className="text-3xl font-mono font-bold text-white/90">Reset Your Password</h2>
            <p className="text-white/40 mt-2 font-mono text-sm">Enter your email and we'll send you a reset link</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm flex items-center gap-3 text-sm text-[#FF4444]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm flex items-center gap-3 text-sm text-[#00FF88]">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-mono font-semibold">Check your email!</p>
                <p className="text-xs font-mono mt-1 text-[#00FF88]/70">We've sent a password reset link to {email}</p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  disabled={loading || success}
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending Reset Link...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Email Sent
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Back to Sign In */}
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-mono text-[#00F5FF] hover:text-[#00F5FF]/80 font-semibold">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
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
