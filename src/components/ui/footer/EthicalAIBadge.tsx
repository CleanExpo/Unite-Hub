"use client";

/**
 * Ethical AI Badge
 * Phase 35: Integrity Framework
 *
 * Badge showing commitment to ethical AI practices
 */

import { Shield, ExternalLink } from "lucide-react";
import Link from "next/link";

interface EthicalAIBadgeProps {
  className?: string;
  showLink?: boolean;
  variant?: "default" | "compact" | "inline";
}

export default function EthicalAIBadge({
  className = "",
  showLink = true,
  variant = "default",
}: EthicalAIBadgeProps) {
  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-400 ${className}`}
      >
        <Shield className="w-3 h-3" />
        Ethical AI
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded text-xs text-accent-700 dark:text-accent-300 ${className}`}
      >
        <Shield className="w-3 h-3" />
        <span>Ethical AI</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg ${className}`}
    >
      <Shield className="w-4 h-4 text-accent-600 dark:text-accent-400" />
      <div className="flex-1">
        <p className="text-xs font-medium text-accent-700 dark:text-accent-300">
          Ethical AI Commitment
        </p>
        <p className="text-xs text-accent-600 dark:text-accent-400">
          No fake results • No false promises • Your approval required
        </p>
      </div>
      {showLink && (
        <Link
          href="/client/dashboard/settings/ethical-ai"
          className="text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

// Footer integration version
export function EthicalAIFooterBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Shield className="w-3 h-3 text-accent-600 dark:text-accent-400" />
      <span className="text-xs text-text-secondary">
        Governed by our{" "}
        <Link
          href="/client/dashboard/settings/ethical-ai"
          className="text-accent-600 dark:text-accent-400 hover:underline"
        >
          Ethical AI Manifesto
        </Link>
      </span>
    </div>
  );
}
