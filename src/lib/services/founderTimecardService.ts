/**
 * Founder Timecard Service
 * Phase 41.1: Founder Timecard System
 *
 * Personal time tracking with burnout detection
 */

import { getSupabaseServer } from "@/lib/supabase";

// Types
export type TimeCategory =
  | "admin"
  | "coding"
  | "meetings"
  | "strategy"
  | "finance"
  | "ops"
  | "sales"
  | "marketing"
  | "research"
  | "learning"
  | "break";

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  category: TimeCategory;
  notes?: string;
  isRunning: boolean;
}

export interface TimeSummary {
  totalMinutes: number;
  totalHours: number;
  byCategory: Record<string, number>;
  entries: TimeEntry[];
  period: string;
}

export interface BurnoutIndicator {
  risk: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendations: string[];
}

/**
 * Start a new timer
 */
export async function startTimer(
  category: TimeCategory,
  notes?: string
): Promise<TimeEntry | null> {
  const supabase = await getSupabaseServer();

  // Stop any running timer first
  await stopTimer();

  const { data, error } = await supabase
    .from("founder_time_entries")
    .insert({
      start_time: new Date().toISOString(),
      category,
      notes,
      is_running: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error starting timer:", error);
    return null;
  }

  return mapEntry(data);
}

/**
 * Stop the running timer
 */
export async function stopTimer(): Promise<TimeEntry | null> {
  const supabase = await getSupabaseServer();

  // Find running timer
  const { data: running } = await supabase
    .from("founder_time_entries")
    .select("*")
    .eq("is_running", true)
    .single();

  if (!running) return null;

  const endTime = new Date();
  const startTime = new Date(running.start_time);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { data, error } = await supabase
    .from("founder_time_entries")
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      is_running: false,
      updated_at: endTime.toISOString(),
    })
    .eq("id", running.id)
    .select()
    .single();

  if (error) {
    console.error("Error stopping timer:", error);
    return null;
  }

  return mapEntry(data);
}

/**
 * Add a manual time entry
 */
export async function addManualEntry(
  startTime: Date,
  endTime: Date,
  category: TimeCategory,
  notes?: string
): Promise<TimeEntry | null> {
  const supabase = await getSupabaseServer();

  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { data, error } = await supabase
    .from("founder_time_entries")
    .insert({
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      category,
      notes,
      is_running: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding manual entry:", error);
    return null;
  }

  return mapEntry(data);
}

/**
 * Get daily summary
 */
export async function getDailySummary(date: Date): Promise<TimeSummary> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return getSummary(startOfDay, endOfDay, date.toISOString().split("T")[0]);
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(startOfWeek: Date): Promise<TimeSummary> {
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekStr = `Week of ${startOfWeek.toISOString().split("T")[0]}`;
  return getSummary(startOfWeek, endOfWeek, weekStr);
}

/**
 * Get monthly summary
 */
export async function getMonthlySummary(month: number, year: number): Promise<TimeSummary> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const monthStr = `${year}-${month.toString().padStart(2, "0")}`;
  return getSummary(startOfMonth, endOfMonth, monthStr);
}

/**
 * Calculate total hours for date range
 */
export async function calculateTotalHours(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const summary = await getSummary(startDate, endDate, "range");
  return summary.totalHours;
}

/**
 * Detect burnout patterns
 */
export async function detectBurnoutPatterns(): Promise<BurnoutIndicator> {
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Check last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSummary = await getSummary(weekAgo, new Date(), "week");

  // Check last 30 days
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthSummary = await getSummary(monthAgo, new Date(), "month");

  const avgDailyHours = weekSummary.totalHours / 7;
  const avgMonthlyDailyHours = monthSummary.totalHours / 30;

  // Excessive hours
  if (avgDailyHours > 10) {
    factors.push(`Averaging ${avgDailyHours.toFixed(1)} hours/day this week`);
    recommendations.push("Consider delegating tasks or reducing scope");
  } else if (avgDailyHours > 8) {
    factors.push(`Averaging ${avgDailyHours.toFixed(1)} hours/day this week`);
  }

  // No breaks
  const breakMinutes = weekSummary.byCategory["break"] || 0;
  if (breakMinutes < 30) {
    factors.push("Less than 30 minutes of breaks this week");
    recommendations.push("Schedule regular breaks throughout the day");
  }

  // Too many meetings
  const meetingMinutes = weekSummary.byCategory["meetings"] || 0;
  const meetingPercent = weekSummary.totalMinutes > 0
    ? (meetingMinutes / weekSummary.totalMinutes) * 100
    : 0;
  if (meetingPercent > 40) {
    factors.push(`${meetingPercent.toFixed(0)}% of time in meetings`);
    recommendations.push("Consider async communication or batch meetings");
  }

  // Increasing trend
  if (avgDailyHours > avgMonthlyDailyHours * 1.2) {
    factors.push("Hours increasing compared to monthly average");
    recommendations.push("Review workload sustainability");
  }

  // Determine risk level
  let risk: "low" | "medium" | "high" | "critical" = "low";

  if (avgDailyHours > 12 || factors.length >= 4) {
    risk = "critical";
    recommendations.push("Take immediate action to reduce workload");
  } else if (avgDailyHours > 10 || factors.length >= 3) {
    risk = "high";
    recommendations.push("Consider taking a day off this week");
  } else if (avgDailyHours > 8 || factors.length >= 2) {
    risk = "medium";
  }

  return { risk, factors, recommendations };
}

/**
 * Export to CSV format
 */
export async function exportToCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const supabase = await getSupabaseServer();

  const { data: entries } = await supabase
    .from("founder_time_entries")
    .select("*")
    .gte("start_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time", { ascending: true });

  const headers = ["Date", "Start Time", "End Time", "Duration (min)", "Category", "Notes"];
  const rows = (entries || []).map((e) => [
    e.start_time.split("T")[0],
    e.start_time.split("T")[1]?.substring(0, 5) || "",
    e.end_time?.split("T")[1]?.substring(0, 5) || "",
    e.duration_minutes?.toString() || "",
    e.category,
    `"${(e.notes || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Get running timer
 */
export async function getRunningTimer(): Promise<TimeEntry | null> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from("founder_time_entries")
    .select("*")
    .eq("is_running", true)
    .single();

  return data ? mapEntry(data) : null;
}

/**
 * Get summary for date range
 */
async function getSummary(
  startDate: Date,
  endDate: Date,
  period: string
): Promise<TimeSummary> {
  const supabase = await getSupabaseServer();

  const { data: entries } = await supabase
    .from("founder_time_entries")
    .select("*")
    .gte("start_time", startDate.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time", { ascending: true });

  let totalMinutes = 0;
  const byCategory: Record<string, number> = {};

  for (const entry of entries || []) {
    const minutes = entry.duration_minutes || 0;
    totalMinutes += minutes;

    byCategory[entry.category] = (byCategory[entry.category] || 0) + minutes;
  }

  return {
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    byCategory,
    entries: (entries || []).map(mapEntry),
    period,
  };
}

/**
 * Map database entry to TimeEntry
 */
function mapEntry(data: Record<string, unknown>): TimeEntry {
  return {
    id: data.id as string,
    startTime: data.start_time as string,
    endTime: data.end_time as string | undefined,
    durationMinutes: data.duration_minutes as number | undefined,
    category: data.category as TimeCategory,
    notes: data.notes as string | undefined,
    isRunning: data.is_running as boolean,
  };
}

export default {
  startTimer,
  stopTimer,
  addManualEntry,
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary,
  calculateTotalHours,
  detectBurnoutPatterns,
  exportToCSV,
  getRunningTimer,
};
