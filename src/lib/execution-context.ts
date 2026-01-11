import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, getSupabaseServerWithAuth } from '@/lib/supabase';

/**
 * Canonical API-boundary execution context.
 *
 * This module is the single, execution-proof entry contract for App Router Route Handlers
 * (e.g. under src/app/api/.../route.ts).
 *
 * Design constraints:
 * - No Next.js middleware dependency (repo has no middleware.ts)
 * - Auth is resolved server-side using Supabase (JWT via header OR cookie session)
 * - Workspace is resolved via a deterministic contract (NOT query params)
 * - Explicit failure modes (401/403/404/400)
 */

export type ExecutionAuthSource = 'authorization-header' | 'cookie-session';
export type ExecutionWorkspaceSource = 'header' | 'body' | 'route-param' | 'default-membership';

export type ExecutionContext = {
  user: { id: string; email?: string };
  supabase: any;
  workspace?: {
    id: string;
    orgId: string;
    role?: string;
  };
  resolvedFrom: {
    auth: ExecutionAuthSource;
    workspace?: ExecutionWorkspaceSource;
  };
};

export type RequireExecutionContextOptions = {
  /**
   * Require workspace resolution.
   * If true and no workspace id is provided (and no default membership can be resolved), returns 400.
   */
  requireWorkspace?: boolean;

  /**
   * Workspace id can be supplied via:
   * - header: x-workspace-id
   * - JSON body: { workspaceId }
   * - route param: params.workspaceId
   *
   * If false, query params will NOT be used.
   */
  allowWorkspaceFromHeader?: boolean;
  allowWorkspaceFromBody?: boolean;
  allowWorkspaceFromRouteParam?: boolean;

  /** If true, allow falling back to the user's first org's first workspace. */
  allowDefaultWorkspace?: boolean;
};

export type RequireExecutionContextResult =
  | { ok: true; ctx: ExecutionContext }
  | { ok: false; response: NextResponse };

