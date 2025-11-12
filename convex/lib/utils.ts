/**
 * Common Utility Functions for Unite-Hub CRM
 * Reusable helpers for dates, formatting, IDs, etc.
 */

// Date utilities
export function getCurrentTimestamp(): number {
  return Date.now();
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}

export function addMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp);
  date.setMonth(date.getMonth() + months);
  return date.getTime();
}

export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

export function isWithinDateRange(
  timestamp: number,
  start: number,
  end: number
): boolean {
  return timestamp >= start && timestamp <= end;
}

// Billing period utilities
export function getCurrentBillingPeriod(
  periodStart: number,
  periodEnd: number
): { start: number; end: number } {
  const now = Date.now();
  if (now >= periodStart && now <= periodEnd) {
    return { start: periodStart, end: periodEnd };
  }
  // If outside current period, calculate next period
  const duration = periodEnd - periodStart;
  const newStart = periodEnd + 1;
  const newEnd = newStart + duration;
  return { start: newStart, end: newEnd };
}

export function getNextBillingPeriod(
  currentPeriodEnd: number,
  durationDays: number = 30
): { start: number; end: number } {
  const start = currentPeriodEnd + 1;
  const end = addDays(start, durationDays) - 1;
  return { start, end };
}

// ID generation utilities
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateNodeId(prefix: string): string {
  return `${prefix}-${generateUniqueId()}`;
}

// String utilities
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
}

export function extractPlainText(html: string): string {
  // Remove HTML tags
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Array utilities
export function uniqueArray<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Pagination utilities
export function paginateResults<T>(
  items: T[],
  limit: number = 20,
  cursor?: string
): {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
} {
  const startIndex = cursor ? parseInt(cursor) : 0;
  const endIndex = startIndex + limit;
  const paginatedItems = items.slice(startIndex, endIndex);
  const hasMore = endIndex < items.length;

  return {
    items: paginatedItems,
    nextCursor: hasMore ? endIndex.toString() : undefined,
    hasMore,
  };
}

// Sorting utilities
export function sortByDate<T extends { createdAt: number }>(
  items: T[],
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    return order === "desc"
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt;
  });
}

export function sortByField<T>(
  items: T[],
  field: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return order === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

// Search utilities
export function searchInText(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  return normalizedText.includes(normalizedQuery);
}

export function highlightSearchTerm(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

// Color utilities
export function generateColorPalette(baseColor: string): string[] {
  // Generate complementary colors based on base
  // This is a simplified version - could use a color library in production
  return [
    baseColor,
    adjustColorBrightness(baseColor, 20),
    adjustColorBrightness(baseColor, -20),
    adjustColorBrightness(baseColor, 40),
    adjustColorBrightness(baseColor, -40),
  ];
}

export function adjustColorBrightness(
  color: string,
  percent: number
): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (val: number) => {
    const adjusted = val + (percent / 100) * 255;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  // Convert back to hex
  const toHex = (val: number) => val.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

export function getRandomColor(): string {
  const colors = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Version management
export function getNextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

export function compareVersions(v1: number, v2: number): number {
  return v1 - v2;
}

// Error handling utilities
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

export function isConvexError(error: unknown): boolean {
  return error instanceof Error && error.name === "ConvexError";
}

// File utilities
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.substring(lastDot + 1).toLowerCase();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

// Platform utilities
export function getPlatformDisplayName(
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | string
): string {
  const names: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
  };
  return names[platform] || capitalizeFirst(platform);
}

export function getPlatformColor(
  platform: "facebook" | "instagram" | "tiktok" | "linkedin" | string
): string {
  const colors: Record<string, string> = {
    facebook: "#1877F2",
    instagram: "#E4405F",
    tiktok: "#000000",
    linkedin: "#0A66C2",
  };
  return colors[platform] || "#6B7280";
}

// Metrics utilities
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
}

// Retry utilities
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
