"use client";

/**
 * Creative Lab Info Drawer
 * Phase 34: Client Honest Experience Integration
 *
 * Persistent slide-out drawer with full narrative about the Creative Lab
 */

import { useState } from "react";
import { X, Info, CheckCircle, XCircle, Cpu, Shield, Users } from "lucide-react";

interface CreativeLabInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreativeLabInfoDrawer({
  isOpen,
  onClose,
}: CreativeLabInfoDrawerProps) {
  if (!isOpen) {
return null;
}

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-bg-card shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-card border-b border-border-subtle p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-accent-600" />
              <h2 className="text-lg font-bold text-text-primary">
                About This Page
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What This Space Is */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-success-600 dark:text-success-400 mb-3">
              <CheckCircle className="w-4 h-4" />
              What This Space Is
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• AI-generated concept exploration</li>
              <li>• Starting points for creative direction</li>
              <li>• Wireframe and layout ideas</li>
              <li>• Draft copy for review</li>
              <li>• Brand styling explorations</li>
            </ul>
          </section>

          {/* What This Space Is Not */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-error-600 dark:text-error-400 mb-3">
              <XCircle className="w-4 h-4" />
              What This Space Is Not
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Final production-ready assets</li>
              <li>• Guaranteed performance results</li>
              <li>• Completed brand identity systems</li>
              <li>• Real testimonials or case studies</li>
              <li>• Published content</li>
            </ul>
          </section>

          {/* AI Tools Used */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <Cpu className="w-4 h-4" />
              AI Tools Used
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-info-500" />
                <span className="text-sm text-text-secondary">
                  OpenAI — Copy drafts, text generation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success-500" />
                <span className="text-sm text-text-secondary">
                  Gemini — Design rationale, multimodal
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Purple kept for brand differentiation */}
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-text-secondary">
                  Nano Banana 2 — Wireframes, layouts
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-sm text-text-secondary">
                  ElevenLabs — Voice demos (AI labeled)
                </span>
              </div>
            </div>
          </section>

          {/* Honesty & Transparency */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <Shield className="w-4 h-4" />
              Honesty & Transparency
            </h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• We never fake results</li>
              <li>• We never generate testimonials</li>
              <li>• We never promise rankings or revenue</li>
              <li>• All AI outputs are clearly labeled</li>
              <li>• You approve everything before it goes live</li>
            </ul>
          </section>

          {/* Your Role */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
              <Users className="w-4 h-4" />
              Your Role in Reviewing
            </h3>
            <p className="text-sm text-text-secondary mb-3">
              You are the final decision-maker. AI generates ideas; you decide
              what&apos;s useful.
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Does this align with my brand voice?</li>
              <li>• Is the direction right for my audience?</li>
              <li>• What would I change before production?</li>
              <li>• Is this worth developing further?</li>
            </ul>
          </section>

          {/* Final Note */}
          <div className="bg-bg-hover rounded-lg p-4">
            <p className="text-xs text-text-secondary italic">
              This space exists to help you explore possibilities, not to
              replace professional creative work. Every concept is a
              conversation starter, not a conclusion.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Trigger button component
export function CreativeLabInfoTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text-secondary border border-border-subtle rounded-lg hover:bg-bg-hover"
    >
      <Info className="w-4 h-4" />
      About This Page
    </button>
  );
}
