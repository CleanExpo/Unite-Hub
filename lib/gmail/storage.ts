/**
 * Attachment Storage Handler
 * Uploads email attachments to Supabase Storage
 *
 * IMPLEMENTATION: Supabase Storage with signed URLs
 * ✅ Real cloud storage (not mock)
 * ✅ Secure signed URLs with expiration
 * ✅ Automatic bucket creation
 * ✅ 50MB file size limit
 * ✅ MIME type validation
 */

export { uploadAttachment, uploadAttachments, deleteAttachment, getAttachmentDownloadUrl, listClientAttachments, type UploadedAttachment } from './storage-supabase'
