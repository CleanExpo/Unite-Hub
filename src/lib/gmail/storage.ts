/**
 * Attachment Storage Handler
 * Uploads email attachments to cloud storage
 *
 * ⚠️ PLACEHOLDER IMPLEMENTATION
 * Cloud storage is not yet configured. Attachment URLs are mock placeholders.
 * Configure one of: AWS S3, Google Cloud Storage, Azure Blob, Cloudflare R2
 */

const STORAGE_NOT_CONFIGURED_WARNING =
  "⚠️  Gmail attachment storage not configured. " +
  "Using placeholder URLs - attachments will not be retrievable. " +
  "Configure cloud storage (S3/GCS/R2) for production use.";

let warnedAboutStorage = false;

function warnStorageNotConfigured() {
  if (!warnedAboutStorage) {
    console.warn(STORAGE_NOT_CONFIGURED_WARNING);
    warnedAboutStorage = true;
  }
}

export interface UploadedAttachment {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

/**
 * Upload attachment to cloud storage
 * This is a placeholder - implement actual cloud storage integration
 */
export async function uploadAttachment(
  fileName: string,
  content: string, // Base64 encoded
  mimeType: string,
  clientId: string
): Promise<UploadedAttachment> {
  // Warn once about placeholder status
  warnStorageNotConfigured();

  try {
    // Decode base64 content
    const buffer = Buffer.from(content, "base64");
    const fileSize = buffer.length;

    // PLACEHOLDER: Cloud storage not configured
    // Options:
    // 1. AWS S3
    // 2. Google Cloud Storage
    // 3. Azure Blob Storage
    // 4. Cloudflare R2
    // 5. Convex file storage

    // For now, return mock URL
    const mockUrl = `https://storage.unite-hub.com/${clientId}/attachments/${Date.now()}-${fileName}`;

    return {
      fileName,
      fileUrl: mockUrl,
      mimeType,
      fileSize,
    };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    throw new Error("Failed to upload attachment");
  }
}

/**
 * Upload multiple attachments
 */
export async function uploadAttachments(
  attachments: Array<{
    fileName: string;
    content: string;
    mimeType: string;
  }>,
  clientId: string
): Promise<UploadedAttachment[]> {
  const uploaded: UploadedAttachment[] = [];

  for (const attachment of attachments) {
    try {
      const result = await uploadAttachment(
        attachment.fileName,
        attachment.content,
        attachment.mimeType,
        clientId
      );
      uploaded.push(result);
    } catch (error) {
      console.error(`Failed to upload ${attachment.fileName}:`, error);
      // Continue with other attachments
    }
  }

  return uploaded;
}

/**
 * Delete attachment from cloud storage
 */
export async function deleteAttachment(fileUrl: string): Promise<void> {
  try {
    // TODO: Implement actual deletion from cloud storage
    console.log(`Deleting attachment: ${fileUrl}`);
  } catch (error) {
    console.error("Error deleting attachment:", error);
    throw new Error("Failed to delete attachment");
  }
}

/**
 * Get attachment download URL with expiration
 */
export async function getAttachmentDownloadUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    // TODO: Generate signed URL for secure download
    // For cloud storage services that support it
    return fileUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw new Error("Failed to generate download URL");
  }
}
