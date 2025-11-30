/**
 * Route Definitions
 * Central registry of all application routes
 */

export const ROUTES = {
  // ============================================
  // Public Routes (No Auth Required)
  // ============================================
  public: {
    home: '/',
    pricing: '/pricing',
    features: '/features',
    about: '/about',
    contact: '/contact',
    blog: '/blog',
    login: '/login',
    signup: '/signup',
    register: '/register',
    forgotPassword: '/forgot-password',
    terms: '/terms',
    privacy: '/privacy',
    security: '/security',
    cookies: '/cookies',
    support: '/support',
    landing: '/landing',
    demo: '/modern-demo',
  },

  // ============================================
  // Auth Routes
  // ============================================
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    callback: '/auth/callback',
    implicitCallback: '/auth/implicit-callback',
    awaitApproval: '/auth/await-approval',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    clientLogin: '/client/login',
  },

  // ============================================
  // Staff Dashboard Routes
  // ============================================
  dashboard: {
    root: '/dashboard',
    overview: '/dashboard/overview',

    // Contacts & CRM
    contacts: '/dashboard/contacts',
    contactDetail: (id: string) => `/dashboard/contacts/${id}`,

    // Campaigns
    campaigns: '/dashboard/campaigns',
    campaignDetail: (id: string) => `/dashboard/campaigns/${id}`,
    campaignBuilder: '/dashboard/campaigns/builder',

    // Content
    content: '/dashboard/content',
    contentDetail: (id: string) => `/dashboard/content/${id}`,

    // Analytics
    analytics: '/dashboard/analytics',

    // Emails
    inbox: '/dashboard/inbox',

    // Settings
    settings: '/dashboard/settings',
    profile: '/dashboard/profile',
    billing: '/dashboard/billing',

    // Integrations
    integrations: '/dashboard/integrations',
    gmail: '/dashboard/gmail',
  },

  // ============================================
  // Staff Portal Routes
  // ============================================
  staff: {
    root: '/staff',
    dashboard: '/staff/dashboard',
    projects: '/staff/projects',
    projectDetail: (id: string) => `/staff/projects/${id}`,
    tasks: '/staff/tasks',
    reports: '/staff/reports',
    settings: '/staff/settings',
    activity: '/staff/activity',
    seo: '/staff/seo',
    seoEnhancement: '/staff/seo-enhancement',
    socialInbox: '/staff/social-inbox',
    searchSuite: '/staff/search-suite',
    browserAutomation: '/staff/browser-automation',
    ads: '/staff/ads',
    timeTracker: '/staff/time-tracker',
    onboardingAssistant: '/staff/onboarding-assistant',
    scopeReview: '/staff/scope-review',
    approvals: '/staff/approvals',
  },

  // ============================================
  // Client Portal Routes
  // ============================================
  client: {
    root: '/client',
    dashboard: '/client/dashboard',
    overview: '/client/dashboard/overview',
    projects: '/portal/projects',
    projectDetail: (id: string) => `/portal/projects/${id}`,
    messages: '/portal/messages',
    documents: '/portal/documents',
    invoices: '/portal/invoices',
    settings: '/portal/settings',

    // Additional client dashboard pages
    activation: '/client/dashboard/activation',
    approvals: '/client/dashboard/approvals',
    archive: '/client/dashboard/archive',
    capabilities: '/client/dashboard/capabilities',
    enhancements: '/client/dashboard/enhancements',
    packs: '/client/dashboard/packs',
    performance: '/client/dashboard/performance',
    production: '/client/dashboard/production',
    roadmap: '/client/dashboard/roadmap',
    success: '/client/dashboard/success',
    timeline: '/client/dashboard/timeline',
    training: '/client/dashboard/training',
    vision: '/client/dashboard/vision',
    visualIntelligence: '/client/dashboard/visual-intelligence',
  },

  // ============================================
  // Founder Routes
  // ============================================
  founder: {
    root: '/founder',
    dashboard: '/founder/dashboard',
    ops: '/founder/ops-hub',
    awareness: '/founder/awareness',
    cognitiveTwin: '/founder/cognitive-twin',
    memory: '/founder/memory-spine',
    mesh: '/founder/mesh',
    navigator: '/founder/navigator',
    orchestrator: '/founder/orchestrator',
    patterns: '/founder/patterns',
    playbooks: '/founder/playbooks',
    reasoning: '/founder/reasoning',
    roadmap: '/founder/roadmap',
    safety: '/founder/safety',
    settings: '/founder/settings',
    strategy: '/founder/strategy',
    synthex: '/founder/synthex-portfolio',
    seo: '/founder/seo',
    visualEngine: '/founder/visual-engine',
  },

  // ============================================
  // Synthex Routes
  // ============================================
  synthex: {
    root: '/synthex',
    dashboard: '/synthex/dashboard',
    onboarding: '/synthex/onboarding',
    billing: '/synthex/billing',
    settings: '/synthex/settings',
    help: '/synthex/help',
  },

  // ============================================
  // Admin Routes (Owner Only)
  // ============================================
  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    analytics: '/admin/analytics',
    settings: '/admin/settings',
    billing: '/admin/billing',
    approvalResult: '/admin/approval-result',
  },

  // ============================================
  // API Routes
  // ============================================
  api: {
    health: '/api/health',
    auth: {
      initialize: '/api/auth/initialize-user',
      session: '/api/auth/session',
    },
    contacts: '/api/contacts',
    campaigns: '/api/campaigns',
    content: '/api/content',
    agents: {
      orchestrator: '/api/agents/orchestrator',
      email: '/api/agents/email-intelligence',
      content: '/api/agents/content-personalization',
      contactIntelligence: '/api/agents/contact-intelligence',
    },
    seo: {
      audit: '/api/seo-enhancement/audit',
      content: '/api/seo-enhancement/content',
      schema: '/api/seo-enhancement/schema',
      ctr: '/api/seo-enhancement/ctr',
      competitors: '/api/seo-enhancement/competitors',
    },
  },
};

/**
 * Check if a route requires authentication
 */
export function requiresAuth(path: string): boolean {
  const publicPaths = [
    ...Object.values(ROUTES.public),
    ...Object.values(ROUTES.auth),
    '/api/health',
  ];

  return !publicPaths.some(publicPath =>
    path === publicPath || path.startsWith(publicPath + '/')
  );
}

/**
 * Check if a route is admin-only
 */
export function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin');
}

/**
 * Check if a route is a founder route
 */
export function isFounderRoute(path: string): boolean {
  return path.startsWith('/founder');
}

/**
 * Get the redirect path after login based on user role
 */
export function getPostLoginRedirect(role: 'owner' | 'staff' | 'client'): string {
  switch (role) {
    case 'owner':
      return ROUTES.founder.dashboard;
    case 'staff':
      return ROUTES.staff.dashboard;
    case 'client':
      return ROUTES.client.dashboard;
    default:
      return ROUTES.dashboard.overview;
  }
}

export default ROUTES;
