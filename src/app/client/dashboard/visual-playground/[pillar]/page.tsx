"use client";

/**
 * Pillar Detail Page
 * Phase 33: Honest Visual Playground
 *
 * Shows sub-pillars for a specific content pillar
 */

import { useRouter, useParams } from "next/navigation";
import { getPillar, DISCLAIMERS } from "@/lib/content/pillars-config";
import { ArrowLeft, AlertTriangle, Sparkles, ChevronRight } from "lucide-react";

export default function PillarPage() {
  const router = useRouter();
  const params = useParams();
  const pillarId = params.pillar as string;
  const pillar = getPillar(pillarId);

  if (!pillar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Pillar not found</p>
          <button
            onClick={() => router.push("/client/dashboard/visual-playground")}
            className="mt-4 text-teal-600 hover:text-teal-700"
          >
            Back to Playground
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/client/dashboard/visual-playground")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Playground
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {pillar.title}
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">{pillar.description}</p>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {DISCLAIMERS.general}
            </p>
          </div>
        </div>

        {/* Sub-Pillars */}
        <div className="space-y-4">
          {pillar.subPillars.map((subPillar) => (
            <div
              key={subPillar.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-teal-500 dark:hover:border-teal-500 transition-colors cursor-pointer"
              onClick={() =>
                router.push(
                  `/client/dashboard/visual-playground/${pillarId}/${subPillar.id}`
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {subPillar.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {subPillar.description}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    {subPillar.disclaimer}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
