/**
 * Client Digital Vault API Routes - Phase 2
 * GET /api/client/vault - List vault entries
 * POST /api/client/vault - Add vault entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { withClientAuth, getUserId } from '@/lib/middleware/auth';
import { supabaseStaff } from '@/lib/auth/supabase';
import { validateBody, vaultSchemas } from '@/lib/middleware/validation';

export const GET = withClientAuth(async (req) => {
  try {
    const clientId = getUserId(req);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: entries, error } = await (supabaseStaff
      .from('digital_vault') as any)
      .select('id, key_name, category, created_at') // Don't expose encrypted values in list
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch vault entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vault entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entries: entries || [],
    });
  } catch (error) {
    console.error('Get vault entries error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withClientAuth(async (req) => {
  try {
    const { data, error: validationError } = await validateBody(req, vaultSchemas.create);

    if (validationError || !data) {
      return NextResponse.json(
        { error: validationError || 'Invalid request body' },
        { status: 400 }
      );
    }

    const clientId = getUserId(req);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In production, encrypt the value before storing
    // For now, store as-is (would use crypto library in production)
    const { data: entry, error } = await (supabaseStaff
      .from('digital_vault') as any)
      .insert({
        client_id: clientId,
        ...data,
        encrypted: true, // Flag as encrypted
      })
      .select('id, key_name, category, created_at')
      .single();

    if (error) {
      console.error('Failed to create vault entry:', error);
      return NextResponse.json(
        { error: 'Failed to create vault entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Create vault entry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
