/**
 * Error Signatures API
 * Phase: D68
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  listErrorSignatures,
  createErrorSignature,
  updateErrorSignature,
  aiDetectErrorPatterns,
} from '@/lib/unite/selfHealingService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const filters = {
      tenant_id: tenantId || undefined,
      severity: request.nextUrl.searchParams.get('severity') || undefined,
      category: request.nextUrl.searchParams.get('category') || undefined,
      fix_type: request.nextUrl.searchParams.get('fix_type') || undefined,
      auto_approve:
        request.nextUrl.searchParams.get('auto_approve') === 'true' ? true : undefined,
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '100', 10),
    };

    const signatures = await listErrorSignatures(filters);
    return NextResponse.json({ signatures });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: orgData } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    const tenantId = orgData?.org_id || null;

    const body = await request.json();
    const action = body.action;

    // AI-powered error pattern detection
    if (action === 'detect_patterns') {
      const { error_samples } = body;
      if (!error_samples || !Array.isArray(error_samples)) {
        return NextResponse.json({ error: 'error_samples array required' }, { status: 400 });
      }

      const result = await aiDetectErrorPatterns(tenantId, error_samples);
      return NextResponse.json(result);
    }

    // Update existing signature
    if (action === 'update') {
      const { signature_id, ...updates } = body;
      if (!signature_id) {
        return NextResponse.json({ error: 'signature_id required' }, { status: 400 });
      }

      const signature = await updateErrorSignature(signature_id, updates);
      return NextResponse.json({ signature });
    }

    // Create new signature
    const signature = await createErrorSignature({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({ signature }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
