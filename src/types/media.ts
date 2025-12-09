// Media Types for Phase 3 Frontend Components
// Generated: 2025-01-17

/**
 * File types supported by the multimedia input system
 */
export type FileType = 'video' | 'audio' | 'document' | 'image' | 'sketch';

/**
 * Processing status of a media file
 */
export type MediaStatus =
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'failed';

/**
 * Sentiment analysis result
 */
export type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * Transcript segment with timestamps
 */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

/**
 * Full transcript data stored in JSONB
 */
export interface TranscriptData {
  segments: TranscriptSegment[];
  language: string;
  full_text: string;
}

/**
 * AI analysis result stored in JSONB
 */
export interface AIAnalysis {
  summary: string;
  key_points: string[];
  entities: string[];
  sentiment: Sentiment;
  topics: string[];
  action_items: string[];
}

/**
 * Complete media file record from database
 */
export interface MediaFile {
  // Core identifiers
  id: string;
  workspace_id: string;
  org_id: string;
  uploaded_by: string;
  project_id: string | null;

  // File metadata
  filename: string;
  original_filename: string;
  file_type: FileType;
  mime_type: string;
  file_size_bytes: number;

  // Storage
  storage_path: string;
  storage_bucket: string;
  public_url: string | null;

  // Processing status
  status: MediaStatus;
  progress: number; // 0-100
  error_message: string | null;

  // Transcription (JSONB)
  transcript: TranscriptData | null;
  transcript_language: string | null;
  transcript_confidence: number | null;
  transcribed_at: string | null;

  // AI Analysis (JSONB)
  ai_analysis: AIAnalysis | null;
  ai_analyzed_at: string | null;
  ai_model_used: string | null;

  // Search & Tags
  tags: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Search filters for media gallery
 */
export interface SearchFilters {
  fileType?: FileType | 'all';
  status?: MediaStatus | 'all';
  dateFrom?: Date;
  dateTo?: Date;
  projectId?: string;
  tags?: string[];
}

/**
 * Search result from API
 */
export interface SearchResult {
  success: boolean;
  media: MediaFile[];
  total: number;
}

/**
 * Upload progress event
 */
export interface UploadProgress {
  mediaId: string;
  filename: string;
  progress: number; // 0-100
  status: MediaStatus;
  error?: string;
}

/**
 * Upload API response
 */
export interface UploadResponse {
  success: boolean;
  media: MediaFile;
  warnings?: string[];
  message?: string;
}

/**
 * Transcription API response
 */
export interface TranscribeResponse {
  success: boolean;
  transcript: TranscriptData;
  message?: string;
  stats?: {
    wordCount: number;
    segmentCount: number;
    duration: number;
    language: string;
  };
}

/**
 * AI Analysis API response
 */
export interface AnalyzeResponse {
  success: boolean;
  analysis: AIAnalysis;
  message?: string;
}

/**
 * Error response from API
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Component props type utilities
 */

// MediaUploader props
export interface MediaUploaderProps {
  workspaceId: string;
  orgId: string;
  projectId?: string;
  onUploadComplete?: (media: MediaFile) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  acceptedFileTypes?: FileType[];
  className?: string;
}

// MediaGallery props
export interface MediaGalleryProps {
  workspaceId: string;
  filterType?: FileType | 'all';
  filterStatus?: MediaStatus | 'all';
  searchQuery?: string;
  layout?: 'grid' | 'list';
  onMediaSelect?: (media: MediaFile) => void;
  className?: string;
}

// VideoPlayer props
export interface VideoPlayerProps {
  media: MediaFile;
  autoplay?: boolean;
  showTranscript?: boolean;
  onTimestampClick?: (timestamp: number) => void;
  className?: string;
}

// AIInsightsPanel props
export interface AIInsightsPanelProps {
  analysis: AIAnalysis;
  mediaFile: MediaFile;
  collapsible?: boolean;
  showExport?: boolean;
  className?: string;
}

// MediaSearch props
export interface MediaSearchProps {
  workspaceId: string;
  placeholder?: string;
  onResultClick?: (media: MediaFile) => void;
  filters?: SearchFilters;
  showFilters?: boolean;
  className?: string;
}

// MediaDetailModal props
export interface MediaDetailModalProps {
  media: MediaFile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updated: MediaFile) => void;
  onDelete?: (mediaId: string) => void;
}

// MediaCard props
export interface MediaCardProps {
  media: MediaFile;
  onClick?: (media: MediaFile) => void;
  onDelete?: (mediaId: string) => void;
  showActions?: boolean;
  className?: string;
}

/**
 * Utility type guards
 */

export function isVideoFile(media: MediaFile): boolean {
  return media.file_type === 'video';
}

export function isAudioFile(media: MediaFile): boolean {
  return media.file_type === 'audio';
}

export function hasTranscript(media: MediaFile): media is MediaFile & {
  transcript: TranscriptData
} {
  return media.transcript !== null;
}

export function hasAIAnalysis(media: MediaFile): media is MediaFile & {
  ai_analysis: AIAnalysis
} {
  return media.ai_analysis !== null;
}

export function isProcessing(media: MediaFile): boolean {
  return ['uploading', 'processing', 'transcribing', 'analyzing'].includes(media.status);
}

export function isCompleted(media: MediaFile): boolean {
  return media.status === 'completed';
}

export function isFailed(media: MediaFile): boolean {
  return media.status === 'failed';
}

/**
 * Formatting utilities
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

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * File type detection
 */

export function getFileTypeFromMime(mimeType: string): FileType {
  if (mimeType.startsWith('video/')) {
return 'video';
}
  if (mimeType.startsWith('audio/')) {
return 'audio';
}
  if (mimeType.startsWith('image/')) {
return 'image';
}
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
return 'document';
}
  if (mimeType === 'image/svg+xml' || mimeType === 'application/json') {
return 'sketch';
}
  return 'document'; // Default fallback
}

/**
 * Color schemes for UI
 */

export const FILE_TYPE_COLORS: Record<FileType, string> = {
  video: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  audio: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  document: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  image: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  sketch: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
};

export const STATUS_COLORS: Record<MediaStatus, string> = {
  uploading: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  transcribing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  analyzing: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  negative: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};
