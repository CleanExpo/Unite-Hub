/**
 * POST /api/founder/os/media
 * Upload media (base64 data URL) to Supabase storage and record in founder_media table.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, getSupabaseAdmin } from '@/lib/supabase';

const BUCKET = 'founder-media';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { dataUrl, caption, business, mimeType } = body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      return NextResponse.json({ error: 'dataUrl is required' }, { status: 400 });
    }

    // Parse data URL → buffer
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 });
    }

    const detectedMime = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const finalMime = mimeType || detectedMime;
    const ext = finalMime.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
    const fileName = `${user.id}/${Date.now()}.${ext}`;

    // Use admin client to ensure bucket exists and upload
    const admin = getSupabaseAdmin();

    // Ensure bucket exists (idempotent)
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET);
    if (!bucketExists) {
      await admin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
      });
    }

    // Upload file
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: finalMime,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    const publicUrl = urlData?.publicUrl || '';

    // Insert record into founder_media
    const { data: record, error: insertError } = await supabase
      .from('founder_media')
      .insert({
        owner_id: user.id,
        file_name: fileName,
        mime_type: finalMime,
        storage_path: fileName,
        public_url: publicUrl,
        caption: caption || null,
        business_key: business || null,
        file_size_bytes: buffer.byteLength,
      })
      .select('id, public_url, created_at')
      .single();

    if (insertError) {
      console.error('[media] insert error:', insertError.message);
      // Still return the URL even if the record insert fails
      return NextResponse.json({
        id: null,
        url: publicUrl,
        warning: 'File uploaded but record insert failed',
      });
    }

    return NextResponse.json({
      id: record.id,
      url: record.public_url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[POST /api/founder/os/media]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
