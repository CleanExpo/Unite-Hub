"use client";

/**
 * Transparency Footer
 * Phase 34: Client Honest Experience Integration
 *
 * Footer with ethical standards and transparency statements
 */

import { Shield, CheckCircle } from "lucide-react";

interface TransparencyFooterProps {
  className?: string;
  compact?: boolean;
}

const TRANSPARENCY_STATEMENTS = [
  "We never fake results.",
  "We never generate testimonials.",
  "We never promise SEO rankings or revenue outcomes.",
  "All visuals shown are AI-generated concepts, not finished production assets.",
  "You approve all work before anything goes live.",
];

export default function TransparencyFooter({
  className = "",
  compact = false,
}: TransparencyFooterProps) {
  if (compact) {
    return (
      <div
        className={`border-t border-border-subtle py-4 px-6 ${className}`}
      >
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Shield className="w-3 h-3" />
          <span>
            AI-generated concepts only • No fake results • Your approval required
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-t border-border-subtle bg-bg-raised/50 py-6 px-6 ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-teal-600" />
          <h4 className="text-sm font-semibold text-text-primary">
            Our Transparency Commitment
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {TRANSPARENCY_STATEMENTS.map((statement, index) => (
            <div key={index} className="flex items-start gap-2">
              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary">
                {statement}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Inline version for use in cards/panels
export function TransparencyStatement({
  statement,
  className = "",
}: {
  statement: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Shield className="w-3 h-3 text-teal-600 flex-shrink-0" />
      <p className="text-xs text-text-secondary">{statement}</p>
    </div>
  );
}

// Mini badge version
export function TransparencyBadge({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded text-xs text-teal-700 dark:text-teal-300 ${className}`}
    >
      <Shield className="w-3 h-3" />
      <span>Honest AI Concepts</span>
    </div>
  );
}
