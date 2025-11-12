"use client";

import React from "react";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export function UpgradePrompt({
  feature,
  description,
  size = "md",
}: UpgradePromptProps) {
  if (size === "sm") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <Crown className="h-4 w-4 text-amber-600" />
        <span className="text-sm text-gray-700">Professional Feature</span>
      </div>
    );
  }

  if (size === "md") {
    return (
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Crown className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              Unlock {feature}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {description || "Upgrade to Professional to access this feature"}
            </p>
            <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="relative p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-4 shadow-lg">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Unlock {feature}
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {description ||
            "Upgrade to Professional to unlock advanced features and take your marketing to the next level"}
        </p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Unlimited Access
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Advanced Features
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Sparkles className="h-4 w-4 text-amber-600" />
            Priority Support
          </div>
        </div>
        <Button size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all">
          Upgrade to Professional
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
