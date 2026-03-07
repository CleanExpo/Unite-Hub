"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AssetUpload } from "@/components/assets/AssetUpload";

export default function OnboardingStep3Page() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/onboarding/step-4-contacts");
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4">
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
          <div className="mb-8">
            {/* Progress */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/30 text-[#00F5FF] flex items-center justify-center font-mono font-bold text-sm">
                3
              </div>
              <div className="flex-1 h-1 bg-white/[0.06] rounded-sm">
                <div className="w-3/4 h-full bg-[#00F5FF] rounded-sm" />
              </div>
            </div>
            <h1 className="text-3xl font-mono font-bold text-white/90">Upload Your Assets</h1>
            <p className="text-white/40 font-mono text-sm mt-2">
              Add your logos, brand materials, and marketing assets
            </p>
          </div>

          <AssetUpload onUploadComplete={(assetId) => console.log("Uploaded:", assetId)} />

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="bg-white/[0.04] border border-white/[0.06] text-white/50 font-mono text-sm rounded-sm px-5 py-2.5 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 transition-colors flex items-center gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
