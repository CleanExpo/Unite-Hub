"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function OnboardingStep4Page() {
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      setEmails([...emails, newEmail]);
      setNewEmail("");
    }
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleComplete = () => {
    // TODO: Save to Convex and complete onboarding
    router.push("/portal/dashboard");
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
                    onKeyPress={(e) => e.key === "Enter" && addEmail()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={addEmail} size="icon">
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
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleComplete} className="gap-2">
              Complete Setup
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
