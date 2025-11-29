/**
 * Core Authentication Types
 *
 * Centralized type definitions for authentication and authorization.
 * Used across all API routes and middleware.
 *
 * @module core/auth/types
 */

import { SupabaseClient, User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * User roles matching the database ENUM
 * See: .claude/SCHEMA_REFERENCE.md
 */
export type UserRole = 'FOUNDER' | 'STAFF' | 'CLIENT' | 'ADMIN';

/**
 * Project context for route separation
 * Unite-Hub: Staff CRM (FOUNDER, STAFF, ADMIN only)
 * Synthex: Client marketing portal (CLIENT + tiers)
 */
export type ProjectContext = 'unite-hub' | 'synthex' | 'shared';

/**
 * Synthex subscription tiers
 */
export type SynthexTier = 'starter' | 'professional' | 'elite' | null;

/**
 * User profile with role information
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

/**
 * Workspace context for data isolation
 */
export interface WorkspaceContext {
  workspaceId: string;
  organizationId?: string;
}

/**
 * Authentication context passed to protected handlers
 */
export interface AuthContext {
  user: User;
  profile: UserProfile;
  role: UserRole;
  supabase: SupabaseClient;
}

/**
 * Full request context including workspace
 */
export interface RequestContext extends AuthContext {
  workspace: WorkspaceContext;
  request: NextRequest;
}

/**
 * Handler for authenticated routes
 */
export type AuthenticatedHandler = (
  context: AuthContext,
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Handler for routes with workspace scope
 */
export type WorkspaceScopedHandler = (
  context: RequestContext
) => Promise<NextResponse> | NextResponse;

/**
 * Handler for public routes (webhooks, health checks)
 */
export type PublicHandler = (
  request: NextRequest
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware chain result
 */
export interface MiddlewareResult {
  success: boolean;
  response?: NextResponse;
  context?: Partial<RequestContext>;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * Role permission configuration
 */
export interface RolePermissions {
  allowedRoles: UserRole[];
  projectContext: ProjectContext;
  requireTier?: SynthexTier[];
}

/**
 * Auth error codes for consistent error handling
 */
export const AUTH_ERROR_CODES = {
  UNAUTHENTICATED: 'AUTH_UNAUTHENTICATED',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  ROLE_DENIED: 'AUTH_ROLE_DENIED',
  WORKSPACE_DENIED: 'AUTH_WORKSPACE_DENIED',
  TIER_REQUIRED: 'AUTH_TIER_REQUIRED',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
