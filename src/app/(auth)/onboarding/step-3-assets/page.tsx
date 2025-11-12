"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetUpload } from "@/components/assets/AssetUpload";

export default function OnboardingStep3Page() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/onboarding/step-4-contacts");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-3xl mx-auto py-12">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded">
                <div className="w-3/4 h-full bg-blue-600 rounded" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Your Assets</h1>
            <p className="text-gray-600 mt-2">
              Add your logos, brand materials, and marketing assets
            </p>
          </div>

          <AssetUpload onUploadComplete={(assetId) => console.log("Uploaded:", assetId)} />

          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleNext} className="gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
