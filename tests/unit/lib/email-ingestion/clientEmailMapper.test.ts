/**
 * Client Email Mapper Tests
 *
 * Tests for mapping emails to CRM contacts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import ClientEmailMapper, {
  getClientEmailMapper,
} from '@/lib/emailIngestion/clientEmailMapper';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(async () => mockSupabaseClient),
}));

// Mock config
vi.mock('@config/emailIngestion.config', () => ({
  emailIngestionConfig: {
    clientMapping: {
      autoMapByEmail: true,
      autoMapByDomain: true,
      createUnmappedContacts: false,
      similarityThreshold: 0.5,
    },
  },
}));

describe('ClientEmailMapper', () => {
  let mapper: ClientEmailMapper;
  let mockSupabase: any;

  const mockContacts = [
    {
      id: 'contact-1',
      name: 'John Doe',
      email: 'john.doe@acme.com',
      company: 'Acme Corp',
      domain: 'acme.com',
      workspaceId: 'ws-123',
    },
    {
      id: 'contact-2',
      name: 'Jane Smith',
      email: 'jane@techco.io',
      company: 'TechCo',
      domain: 'techco.io',
      workspaceId: 'ws-123',
    },
    {
      id: 'contact-3',
      name: 'Bob Wilson',
      email: 'bob.wilson@acme.com',
      company: 'Acme Corp',
      domain: 'acme.com',
      workspaceId: 'ws-123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = mockSupabaseClient;
    mapper = new ClientEmailMapper();

    // Setup default mock response for contact loading
    mockSupabase.select.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: mockContacts,
        error: null,
      }),
    });
  });

  describe('mapEmailToClient', () => {
    it('should find exact email match', async () => {
      const result = await mapper.mapEmailToClient('ws-123', {
        name: 'John Doe',
        email: 'john.doe@acme.com',
      });

      expect(result.clientId).toBe('contact-1');
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('email_exact');
      expect(result.matchedContact?.name).toBe('John Doe');
    });

    it('should handle case-insensitive email matching', async () => {
      const result = await mapper.mapEmailToClient('ws-123', {
        name: 'John Doe',
        email: 'JOHN.DOE@ACME.COM',
      });

      expect(result.clientId).toBe('contact-1');
      expect(result.confidence).toBe(1.0);
      expect(result.method).toBe('email_exact');
    });

    it('should find domain match when no exact email', async () => {
      const result = await mapper.mapEmailToClient('ws-123', {
        name: 'Sarah Johnson',
        email: 'sarah@techco.io',
      });

      // Should match jane@techco.io by domain
      expect(result.clientId).toBe('contact-2');
      expect(result.method).toBe('domain_match');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return no match for unknown email and domain', async () => {
      const result = await mapper.mapEmailToClient('ws-123', {
        name: 'Unknown Person',
        email: 'unknown@nowhere.com',
      });

      expect(result.clientId).toBeNull();
      expect(result.method).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      });

      const result = await mapper.mapEmailToClient('ws-123', {
        name: 'Test',
        email: 'test@test.com',
      });

      expect(result.clientId).toBeNull();
      expect(result.method).toBe('none');
    });
  });

  describe('mapEmailsToClients', () => {
    it('should map multiple email addresses', async () => {
      const addresses = [
        { name: 'John Doe', email: 'john.doe@acme.com' },
        { name: 'Jane Smith', email: 'jane@techco.io' },
        { name: 'Unknown', email: 'unknown@test.com' },
      ];

      const result = await mapper.mapEmailsToClients('ws-123', addresses);

      expect(result.mappings.size).toBeGreaterThan(0);

      const johnMapping = result.mappings.get('john.doe@acme.com');
      expect(johnMapping?.clientId).toBe('contact-1');

      const janeMapping = result.mappings.get('jane@techco.io');
      expect(janeMapping?.clientId).toBe('contact-2');

      const unknownMapping = result.mappings.get('unknown@test.com');
      expect(unknownMapping?.clientId).toBeNull();
    });

    it('should handle empty addresses array', async () => {
      const result = await mapper.mapEmailsToClients('ws-123', []);

      expect(result.mappings.size).toBe(0);
      expect(result.newContacts).toHaveLength(0);
    });

    it('should deduplicate addresses by email', async () => {
      const addresses = [
        { name: 'John Doe', email: 'john.doe@acme.com' },
        { name: 'John D', email: 'john.doe@acme.com' }, // Same email, different name
      ];

      const result = await mapper.mapEmailsToClients('ws-123', addresses);

      // Should only map once per unique email
      expect(result.mappings.size).toBe(1);
    });
  });

  describe('getContactsByDomain', () => {
    it('should retrieve contacts by domain from cache', async () => {
      // loadCache will build domain cache from email addresses
      // Both john.doe@acme.com and bob.wilson@acme.com have domain acme.com
      const contacts = await mapper.getContactsByDomain('ws-123', 'acme.com');

      expect(contacts.length).toBeGreaterThanOrEqual(2);
      // All contacts should have acme.com domain
      contacts.forEach(contact => {
        expect(contact.email?.includes('@acme.com')).toBe(true);
      });
    });

    it('should return empty array for unknown domain', async () => {
      const contacts = await mapper.getContactsByDomain('ws-123', 'unknown.com');

      expect(contacts).toHaveLength(0);
    });

    it('should return contacts for techco.io domain', async () => {
      const contacts = await mapper.getContactsByDomain('ws-123', 'techco.io');

      expect(contacts).toHaveLength(1);
      expect(contacts[0].email).toBe('jane@techco.io');
    });
  });

  describe('caching', () => {
    it('should cache contacts after first load', async () => {
      // First call
      await mapper.mapEmailToClient('ws-123', {
        name: 'John Doe',
        email: 'john.doe@acme.com',
      });

      // Second call
      await mapper.mapEmailToClient('ws-123', {
        name: 'Jane Smith',
        email: 'jane@techco.io',
      });

      // Database should only be queried once for contacts
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    it('should support manual cache clearing', () => {
      mapper.clearCache();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

describe('getClientEmailMapper singleton', () => {
  it('should return a singleton instance', () => {
    const instance1 = getClientEmailMapper();
    const instance2 = getClientEmailMapper();

    expect(instance1).toBeDefined();
    expect(instance1).toBeInstanceOf(ClientEmailMapper);
    expect(instance1).toBe(instance2); // Same instance
  });

  it('should have required methods', () => {
    const mapper = getClientEmailMapper();

    expect(typeof mapper.mapEmailToClient).toBe('function');
    expect(typeof mapper.mapEmailsToClients).toBe('function');
    expect(typeof mapper.getContactsByDomain).toBe('function');
    expect(typeof mapper.clearCache).toBe('function');
  });
});
