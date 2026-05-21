"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <>
      <h1 className="text-2xl font-extralight text-white/90 mb-8">Set new password</h1>

      {error && (
        <p className="text-sm text-[var(--color-danger)] mb-4 border border-[var(--color-danger)]/20 bg-[var(--color-danger-dim)] px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {success ? (
        <p className="text-sm mb-4" style={{ color: 'var(--color-accent)' }}>
          Password updated. Redirecting to dashboard…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="reset-new-password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            id="reset-confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            className="mt-2 text-xs uppercase tracking-[0.2em]"
          >
            Update password
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
