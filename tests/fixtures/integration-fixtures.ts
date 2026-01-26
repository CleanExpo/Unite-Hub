/**
 * Integration Test Fixtures
 * Common test data for integration tests
 */

import { TEST_CONTACT } from '../helpers/db';

/**
 * Workspace Isolation Fixtures
 * Used to test that data is properly scoped to workspaces
 */
export const workspaceIsolation = {
  workspace1: {
    id: 'workspace-isolation-test-1',
    name: 'Workspace 1 (Isolation Test)',
    market: 'ANZ_SMB',
    region: 'AU-SE1',
    status: 'active' as const,
  },
  workspace2: {
    id: 'workspace-isolation-test-2',
    name: 'Workspace 2 (Isolation Test)',
    market: 'ANZ_SMB',
    region: 'AU-SE1',
    status: 'active' as const,
  },
};

/**
 * Authentication Test Fixtures
 */
export const authFixtures = {
  validUser: {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STAFF' as const,
  },
  adminUser: {
    id: 'admin-user-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN' as const,
  },
  clientUser: {
    id: 'client-user-123',
    email: 'client@example.com',
    name: 'Client User',
    role: 'CLIENT' as const,
  },
};

/**
 * API Test Fixtures
 */
export const apiFixtures = {
  successResponse: {
    success: true,
    message: 'Operation successful',
  },
  errorResponse: {
    success: false,
    error: 'Operation failed',
  },
  unauthorizedResponse: {
    success: false,
    error: 'Unauthorized',
    status: 401,
  },
  forbiddenResponse: {
    success: false,
    error: 'Forbidden',
    status: 403,
  },
};

/**
 * Contact Test Fixtures
 */
export const contactFixtures = {
  validContact: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Example Corp',
    job_title: 'CTO',
    phone: '+1234567890',
    status: 'warm' as const,
  },
  highScoreContact: {
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Enterprise Inc',
    job_title: 'CEO',
    phone: '+0987654321',
    status: 'hot' as const,
    ai_score: 95,
  },
};

/**
 * Campaign Test Fixtures
 */
export const campaignFixtures = {
  validCampaign: {
    name: 'Test Campaign',
    description: 'Test campaign description',
    type: 'drip' as const,
    status: 'draft' as const,
  },
  activeCampaign: {
    name: 'Active Campaign',
    description: 'Running campaign',
    type: 'drip' as const,
    status: 'active' as const,
  },
};

/**
 * Autonomy Test Fixtures
 */
export const autonomyFixtures = {
  seoConfig: {
    id: 'test-seo-config-123',
    client_id: TEST_CONTACT.workspace_id,
    enabled: true,
    max_risk_level_allowed: 'MEDIUM',
    auto_approve_low_risk: true,
    created_at: new Date().toISOString(),
  },
  proposalPending: {
    id: 'test-proposal-uuid',
    client_id: TEST_CONTACT.workspace_id,
    type: 'SEO_OPTIMIZATION',
    risk_level: 'LOW',
    status: 'PENDING',
    description: 'Test SEO proposal',
    created_at: new Date().toISOString(),
  },
};
