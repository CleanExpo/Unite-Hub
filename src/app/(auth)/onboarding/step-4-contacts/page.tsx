"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        .single() as { data: { org_id: string } | null };

      if (!userOrgs) {
        throw new Error("No organization found. Please contact support.");
      }

      // Get workspace for the organization
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("organization_id", userOrgs.org_id)
        .single() as { data: { id: string } | null };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className="w-full h-full bg-blue-600 rounded" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Information</h1>
            <p className="text-gray-600 mt-2">
              Add email addresses to link with your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <Label htmlFor="email">Add Email Address</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="additional@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <Button onClick={addEmail} size="icon" disabled={loading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {emails.length > 0 && (
              <div>
                <Label>Added Emails</Label>
                <div className="mt-2 space-y-2">
                  {emails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <span className="text-gray-900">{email}</span>
                      <button
                        onClick={() => removeEmail(email)}
                        className="text-red-600 hover:text-red-700"
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                These email addresses will be monitored for incoming messages. Our AI will
                automatically analyze and respond to emails from your clients.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Back
            </Button>
            <Button onClick={handleComplete} className="gap-2" disabled={loading}>
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
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
