"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Crown, SkipForward } from "lucide-react";

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
    <div className="min-h-screen bg-[#050505] p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          <div className="mb-8">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] flex items-center justify-center font-mono font-bold text-sm">
                2
              </div>
              <div className="flex-1 h-1 bg-white/[0.06] rounded-sm">
                <div className="w-1/2 h-full bg-[#00F5FF] rounded-sm" />
              </div>
            </div>
            <h1 className="text-3xl font-mono font-bold text-white/90">Choose Your Plan</h1>
            <p className="text-white/40 font-mono text-sm mt-2">Select the perfect plan for your business</p>
          </div>

          {/* Free Trial Notice */}
          <div className="mb-6 bg-[#00FF88]/[0.06] border border-[#00FF88]/20 rounded-sm text-[#00FF88] px-4 py-3 text-sm font-mono">
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
            <button
              onClick={handleNext}
              className="flex-1 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 transition-colors flex items-center justify-center gap-2"
            >
              Continue with {selectedPlan === "starter" ? "Starter" : "Professional"} Plan
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSkip}
              className="bg-white/[0.04] border border-white/[0.06] text-white/50 font-mono text-sm rounded-sm px-5 py-2.5 hover:bg-white/[0.06] hover:text-white/70 transition-colors flex items-center justify-center gap-2"
            >
              <SkipForward className="h-4 w-4" />
              Skip for now
            </button>
          </div>

          <p className="mt-4 text-center text-sm font-mono text-white/30">
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
      className={`relative p-6 border-2 rounded-sm cursor-pointer transition-all ${
        selected
          ? "border-[#00F5FF]/50 bg-[#00F5FF]/[0.04]"
          : "border-white/[0.06] hover:border-white/[0.12]"
      }`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#FFB800] text-[#050505] font-mono text-xs font-bold px-3 py-1 rounded-sm flex items-center gap-1">
          <Crown className="h-3 w-3" />
          Recommended
        </div>
      )}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-mono font-bold text-white/90">{name}</h3>
        <div className="mt-2">
          <span className="text-4xl font-mono font-bold text-white/90">{price}</span>
          <span className="text-white/40 font-mono text-sm">/month</span>
        </div>
      </div>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-white/60 font-mono text-sm">
            <Check className="h-5 w-5 text-[#00FF88] flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
