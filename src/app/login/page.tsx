"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

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
      router.push('/dashboard/overview');
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
        setError(error.message || "Failed to sign in with Google");
        setGoogleLoading(false);
        return;
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background: 'radial-gradient(circle at center top, #0d2a5c 0%, #051224 80%)'
        }}
      />

      {/* Wave pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, transparent 2px, transparent 100px)'
        }}
      />

      <div className="w-full max-w-[480px] px-5">
        <div
          className="p-10 rounded-[20px] text-center border border-[rgba(52,123,247,0.1)]"
          style={{
            background: 'rgba(10, 30, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.2), 0 0 20px rgba(52, 123, 247, 0.1)'
          }}
        >
          {/* Logo */}
          <div className="mb-5">
            <div className="h-[60px] w-[60px] mx-auto rounded-full bg-[#0a1e3b] border-2 border-[#ff5722] flex items-center justify-center">
              <span className="text-[#ff5722] font-bold text-xl">UH</span>
            </div>
          </div>

          <h2 className="text-white text-[28px] font-bold mb-2.5">Unite-Hub</h2>
          <p className="text-[#a0aec0] mb-8 text-[15px]">Sign in to your Business Hub</p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-sm text-red-400 text-left">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="text-left mb-5">
              <label htmlFor="email" className="block text-white mb-2 text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0aec0]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full py-3.5 pl-11 pr-4 bg-[#0d2a5c] border border-[#1e3a6d] rounded-lg text-white text-[15px] placeholder-[rgba(160,174,192,0.6)] focus:outline-none focus:border-[#347bf7] focus:shadow-[0_0_0_3px_rgba(52,123,247,0.2)] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="text-left mb-5">
              <label htmlFor="password" className="block text-white mb-2 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a0aec0]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full py-3.5 pl-11 pr-11 bg-[#0d2a5c] border border-[#1e3a6d] rounded-lg text-white text-[15px] placeholder-[rgba(160,174,192,0.6)] focus:outline-none focus:border-[#347bf7] focus:shadow-[0_0_0_3px_rgba(52,123,247,0.2)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6 text-sm">
              <label className="flex items-center text-[#a0aec0] cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 accent-[#347bf7]"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[#347bf7] font-medium hover:opacity-80 transition-opacity">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white border-none rounded-lg text-base font-semibold cursor-pointer hover:-translate-y-0.5 transition-transform shadow-[0_4px_15px_rgba(52,123,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center text-[#a0aec0] text-sm">
              <div className="absolute inset-0 flex items-center">
                <div className="w-[45%] h-px bg-[#1e3a6d]" />
                <div className="flex-1" />
                <div className="w-[45%] h-px bg-[#1e3a6d]" />
              </div>
              <span className="relative px-4 bg-[#0a1e3b]">or continue with</span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 bg-white text-[#333] border-none rounded-lg text-base font-medium cursor-pointer flex items-center justify-center gap-2.5 hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-[#a0aec0] text-sm">
            Client access is by invitation only.{" "}
            <Link href="/support" className="text-[#347bf7] font-semibold hover:opacity-80 transition-opacity">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