function jsonError(status: number, error: string, details?: any): NextResponse {
  return NextResponse.json(
    { success: false, error, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

async function resolveSupabaseForRequest(req: NextRequest): Promise<{
  supabase: any;
  authSource: ExecutionAuthSource;
  user: { id: string; email?: string } | null;
  responseIfError?: NextResponse;
}> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;

  try {
    const supabase = token ? getSupabaseServerWithAuth(token) : await getSupabaseServer();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return {
        supabase,
        authSource: token ? 'authorization-header' : 'cookie-session',
        user: null,
        responseIfError: jsonError(401, 'Unauthorized'),
      };
    }

    return {
      supabase,
      authSource: token ? 'authorization-header' : 'cookie-session',
      user: { id: data.user.id, email: data.user.email },
    };
  } catch (err: any) {
    return {
      supabase: null,
      authSource: token ? 'authorization-header' : 'cookie-session',
      user: null,
      responseIfError: jsonError(500, 'Authentication failed', err?.message),
    };
  }
}

async function readJsonBodyIfPresent(req: NextRequest): Promise<any | null> {
  // Only attempt on methods that commonly carry JSON bodies.
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return null;

  // NextRequest body is a stream; cloning keeps the original available for the route.
  try {
    const cloned = req.clone();
    return await cloned.json();
  } catch {
    return null;
  }
}

async function resolveWorkspaceId(req: NextRequest, params?: Record<string, string>, options?: RequireExecutionContextOptions): Promise<{
  workspaceId?: string;
  source?: ExecutionWorkspaceSource;
}> {
  const opts: Required<RequireExecutionContextOptions> = {
    requireWorkspace: options?.requireWorkspace ?? false,
    allowWorkspaceFromHeader: options?.allowWorkspaceFromHeader ?? true,
    allowWorkspaceFromBody: options?.allowWorkspaceFromBody ?? true,
    allowWorkspaceFromRouteParam: options?.allowWorkspaceFromRouteParam ?? true,
    allowDefaultWorkspace: options?.allowDefaultWorkspace ?? false,
  };

  if (opts.allowWorkspaceFromRouteParam) {
    const wp = params?.workspaceId;
    if (wp) return { workspaceId: wp, source: 'route-param' };
  }

  if (opts.allowWorkspaceFromHeader) {
    const wh = req.headers.get('x-workspace-id');
    if (wh) return { workspaceId: wh, source: 'header' };
  }

  if (opts.allowWorkspaceFromBody) {
    const body = await readJsonBodyIfPresent(req);
    const wb = body?.workspaceId;
    if (typeof wb === 'string' && wb.length > 0) return { workspaceId: wb, source: 'body' };
  }

  return {};
}

async function assertWorkspaceAccess(supabase: any, userId: string, workspaceId: string): Promise<
  | { ok: true; workspace: { id: string; orgId: string; role?: string } }
  | { ok: false; response: NextResponse }
> {
  // 1) Load workspace to get org_id
  const { data: ws, error: wsError } = await supabase
    .from('workspaces')
    .select('id, org_id')
    .eq('id', workspaceId)
    .single();

  if (wsError || !ws) {
    return { ok: false, response: jsonError(404, 'Workspace not found') };
  }

  // 2) Verify membership in org
  const { data: membership, error: membershipError } = await supabase
    .from('user_organizations')
    .select('org_id, role, is_active')
    .eq('user_id', userId)
    .eq('org_id', ws.org_id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return { ok: false, response: jsonError(403, 'Access denied to this workspace') };
  }

  return {
    ok: true,
    workspace: {
      id: ws.id,
      orgId: ws.org_id,
      role: membership.role,
    },
  };
}

async function resolveDefaultWorkspaceForUser(supabase: any, userId: string): Promise<string | null> {
  // Deterministic fallback: first active org membership -> first workspace for that org
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('org_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership?.org_id) return null;

  const { data: ws } = await supabase
    .from('workspaces')
    .select('id')
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return ws?.id ?? null;
}

/**
 * Resolve a canonical execution context or return a deterministic error response.
 */
export async function requireExecutionContext(
  req: NextRequest,
  args?: { params?: Record<string, string> },
  options?: RequireExecutionContextOptions
): Promise<RequireExecutionContextResult> {
  const auth = await resolveSupabaseForRequest(req);
  if (!auth.user) {
    return { ok: false, response: auth.responseIfError! };
  }

  const { workspaceId, source } = await resolveWorkspaceId(req, args?.params, options);

  let finalWorkspaceId = workspaceId;
  let workspaceSource = source;

  const allowDefault = options?.allowDefaultWorkspace ?? false;
  const requireWs = options?.requireWorkspace ?? false;

  if (!finalWorkspaceId && allowDefault) {
    finalWorkspaceId = await resolveDefaultWorkspaceForUser(auth.supabase, auth.user.id);
    if (finalWorkspaceId) {
      workspaceSource = 'default-membership';
    }
  }

  if (!finalWorkspaceId) {
    if (requireWs) {
      return {
        ok: false,
        response: jsonError(400, 'workspaceId is required', {
          accepted_sources: ['x-workspace-id header', 'JSON body.workspaceId', 'route param :workspaceId'],
        }),
      };
    }

    // Workspace not required for this route/action.
    return {
      ok: true,
      ctx: {
        user: auth.user,
        supabase: auth.supabase,
        resolvedFrom: {
          auth: auth.authSource,
        },
      },
    };
  }

  const access = await assertWorkspaceAccess(auth.supabase, auth.user.id, finalWorkspaceId);
  if (!access.ok) {
    return { ok: false, response: access.response };
  }

  return {
    ok: true,
    ctx: {
      user: auth.user,
      supabase: auth.supabase,
      workspace: access.workspace,
      resolvedFrom: {
        auth: auth.authSource,
        workspace: workspaceSource ?? 'header',
      },
    },
  };
}
