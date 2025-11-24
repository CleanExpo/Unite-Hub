import { NextRequest, NextResponse } from 'next/server';
import { supabaseBrowser } from '@/lib/supabase';
import { generateArtifact } from '@/lib/knowledgeDistillation';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData, error: authError } = await supabaseBrowser.auth.getUser(token);
    if (authError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId, artifactType, title, content, sourceSystems } = await req.json();
    if (!tenantId || !artifactType || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const artifact = await generateArtifact(tenantId, artifactType, title, content, sourceSystems || []);

    return NextResponse.json({ success: true, artifact });
  } catch (error) {
    console.error('Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
