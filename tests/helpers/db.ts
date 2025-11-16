/**
 * Database Test Helpers
 * Utilities for mocking database operations in tests
 */

import { vi } from 'vitest';
import { TEST_USER, TEST_ORGANIZATION, TEST_WORKSPACE } from './auth';

/**
 * Mock contact data
 */
export const TEST_CONTACT = {
  id: 'test-contact-123',
  workspace_id: TEST_WORKSPACE.id,
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Example Corp',
  job_title: 'CTO',
  phone: '+1234567890',
  status: 'warm' as const,
  ai_score: 85,
  last_interaction: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mock email data
 */
export const TEST_EMAIL = {
  id: 'test-email-123',
  workspace_id: TEST_WORKSPACE.id,
  contact_id: TEST_CONTACT.id,
  subject: 'Test Email Subject',
  body: 'This is a test email body with some content.',
  from_email: TEST_CONTACT.email,
  to_email: TEST_USER.email,
  sent_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mock campaign data
 */
export const TEST_CAMPAIGN = {
  id: 'test-campaign-123',
  workspace_id: TEST_WORKSPACE.id,
  name: 'Test Campaign',
  description: 'Test campaign description',
  status: 'active' as const,
  created_by: TEST_USER.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Create mock Supabase query builder
 */
export function createMockQueryBuilder(data: any = [], error: any = null) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
    csv: vi.fn().mockResolvedValue({ data, error }),
    // Promise-like behavior for direct awaiting
    then: vi.fn((resolve) => resolve({ data, error })),
    catch: vi.fn(),
  };

  return queryBuilder;
}

/**
 * Mock Supabase client with common operations
 */
export function mockSupabaseClient(options: {
  contacts?: any[];
  emails?: any[];
  campaigns?: any[];
  error?: any;
} = {}) {
  const {
    contacts = [TEST_CONTACT],
    emails = [TEST_EMAIL],
    campaigns = [TEST_CAMPAIGN],
    error = null,
  } = options;

  return {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'contacts':
          return createMockQueryBuilder(contacts, error);
        case 'emails':
          return createMockQueryBuilder(emails, error);
        case 'campaigns':
          return createMockQueryBuilder(campaigns, error);
        default:
          return createMockQueryBuilder([], error);
      }
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: TEST_USER },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },
  };
}

/**
 * Create mock contact with custom properties
 */
export function createMockContact(overrides: Partial<typeof TEST_CONTACT> = {}) {
  return {
    ...TEST_CONTACT,
    id: `test-contact-${Math.random().toString(36).substring(7)}`,
    ...overrides,
  };
}

/**
 * Create multiple mock contacts
 */
export function createMockContacts(count: number, baseOverrides: Partial<typeof TEST_CONTACT> = {}) {
  return Array.from({ length: count }, (_, i) =>
    createMockContact({
      ...baseOverrides,
      name: `Test Contact ${i + 1}`,
      email: `contact${i + 1}@example.com`,
      ai_score: 50 + Math.floor(Math.random() * 50), // Random score 50-100
    })
  );
}

/**
 * Create mock email with custom properties
 */
export function createMockEmail(overrides: Partial<typeof TEST_EMAIL> = {}) {
  return {
    ...TEST_EMAIL,
    id: `test-email-${Math.random().toString(36).substring(7)}`,
    ...overrides,
  };
}

/**
 * Create mock campaign with custom properties
 */
export function createMockCampaign(overrides: Partial<typeof TEST_CAMPAIGN> = {}) {
  return {
    ...TEST_CAMPAIGN,
    id: `test-campaign-${Math.random().toString(36).substring(7)}`,
    ...overrides,
  };
}

/**
 * Clean up test data (for integration tests)
 */
export async function cleanupTestData(supabase: any, workspaceId: string) {
  // Delete in reverse order of dependencies
  await supabase.from('email_clicks').delete().eq('workspace_id', workspaceId);
  await supabase.from('email_opens').delete().eq('workspace_id', workspaceId);
  await supabase.from('emails').delete().eq('workspace_id', workspaceId);
  await supabase.from('campaign_execution_logs').delete().eq('workspace_id', workspaceId);
  await supabase.from('campaign_enrollments').delete().eq('workspace_id', workspaceId);
  await supabase.from('campaign_steps').delete().eq('workspace_id', workspaceId);
  await supabase.from('drip_campaigns').delete().eq('workspace_id', workspaceId);
  await supabase.from('campaigns').delete().eq('workspace_id', workspaceId);
  await supabase.from('contacts').delete().eq('workspace_id', workspaceId);
  await supabase.from('generatedContent').delete().eq('workspace_id', workspaceId);
}

/**
 * Wait for database operation to complete
 */
export async function waitForDbOperation(fn: () => Promise<any>, maxAttempts = 10) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const result = await fn();
      if (result) return result;
    } catch (error) {
      // Continue waiting
    }
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Database operation timeout');
}
