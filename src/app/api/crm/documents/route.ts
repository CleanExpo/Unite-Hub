import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function handlePOST(req, userId) (request: NextRequest) {
  const supabase = await createClient();
  const formData = await request.formData();
  
  const file = formData.get('file') as File;
  const dealId = formData.get('dealId') as string;
  const userId = formData.get('userId') as string;

  if (!file || !dealId) {
    return NextResponse.json(
      { error: 'File and dealId are required' },
      { status: 400 }
    );
  }

  // Generate unique file path
  const filePath = `documents/${dealId}/${Date.now()}-${file.name}`;
  
  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = await supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  // Save document metadata
  const { data, error } = await supabase
    .from('documents')
    .insert([{
      deal_id: dealId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath,
      public_url: urlData.publicUrl,
      uploaded_by: userId
    }])
    .select();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data[0], { status: 201 });
}

async function handleGET(req, userId) (request: NextRequest) {
  const supabase = await createClient();
  const dealId = request.nextUrl.searchParams.get('dealId');
  
  if (!dealId) {
    return NextResponse.json(
      { error: 'dealId parameter is required' },
      { status: 400 }
    );
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(documents);
}

export const GET = withApiAuth(handleGET);
export const POST = withApiAuth(handlePOST);