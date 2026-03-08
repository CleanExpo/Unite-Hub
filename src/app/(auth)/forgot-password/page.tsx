"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-white/[0.06] p-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-6">
          Nexus — Unite Group
        </p>
        <h1 className="text-2xl font-extralight text-white/90 mb-8">Reset password</h1>

        {error && (
          <p className="text-sm text-red-400 mb-4 border border-red-400/20 bg-red-400/5 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        {sent ? (
          <p className="text-sm text-[#00F5FF]/80 mb-4">
            Check your email for a reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-[11px] uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 disabled:opacity-50 rounded-sm transition-colors"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link
          href="/auth/login"
          className="mt-6 block text-center text-[11px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
