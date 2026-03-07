"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, Globe, Phone, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OnboardingStep1Page() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    businessDescription: "",
    websiteUrl: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated. Please sign in again.");
        router.push("/login");
        return;
      }

      // Save business info to user_profiles via API
      const response = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          business_name: formData.businessName,
          business_description: formData.businessDescription,
          website_url: formData.websiteUrl,
          phone_number: formData.phoneNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save business information");
      }

      // Navigate to next step
      router.push("/onboarding/step-2-payment");
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
                1
              </div>
              <div className="flex-1 h-1 bg-white/[0.06] rounded-sm">
                <div className="w-1/4 h-full bg-[#00F5FF] rounded-sm" />
              </div>
            </div>
            <h1 className="text-3xl font-mono font-bold text-white/90">Business Information</h1>
            <p className="text-white/40 font-mono text-sm mt-2">Tell us about your business</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm text-[#FF4444] px-4 py-3 text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Business Name *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessDescription" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Business Description *
              </label>
              <textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                rows={4}
                placeholder="Describe what your business does..."
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm resize-none"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  placeholder="https://yourbusiness.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-mono font-medium text-white/50 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/20" />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white/90 placeholder:text-white/20 focus:border-[#00F5FF]/50 outline-none transition-colors font-mono text-sm"
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Payment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
