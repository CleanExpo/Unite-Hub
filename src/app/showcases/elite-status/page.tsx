/**
 * Elite Operation Status Showcase Page
 *
 * Demonstrates the AI operation progress visualization system.
 * URL: /showcases/elite-status
 */

import { Metadata } from "next";
import { EliteOperationDemo, EliteOperationDemoGrid } from "@/components/ui/elite-operation-demo";

export const metadata: Metadata = {
  title: "Elite Operation Status | Unite-Hub Showcase",
  description: "Premium AI operation progress visualization with real-time status updates",
};

export default function EliteStatusShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-primary to-bg-secondary">
      {/* Header */}
      <header className="border-b bg-bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-text-secondary">
            <a href="/" className="hover:text-[#ff6b35] transition-colors">Home</a>
            <span>/</span>
            <a href="/showcases" className="hover:text-[#ff6b35] transition-colors">Showcases</a>
            <span>/</span>
            <span className="text-text-primary">Elite Status</span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-full bg-[#ff6b35]/10 text-[#ff6b35] text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b35] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff6b35]"></span>
            </span>
            Elite Production Mode
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            AI Operation Status
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Premium progress visualization that shows users exactly what the system
            is doing—no more wondering if it&apos;s stuck or still generating.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: "⚡",
              title: "Real-time Updates",
              description: "Live progress tracking with stage-by-stage visibility"
            },
            {
              icon: "🎯",
              title: "Clear Phases",
              description: "Distinct phases: Analysing, Thinking, Generating, Validating"
            },
            {
              icon: "✨",
              title: "Micro-interactions",
              description: "Smooth animations that communicate system activity"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-bg-card border hover:border-[#ff6b35]/30 hover:shadow-lg transition-all"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Interactive Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Interactive Demo
          </h2>
          <EliteOperationDemo />
        </section>

        {/* Compact Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Compact Variants
          </h2>
          <p className="text-text-secondary mb-6">
            Use compact mode for sidebars, notifications, or when space is limited.
          </p>
          <EliteOperationDemoGrid />
        </section>

        {/* Design Philosophy */}
        <section className="p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <h2 className="text-2xl font-bold mb-4">Design Philosophy</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">
                Why This Matters
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Users lose trust when they can&apos;t see what&apos;s happening. This system
                provides transparency into AI operations, reducing anxiety and
                building confidence in the platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">
                Australian Localisation
              </h3>
              <p className="text-gray-300 leading-relaxed">
                All copy uses en-AU spelling (Analysing, Initialising, Finalising).
                Follows Australian conventions for formatting and communication style.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-bg-card mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-text-secondary text-sm">
          <p>Unite-Hub Elite Production System</p>
        </div>
      </footer>
    </div>
  );
}
