// Media Utility Functions
// Phase 3: Frontend Components

import type { FileType, MediaFile, MediaStatus } from '@/types/media';

/**
 * File Type Detection and Validation
 */

export const ALLOWED_MIME_TYPES: Record<FileType, string[]> = {
  video: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska',
    'video/x-flv',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/x-m4a',
  ],
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/rtf',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  sketch: [
    'image/svg+xml',
    'application/json',
  ],
};

export const ALLOWED_EXTENSIONS: Record<FileType, string[]> = {
  video: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
  audio: ['mp3', 'wav', 'webm', 'm4a', 'ogg', 'aac', 'flac'],
  document: ['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  sketch: ['svg', 'json'],
};

/**
 * Detect file type from MIME type
 */
export function detectFileType(file: File): FileType {
  const mimeType = file.type;

  if (mimeType.startsWith('video/')) {
return 'video';
}
  if (mimeType.startsWith('audio/')) {
return 'audio';
}
  if (mimeType.startsWith('image/')) {
    // SVG can be either image or sketch
    if (mimeType === 'image/svg+xml' && file.name.endsWith('.svg')) {
      return 'sketch'; // Treat SVG as sketch by default
    }
    return 'image';
  }
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
return 'document';
}
  if (mimeType === 'application/json') {
return 'sketch';
}

  // Fallback to extension-based detection
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  for (const [type, extensions] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type as FileType;
    }
  }

  return 'document'; // Default fallback
}

/**
 * Validate file against allowed types
 */
export function validateFile(file: File, allowedTypes?: FileType[]): {
  valid: boolean;
  error?: string;
  fileType?: FileType;
} {
  // Check file size (100MB limit)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds 100MB limit`,
    };
  }

  // Detect file type
  const fileType = detectFileType(file);

  // Check if file type is allowed
  if (allowedTypes && !allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `File type "${fileType}" not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Validate MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[fileType];
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `MIME type "${file.type}" not allowed for ${fileType} files`,
    };
  }

  // Validate extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const allowedExts = ALLOWED_EXTENSIONS[fileType];
  if (!allowedExts.includes(extension)) {
    return {
      valid: false,
      error: `File extension ".${extension}" not allowed for ${fileType} files. Allowed: ${allowedExts.join(', ')}`,
    };
  }

  return { valid: true, fileType };
}

/**
 * File Size Formatting
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
return '0 Bytes';
}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Status Utilities
 */

export function getStatusLabel(status: MediaStatus): string {
  const labels: Record<MediaStatus, string> = {
    uploading: 'Uploading',
    processing: 'Processing',
    transcribing: 'Transcribing',
    analyzing: 'Analyzing',
    completed: 'Completed',
    failed: 'Failed',
  };
  return labels[status];
}

export function getStatusIcon(status: MediaStatus): string {
  const icons: Record<MediaStatus, string> = {
    uploading: '⬆️',
    processing: '⚙️',
    transcribing: '🎙️',
    analyzing: '🤖',
    completed: '✅',
    failed: '❌',
  };
  return icons[status];
}

export function isProcessingStatus(status: MediaStatus): boolean {
  return ['uploading', 'processing', 'transcribing', 'analyzing'].includes(status);
}

/**
 * Thumbnail Generation
 */

export function getThumbnailUrl(media: MediaFile): string | null {
  // If public URL exists and it's an image, use it
  if (media.public_url && media.file_type === 'image') {
    return media.public_url;
  }

  // For videos, we could generate thumbnails server-side
  // For now, return null and use placeholder
  return null;
}

export function getFileIconName(fileType: FileType): string {
  const icons: Record<FileType, string> = {
    video: 'video',
    audio: 'music',
    document: 'file-text',
    image: 'image',
    sketch: 'pen-tool',
  };
  return icons[fileType];
}

/**
 * Date Formatting
 */

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
return 'just now';
}
  if (diffMins < 60) {
return `${diffMins}m ago`;
}
  if (diffHours < 24) {
return `${diffHours}h ago`;
}
  if (diffDays < 7) {
return `${diffDays}d ago`;
}

  return date.toLocaleDateString();
}

export function formatAbsoluteDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Progress Calculation
 */

export function getProgressPercentage(media: MediaFile): number {
  return media.progress || 0;
}

export function getProgressLabel(media: MediaFile): string {
  const percentage = getProgressPercentage(media);
  const status = getStatusLabel(media.status);

  if (media.status === 'failed') {
    return `Failed: ${media.error_message || 'Unknown error'}`;
  }

  if (media.status === 'completed') {
    return 'Completed';
  }

  return `${status} (${percentage}%)`;
}

/**
 * Search Query Helpers
 */

export function buildSearchQuery(
  query: string,
  filters?: {
    fileType?: FileType | 'all';
    status?: MediaStatus | 'all';
    projectId?: string;
  }
): URLSearchParams {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set('q', query.trim());
  }

  if (filters?.fileType && filters.fileType !== 'all') {
    params.set('fileType', filters.fileType);
  }

  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters?.projectId) {
    params.set('projectId', filters.projectId);
  }

  return params;
}

/**
 * Transcript Helpers
 */

export function getTranscriptExcerpt(media: MediaFile, maxLength: number = 100): string {
  if (!media.transcript?.full_text) {
return '';
}

  const text = media.transcript.full_text;
  if (text.length <= maxLength) {
return text;
}

  return text.substring(0, maxLength) + '...';
}

export function getWordCount(media: MediaFile): number {
  if (!media.transcript?.full_text) {
return 0;
}

  return media.transcript.full_text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * AI Analysis Helpers
 */

export function getAnalysisExcerpt(media: MediaFile, maxLength: number = 150): string {
  if (!media.ai_analysis?.summary) {
return '';
}

  const summary = media.ai_analysis.summary;
  if (summary.length <= maxLength) {
return summary;
}

  return summary.substring(0, maxLength) + '...';
}

export function getSentimentEmoji(sentiment: string): string {
  const emojis: Record<string, string> = {
    positive: '😊',
    neutral: '😐',
    negative: '😞',
  };
  return emojis[sentiment] || '😐';
}

/**
 * Download Helpers
 */

export function downloadTranscript(media: MediaFile): void {
  if (!media.transcript?.full_text) {
return;
}

  const blob = new Blob([media.transcript.full_text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${media.original_filename}_transcript.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

/**
 * Validation Helpers
 */

export function isValidWorkspaceId(workspaceId: string): boolean {
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(workspaceId);
}

export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
