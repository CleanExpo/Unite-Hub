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
      // Redirect to root - middleware will route based on user role
      router.push('/');
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

      // Redirect to root - middleware will route based on user role
      router.push("/");
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
        return;
      }
    } catch {
      setError("An unexpected error occurred");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-bg-base">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, transparent 2px, transparent 100px)'
        }}
      />

      <div className="w-full max-w-[480px] px-5">
        <div className="p-10 rounded-2xl text-center border border-border-medium bg-bg-raised/95 backdrop-blur-sm shadow-2xl">
          {/* Logo */}
          <div className="mb-5">
            <div className="h-[60px] w-[60px] mx-auto rounded-full bg-bg-card border-2 border-accent-500 flex items-center justify-center">
              <span className="text-accent-500 font-bold text-xl">UH</span>
            </div>
          </div>

          <h2 className="text-text-primary text-[28px] font-bold mb-2.5">Sign In to Your Hub</h2>
          <p className="text-text-muted mb-8 text-[15px]">Welcome back! Please enter your details.</p>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-error-500/10 border border-error-500/30 rounded-xl flex items-center gap-3 text-sm text-error-400 text-left">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="text-left mb-5">
              <label htmlFor="email" className="block text-text-primary mb-2 text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="w-full py-3.5 pl-11 pr-4 bg-bg-card border border-border-subtle rounded-lg text-text-primary text-[15px] placeholder-text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="text-left mb-5">
              <label htmlFor="password" className="block text-text-primary mb-2 text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="w-full py-3.5 pl-11 pr-11 bg-bg-card border border-border-subtle rounded-lg text-text-primary text-[15px] placeholder-text-muted focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6 text-sm">
              <label className="flex items-center text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 accent-primary-500"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-primary-500 font-medium hover:text-primary-400 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-text-primary border-none rounded-lg text-base font-semibold cursor-pointer hover:-translate-y-0.5 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="relative my-6 text-center text-text-muted text-sm">
              <div className="absolute inset-0 flex items-center">
                <div className="w-[45%] h-px bg-border-medium" />
                <div className="flex-1" />
                <div className="w-[45%] h-px bg-border-medium" />
              </div>
              <span className="relative px-4 bg-bg-raised">or continue with</span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 bg-white text-text-inverse border-none rounded-lg text-base font-medium cursor-pointer flex items-center justify-center gap-2.5 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          <div className="mt-8 text-text-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-500 font-semibold hover:text-primary-400 transition-colors">
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
