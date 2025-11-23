/**
 * Enhancement Scan Service
 * Phase 36: MVP Client Truth Layer
 *
 * Safe suggestion-only enhancement scanner
 */

import { getSupabaseServer } from "@/lib/supabase";

export interface EnhancementSuggestion {
  id: string;
  title: string;
  description: string;
  impact: "low_effort_high_impact" | "medium_effort_medium_impact" | "high_effort_high_impact";
  source: string;
  model_used: string;
  created_at: string;
}

export interface ScanResult {
  suggestions: EnhancementSuggestion[];
  scannedSources: string[];
  lastScanned: string;
}

/**
 * Scan for enhancement opportunities
 * Returns suggestions only - no automatic execution
 */
export async function scanForEnhancements(
  clientId: string
): Promise<ScanResult> {
  const supabase = await getSupabaseServer();
  const suggestions: EnhancementSuggestion[] = [];
  const scannedSources: string[] = [];

  // Check for audits
  // In production, would query actual audit tables
  scannedSources.push("website_audits");

  // Check AI event log for patterns
  const { data: events } = await supabase
    .from("ai_event_log")
    .select("event_type, metadata")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (events) {
    scannedSources.push("ai_event_log");
  }

  // Check approvals for patterns
  const { data: approvals } = await supabase
    .from("client_approvals")
    .select("item_type, status")
    .eq("client_id", clientId);

  if (approvals) {
    scannedSources.push("client_approvals");

    // Example suggestion based on approval patterns
    const rejectedCount = approvals.filter((a) => a.status === "rejected").length;
    if (rejectedCount > 3) {
      suggestions.push({
        id: crypto.randomUUID(),
        title: "Review content direction preferences",
        description: "Multiple concepts have been rejected. Consider updating your brand notes or goals to improve AI alignment.",
        impact: "low_effort_high_impact",
        source: "client_approvals",
        model_used: "analysis",
        created_at: new Date().toISOString(),
      });
    }
  }

  // Mock suggestions for demo
  if (suggestions.length === 0) {
    suggestions.push(
      {
        id: crypto.randomUUID(),
        title: "Add schema markup to service pages",
        description: "Technical audit detected missing LocalBusiness schema on service pages. This may improve local search visibility.",
        impact: "low_effort_high_impact",
        source: "website_audits",
        model_used: "openai",
        created_at: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: "Create FAQ content for top keywords",
        description: "Keyword analysis shows opportunity for FAQ-style content targeting common questions in your industry.",
        impact: "medium_effort_medium_impact",
        source: "usage_metrics",
        model_used: "gemini",
        created_at: new Date().toISOString(),
      }
    );
  }

  return {
    suggestions,
    scannedSources,
    lastScanned: new Date().toISOString(),
  };
}

/**
 * Get impact label and color
 */
export function getImpactLabel(impact: EnhancementSuggestion["impact"]): { label: string; color: string } {
  switch (impact) {
    case "low_effort_high_impact":
      return { label: "Low effort / High impact", color: "text-green-600 bg-green-50" };
    case "medium_effort_medium_impact":
      return { label: "Medium effort / Medium impact", color: "text-yellow-600 bg-yellow-50" };
    case "high_effort_high_impact":
      return { label: "High effort / High impact", color: "text-blue-600 bg-blue-50" };
    default:
      return { label: "Unknown", color: "text-gray-600 bg-gray-50" };
  }
}
