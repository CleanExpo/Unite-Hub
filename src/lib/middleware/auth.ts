/**
 * Authentication Middleware - Phase 2 API Routes
 * Protects API routes with staff authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseStaff, requireStaffAuth } from '../auth/supabase';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to require staff authentication
 * Usage: Wrap API route handlers with this middleware
 */
export function withStaffAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      // Get authorization header
      const authHeader = req.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token and get user
      const { data: { user }, error } = await supabaseStaff.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Verify user is staff
      const { data: staffData, error: staffError } = await supabaseStaff
        .from('staff_users')
        .select('id, email, role, active')
        .eq('id', user.id)
        .single();

      if (staffError || !staffData) {
        return NextResponse.json(
          { error: 'User is not authorized as staff' },
          { status: 403 }
        );
      }

      if (!staffData.active) {
        return NextResponse.json(
          { error: 'Staff account is inactive' },
          { status: 403 }
        );
      }

      // Attach user data to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: staffData.id,
        email: staffData.email,
        role: staffData.role,
      };

      // Call the actual handler
      return await handler(authenticatedReq, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to require client authentication
 */
export function withClientAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any) => {
    try {
      const authHeader = req.headers.get('authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }

      const token = authHeader.replace('Bearer ', '');

      const { data: { user }, error } = await supabaseStaff.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Verify user is client
      const { data: clientData, error: clientError } = await supabaseStaff
        .from('client_users')
        .select('id, email, name')
        .eq('id', user.id)
        .single();

      if (clientError || !clientData) {
        return NextResponse.json(
          { error: 'User is not authorized as client' },
          { status: 403 }
        );
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: clientData.id,
        email: clientData.email,
        role: 'client',
      };

      return await handler(authenticatedReq, context);
    } catch (error) {
      console.error('Client auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Extract user ID from request
 */
export function getUserId(req: AuthenticatedRequest): string | null {
  return req.user?.id || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(req: AuthenticatedRequest, role: string): boolean {
  return req.user?.role === role;
}
