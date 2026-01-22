/**
 * Files API Utilities
 *
 * Helpers for using Claude's Files API to upload documents once
 * and reference them across multiple conversations.
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

// ============================================================================
// Types
// ============================================================================

export interface UploadedFile {
  /** File ID returned by the API */
  id: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Upload timestamp */
  uploadedAt: string;
  /** Purpose of the file */
  purpose: "assistants" | "batch" | "vision";
  /** Expiration time (if any) */
  expiresAt?: string;
}

export interface FileReference {
  type: "file";
  file_id: string;
}

export type SupportedMimeType =
  | "application/pdf"
  | "text/plain"
  | "text/csv"
  | "text/markdown"
  | "application/json"
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/webp";

// ============================================================================
// File Management
// ============================================================================

/**
 * Upload a file to the Files API
 *
 * @param client - Anthropic client instance
 * @param filePath - Path to the file to upload
 * @param purpose - Purpose of the file (default: "assistants")
 * @returns Uploaded file info
 *
 * @example
 * const file = await uploadFile(client, "/path/to/document.pdf");
 * console.log(`Uploaded file ID: ${file.id}`);
 */
export async function uploadFile(
  client: Anthropic,
  filePath: string,
  purpose: UploadedFile["purpose"] = "assistants"
): Promise<UploadedFile> {
  const filename = path.basename(filePath);
  const mimeType = getMimeType(filePath);

  // Read file
  const fileBuffer = fs.readFileSync(filePath);
  const fileBlob = new Blob([fileBuffer], { type: mimeType });

  // Create File object for the API
  const file = new File([fileBlob], filename, { type: mimeType });

  // Upload via Files API
  // Note: Using files.create which returns a file object
  const response = await (client as any).files.create({
    file,
    purpose,
  });

  return {
    id: response.id,
    filename,
    mimeType,
    sizeBytes: fileBuffer.length,
    uploadedAt: new Date().toISOString(),
    purpose,
    expiresAt: response.expires_at,
  };
}

/**
 * Upload a file from a buffer
 *
 * @param client - Anthropic client instance
 * @param buffer - File buffer
 * @param filename - Filename with extension
 * @param purpose - Purpose of the file
 * @returns Uploaded file info
 */
export async function uploadFileFromBuffer(
  client: Anthropic,
  buffer: Buffer,
  filename: string,
  purpose: UploadedFile["purpose"] = "assistants"
): Promise<UploadedFile> {
  const mimeType = getMimeType(filename);
  const fileBlob = new Blob([buffer], { type: mimeType });
  const file = new File([fileBlob], filename, { type: mimeType });

  const response = await (client as any).files.create({
    file,
    purpose,
  });

  return {
    id: response.id,
    filename,
    mimeType,
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    purpose,
    expiresAt: response.expires_at,
  };
}

/**
 * Delete a file from the Files API
 *
 * @param client - Anthropic client instance
 * @param fileId - File ID to delete
 */
export async function deleteFile(
  client: Anthropic,
  fileId: string
): Promise<void> {
  await (client as any).files.delete(fileId);
}

/**
 * List all uploaded files
 *
 * @param client - Anthropic client instance
 * @param purpose - Filter by purpose (optional)
 * @returns Array of uploaded files
 */
export async function listFiles(
  client: Anthropic,
  purpose?: UploadedFile["purpose"]
): Promise<UploadedFile[]> {
  const params: any = {};
  if (purpose) {
    params.purpose = purpose;
  }

  const response = await (client as any).files.list(params);

  return response.data.map((f: any) => ({
    id: f.id,
    filename: f.filename,
    mimeType: f.mime_type,
    sizeBytes: f.bytes,
    uploadedAt: f.created_at,
    purpose: f.purpose,
    expiresAt: f.expires_at,
  }));
}

/**
 * Get file info
 *
 * @param client - Anthropic client instance
 * @param fileId - File ID
 * @returns File info
 */
export async function getFile(
  client: Anthropic,
  fileId: string
): Promise<UploadedFile> {
  const response = await (client as any).files.retrieve(fileId);

  return {
    id: response.id,
    filename: response.filename,
    mimeType: response.mime_type,
    sizeBytes: response.bytes,
    uploadedAt: response.created_at,
    purpose: response.purpose,
    expiresAt: response.expires_at,
  };
}

// ============================================================================
// Message Content Helpers
// ============================================================================

/**
 * Create a file reference for use in messages
 *
 * @param fileId - File ID from upload
 * @returns File reference content block
 *
 * @example
 * const messages = [{
 *   role: "user",
 *   content: [
 *     createFileReference(uploadedFile.id),
 *     { type: "text", text: "Please analyze this document" }
 *   ]
 * }];
 */
export function createFileReference(fileId: string): FileReference {
  return {
    type: "file",
    file_id: fileId,
  };
}

/**
 * Create message content with file and text
 *
 * @param fileId - File ID
 * @param text - Text prompt
 * @returns Content array for message
 */
export function createFileWithTextContent(
  fileId: string,
  text: string
): Array<FileReference | { type: "text"; text: string }> {
  return [createFileReference(fileId), { type: "text", text }];
}

/**
 * Create message content with multiple files
 *
 * @param fileIds - Array of file IDs
 * @param text - Text prompt
 * @returns Content array for message
 */
export function createMultiFileContent(
  fileIds: string[],
  text: string
): Array<FileReference | { type: "text"; text: string }> {
  return [
    ...fileIds.map(createFileReference),
    { type: "text", text },
  ];
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get MIME type from file path
 */
export function getMimeType(filePath: string): SupportedMimeType {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, SupportedMimeType> = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".md": "text/markdown",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  return mimeTypes[ext] || "application/pdf";
}

/**
 * Check if a file type is supported
 */
export function isSupportedFileType(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".pdf",
    ".txt",
    ".csv",
    ".md",
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
  ].includes(ext);
}

/**
 * Get maximum file size for a given purpose
 */
export function getMaxFileSize(purpose: UploadedFile["purpose"]): number {
  switch (purpose) {
    case "vision":
      return 20 * 1024 * 1024; // 20MB for images
    case "assistants":
      return 512 * 1024 * 1024; // 512MB for documents
    case "batch":
      return 100 * 1024 * 1024; // 100MB for batch files
    default:
      return 512 * 1024 * 1024;
  }
}

// ============================================================================
// File Cache Manager
// ============================================================================

/**
 * Simple in-memory cache for file IDs
 * Maps file hashes to file IDs to avoid duplicate uploads
 */
const fileCache = new Map<string, { fileId: string; expiresAt: number }>();

/**
 * Get cached file ID if available
 */
export function getCachedFileId(fileHash: string): string | null {
  const cached = fileCache.get(fileHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.fileId;
  }
  fileCache.delete(fileHash);
  return null;
}

/**
 * Cache a file ID
 */
export function cacheFileId(
  fileHash: string,
  fileId: string,
  ttlMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): void {
  fileCache.set(fileHash, {
    fileId,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear expired cache entries
 */
export function cleanupFileCache(): void {
  const now = Date.now();
  for (const [hash, cached] of fileCache.entries()) {
    if (cached.expiresAt <= now) {
      fileCache.delete(hash);
    }
  }
}

/**
 * Generate a hash for a file buffer
 */
export async function hashFileBuffer(buffer: Buffer): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
