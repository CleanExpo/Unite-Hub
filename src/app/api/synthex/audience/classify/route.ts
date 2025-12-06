/**
 * POST /api/synthex/audience/classify
 *
 * Classify a contact's persona using AI.
 *
 * Body:
 * {
 *   tenantId: string (required)
 *   contactId: string (required)
 *   save?: boolean (default: true) - Save classification to database
 * }
 *
 * Phase: B11 - Synthex Audience Scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { classifyPersona, updatePersona, getScore } from '@/lib/synthex/audienceScoringService';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { tenantId, contactId, save = true } = body;

    if (!tenantId || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, contactId' },
        { status: 400 }
      );
    }

    // Validate tenant access
    const { data: tenant } = await supabaseAdmin
      .from('synthex_tenants')
      .select('id, owner_user_id')
      .eq('id', tenantId)
      .single();

    if (!tenant || tenant.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get contact data
    const { data: contact } = await supabaseAdmin
      .from('synthex_audience_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    if (contact.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Contact does not belong to tenant' }, { status: 403 });
    }

    // Get score data to enrich classification
    const scoreResult = await getScore(contactId);
    const scoreData = scoreResult.data || {};

    // Build contact profile for classification
    const contactProfile = {
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email ? contact.email.split('@')[1] : null, // Domain only for privacy
      attributes: contact.attributes || {},
      tags: contact.tags || [],
      engagementScore: scoreData.engagementScore || contact.engagement_score || 0,
      activityVector: scoreData.activityVector || {},
      totalEvents: scoreData.totalEvents || 0,
      positiveSignals: scoreData.positiveSignals || 0,
      negativeSignals: scoreData.negativeSignals || 0,
    };

    // Classify using AI
    const classifyResult = await classifyPersona(contactProfile);

    if (classifyResult.error) {
      throw classifyResult.error;
    }

    if (!classifyResult.data) {
      return NextResponse.json(
        { error: 'Could not classify persona - insufficient data' },
        { status: 400 }
      );
    }

    // Optionally save to database
    let savedScore = null;
    if (save) {
      const updateResult = await updatePersona(
        contactId,
        classifyResult.data.persona,
        classifyResult.data.confidence,
        classifyResult.data.tags
      );

      if (updateResult.error) {
        console.error('[audience/classify] Save error:', updateResult.error);
        // Don't fail - still return classification
      } else {
        savedScore = updateResult.data;
      }
    }

    return NextResponse.json({
      status: 'ok',
      classification: classifyResult.data,
      savedScore,
      saved: save && savedScore !== null,
    }, { status: 200 });
  } catch (error) {
    console.error('[audience/classify POST] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
