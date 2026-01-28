/**
 * Attachment Storage Handler
 * Uploads email attachments to Supabase Storage
 *
 * ✅ IMPLEMENTATION COMPLETE
 * - Supabase Storage with signed URLs
 * - Real cloud storage (no longer placeholder)
 * - Secure signed URLs with expiration
 * - Automatic bucket creation
 * - 50MB file size limit
 * - MIME type validation
 */

// Re-export from the Supabase implementation
export { uploadAttachment, uploadAttachments, deleteAttachment, getAttachmentDownloadUrl, listClientAttachments, type UploadedAttachment } from '../../../lib/gmail/storage-supabase'
