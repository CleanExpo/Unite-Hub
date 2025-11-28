/**
 * Client Email Mapper Tests
 *
 * Tests for mapping emails to CRM contacts.
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  ClientEmailMapper,
  clientEmailMapper,
  EmailParticipant,
  MappingResult,
  Contact,
} from '@/lib/emailIngestion/clientEmailMapper';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

// Mock config
vi.mock('@/config/emailIngestion.config', () => ({
  emailIngestionConfig: {
    clientMapping: {
      exactEmailMatch: true,
      domainMatch: true,
      nameSimilarity: true,
      autoCreateUnmapped: false,
      similarityThreshold: 0.5,
    },
  },
}));

describe('ClientEmailMapper', () => {
  let mapper: ClientEmailMapper;
  let mockSupabase: any;

  const mockContacts: Contact[] = [
    {
      id: 'contact-1',
      name: 'John Doe',
      email: 'john.doe@acme.com',
      company: 'Acme Corp',
      workspace_id: 'ws-123',
    },
    {
      id: 'contact-2',
      name: 'Jane Smith',
      email: 'jane@techco.io',
      company: 'TechCo',
      workspace_id: 'ws-123',
    },
    {
      id: 'contact-3',
      name: 'Bob Wilson',
      email: 'bob.wilson@acme.com',
      company: 'Acme Corp',
      workspace_id: 'ws-123',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = require('@/lib/supabase').supabaseAdmin;
    mapper = new ClientEmailMapper();
  });

  describe('mapParticipantToClient', () => {
    it('should find exact email match', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockContacts[0],
        error: null,
      });

      const participant: EmailParticipant = {
        name: 'John Doe',
        email: 'john.doe@acme.com',
      };

      const result = await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(result.matched).toBe(true);
      expect(result.contact?.id).toBe('contact-1');
      expect(result.confidence).toBe(1.0);
      expect(result.matchType).toBe('exact_email');
    });

    it('should find domain match when no exact email', async () => {
      // First call for exact match returns null
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({
          data: mockContacts[0],
          error: null,
        });

      const participant: EmailParticipant = {
        name: 'Sarah Johnson',
        email: 'sarah@acme.com',
      };

      const result = await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(result.matched).toBe(true);
      expect(result.contact?.company).toBe('Acme Corp');
      expect(result.confidence).toBe(0.7);
      expect(result.matchType).toBe('domain');
    });

    it('should find name similarity match', async () => {
      // No exact match, no domain match
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      // Name search returns multiple contacts
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.ilike.mockResolvedValueOnce({
        data: [mockContacts[0]],
        error: null,
      });

      const participant: EmailParticipant = {
        name: 'John D.',
        email: 'jd@different.com',
      };

      const result = await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(result.matched).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.matchType).toBe('name_similarity');
    });

    it('should return unmatched for no matches', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.ilike.mockResolvedValue({ data: [], error: null });

      const participant: EmailParticipant = {
        name: 'Unknown Person',
        email: 'unknown@nowhere.com',
      };

      const result = await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(result.matched).toBe(false);
      expect(result.contact).toBeUndefined();
      expect(result.confidence).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const participant: EmailParticipant = {
        name: 'Test',
        email: 'test@test.com',
      };

      const result = await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(result.matched).toBe(false);
      expect(result.error).toContain('Database');
    });
  });

  describe('calculateNameSimilarity', () => {
    it('should return 1.0 for identical names', () => {
      const similarity = mapper.calculateNameSimilarity('John Doe', 'John Doe');
      expect(similarity).toBe(1.0);
    });

    it('should return 1.0 for case-insensitive identical names', () => {
      const similarity = mapper.calculateNameSimilarity('John Doe', 'JOHN DOE');
      expect(similarity).toBe(1.0);
    });

    it('should return high similarity for partial matches', () => {
      const similarity = mapper.calculateNameSimilarity('John D.', 'John Doe');
      expect(similarity).toBeGreaterThan(0.5);
    });

    it('should return low similarity for different names', () => {
      const similarity = mapper.calculateNameSimilarity('John Doe', 'Jane Smith');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should return 0 for empty names', () => {
      const similarity = mapper.calculateNameSimilarity('', '');
      expect(similarity).toBe(0);
    });

    it('should handle names with middle names', () => {
      const similarity = mapper.calculateNameSimilarity(
        'John Michael Doe',
        'John Doe'
      );
      expect(similarity).toBeGreaterThan(0.6);
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from email', () => {
      const domain = mapper.extractDomain('user@company.com');
      expect(domain).toBe('company.com');
    });

    it('should handle subdomains', () => {
      const domain = mapper.extractDomain('user@mail.company.com');
      expect(domain).toBe('mail.company.com');
    });

    it('should return empty string for invalid email', () => {
      const domain = mapper.extractDomain('invalid-email');
      expect(domain).toBe('');
    });

    it('should handle empty email', () => {
      const domain = mapper.extractDomain('');
      expect(domain).toBe('');
    });
  });

  describe('mapEmailParticipants', () => {
    it('should map multiple participants', async () => {
      // Setup mock responses
      mockSupabase.single
        .mockResolvedValueOnce({ data: mockContacts[0], error: null })
        .mockResolvedValueOnce({ data: mockContacts[1], error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.ilike.mockResolvedValue({ data: [], error: null });

      const participants: EmailParticipant[] = [
        { name: 'John Doe', email: 'john.doe@acme.com' },
        { name: 'Jane Smith', email: 'jane@techco.io' },
        { name: 'Unknown', email: 'unknown@test.com' },
      ];

      const results = await mapper.mapEmailParticipants(participants, 'ws-123');

      expect(results).toHaveLength(3);
      expect(results[0].matched).toBe(true);
      expect(results[1].matched).toBe(true);
      expect(results[2].matched).toBe(false);
    });

    it('should handle empty participants array', async () => {
      const results = await mapper.mapEmailParticipants([], 'ws-123');
      expect(results).toHaveLength(0);
    });

    it('should deduplicate participants by email', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockContacts[0],
        error: null,
      });

      const participants: EmailParticipant[] = [
        { name: 'John Doe', email: 'john.doe@acme.com' },
        { name: 'John D', email: 'john.doe@acme.com' }, // Same email, different name
      ];

      const results = await mapper.mapEmailParticipants(participants, 'ws-123');

      // Should only map once per unique email
      expect(results.filter((r) => r.matched).length).toBe(1);
    });
  });

  describe('batch operations', () => {
    it('should process large batches efficiently', async () => {
      // Generate 100 participants
      const participants: EmailParticipant[] = Array.from(
        { length: 100 },
        (_, i) => ({
          name: `Person ${i}`,
          email: `person${i}@test.com`,
        })
      );

      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.ilike.mockResolvedValue({ data: [], error: null });

      const startTime = Date.now();
      const results = await mapper.mapEmailParticipants(participants, 'ws-123');
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      // Should complete in reasonable time (under 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('caching', () => {
    it('should cache mapping results', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockContacts[0],
        error: null,
      });

      const participant: EmailParticipant = {
        name: 'John Doe',
        email: 'john.doe@acme.com',
      };

      // First call
      await mapper.mapParticipantToClient(participant, 'ws-123');

      // Second call with same email
      await mapper.mapParticipantToClient(participant, 'ws-123');

      // Should only call database once due to caching
      expect(mockSupabase.single).toHaveBeenCalledTimes(1);
    });

    it('should respect cache TTL', async () => {
      vi.useFakeTimers();

      mockSupabase.single.mockResolvedValue({
        data: mockContacts[0],
        error: null,
      });

      const participant: EmailParticipant = {
        name: 'John Doe',
        email: 'john.doe@acme.com',
      };

      // First call
      await mapper.mapParticipantToClient(participant, 'ws-123');

      // Advance time past cache TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Second call should hit database again
      await mapper.mapParticipantToClient(participant, 'ws-123');

      expect(mockSupabase.single).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});

describe('clientEmailMapper singleton', () => {
  it('should export a singleton instance', () => {
    expect(clientEmailMapper).toBeDefined();
    expect(clientEmailMapper).toBeInstanceOf(ClientEmailMapper);
  });

  it('should have required methods', () => {
    expect(typeof clientEmailMapper.mapParticipantToClient).toBe('function');
    expect(typeof clientEmailMapper.mapEmailParticipants).toBe('function');
    expect(typeof clientEmailMapper.calculateNameSimilarity).toBe('function');
    expect(typeof clientEmailMapper.extractDomain).toBe('function');
  });
});
