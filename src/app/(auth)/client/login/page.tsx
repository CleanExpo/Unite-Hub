'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/client-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect to client portal
      router.push('/client');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-mono font-bold text-white/90 mb-2">Client Portal</h1>
          <p className="text-white/40 text-sm font-mono">
            Sign in to access your Unite-Group client dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-mono font-medium text-white/50 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-4 py-3 text-white/90 text-sm font-mono placeholder:text-white/20 focus:border-[#00F5FF]/50 focus:outline-none transition-colors"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-mono font-medium text-white/50 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-4 py-3 text-white/90 text-sm font-mono placeholder:text-white/20 focus:border-[#00F5FF]/50 focus:outline-none transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-sm bg-[#FF4444]/10 border border-[#FF4444]/30 px-4 py-3">
              <p className="text-sm font-mono text-[#FF4444]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm font-mono text-white/40">
            Need help?{' '}
            <Link href="/support" className="text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
