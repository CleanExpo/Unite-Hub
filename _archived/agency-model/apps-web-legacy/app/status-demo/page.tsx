'use client';

/**
 * StatusCommandCentre Demo Page
 * Timeline layout with spectral colours, breathing animations
 */

import { StatusCommandCentre } from '@/components/status-command-centre';

export default function StatusDemoPage() {
  return (
    <main className="min-h-screen bg-[#050505] p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <p className="mb-2 text-[10px] tracking-[0.3em] text-white/30 uppercase">
            Refactored Component Demo
          </p>
          <h1 className="text-3xl font-extralight tracking-tight text-white">
            StatusCommandCentre
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Timeline layout • Spectral colours • OLED Black • Framer Motion
          </p>
        </header>

        {/* Full Variant */}
        <section className="mb-12">
          <h2 className="mb-4 text-sm tracking-widest text-white/30 uppercase">Full Variant</h2>
          <StatusCommandCentre variant="full" showNotifications />
        </section>

        {/* Compact Variant */}
        <section className="mb-12">
          <h2 className="mb-4 text-sm tracking-widest text-white/30 uppercase">Compact Variant</h2>
          <div className="max-w-md">
            <StatusCommandCentre variant="compact" />
          </div>
        </section>

        {/* Minimal Variant */}
        <section>
          <h2 className="mb-4 text-sm tracking-widest text-white/30 uppercase">Minimal Variant</h2>
          <StatusCommandCentre variant="minimal" />
        </section>
      </div>
    </main>
  );
}
