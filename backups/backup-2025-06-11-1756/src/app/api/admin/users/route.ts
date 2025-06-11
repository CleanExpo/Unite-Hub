// ================================================
// Admin Users API Route
// ================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { createUser } from '@/lib/auth/auth';
import { UserRole, CreateUserInput, AUTH_ERROR_CODES } from '@/lib/auth/types';
import { createSupabaseServerClient } from '@/lib/auth/session';

/**
 * GET /api/admin/users
 * Fetch all users (Admin/Master only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user with error handling
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user has admin or master role
    if (!['Master', 'Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as UserRole | null;
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Fetch users with error handling
    try {
      const supabase = createSupabaseServerClient();
      
      // Build query
      let query = supabase
        .from('users')
        .select('id, email, role, is_active, created_at, updated_at, last_login, login_count, created_by', { count: 'exact' });
      
      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }
      
      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      // Sort by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data: users, error, count } = await query;
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        );
      }
      
      // Get created_by user details for each user
      const userIds = [...new Set(users?.map(u => u.created_by).filter(Boolean) || [])];
      let creators = {};
      
      if (userIds.length > 0) {
        const { data: creatorData } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
        
        creators = (creatorData || []).reduce((acc, creator) => {
          acc[creator.id] = creator.email;
          return acc;
        }, {} as Record<string, string>);
      }
      
      // Format response
      const formattedUsers = (users || []).map(u => ({
        ...u,
        createdByEmail: u.created_by ? creators[u.created_by] : null,
      }));
      
      // Log audit event
      await supabase.from('permission_audit_log').insert({
        action: 'Viewed user list',
        action_type: 'read',
        performed_by_id: user.id,
        details: { filters: { role, isActive }, page, limit },
        success: true,
      });
      
      return NextResponse.json({
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user (Admin/Master only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !['Master', 'Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.email || !data.password || !data.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles: UserRole[] = ['Master', 'Admin', 'Manager', 'User'];
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }
    
    // Only Master can create other Master users
    if (data.role === 'Master' && user.role !== 'Master') {
      return NextResponse.json(
        { error: 'Only Master users can create other Master users' },
        { status: 403 }
      );
    }
    
    // Create user
    const result = await createUser(
      data.email,
      data.password,
      data.role,
      user.id
    );
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      user: result.user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users
 * Update user details (Admin/Master only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || !['Master', 'Admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    
    // Get target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.id)
      .single();
    
    if (fetchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only Master can modify Master users
    if (targetUser.role === 'Master' && user.role !== 'Master') {
      return NextResponse.json(
        { error: 'Only Master users can modify other Master users' },
        { status: 403 }
      );
    }
    
    // Build update object
    const updates: any = {};
    
    if (data.role !== undefined) {
      // Only Master can change roles to/from Master
      if ((data.role === 'Master' || targetUser.role === 'Master') && user.role !== 'Master') {
        return NextResponse.json(
          { error: 'Only Master users can change Master roles' },
          { status: 403 }
        );
      }
      updates.role = data.role;
    }
    
    if (data.isActive !== undefined) {
      updates.is_active = data.isActive;
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', data.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    // Log audit event
    await supabase.from('permission_audit_log').insert({
      action: 'Updated user',
      action_type: 'modify',
      target_user_id: data.id,
      performed_by_id: user.id,
      details: { updates },
      success: true,
    });
    
    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users
 * Delete a user (Master only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'Master') {
      return NextResponse.json(
        { error: 'Only Master users can delete users' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    const supabase = createSupabaseServerClient();
    
    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);
    
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    
    // Log audit event
    await supabase.from('permission_audit_log').insert({
      action: 'Deleted user',
      action_type: 'delete',
      target_user_id: userId,
      performed_by_id: user.id,
      success: true,
    });
    
    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
