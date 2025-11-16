/**
 * Test Data Fixtures
 * Centralized test data for consistent testing
 */

// Re-export all helpers for convenience
export * from '../helpers/auth';
export * from '../helpers/db';
export * from '../helpers/api';

/**
 * Common test scenarios
 */
export const scenarios = {
  /**
   * New user first login scenario
   */
  newUserFirstLogin: {
    user: {
      id: 'new-user-001',
      email: 'newuser@unite-hub.com',
      created_at: new Date().toISOString(),
    },
    expectation: 'Should create profile, organization, and workspace',
  },

  /**
   * Existing user with organization
   */
  existingUserWithOrg: {
    user: {
      id: 'existing-user-001',
      email: 'existing@unite-hub.com',
    },
    organization: {
      id: 'org-001',
      name: 'Existing Org',
    },
    workspace: {
      id: 'workspace-001',
      name: 'Main Workspace',
    },
  },

  /**
   * Hot lead contact
   */
  hotLeadContact: {
    ai_score: 85,
    status: 'hot',
    engagement_velocity: 2,
    last_interaction: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },

  /**
   * Cold lead contact
   */
  coldLeadContact: {
    ai_score: 30,
    status: 'cold',
    engagement_velocity: -1,
    last_interaction: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },

  /**
   * Active campaign
   */
  activeCampaign: {
    status: 'active',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    sent_count: 100,
    open_rate: 0.45,
    click_rate: 0.12,
  },

  /**
   * Draft campaign
   */
  draftCampaign: {
    status: 'draft',
    created_at: new Date().toISOString(),
    sent_count: 0,
    open_rate: 0,
    click_rate: 0,
  },
};

/**
 * Sample email templates
 */
export const emailTemplates = {
  inquiry: {
    subject: 'Product Inquiry',
    body: 'I am interested in learning more about your product. Could you provide more information?',
    sentiment: 'positive',
    intent: 'product_inquiry',
  },

  pricing: {
    subject: 'Pricing Question',
    body: 'What are your pricing options? We are considering a solution for our team of 50 people.',
    sentiment: 'neutral',
    intent: 'pricing_inquiry',
  },

  demo: {
    subject: 'Demo Request',
    body: 'We would like to schedule a demo. When would be a good time?',
    sentiment: 'positive',
    intent: 'demo_request',
  },

  objection: {
    subject: 'Budget Concerns',
    body: 'The pricing seems higher than expected. Do you offer any discounts?',
    sentiment: 'neutral',
    intent: 'objection',
  },

  ready_to_buy: {
    subject: 'Ready to Proceed',
    body: 'We have approval from our team. How do we get started?',
    sentiment: 'very_positive',
    intent: 'ready_to_buy',
  },
};

/**
 * Error scenarios
 */
export const errorScenarios = {
  unauthorized: {
    status: 401,
    error: 'Unauthorized',
    message: 'Authentication required',
  },

  forbidden: {
    status: 403,
    error: 'Forbidden',
    message: 'You do not have permission to access this resource',
  },

  notFound: {
    status: 404,
    error: 'Not Found',
    message: 'Resource not found',
  },

  rateLimited: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: 60,
  },

  serverError: {
    status: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  },

  databaseError: {
    code: 'PGRST116',
    message: 'Database connection failed',
    details: 'Could not connect to database',
  },
};

/**
 * Workspace isolation test data
 */
export const workspaceIsolation = {
  workspace1: {
    id: 'workspace-alpha-001',
    name: 'Workspace Alpha',
    contactCount: 50,
  },

  workspace2: {
    id: 'workspace-beta-002',
    name: 'Workspace Beta',
    contactCount: 30,
  },

  // Contact that should NOT be accessible from workspace1
  workspace2Contact: {
    id: 'contact-beta-001',
    workspace_id: 'workspace-beta-002',
    name: 'Isolated Contact',
  },
};

/**
 * Performance test data
 */
export const performanceData = {
  smallDataset: {
    contactCount: 10,
    emailCount: 50,
  },

  mediumDataset: {
    contactCount: 100,
    emailCount: 500,
  },

  largeDataset: {
    contactCount: 1000,
    emailCount: 5000,
  },

  stressDataset: {
    contactCount: 10000,
    emailCount: 50000,
  },
};

/**
 * AI response fixtures
 */
export const aiResponses = {
  contactIntelligence: {
    engagement_score: 85,
    buying_intent: 'high',
    decision_stage: 'consideration',
    role_type: 'decision_maker',
    next_best_action: 'Schedule product demo with decision makers',
    risk_signals: ['Budget concerns mentioned', 'Comparing with competitors'],
    opportunity_signals: [
      'Active timeline in next quarter',
      'Multiple stakeholders engaged',
      'Technical validation completed',
    ],
    engagement_velocity: 1,
    sentiment_score: 75,
  },

  contentGeneration: {
    subject: 'Re: Your inquiry about our enterprise solution',
    body: 'Thank you for your interest in our platform...',
    tone: 'professional',
    personalization_score: 0.85,
  },

  emailIntent: {
    intent: 'product_inquiry',
    confidence: 0.92,
    sentiment: 'positive',
    urgency: 'medium',
  },
};

/**
 * Date helpers for testing
 */
export const dates = {
  now: () => new Date(),
  yesterday: () => new Date(Date.now() - 24 * 60 * 60 * 1000),
  lastWeek: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  lastMonth: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  nextWeek: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  nextMonth: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};
