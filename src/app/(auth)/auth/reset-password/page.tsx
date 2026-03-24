"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a brief delay
    setTimeout(() => router.push("/founder/dashboard"), 2000);
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-white/[0.06] p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60 mb-6">
          Nexus — Unite Group
        </p>
        <h1 className="text-2xl font-extralight text-white/90 mb-8">
          Set new password
        </h1>

        {error && (
          <p className="text-sm text-red-400 mb-4 border border-red-400/20 bg-red-400/5 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        {success ? (
          <div>
            <p className="text-sm text-[#00F5FF]/80 mb-4">
              Password updated successfully. Redirecting to dashboard…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-new-password" className="block text-xs uppercase tracking-[0.15em] text-white/60 mb-2">
                New password
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm"
              />
            </div>
            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs uppercase tracking-[0.15em] text-white/60 mb-2">
                Confirm password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#00F5FF]/40 rounded-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] text-xs uppercase tracking-[0.2em] hover:bg-[#00F5FF]/20 disabled:opacity-50 rounded-sm transition-colors"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <Link
          href="/auth/login"
          className="mt-6 block text-center text-xs uppercase tracking-[0.15em] text-white/50 hover:text-white/70 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
