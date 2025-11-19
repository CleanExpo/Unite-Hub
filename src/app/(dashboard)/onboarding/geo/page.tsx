"use client";

/**
 * GEO Onboarding Wizard Page
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * Three-step wizard for configuring client GEO targeting:
 * 1. Business Type Selection
 * 2. Radius Selection with Cost Preview
 * 3. Suburb Selection and Confirmation
 */

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";
import GeoBusinessTypeStep, { type BusinessType } from "@/components/geo/GeoBusinessTypeStep";
import GeoRadiusStep from "@/components/geo/GeoRadiusStep";
import GeoSuburbStep from "@/components/geo/GeoSuburbStep";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface GeoConfig {
  businessType?: BusinessType;
  radius: number;
  costMultiplier: number;
  selectedSuburbs: string[];
}

export default function GeoOnboardingPage() {
  const router = useRouter();
  const { user, currentOrganization } = useAuth();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isSaving, setIsSaving] = React.useState(false);
  const [clientId, setClientId] = React.useState<string | null>(null);

  const [geoConfig, setGeoConfig] = React.useState<GeoConfig>({
    radius: 10,
    costMultiplier: 1.25,
    selectedSuburbs: [],
  });

  // Get user's subscription tier
  const [tier, setTier] = React.useState("Pro");

  React.useEffect(() => {
    fetchClientProfile();
  }, [currentOrganization]);

  const fetchClientProfile = async () => {
    if (!currentOrganization) return;

    try {
      const { data, error } = await supabase
        .from("seo_client_profiles")
        .select("client_id, subscription_tier")
        .eq("organization_id", currentOrganization.org_id)
        .single();

      if (data) {
        setClientId(data.client_id);
        setTier(data.subscription_tier);
      }
    } catch (error) {
      console.error("Failed to fetch client profile:", error);
    }
  };

  const handleBusinessTypeSelect = (type: BusinessType, recommendedRadius: number) => {
    setGeoConfig((prev) => ({
      ...prev,
      businessType: type,
      radius: recommendedRadius,
      costMultiplier: getCostMultiplier(recommendedRadius),
    }));
  };

  const handleRadiusChange = (radius: number, costMultiplier: number) => {
    setGeoConfig((prev) => ({
      ...prev,
      radius,
      costMultiplier,
    }));
  };

  const handleSuburbsConfirm = async (selectedSuburbs: string[]) => {
    if (!clientId) {
      alert("Client ID not found. Please create a client profile first.");
      return;
    }

    setIsSaving(true);

    try {
      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated. Please log in again.");
        return;
      }

      // Save GEO configuration
      const response = await fetch("/api/client/geo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          geo_radius: geoConfig.radius,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save GEO configuration");
      }

      const data = await response.json();
      console.log("GEO configuration saved:", data);

      // Queue initial GEO audit
      const queueResponse = await fetch("/api/autonomy/queue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          task: "geo",
        }),
      });

      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        console.log("GEO audit queued:", queueData);
      }

      // Redirect to dashboard
      router.push("/dashboard/overview?onboarding=complete");
    } catch (error) {
      console.error("Failed to save GEO configuration:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getCostMultiplier = (radius: number): number => {
    const multipliers: Record<number, number> = {
      3: 1.0,
      5: 1.1,
      10: 1.25,
      15: 1.4,
      20: 1.5,
      25: 1.7,
      50: 2.0,
    };
    return multipliers[radius] || 1.0;
  };

  const steps = [
    { number: 1, title: "Business Type" },
    { number: 2, title: "Service Radius" },
    { number: 3, title: "Target Suburbs" },
  ];

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8 space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              GEO Targeting Setup
            </h1>
            <p className="text-lg text-muted-foreground">
              Configure your local SEO service area in 3 simple steps
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex items-center gap-2 text-sm"
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : currentStep === step.number ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {step.number}
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      currentStep >= step.number
                        ? "font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <GeoBusinessTypeStep
              selectedType={geoConfig.businessType}
              onSelect={handleBusinessTypeSelect}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <GeoRadiusStep
              selectedRadius={geoConfig.radius}
              onRadiusChange={handleRadiusChange}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
              tier={tier}
            />
          )}

          {currentStep === 3 && clientId && (
            <GeoSuburbStep
              clientId={clientId}
              radius={geoConfig.radius}
              onConfirm={handleSuburbsConfirm}
              onBack={() => setCurrentStep(2)}
              isLoading={isSaving}
            />
          )}
        </div>

        {/* Skip Option */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/overview")}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
