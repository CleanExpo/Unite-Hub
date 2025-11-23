"use client";

/**
 * Capabilities Ledger
 * Phase 36: MVP Client Truth Layer
 *
 * Transparent list of what Unite-Hub can and cannot do
 */

import { CheckCircle, Beaker, Clock, Shield } from "lucide-react";
import { getCapabilitiesByStatus } from "@/lib/config/capabilities-config";

export default function CapabilitiesPage() {
  const available = getCapabilitiesByStatus("available");
  const testing = getCapabilitiesByStatus("testing");
  const planned = getCapabilitiesByStatus("planned");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Capability Ledger
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            What Unite-Hub can currently do for you
          </p>
        </div>

        {/* Philosophy */}
        <div className="mb-8 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
          <p className="text-sm text-teal-700 dark:text-teal-300">
            We&apos;d rather under-promise and over-deliver than claim features we can&apos;t support. This page transparently shows what&apos;s available today, what we&apos;re testing, and what&apos;s planned.
          </p>
        </div>

        {/* Currently Available */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Currently Available (Stage 1 MVP)
            </h2>
          </div>
          <div className="space-y-3">
            {available.map((cap) => (
              <div
                key={cap.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cap.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cap.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* In Testing */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Beaker className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              In Testing
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            These features are being tested internally and are not yet available for client use.
          </p>
          <div className="space-y-3">
            {testing.map((cap) => (
              <div
                key={cap.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 opacity-75"
              >
                <div className="flex items-start gap-3">
                  <Beaker className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cap.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cap.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Planned */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Planned / Not Yet Available
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            These features are on our roadmap but have no committed timeline. We do not promise dates or availability.
          </p>
          <div className="space-y-3">
            {planned.map((cap) => (
              <div
                key={cap.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {cap.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cap.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
