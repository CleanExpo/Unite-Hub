"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building, Globe, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className="w-1/4 h-full bg-blue-600 rounded" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Business Information</h1>
            <p className="text-gray-600 mt-2">Tell us about your business</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleNext} className="space-y-6">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessDescription">Business Description *</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) =>
                  setFormData({ ...formData, businessDescription: e.target.value })
                }
                rows={4}
                placeholder="Describe what your business does..."
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="websiteUrl">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, websiteUrl: e.target.value })
                  }
                  className="pl-10"
                  placeholder="https://yourbusiness.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="pl-10"
                  placeholder="+1 (555) 000-0000"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
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
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
