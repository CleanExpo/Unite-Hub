/**
 * Synthex Template Clone API
 * POST /api/synthex/templates/clone - Clone template to tenant
 * Phase B24: Template Packs & Cross-Business Playbooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  cloneTemplateToTenant,
  recordTemplateUsage,
  type CloneOptions,
} from '@/lib/synthex/templatePackService';

/**
 * POST /api/synthex/templates/clone
 * Clone a template to a tenant's private pack
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { templateId, tenantId, options } = body as {
      templateId: string;
      tenantId: string;
      options?: CloneOptions;
    };

    if (!templateId || !tenantId) {
      return NextResponse.json(
        { error: 'templateId and tenantId are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this tenant
    const { data: tenantUser, error: tenantError } = await supabase
      .from('synthex_tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    if (tenantError || !tenantUser) {
      return NextResponse.json(
        { error: 'Forbidden: Not a member of this tenant' },
        { status: 403 }
      );
    }

    if (!['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or owner role required' },
        { status: 403 }
      );
    }

    // Clone the template
    const clonedTemplate = await cloneTemplateToTenant(
      templateId,
      tenantId,
      options
    );

    return NextResponse.json({
      success: true,
      data: clonedTemplate,
    });

  } catch (error) {
    console.error('[Template Clone API] POST Error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clone template' },
      { status: 500 }
    );
  }
}
