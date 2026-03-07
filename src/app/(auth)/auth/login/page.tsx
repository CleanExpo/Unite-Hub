/**
 * Staff Login Page - Phase 1 New UI
 * Supabase email/password authentication for staff
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { staffLogin } from '@/lib/auth/supabase';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await staffLogin(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
      return;
    }

    // Success - redirect to staff dashboard
    router.push('/staff/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#00F5FF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-mono font-bold text-white/90 mb-2">
              Staff Login
            </h1>
            <p className="text-white/40 text-sm font-mono">
              Phase 1 — New Supabase Authentication
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm p-4">
                <p className="text-sm text-[#FF4444]">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-mono font-medium text-white/50 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                placeholder="your-email@unite-group.in"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-mono font-medium text-white/50 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#050505]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <button
              onClick={() => router.push('/login')}
              className="w-full text-sm font-mono text-white/40 hover:text-[#00F5FF] transition-colors"
            >
              ← Back to old authentication
            </button>
          </div>

          {/* Info Banner */}
          <div className="mt-6 bg-[#00F5FF]/[0.04] border border-[#00F5FF]/[0.12] rounded-sm p-4">
            <p className="text-xs font-mono text-[#00F5FF]/70">
              <strong className="text-[#00F5FF]">Phase 1 Testing:</strong> This is the new staff
              authentication system. The old system at /login continues to work independently.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm font-mono text-white/30 mt-6">
          Feature-flagged deployment • Safe parallel architecture
        </p>
      </div>
    </div>
  );
}
