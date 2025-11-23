/**
 * Founder Time Voice Commands
 * Phase 41.1: Founder Timecard System
 *
 * Voice-activated time logging
 */

import {
  startTimer,
  stopTimer,
  addManualEntry,
  getDailySummary,
  getWeeklySummary,
  getRunningTimer,
  TimeCategory,
} from "@/lib/services/founderTimecardService";

// Command patterns
const COMMAND_PATTERNS = {
  startTimer: /^start\s+(?:timer\s+)?(?:under\s+)?(.+)$/i,
  stopTimer: /^stop\s+(?:my\s+)?timer$/i,
  logHours: /^log\s+(\d+(?:\.\d+)?)\s+hours?\s+(?:for\s+)?(.+)$/i,
  todayHours: /^(?:what\s+are\s+)?my\s+hours?\s+today\??$/i,
  weekBreakdown: /^(?:show\s+me\s+)?(?:this\s+)?week(?:'s)?\s+(?:time\s+)?breakdown$/i,
  currentTimer: /^(?:what(?:'s|\s+is)\s+)?(?:my\s+)?current\s+timer\??$/i,
};

// Category mapping from natural language
const CATEGORY_MAP: Record<string, TimeCategory> = {
  admin: "admin",
  administration: "admin",
  paperwork: "admin",
  coding: "coding",
  code: "coding",
  development: "coding",
  programming: "coding",
  dev: "coding",
  meetings: "meetings",
  meeting: "meetings",
  calls: "meetings",
  strategy: "strategy",
  planning: "strategy",
  finance: "finance",
  accounting: "finance",
  ops: "ops",
  operations: "ops",
  sales: "sales",
  marketing: "marketing",
  research: "research",
  learning: "learning",
  studying: "learning",
  training: "learning",
  break: "break",
  rest: "break",
  lunch: "break",
};

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Execute a voice command for time tracking
 */
export async function executeTimeCommand(command: string): Promise<VoiceCommandResult> {
  const trimmedCommand = command.trim();

  // Start timer
  if (COMMAND_PATTERNS.startTimer.test(trimmedCommand)) {
    const match = trimmedCommand.match(COMMAND_PATTERNS.startTimer);
    const categoryInput = match?.[1]?.toLowerCase() || "admin";
    const category = CATEGORY_MAP[categoryInput] || "admin";

    const entry = await startTimer(category);
    if (entry) {
      return {
        success: true,
        message: `Timer started for ${category}`,
        data: entry,
      };
    }
    return { success: false, message: "Failed to start timer" };
  }

  // Stop timer
  if (COMMAND_PATTERNS.stopTimer.test(trimmedCommand)) {
    const entry = await stopTimer();
    if (entry) {
      const hours = Math.floor((entry.durationMinutes || 0) / 60);
      const minutes = (entry.durationMinutes || 0) % 60;
      return {
        success: true,
        message: `Timer stopped. Logged ${hours}h ${minutes}m for ${entry.category}`,
        data: entry,
      };
    }
    return { success: false, message: "No running timer to stop" };
  }

  // Log hours manually
  if (COMMAND_PATTERNS.logHours.test(trimmedCommand)) {
    const match = trimmedCommand.match(COMMAND_PATTERNS.logHours);
    const hours = parseFloat(match?.[1] || "0");
    const categoryInput = match?.[2]?.toLowerCase() || "admin";
    const category = CATEGORY_MAP[categoryInput] || "admin";

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const entry = await addManualEntry(startTime, endTime, category);
    if (entry) {
      return {
        success: true,
        message: `Logged ${hours} hours for ${category}`,
        data: entry,
      };
    }
    return { success: false, message: "Failed to log time" };
  }

  // Today's hours
  if (COMMAND_PATTERNS.todayHours.test(trimmedCommand)) {
    const summary = await getDailySummary(new Date());
    const hours = Math.floor(summary.totalMinutes / 60);
    const minutes = summary.totalMinutes % 60;

    const breakdown = Object.entries(summary.byCategory)
      .map(([cat, mins]) => `${cat}: ${Math.round(mins / 60 * 10) / 10}h`)
      .join(", ");

    return {
      success: true,
      message: `Today: ${hours}h ${minutes}m total. ${breakdown || "No entries yet"}`,
      data: summary,
    };
  }

  // Week breakdown
  if (COMMAND_PATTERNS.weekBreakdown.test(trimmedCommand)) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const summary = await getWeeklySummary(startOfWeek);
    const hours = Math.floor(summary.totalMinutes / 60);
    const minutes = summary.totalMinutes % 60;

    const breakdown = Object.entries(summary.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, mins]) => `${cat}: ${Math.round(mins / 60 * 10) / 10}h`)
      .join(", ");

    return {
      success: true,
      message: `This week: ${hours}h ${minutes}m total. Top categories: ${breakdown || "No entries"}`,
      data: summary,
    };
  }

  // Current timer
  if (COMMAND_PATTERNS.currentTimer.test(trimmedCommand)) {
    const running = await getRunningTimer();
    if (running) {
      const startTime = new Date(running.startTime);
      const now = new Date();
      const elapsed = Math.round((now.getTime() - startTime.getTime()) / 60000);
      const hours = Math.floor(elapsed / 60);
      const minutes = elapsed % 60;

      return {
        success: true,
        message: `Timer running for ${running.category}: ${hours}h ${minutes}m`,
        data: running,
      };
    }
    return {
      success: true,
      message: "No timer currently running",
    };
  }

  return {
    success: false,
    message: "Command not recognized. Try: start timer under coding, stop my timer, log 3 hours for strategy, what are my hours today?",
  };
}

/**
 * Get available voice commands
 */
export function getAvailableCommands(): string[] {
  return [
    "Start timer under [category]",
    "Stop my timer",
    "Log [hours] hours for [category]",
    "What are my hours today?",
    "Show me this week's time breakdown",
    "What's my current timer?",
  ];
}

/**
 * Get available categories
 */
export function getAvailableCategories(): TimeCategory[] {
  return [
    "admin",
    "coding",
    "meetings",
    "strategy",
    "finance",
    "ops",
    "sales",
    "marketing",
    "research",
    "learning",
    "break",
  ];
}

export default {
  executeTimeCommand,
  getAvailableCommands,
  getAvailableCategories,
};
