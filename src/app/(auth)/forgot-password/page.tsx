"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-unite-navy">Reset Password</h2>
        <p className="text-gray-600 mt-1">Enter your email to receive a reset link</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Check your email for a password reset link</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="pl-10"
              required
              disabled={loading || success}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-unite-teal to-unite-blue text-white hover:opacity-90"
          disabled={loading || success}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : success ? (
            "Email Sent"
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="text-unite-teal hover:text-unite-blue font-semibold">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
