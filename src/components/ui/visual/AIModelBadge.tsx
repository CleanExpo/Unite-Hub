"use client";

/**
 * AI Model Badge
 * Phase 34: Client Honest Experience Integration
 *
 * Shows which AI model generated content with timestamp
 */

import { Cpu } from "lucide-react";

export type AIModel = "openai" | "gemini" | "nano_banana_2" | "elevenlabs" | "anthropic";

interface AIModelBadgeProps {
  model: AIModel;
  generatedAt?: Date | string;
  className?: string;
}

const MODEL_CONFIG: Record<AIModel, { name: string; color: string; bgColor: string }> = {
  openai: {
    name: "OpenAI",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  gemini: {
    name: "Gemini",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  nano_banana_2: {
    name: "Nano Banana 2",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  elevenlabs: {
    name: "ElevenLabs",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  anthropic: {
    name: "Anthropic",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
};

export default function AIModelBadge({
  model,
  generatedAt,
  className = "",
}: AIModelBadgeProps) {
  const config = MODEL_CONFIG[model] || MODEL_CONFIG.openai;

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs ${config.bgColor} ${config.color} ${className}`}
    >
      <Cpu className="w-3 h-3" />
      <span className="font-medium">{config.name}</span>
      {generatedAt && (
        <>
          <span className="opacity-50">•</span>
          <span className="opacity-75">{formatDate(generatedAt)}</span>
        </>
      )}
    </div>
  );
}

// Compact version for inline use
export function AIModelBadgeCompact({
  model,
  className = "",
}: {
  model: AIModel;
  className?: string;
}) {
  const config = MODEL_CONFIG[model] || MODEL_CONFIG.openai;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${config.bgColor} ${config.color} ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.bgColor.replace("bg-", "bg-").replace("/30", "")}`}
        style={{
          backgroundColor:
            model === "openai"
              ? "#3B82F6"
              : model === "gemini"
              ? "#22C55E"
              : model === "nano_banana_2"
              ? "#A855F7"
              : model === "elevenlabs"
              ? "#F97316"
              : "#F59E0B",
        }}
      />
      <span className="font-medium">{config.name}</span>
    </span>
  );
}

// List of all available models
export function getAvailableModels(): AIModel[] {
  return ["openai", "gemini", "nano_banana_2", "elevenlabs", "anthropic"];
}

// Get model display name
export function getModelDisplayName(model: AIModel): string {
  return MODEL_CONFIG[model]?.name || model;
}
