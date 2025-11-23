/**
 * Route Configuration - Centralized routing metadata
 *
 * Source: docs/abacus/routing-map.json
 * Purpose: Standardize route definitions, improve navigation consistency
 */

export interface RouteConfig {
  path: string;
  label: string;
  icon?: string;
  authRequired: boolean;
  workspaceRequired?: boolean;
  adminOnly?: boolean;
  parent?: string;
  children?: string[];
}

// Dashboard routes
export const DASHBOARD_ROUTES: Record<string, RouteConfig> = {
  "/dashboard": {
    path: "/dashboard",
    label: "Dashboard",
    authRequired: true,
    workspaceRequired: true,
  },
  "/dashboard/overview": {
    path: "/dashboard/overview",
    label: "Overview",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/contacts": {
    path: "/dashboard/contacts",
    label: "Contacts",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/campaigns": {
    path: "/dashboard/campaigns",
    label: "Campaigns",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/campaigns/drip"],
  },
  "/dashboard/campaigns/drip": {
    path: "/dashboard/campaigns/drip",
    label: "Drip Campaigns",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard/campaigns",
  },
  "/dashboard/content": {
    path: "/dashboard/content",
    label: "Content",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/audits": {
    path: "/dashboard/audits",
    label: "Website Audits",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/insights": {
    path: "/dashboard/insights",
    label: "Insights",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/insights/competitors"],
  },
  "/dashboard/intelligence": {
    path: "/dashboard/intelligence",
    label: "Intelligence",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/ai-tools": {
    path: "/dashboard/ai-tools",
    label: "AI Tools",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/ai-tools/code-generator", "/dashboard/ai-tools/marketing-copy"],
  },
  "/dashboard/media": {
    path: "/dashboard/media",
    label: "Media",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/meetings": {
    path: "/dashboard/meetings",
    label: "Meetings",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/messages": {
    path: "/dashboard/messages",
    label: "Messages",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/messages/whatsapp"],
  },
  "/dashboard/profile": {
    path: "/dashboard/profile",
    label: "Profile",
    authRequired: true,
    workspaceRequired: false,
    parent: "/dashboard",
  },
  "/dashboard/projects": {
    path: "/dashboard/projects",
    label: "Projects",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/resources": {
    path: "/dashboard/resources",
    label: "Resources",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/resources/landing-pages"],
  },
  "/dashboard/settings": {
    path: "/dashboard/settings",
    label: "Settings",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
    children: ["/dashboard/settings/integrations"],
  },
  "/dashboard/sites": {
    path: "/dashboard/sites",
    label: "Sites",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/team": {
    path: "/dashboard/team",
    label: "Team",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/workspaces": {
    path: "/dashboard/workspaces",
    label: "Workspaces",
    authRequired: true,
    workspaceRequired: false,
    parent: "/dashboard",
  },
  "/dashboard/billing": {
    path: "/dashboard/billing",
    label: "Billing",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/approvals": {
    path: "/dashboard/approvals",
    label: "Approvals",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
  "/dashboard/calendar": {
    path: "/dashboard/calendar",
    label: "Calendar",
    authRequired: true,
    workspaceRequired: true,
    parent: "/dashboard",
  },
};

// Client portal routes
export const CLIENT_ROUTES: Record<string, RouteConfig> = {
  "/client": {
    path: "/client",
    label: "Client Portal",
    authRequired: true,
    workspaceRequired: true,
  },
  "/client/home": {
    path: "/client/home",
    label: "Home",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/assistant": {
    path: "/client/assistant",
    label: "Assistant",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/ideas": {
    path: "/client/ideas",
    label: "Ideas",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/projects": {
    path: "/client/projects",
    label: "Projects",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/proposals": {
    path: "/client/proposals",
    label: "Proposals",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/reports": {
    path: "/client/reports",
    label: "Reports",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/seo": {
    path: "/client/seo",
    label: "SEO",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
  "/client/vault": {
    path: "/client/vault",
    label: "Vault",
    authRequired: true,
    workspaceRequired: true,
    parent: "/client",
  },
};

// Staff portal routes
export const STAFF_ROUTES: Record<string, RouteConfig> = {
  "/staff": {
    path: "/staff",
    label: "Staff Portal",
    authRequired: true,
    workspaceRequired: true,
  },
  "/staff/dashboard": {
    path: "/staff/dashboard",
    label: "Dashboard",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/activity": {
    path: "/staff/activity",
    label: "Activity",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/projects": {
    path: "/staff/projects",
    label: "Projects",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/reports": {
    path: "/staff/reports",
    label: "Reports",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/scope-review": {
    path: "/staff/scope-review",
    label: "Scope Review",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/seo": {
    path: "/staff/seo",
    label: "SEO",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/settings": {
    path: "/staff/settings",
    label: "Settings",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/tasks": {
    path: "/staff/tasks",
    label: "Tasks",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
  "/staff/time-tracker": {
    path: "/staff/time-tracker",
    label: "Time Tracker",
    authRequired: true,
    workspaceRequired: true,
    parent: "/staff",
  },
};

// Console (admin) routes
export const CONSOLE_ROUTES: Record<string, RouteConfig> = {
  "/console": {
    path: "/console",
    label: "Console",
    authRequired: true,
    adminOnly: true,
  },
};

// Public marketing routes
export const MARKETING_ROUTES: Record<string, RouteConfig> = {
  "/": {
    path: "/",
    label: "Home",
    authRequired: false,
  },
  "/about": {
    path: "/about",
    label: "About",
    authRequired: false,
  },
  "/contact": {
    path: "/contact",
    label: "Contact",
    authRequired: false,
  },
  "/pricing": {
    path: "/pricing",
    label: "Pricing",
    authRequired: false,
  },
  "/features": {
    path: "/features",
    label: "Features",
    authRequired: false,
  },
  "/privacy": {
    path: "/privacy",
    label: "Privacy",
    authRequired: false,
  },
  "/terms": {
    path: "/terms",
    label: "Terms",
    authRequired: false,
  },
  "/security": {
    path: "/security",
    label: "Security",
    authRequired: false,
  },
};

// All routes combined
export const ALL_ROUTES: Record<string, RouteConfig> = {
  ...DASHBOARD_ROUTES,
  ...CLIENT_ROUTES,
  ...STAFF_ROUTES,
  ...CONSOLE_ROUTES,
  ...MARKETING_ROUTES,
};

/**
 * Get route configuration by path
 */
export function getRouteConfig(path: string): RouteConfig | undefined {
  // Exact match
  if (ALL_ROUTES[path]) {
    return ALL_ROUTES[path];
  }

  // Check for dynamic routes (strip IDs)
  const normalizedPath = path.replace(/\/[a-f0-9-]{36}/g, "/[id]");
  return ALL_ROUTES[normalizedPath];
}

/**
 * Get route label by path
 */
export function getRouteLabel(path: string): string {
  const config = getRouteConfig(path);
  if (config) {
    return config.label;
  }

  // Fallback: format last segment
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "";
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Check if route requires authentication
 */
export function requiresAuth(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.authRequired ?? true;
}

/**
 * Check if route requires workspace
 */
export function requiresWorkspace(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.workspaceRequired ?? false;
}

/**
 * Check if route is admin only
 */
export function isAdminOnly(path: string): boolean {
  const config = getRouteConfig(path);
  return config?.adminOnly ?? false;
}

/**
 * Get parent route
 */
export function getParentRoute(path: string): string | undefined {
  const config = getRouteConfig(path);
  return config?.parent;
}

/**
 * Get breadcrumb trail for a path
 */
export function getBreadcrumbTrail(path: string): Array<{ label: string; href: string }> {
  const trail: Array<{ label: string; href: string }> = [];
  let currentPath = path;

  while (currentPath) {
    const config = getRouteConfig(currentPath);
    if (config) {
      trail.unshift({
        label: config.label,
        href: config.path,
      });
      currentPath = config.parent || "";
    } else {
      break;
    }
  }

  return trail;
}
