/**
 * Route Protection Configuration
 * Phase 32: Plans, Paywall & Agency Experience
 *
 * Defines public and protected routes
 */

export interface RouteConfig {
  public: string[];
  protected: string[];
  requiresSubscription: string[];
}

export const ROUTE_CONFIG: RouteConfig = {
  // Public routes - no auth required
  public: [
    "/",
    "/login",
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/implicit-callback",
    "/legal",
    "/legal/*",
    "/privacy",
    "/terms",
    "/pricing",
    "/about",
    "/contact",
    "/features",
    "/api/auth/callback",
    "/api/webhooks/stripe/*",
  ],

  // Protected routes - require auth
  protected: [
    "/dashboard",
    "/dashboard/*",
    "/client",
    "/client/*",
    "/api/agents/*",
    "/api/billing/*",
    "/api/workspaces/*",
    "/api/contacts/*",
    "/api/campaigns/*",
    "/api/profile/*",
    "/api/admin/*",
  ],

  // Routes that require active subscription (not just auth)
  requiresSubscription: [
    "/client/dashboard/*",
    "/api/agents/*",
    "/api/audits/*",
  ],
};

/**
 * Check if path matches pattern
 */
export function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return path === prefix || path.startsWith(prefix + "/");
  }
  return path === pattern;
}

/**
 * Check if route is public
 */
export function isPublicRoute(path: string): boolean {
  return ROUTE_CONFIG.public.some(pattern => matchesPattern(path, pattern));
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(path: string): boolean {
  if (isPublicRoute(path)) return false;
  return ROUTE_CONFIG.protected.some(pattern => matchesPattern(path, pattern));
}

/**
 * Check if route requires active subscription
 */
export function requiresSubscription(path: string): boolean {
  return ROUTE_CONFIG.requiresSubscription.some(pattern =>
    matchesPattern(path, pattern)
  );
}

/**
 * Get redirect URL for unauthorized access
 */
export function getAuthRedirect(returnTo?: string): string {
  const base = "/login";
  if (returnTo) {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

/**
 * Get redirect URL for paywall
 */
export function getPaywallRedirect(reason: string = "upgrade_required"): string {
  return `/pricing?reason=${reason}`;
}

/**
 * Generate auth/paywall report
 */
export function generateRouteReport(): {
  publicCount: number;
  protectedCount: number;
  subscriptionCount: number;
  routes: {
    path: string;
    isPublic: boolean;
    requiresAuth: boolean;
    requiresSubscription: boolean;
  }[];
} {
  const allPatterns = [
    ...ROUTE_CONFIG.public,
    ...ROUTE_CONFIG.protected,
    ...ROUTE_CONFIG.requiresSubscription,
  ];

  const uniquePatterns = [...new Set(allPatterns)];

  const routes = uniquePatterns.map(path => ({
    path,
    isPublic: isPublicRoute(path),
    requiresAuth: requiresAuth(path),
    requiresSubscription: requiresSubscription(path),
  }));

  return {
    publicCount: ROUTE_CONFIG.public.length,
    protectedCount: ROUTE_CONFIG.protected.length,
    subscriptionCount: ROUTE_CONFIG.requiresSubscription.length,
    routes,
  };
}
