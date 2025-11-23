/**
 * Voice Navigation Service
 * Phase 44: Voice-First Navigation Layer
 *
 * Routes, recognition, and event logging for voice navigation
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type UserRole = "founder" | "staff" | "client";

export interface RouteDefinition {
  path: string;
  label: string;
  aliases: string[];
  roles: UserRole[];
}

export interface NavigationResult {
  success: boolean;
  route?: string;
  intent?: string;
  error?: string;
}

export interface VoiceEvent {
  id: string;
  userId: string;
  userRole: UserRole;
  commandText: string;
  recognizedIntent?: string;
  targetRoute?: string;
  success: boolean;
  errorMessage?: string;
  processingTimeMs?: number;
  createdAt: string;
}

// Route definitions by role
const ROUTE_DEFINITIONS: RouteDefinition[] = [
  // Founder routes
  {
    path: "/founder/dashboard/overview",
    label: "Founder Overview",
    aliases: ["founder dashboard", "founder overview", "command center", "my dashboard"],
    roles: ["founder"],
  },
  {
    path: "/founder/dashboard/financials",
    label: "Financials",
    aliases: ["financials", "finances", "money", "cash flow", "xero", "accounting"],
    roles: ["founder"],
  },
  {
    path: "/founder/dashboard/timecard",
    label: "Timecard",
    aliases: ["timecard", "time tracker", "my time", "hours", "timer"],
    roles: ["founder"],
  },

  // Staff routes
  {
    path: "/staff/dashboard",
    label: "Staff Dashboard",
    aliases: ["staff dashboard", "work dashboard", "team dashboard"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/tasks",
    label: "Tasks",
    aliases: ["tasks", "my tasks", "to do", "work items"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/approvals",
    label: "Approvals",
    aliases: ["approvals", "pending approvals", "review queue"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/clients",
    label: "Clients",
    aliases: ["clients", "client list", "all clients"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/campaigns",
    label: "Campaigns",
    aliases: ["campaigns", "email campaigns", "drip campaigns"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/content",
    label: "Content",
    aliases: ["content", "content library", "assets"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/reports",
    label: "Reports",
    aliases: ["reports", "analytics", "performance reports"],
    roles: ["founder", "staff"],
  },
  {
    path: "/staff/settings",
    label: "Settings",
    aliases: ["settings", "preferences", "configuration"],
    roles: ["founder", "staff"],
  },

  // Client routes
  {
    path: "/client/dashboard",
    label: "Client Dashboard",
    aliases: ["dashboard", "home", "overview", "my dashboard"],
    roles: ["client"],
  },
  {
    path: "/client/dashboard/review-packs",
    label: "Review Packs",
    aliases: ["review packs", "reviews", "quarterly reviews", "annual reviews"],
    roles: ["client"],
  },
  {
    path: "/client/dashboard/reports",
    label: "Performance Reports",
    aliases: ["reports", "performance", "my reports"],
    roles: ["client"],
  },
  {
    path: "/client/dashboard/approvals",
    label: "Content Approvals",
    aliases: ["approvals", "pending", "approve content"],
    roles: ["client"],
  },
  {
    path: "/client/dashboard/assets",
    label: "Assets",
    aliases: ["assets", "my assets", "visuals", "images"],
    roles: ["client"],
  },
];

/**
 * Recognize intent from voice command
 */
export function recognizeIntent(command: string, userRole: UserRole): NavigationResult {
  const startTime = Date.now();
  const normalizedCommand = command.toLowerCase().trim();

  // Find matching route
  const accessibleRoutes = ROUTE_DEFINITIONS.filter((r) => r.roles.includes(userRole));

  for (const route of accessibleRoutes) {
    // Check exact label match
    if (normalizedCommand === route.label.toLowerCase()) {
      return {
        success: true,
        route: route.path,
        intent: route.label,
      };
    }

    // Check aliases
    for (const alias of route.aliases) {
      if (normalizedCommand.includes(alias.toLowerCase())) {
        return {
          success: true,
          route: route.path,
          intent: route.label,
        };
      }
    }
  }

  // Special commands
  if (normalizedCommand.includes("go back") || normalizedCommand.includes("back")) {
    return {
      success: true,
      route: "BACK",
      intent: "Go Back",
    };
  }

  if (normalizedCommand.includes("refresh") || normalizedCommand.includes("reload")) {
    return {
      success: true,
      route: "REFRESH",
      intent: "Refresh Page",
    };
  }

  return {
    success: false,
    error: `Could not recognize command: "${command}"`,
  };
}

/**
 * Log voice navigation event
 */
export async function logVoiceEvent(
  userId: string,
  userRole: UserRole,
  commandText: string,
  result: NavigationResult,
  processingTimeMs: number
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from("voice_navigation_events").insert({
    user_id: userId,
    user_role: userRole,
    command_text: commandText,
    recognized_intent: result.intent,
    target_route: result.route,
    success: result.success,
    error_message: result.error,
    processing_time_ms: processingTimeMs,
  });
}

/**
 * Get available routes for role
 */
export function getAvailableRoutes(userRole: UserRole): RouteDefinition[] {
  return ROUTE_DEFINITIONS.filter((r) => r.roles.includes(userRole));
}

/**
 * Get voice command suggestions
 */
export function getCommandSuggestions(userRole: UserRole): string[] {
  const routes = getAvailableRoutes(userRole);
  const suggestions: string[] = [];

  for (const route of routes) {
    suggestions.push(`"Go to ${route.label}"`);
    if (route.aliases.length > 0) {
      suggestions.push(`"${route.aliases[0]}"`);
    }
  }

  suggestions.push(`"Go back"`);
  suggestions.push(`"Refresh"`);

  return suggestions.slice(0, 10);
}

/**
 * Get recent voice events for user
 */
export async function getRecentVoiceEvents(
  userId: string,
  limit: number = 10
): Promise<VoiceEvent[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("voice_navigation_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching voice events:", error);
    return [];
  }

  return (data || []).map(mapEvent);
}

/**
 * Get voice usage statistics
 */
export async function getVoiceUsageStats(userId: string): Promise<{
  totalCommands: number;
  successRate: number;
  topIntents: Array<{ intent: string; count: number }>;
}> {
  const supabase = await getSupabaseServer();

  // Get total and success count
  const { data: stats } = await supabase
    .from("voice_navigation_events")
    .select("success")
    .eq("user_id", userId);

  const total = stats?.length || 0;
  const successful = stats?.filter((s) => s.success).length || 0;

  // Get top intents
  const { data: intents } = await supabase
    .from("voice_navigation_events")
    .select("recognized_intent")
    .eq("user_id", userId)
    .eq("success", true)
    .not("recognized_intent", "is", null);

  const intentCounts: Record<string, number> = {};
  for (const item of intents || []) {
    const intent = item.recognized_intent as string;
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  }

  const topIntents = Object.entries(intentCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalCommands: total,
    successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    topIntents,
  };
}

/**
 * Map database record to VoiceEvent
 */
function mapEvent(data: Record<string, unknown>): VoiceEvent {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    userRole: data.user_role as UserRole,
    commandText: data.command_text as string,
    recognizedIntent: data.recognized_intent as string | undefined,
    targetRoute: data.target_route as string | undefined,
    success: data.success as boolean,
    errorMessage: data.error_message as string | undefined,
    processingTimeMs: data.processing_time_ms as number | undefined,
    createdAt: data.created_at as string,
  };
}

export default {
  recognizeIntent,
  logVoiceEvent,
  getAvailableRoutes,
  getCommandSuggestions,
  getRecentVoiceEvents,
  getVoiceUsageStats,
};
