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
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-accent-600" />
            <h1 className="text-2xl font-bold text-text-primary">
              Capability Ledger
            </h1>
          </div>
          <p className="text-text-secondary">
            What Unite-Hub can currently do for you
          </p>
        </div>

        {/* Philosophy */}
        <div className="mb-8 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
          <p className="text-sm text-accent-700 dark:text-accent-300">
            We&apos;d rather under-promise and over-deliver than claim features we can&apos;t support. This page transparently shows what&apos;s available today, what we&apos;re testing, and what&apos;s planned.
          </p>
        </div>

        {/* Currently Available */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-text-primary">
              Currently Available (Stage 1 MVP)
            </h2>
          </div>
          <div className="space-y-3">
            {available.map((cap) => (
              <div
                key={cap.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {cap.name}
                    </p>
                    <p className="text-sm text-text-secondary">
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
            <h2 className="text-lg font-semibold text-text-primary">
              In Testing
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            These features are being tested internally and are not yet available for client use.
          </p>
          <div className="space-y-3">
            {testing.map((cap) => (
              <div
                key={cap.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-4 opacity-75"
              >
                <div className="flex items-start gap-3">
                  <Beaker className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {cap.name}
                    </p>
                    <p className="text-sm text-text-secondary">
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
            <Clock className="w-5 h-5 text-text-muted" />
            <h2 className="text-lg font-semibold text-text-primary">
              Planned / Not Yet Available
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-3">
            These features are on our roadmap but have no committed timeline. We do not promise dates or availability.
          </p>
          <div className="space-y-3">
            {planned.map((cap) => (
              <div
                key={cap.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-4 opacity-50"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {cap.name}
                    </p>
                    <p className="text-sm text-text-secondary">
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
