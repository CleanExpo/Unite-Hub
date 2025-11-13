import { v } from "convex/values";

/**
 * Input Validation Helpers for Unite-Hub CRM
 * Reusable validators for common input patterns
 */

// Email validation
export const emailValidator = v.string();

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Phone number validation (basic)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
}

// Pagination validator
export const paginationValidator = v.object({
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
});

// Common validators for personas
export const demographicsValidator = v.object({
  ageRange: v.optional(v.string()),
  gender: v.optional(v.string()),
  location: v.optional(v.string()),
  income: v.optional(v.string()),
  education: v.optional(v.string()),
  occupation: v.optional(v.string()),
});

export const psychographicsValidator = v.object({
  values: v.array(v.string()),
  interests: v.array(v.string()),
  lifestyle: v.optional(v.string()),
  personality: v.optional(v.string()),
});

export const buyingBehaviorValidator = v.object({
  motivations: v.array(v.string()),
  barriers: v.array(v.string()),
  decisionFactors: v.array(v.string()),
});

// Common validators for mind maps
export const mindMapNodeValidator = v.object({
  id: v.string(),
  label: v.string(),
  details: v.optional(v.string()),
  sourceEmailId: v.optional(v.id("emailThreads")),
  addedAt: v.number(),
});

export const mindMapBranchValidator = v.object({
  id: v.string(),
  parentId: v.string(),
  label: v.string(),
  category: v.union(
    v.literal("product"),
    v.literal("audience"),
    v.literal("challenge"),
    v.literal("opportunity"),
    v.literal("competitor"),
    v.literal("expansion")
  ),
  color: v.string(),
  subNodes: v.array(mindMapNodeValidator),
  createdAt: v.number(),
});

// Common validators for campaigns
export const adCopyVariationValidator = v.object({
  variant: v.string(),
  copy: v.string(),
  cta: v.string(),
});

export const visualRequirementsValidator = v.object({
  imageSpecs: v.optional(v.string()),
  videoSpecs: v.optional(v.string()),
  styleGuidelines: v.optional(v.string()),
});

export const contentCalendarItemValidator = v.object({
  date: v.number(),
  contentType: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("draft"),
    v.literal("scheduled"),
    v.literal("published")
  ),
});

// Tier validation
export function isStarterTier(tier: string): boolean {
  return tier === "starter";
}

export function isProfessionalTier(tier: string): boolean {
  return tier === "professional";
}

// Slug validation
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

// Color validation
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

// Date range validation
export function isValidDateRange(start: number, end: number): boolean {
  return start < end && start > 0 && end > 0;
}

// Array validation helpers
export function isNonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

export function areAllStringsNonEmpty(arr: string[]): boolean {
  return arr.every((str) => typeof str === "string" && str.trim().length > 0);
}

// Effectiveness score validation
export function isValidEffectivenessScore(score: number): boolean {
  return score >= 1 && score <= 10 && Number.isInteger(score);
}

// File size validation (in bytes)
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
}

// MIME type validation
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function isValidImageMimeType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

export function isValidDocumentMimeType(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
}

// Search query validation
export function sanitizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function isValidSearchQuery(query: string): boolean {
  return query.trim().length >= 2 && query.trim().length <= 200;
}
