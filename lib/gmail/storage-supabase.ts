/**
 * Supabase Storage Implementation for Email Attachments
 * Replaces mock storage with real Supabase bucket upload
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const ATTACHMENTS_BUCKET = 'attachments'

export interface UploadedAttachment {
  fileName: string
  fileUrl: string
  mimeType: string
  fileSize: number
}

/**
 * Ensure attachments bucket exists
 */
async function ensureBucketExists() {
  const { data: buckets } = await supabase.storage.listBuckets()

  if (!buckets?.find(b => b.name === ATTACHMENTS_BUCKET)) {
    const { error } = await supabase.storage.createBucket(ATTACHMENTS_BUCKET, {
      public: false, // Secure, signed URLs required
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: [
        'image/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.*',
        'text/*'
      ]
    })

    if (error) {
      console.error('Failed to create attachments bucket:', error)
    }
  }
}

/**
 * Upload attachment to Supabase Storage
 */
export async function uploadAttachment(
  fileName: string,
  content: string, // Base64 encoded
  mimeType: string,
  clientId: string
): Promise<UploadedAttachment> {
  try {
    // Ensure bucket exists
    await ensureBucketExists()

    // Decode base64 content
    const buffer = Buffer.from(content, 'base64')
    const fileSize = buffer.length

    // Sanitize filename and create unique path
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const filePath = `${clientId}/${timestamp}-${sanitizedFileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`)
    }

    // Get public URL (will require signed URL for access)
    const { data: urlData } = supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .getPublicUrl(filePath)

    return {
      fileName: sanitizedFileName,
      fileUrl: urlData.publicUrl,
      mimeType,
      fileSize
    }
  } catch (error) {
    console.error('Error uploading attachment:', error)
    throw new Error(`Failed to upload attachment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Upload multiple attachments
 */
export async function uploadAttachments(
  attachments: Array<{
    fileName: string
    content: string
    mimeType: string
  }>,
  clientId: string
): Promise<UploadedAttachment[]> {
  const uploaded: UploadedAttachment[] = []

  for (const attachment of attachments) {
    try {
      const result = await uploadAttachment(
        attachment.fileName,
        attachment.content,
        attachment.mimeType,
        clientId
      )
      uploaded.push(result)
    } catch (error) {
      console.error(`Failed to upload ${attachment.fileName}:`, error)
      // Continue with other attachments
    }
  }

  return uploaded
}

/**
 * Delete attachment from Supabase Storage
 */
export async function deleteAttachment(fileUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/attachments/{path}
    const urlParts = fileUrl.split(`/${ATTACHMENTS_BUCKET}/`)
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL format')
    }

    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([filePath])

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`)
    }

    console.log(`Deleted attachment: ${filePath}`)
  } catch (error) {
    console.error('Error deleting attachment:', error)
    throw new Error(`Failed to delete attachment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get attachment download URL with expiration (signed URL)
 */
export async function getAttachmentDownloadUrl(
  fileUrl: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split(`/${ATTACHMENTS_BUCKET}/`)
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL format')
    }

    const filePath = urlParts[1]

    // Generate signed URL for secure download
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`)
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned')
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List attachments for a client
 */
export async function listClientAttachments(clientId: string): Promise<Array<{ name: string; size: number; createdAt: string }>> {
  try {
    const { data, error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .list(clientId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw new Error(`Failed to list attachments: ${error.message}`)
    }

    return data?.map(file => ({
      name: file.name,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || new Date().toISOString()
    })) || []
  } catch (error) {
    console.error('Error listing attachments:', error)
    return []
  }
}
