"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

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
    <>
      <h1 className="text-2xl font-extralight text-white/90 mb-8">Reset password</h1>

      {error && (
        <p className="text-sm text-[var(--color-danger)] mb-4 border border-[var(--color-danger)]/20 bg-[var(--color-danger-dim)] px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {sent ? (
        <p className="text-sm mb-4" style={{ color: 'var(--color-accent)' }}>
          Check your email for a reset link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="forgot-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            className="mt-2 text-xs uppercase tracking-[0.2em]"
          >
            Send reset link
          </Button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="text-[11px] font-mono tracking-wider text-white/35 hover:text-white/55 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </>
  );
}
