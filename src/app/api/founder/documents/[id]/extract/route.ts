/**
 * Document Extraction API — Claude Haiku
 * POST /api/founder/documents/[id]/extract
 *
 * Downloads the file from Supabase Storage and uses Claude Haiku to extract
 * key structured information from the document. Stores the result back in
 * `founder_documents.extracted_text`.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const EXTRACTION_PROMPT = `You are extracting key information from a business document. Extract and summarise:
1. Document type and purpose (1 sentence)
2. Parties involved (names, ABNs, entities)
3. Key dates (start date, end date, renewal date, expiry date — format: DD/MM/YYYY)
4. Key financial terms (amounts, payment schedules, currency)
5. Key obligations or conditions (3-5 bullet points max)
6. Any critical warnings or urgent items

Be concise. Use Australian English. Format as plain text with clear section labels.`;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;

    // ── Fetch document ────────────────────────────────────────────────────────
    const { data: doc, error: docError } = await supabaseAdmin
      .from('founder_documents')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ── Validate extractable source ───────────────────────────────────────────
    if (!doc.storage_path && !doc.drive_file_id) {
      return NextResponse.json({ error: 'No file to extract from' }, { status: 400 });
    }

    // ── Build text content for Claude ─────────────────────────────────────────
    let textContent: string;

    if (doc.storage_path) {
      const { data: fileData, error: storageError } = await supabaseAdmin.storage
        .from('founder-documents')
        .download(doc.storage_path);

      if (storageError || !fileData) {
        return NextResponse.json(
          { error: `Storage download failed: ${storageError?.message ?? 'unknown error'}` },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const fileType: string = doc.file_type ?? '';

      if (fileType.toLowerCase().includes('pdf')) {
        // PDFs are binary — Claude cannot parse raw binary; gracefully degrade.
        textContent =
          'Document is a PDF binary. Please indicate that you cannot extract text from binary PDF files and suggest the user use a text-based format.';
      } else {
        // Plain text, markdown, docx-exported-as-txt, csv, etc.
        textContent = buffer.toString('utf-8').slice(0, 50000);
      }
    } else {
      // drive_file_id present but no storage_path — cannot download without Drive OAuth
      textContent =
        'Document is stored in Google Drive and is not locally accessible for extraction. ' +
        'Please download and re-upload the file to enable text extraction.';
    }

    // ── Call Claude Haiku ─────────────────────────────────────────────────────
    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\nDocument content:\n${textContent}`,
        },
      ],
    });

    // Extract text from the response
    const extractedText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')
      .trim();

    const extractedAt = new Date().toISOString();

    // ── Persist extraction ────────────────────────────────────────────────────
    const { error: updateError } = await supabaseAdmin
      .from('founder_documents')
      .update({ extracted_text: extractedText, extracted_at: extractedAt })
      .eq('id', doc.id);

    if (updateError) {
      console.error('[documentExtract] Failed to persist extracted text:', updateError.message);
      return NextResponse.json(
        { error: `Failed to save extracted text: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ extracted_text: extractedText, extracted_at: extractedAt });
  } catch (err) {
    console.error('[documentExtract]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
