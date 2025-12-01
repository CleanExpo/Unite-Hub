"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Crown, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "professional">("professional");

  const handleNext = () => {
    // For now, skip payment and continue with free trial
    // Stripe payment can be implemented later in settings
    router.push("/onboarding/step-3-assets");
  };

  const handleSkip = () => {
    // Skip payment step entirely
    router.push("/onboarding/step-3-assets");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className="w-1/2 h-full bg-blue-600 rounded" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
            <p className="text-gray-600 mt-2">Select the perfect plan for your business</p>
          </div>

          {/* Free Trial Notice */}
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            You're starting with a free 14-day trial. No credit card required. You can upgrade anytime from settings.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <PlanCard
              name="Starter"
              price="A$495"
              features={[
                "20,000 AI tokens/month",
                "2 website audits/month",
                "500 contacts",
                "1 team seat",
                "Email support",
              ]}
              selected={selectedPlan === "starter"}
              onSelect={() => setSelectedPlan("starter")}
            />
            <PlanCard
              name="Pro"
              price="A$895"
              features={[
                "250,000 AI tokens/month",
                "20 website audits/month",
                "5,000 contacts",
                "3 team seats",
                "Unlimited campaigns",
                "Priority support",
                "API access",
              ]}
              selected={selectedPlan === "professional"}
              onSelect={() => setSelectedPlan("professional")}
              recommended
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleNext} className="flex-1 gap-2">
              Continue with {selectedPlan === "starter" ? "Starter" : "Professional"} Plan
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={handleSkip} variant="secondary" className="gap-2">
              <SkipForward className="h-4 w-4" />
              Skip for now
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            You can change your plan anytime from the settings page
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  selected,
  onSelect,
  recommended,
}: {
  name: string;
  price: string;
  features: string[];
  selected: boolean;
  onSelect: () => void;
  recommended?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {recommended && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-600 to-orange-600 gap-1">
          <Crown className="h-3 w-3" />
          Recommended
        </Badge>
      )}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
        <div className="mt-2">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600">/month</span>
        </div>
      </div>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
