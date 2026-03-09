"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/founder/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-white/[0.12] p-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 mb-6">
          Nexus — Unite Group
        </p>
        <h1 className="text-2xl font-extralight text-white/90 mb-8">Sign in</h1>

        {error && (
          <p className="text-sm text-red-400 mb-4 border border-red-400/20 bg-red-400/5 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-white/60 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/[0.05] border border-white/[0.15] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.15em] text-white/60 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/[0.05] border border-white/[0.15] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-[11px] uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 disabled:opacity-50 rounded-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
