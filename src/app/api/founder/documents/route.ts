/**
 * GET  /api/founder/documents  — list documents for authenticated user
 * POST /api/founder/documents  — upload a new document (multipart/form-data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  listDocuments,
  createDocument,
  uploadDocumentFile,
  type BusinessId,
  type DocumentCategory,
} from '@/lib/documents/founder-document-service';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const businessId = searchParams.get('businessId') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const expiringWithinRaw = searchParams.get('expiringWithin');
    const expiringWithin = expiringWithinRaw ? parseInt(expiringWithinRaw, 10) : undefined;

    const documents = await listDocuments(user.id, { businessId, category, expiringWithin });

    return NextResponse.json({ documents, count: documents.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/documents]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const businessId = formData.get('businessId') as string | null;
    const category = formData.get('category') as string | null;
    const expiryDate = (formData.get('expiryDate') as string | null) ?? undefined;
    const notes = (formData.get('notes') as string | null) ?? undefined;
    const tagsRaw = formData.get('tags') as string | null;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    // Parse optional tags JSON array
    let tags: string[] = [];
    if (tagsRaw) {
      try {
        const parsed = JSON.parse(tagsRaw);
        tags = Array.isArray(parsed) ? parsed : [];
      } catch {
        tags = [];
      }
    }

    // Convert File → Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage bucket
    const { storagePath } = await uploadDocumentFile(
      buffer,
      file.name,
      user.id,
      file.type,
    );

    // Persist document record
    const document = await createDocument({
      ownerId: user.id,
      businessId: businessId as BusinessId,
      fileName: file.name,
      fileType: file.type,
      category: category as DocumentCategory,
      storagePath,
      fileSizeBytes: file.size,
      expiryDate,
      notes,
      tags,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/documents]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
