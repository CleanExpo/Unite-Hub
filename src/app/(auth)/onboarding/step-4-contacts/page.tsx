"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Plus, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OnboardingStep4Page() {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newEmail)) {
        setEmails([...emails, newEmail]);
        setNewEmail("");
        setError("");
      } else {
        setError("Please enter a valid email address");
      }
    }
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated. Please sign in again.");
        router.push("/login");
        return;
      }

      // Get user's workspace
      const { data: userOrgs } = await supabase
        .from("user_organizations")
        .select("org_id")
        .eq("user_id", session.user.id)
        .single();

      if (!userOrgs) {
        throw new Error("No organisation found. Please contact support.");
      }

      // Get workspace for the organization
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("organization_id", userOrgs.org_id)
        .single();

      if (!workspace) {
        throw new Error("No workspace found. Please contact support.");
      }

      // Save contacts if any emails were added
      if (emails.length > 0) {
        const contactsToCreate = emails.map(email => ({
          email,
          workspace_id: workspace.id,
          status: "lead",
          source: "onboarding_import",
        }));

        const response = await fetch("/api/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contacts: contactsToCreate,
            workspaceId: workspace.id
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          // Don't block completion if contacts fail to save
          console.error("Failed to save contacts:", data.error);
        }
      }

      // Mark onboarding as complete by updating user profile
      await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }),
      });

      // Redirect to dashboard
      router.push("/dashboard/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          <div className="mb-8">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] flex items-center justify-center font-mono font-bold text-sm">
                4
              </div>
              <div className="flex-1 h-1 bg-white/[0.06] rounded-sm">
                <div className="w-full h-full bg-[#00F5FF] rounded-sm" />
              </div>
            </div>
            <h1 className="text-3xl font-mono font-bold text-white/90">Contact Information</h1>
            <p className="text-white/40 font-mono text-sm mt-2">
              Add email addresses to link with your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm text-[#FF4444] px-4 py-3 text-sm font-mono">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Add Email Address
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                  <input
                    id="email"
                    type="email"
                    placeholder="additional@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                    className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={addEmail}
                  disabled={loading}
                  className="bg-white/[0.04] border border-white/[0.06] text-white/50 rounded-sm px-3 hover:bg-white/[0.06] hover:text-[#00F5FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {emails.length > 0 && (
              <div>
                <label className="block text-sm font-mono font-medium text-white/50 mb-2">
                  Added Emails
                </label>
                <div className="mt-2 space-y-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 border border-white/[0.06] rounded-sm bg-white/[0.02]"
                    >
                      <span className="text-white/70 font-mono text-sm">{email}</span>
                      <button
                        onClick={() => removeEmail(email)}
                        className="text-[#FF4444]/60 hover:text-[#FF4444] transition-colors"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-[#00F5FF]/[0.04] border border-[#00F5FF]/[0.12] rounded-sm p-4">
              <p className="text-sm font-mono text-[#00F5FF]/70">
                These email addresses will be monitored for incoming messages. Our AI will
                automatically analyse and respond to emails from your clients.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="bg-white/[0.04] border border-white/[0.06] text-white/50 font-mono text-sm rounded-sm px-5 py-2.5 hover:bg-white/[0.06] hover:text-white/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
