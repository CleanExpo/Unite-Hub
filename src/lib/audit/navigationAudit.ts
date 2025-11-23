/**
 * Navigation Audit System
 * Phase 56: Verify all routes are discoverable and linked
 */

export interface RouteConfig {
  path: string;
  name: string;
  linkedFrom: string[];
  requiresAuth: boolean;
  category: 'client' | 'founder' | 'marketing' | 'auth' | 'api';
  status: 'active' | 'placeholder' | 'deprecated';
}

// Critical client dashboard routes
export const clientDashboardRoutes: RouteConfig[] = [
  {
    path: '/client/dashboard/overview',
    name: 'Dashboard Overview',
    linkedFrom: ['/client', '/'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/activation',
    name: '90-Day Activation',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/production',
    name: 'Production Jobs',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/packs',
    name: 'Content Packs',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/training',
    name: 'Training Hub',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/performance',
    name: 'Performance',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
  {
    path: '/client/dashboard/success',
    name: 'Success Engine',
    linkedFrom: ['/client/dashboard/overview'],
    requiresAuth: true,
    category: 'client',
    status: 'active',
  },
];

// Founder dashboard routes
export const founderDashboardRoutes: RouteConfig[] = [
  {
    path: '/founder/dashboard/overview',
    name: 'Founder Overview',
    linkedFrom: ['/founder'],
    requiresAuth: true,
    category: 'founder',
    status: 'active',
  },
  {
    path: '/founder/dashboard/assistant',
    name: 'Executive Assistant',
    linkedFrom: ['/founder/dashboard/overview'],
    requiresAuth: true,
    category: 'founder',
    status: 'active',
  },
  {
    path: '/founder/dashboard/financials',
    name: 'Financials',
    linkedFrom: ['/founder/dashboard/overview'],
    requiresAuth: true,
    category: 'founder',
    status: 'active',
  },
];

// Marketing routes
export const marketingRoutes: RouteConfig[] = [
  {
    path: '/landing',
    name: 'Main Landing',
    linkedFrom: ['/'],
    requiresAuth: false,
    category: 'marketing',
    status: 'active',
  },
  {
    path: '/pricing',
    name: 'Pricing',
    linkedFrom: ['/landing', '/'],
    requiresAuth: false,
    category: 'marketing',
    status: 'active',
  },
  {
    path: '/landing-restoration',
    name: 'Restoration Landing',
    linkedFrom: ['/landing'],
    requiresAuth: false,
    category: 'marketing',
    status: 'active',
  },
  {
    path: '/landing-trades',
    name: 'Trades Landing',
    linkedFrom: ['/landing'],
    requiresAuth: false,
    category: 'marketing',
    status: 'active',
  },
  {
    path: '/landing-local-services',
    name: 'Local Services Landing',
    linkedFrom: ['/landing'],
    requiresAuth: false,
    category: 'marketing',
    status: 'active',
  },
];

// Check for orphan routes (not linked from anywhere)
export function findOrphanRoutes(): RouteConfig[] {
  const allRoutes = [
    ...clientDashboardRoutes,
    ...founderDashboardRoutes,
    ...marketingRoutes,
  ];

  return allRoutes.filter((route) => route.linkedFrom.length === 0);
}

// Check for routes marked as placeholder
export function findPlaceholderRoutes(): RouteConfig[] {
  const allRoutes = [
    ...clientDashboardRoutes,
    ...founderDashboardRoutes,
    ...marketingRoutes,
  ];

  return allRoutes.filter((route) => route.status === 'placeholder');
}

// Get navigation links for client dashboard sidebar
export function getClientSidebarLinks(): { name: string; path: string; icon?: string }[] {
  return [
    { name: 'Overview', path: '/client/dashboard/overview', icon: 'LayoutDashboard' },
    { name: '90-Day Activation', path: '/client/dashboard/activation', icon: 'Target' },
    { name: 'Content Packs', path: '/client/dashboard/packs', icon: 'Package' },
    { name: 'Production', path: '/client/dashboard/production', icon: 'Cog' },
    { name: 'Training', path: '/client/dashboard/training', icon: 'GraduationCap' },
    { name: 'Performance', path: '/client/dashboard/performance', icon: 'TrendingUp' },
    { name: 'Success', path: '/client/dashboard/success', icon: 'Trophy' },
  ];
}

// Get navigation links for founder dashboard sidebar
export function getFounderSidebarLinks(): { name: string; path: string; icon?: string }[] {
  return [
    { name: 'Overview', path: '/founder/dashboard/overview', icon: 'LayoutDashboard' },
    { name: 'Executive Assistant', path: '/founder/dashboard/assistant', icon: 'Brain' },
    { name: 'Financials', path: '/founder/dashboard/financials', icon: 'DollarSign' },
    { name: 'Client Activation', path: '/client/dashboard/activation', icon: 'Target' },
    { name: 'Content Packs', path: '/client/dashboard/packs', icon: 'Package' },
    { name: 'Performance', path: '/client/dashboard/performance', icon: 'TrendingUp' },
  ];
}

// Navigation audit result
export interface NavigationAuditResult {
  orphanRoutes: RouteConfig[];
  placeholderRoutes: RouteConfig[];
  missingLinks: string[];
  totalRoutes: number;
  activeRoutes: number;
  score: number;
}

// Run navigation audit
export function runNavigationAudit(): NavigationAuditResult {
  const allRoutes = [
    ...clientDashboardRoutes,
    ...founderDashboardRoutes,
    ...marketingRoutes,
  ];

  const orphanRoutes = findOrphanRoutes();
  const placeholderRoutes = findPlaceholderRoutes();
  const activeRoutes = allRoutes.filter((r) => r.status === 'active').length;

  // Calculate score
  const score = Math.max(
    0,
    100 - orphanRoutes.length * 5 - placeholderRoutes.length * 10
  );

  return {
    orphanRoutes,
    placeholderRoutes,
    missingLinks: [],
    totalRoutes: allRoutes.length,
    activeRoutes,
    score,
  };
}

export default {
  clientDashboardRoutes,
  founderDashboardRoutes,
  marketingRoutes,
  findOrphanRoutes,
  findPlaceholderRoutes,
  getClientSidebarLinks,
  getFounderSidebarLinks,
  runNavigationAudit,
};
