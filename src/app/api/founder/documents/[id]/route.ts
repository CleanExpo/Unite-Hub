/**
 * GET    /api/founder/documents/[id]  — fetch single document + signed download URL
 * PUT    /api/founder/documents/[id]  — update document metadata
 * DELETE /api/founder/documents/[id]  — delete document + storage file
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import {
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  type DocumentCategory,
} from '@/lib/documents/founder-document-service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const document = await getDocument(id, user.id);

    let downloadUrl: string | undefined;
    if (document.storage_path) {
      try {
        downloadUrl = await getDocumentDownloadUrl(document.storage_path);
      } catch {
        // Non-fatal — return document without download URL
      }
    }

    return NextResponse.json({ document, downloadUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[GET /api/founder/documents/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json() as {
      category?: string;
      expiryDate?: string;
      notes?: string;
      tags?: string[];
    };

    const updates: {
      category?: DocumentCategory;
      expiryDate?: string;
      notes?: string;
      tags?: string[];
    } = {};

    if (body.category !== undefined) updates.category = body.category as DocumentCategory;
    if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined) updates.tags = body.tags;

    const document = await updateDocument(id, user.id, updates);

    return NextResponse.json({ document });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[PUT /api/founder/documents/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    await deleteDocument(id, user.id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[DELETE /api/founder/documents/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
