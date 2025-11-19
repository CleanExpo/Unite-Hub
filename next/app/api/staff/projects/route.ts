/**
 * Staff Projects API Routes - Phase 2
 * GET /api/staff/projects - List all projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { withStaffAuth } from '@/next/core/middleware/auth';
import { supabaseStaff } from '@/next/core/auth/supabase';

export const GET = withStaffAuth(async (req) => {
  try {
    const { data: projects, error } = await supabaseStaff
      .from('projects')
      .select('*, client_users(id, name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
