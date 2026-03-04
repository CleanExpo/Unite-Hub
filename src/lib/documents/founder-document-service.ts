/**
 * Founder Document Repository — Service Layer
 * All DB and storage operations use supabaseAdmin (service role).
 */

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'contract'
  | 'licence'
  | 'insurance'
  | 'tax'
  | 'hr'
  | 'financial'
  | 'legal'
  | 'other';

export type BusinessId =
  | 'disaster-recovery'
  | 'restore-assist'
  | 'ato'
  | 'nrpg'
  | 'unite-group'
  | 'carsi';

export interface FounderDocument {
  id: string;
  owner_id: string;
  business_id: BusinessId;
  file_name: string;
  file_type: string;
  category: DocumentCategory;
  storage_path: string | null;
  drive_file_id: string | null;
  drive_web_url: string | null;
  file_size_bytes: number | null;
  expiry_date: string | null;
  notes: string | null;
  extracted_text: string | null;
  extracted_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateDocumentData {
  ownerId: string;
  businessId: BusinessId;
  fileName: string;
  fileType: string;
  category: DocumentCategory;
  storagePath?: string;
  driveFileId?: string;
  driveWebUrl?: string;
  fileSizeBytes?: number;
  expiryDate?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateDocumentData {
  businessId?: BusinessId;
  fileName?: string;
  fileType?: string;
  category?: DocumentCategory;
  storagePath?: string;
  driveFileId?: string;
  driveWebUrl?: string;
  fileSizeBytes?: number;
  expiryDate?: string;
  notes?: string;
  tags?: string[];
}

export interface ListFilters {
  businessId?: string;
  category?: string;
  expiringWithin?: number; // days
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

// ─── List Documents ───────────────────────────────────────────────────────────

export async function listDocuments(
  ownerId: string,
  filters?: ListFilters,
): Promise<FounderDocument[]> {
  let query = supabaseAdmin
    .from('founder_documents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (filters?.businessId) {
    query = query.eq('business_id', filters.businessId);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.expiringWithin != null) {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + filters.expiringWithin);
    const futureDate = future.toISOString().split('T')[0];

    query = query
      .gte('expiry_date', today)
      .lte('expiry_date', futureDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[listDocuments]', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as FounderDocument[];
}

// ─── Get Single Document ──────────────────────────────────────────────────────

export async function getDocument(
  id: string,
  ownerId: string,
): Promise<FounderDocument> {
  const { data, error } = await supabaseAdmin
    .from('founder_documents')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single();

  if (error) {
    console.error('[getDocument]', error.message);
    throw new Error(error.message);
  }

  return data as FounderDocument;
}

// ─── Create Document ──────────────────────────────────────────────────────────

export async function createDocument(
  input: CreateDocumentData,
): Promise<FounderDocument> {
  const { data, error } = await supabaseAdmin
    .from('founder_documents')
    .insert({
      owner_id: input.ownerId,
      business_id: input.businessId,
      file_name: input.fileName,
      file_type: input.fileType,
      category: input.category,
      storage_path: input.storagePath ?? null,
      drive_file_id: input.driveFileId ?? null,
      drive_web_url: input.driveWebUrl ?? null,
      file_size_bytes: input.fileSizeBytes ?? null,
      expiry_date: input.expiryDate ?? null,
      notes: input.notes ?? null,
      tags: input.tags ?? [],
    })
    .select()
    .single();

  if (error) {
    console.error('[createDocument]', error.message);
    throw new Error(error.message);
  }

  return data as FounderDocument;
}

// ─── Update Document ──────────────────────────────────────────────────────────

export async function updateDocument(
  id: string,
  ownerId: string,
  updates: UpdateDocumentData,
): Promise<FounderDocument> {
  const payload: Record<string, unknown> = {};

  if (updates.businessId !== undefined) payload.business_id = updates.businessId;
  if (updates.fileName !== undefined) payload.file_name = updates.fileName;
  if (updates.fileType !== undefined) payload.file_type = updates.fileType;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.storagePath !== undefined) payload.storage_path = updates.storagePath;
  if (updates.driveFileId !== undefined) payload.drive_file_id = updates.driveFileId;
  if (updates.driveWebUrl !== undefined) payload.drive_web_url = updates.driveWebUrl;
  if (updates.fileSizeBytes !== undefined) payload.file_size_bytes = updates.fileSizeBytes;
  if (updates.expiryDate !== undefined) payload.expiry_date = updates.expiryDate;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.tags !== undefined) payload.tags = updates.tags;

  const { data, error } = await supabaseAdmin
    .from('founder_documents')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select()
    .single();

  if (error) {
    console.error('[updateDocument]', error.message);
    throw new Error(error.message);
  }

  return data as FounderDocument;
}

// ─── Delete Document ──────────────────────────────────────────────────────────

export async function deleteDocument(
  id: string,
  ownerId: string,
): Promise<void> {
  // Fetch first so we can clean up storage
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('founder_documents')
    .select('storage_path')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .single();

  if (fetchError) {
    console.error('[deleteDocument] fetch', fetchError.message);
    throw new Error(fetchError.message);
  }

  // Remove from storage bucket if a path exists
  if (doc?.storage_path) {
    const { error: storageError } = await supabaseAdmin.storage
      .from('founder-documents')
      .remove([doc.storage_path]);

    if (storageError) {
      console.warn('[deleteDocument] storage remove:', storageError.message);
      // Non-fatal — continue with DB deletion
    }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('founder_documents')
    .delete()
    .eq('id', id)
    .eq('owner_id', ownerId);

  if (deleteError) {
    console.error('[deleteDocument] delete', deleteError.message);
    throw new Error(deleteError.message);
  }
}

// ─── Upload File to Storage ───────────────────────────────────────────────────

export async function uploadDocumentFile(
  file: Buffer,
  fileName: string,
  ownerId: string,
  mimeType: string,
): Promise<UploadResult> {
  const uuid = crypto.randomUUID();
  const storagePath = `${ownerId}/${uuid}/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from('founder-documents')
    .upload(storagePath, file, { contentType: mimeType });

  if (error) {
    console.error('[uploadDocumentFile]', error.message);
    throw new Error(error.message);
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('founder-documents')
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: urlData.publicUrl,
  };
}

// ─── Get Signed Download URL ──────────────────────────────────────────────────

export async function getDocumentDownloadUrl(
  storagePath: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('founder-documents')
    .createSignedUrl(storagePath, 3600);

  if (error) {
    console.error('[getDocumentDownloadUrl]', error.message);
    throw new Error(error.message);
  }

  return data.signedUrl;
}
