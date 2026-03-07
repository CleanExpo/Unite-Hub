"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard/overview");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message || "Failed to sign in");
        setLoading(false);
        return;
      }

      router.push("/dashboard/overview");
    } catch {
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
        setError(error.message || "Failed to sign in with Google");
        setGoogleLoading(false);
      }
    } catch {
      setError("An unexpected error occurred");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-[#00F5FF]" />
          </div>
          <span className="text-2xl font-mono font-bold text-white/90">Unite-Group</span>
          <span className="text-sm font-mono text-white/40">AI-Powered Marketing CRM</span>
        </div>

        {/* Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-mono font-bold text-white/90 mb-2">Sign in to your Business Hub</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm flex items-center gap-3 text-sm text-[#FF4444]">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading || googleLoading}
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 text-sm font-mono placeholder:text-white/20 focus:border-[#00F5FF]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading || googleLoading}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 text-sm font-mono placeholder:text-white/20 focus:border-[#00F5FF]/50 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-white/40 font-mono cursor-pointer">
                <input type="checkbox" className="accent-[#00F5FF]" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[#00F5FF] font-mono hover:text-[#00F5FF]/80 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-3 text-white/30 font-mono tracking-widest">or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full h-12 bg-white/[0.04] hover:bg-white/[0.06] text-white/70 border border-white/[0.06] hover:border-white/[0.12] font-mono text-sm font-semibold rounded-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-white/30 font-mono text-sm">
            Client access is by invitation only.{" "}
            <Link href="/support" className="text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>

        <p className="text-center text-sm font-mono text-white/30 mt-6">
          © 2025 Unite-Group. All rights reserved.
        </p>
      </div>
    </div>
  );
}
