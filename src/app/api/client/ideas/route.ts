/**
 * Client Ideas API Routes - Phase 2
 * GET /api/client/ideas - List user's ideas
 * POST /api/client/ideas - Submit new idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClientAuth, getUserId } from '@/lib/middleware/auth';
import { supabaseStaff } from '@/lib/auth/supabase';
import { validateBody, ideaSchemas } from '@/lib/middleware/validation';

export const GET = withClientAuth(async (req) => {
  try {
    const clientId = getUserId(req);

    const { data: ideas, error } = await supabaseStaff
      .from('ideas')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch ideas:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ideas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ideas: ideas || [],
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withClientAuth(async (req) => {
  try {
    const { data, error: validationError } = await validateBody(req, ideaSchemas.create);

    if (validationError || !data) {
      return NextResponse.json(
        { error: validationError || 'Invalid request body' },
        { status: 400 }
      );
    }

    const clientId = getUserId(req);

    const { data: idea, error } = await supabaseStaff
      .from('ideas')
      .insert({
        client_id: clientId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create idea:', error);
      return NextResponse.json(
        { error: 'Failed to submit idea' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      idea,
    });
  } catch (error) {
    console.error('Create idea error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
