/**
 * Unit Tests for Contact Intelligence Agent
 * Tests AI-powered contact scoring and analysis
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyzeContactIntelligence } from '@/lib/agents/contact-intelligence';
import { TEST_WORKSPACE } from '../../helpers/auth';
import { createMockContact, createMockEmail } from '../../helpers/db';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          id: 'msg_test123',
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                engagement_score: 85,
                buying_intent: 'high',
                decision_stage: 'consideration',
                role_type: 'decision_maker',
                next_best_action: 'Schedule product demo',
                risk_signals: ['Budget concerns mentioned'],
                opportunity_signals: ['Actively comparing solutions', 'Timeline in next quarter'],
                engagement_velocity: 1,
                sentiment_score: 75,
              }),
            },
          ],
          model: 'claude-opus-4-1-20250805',
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 1000,
            output_tokens: 200,
          },
        }),
      },
    })),
  };
});

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    contacts: {
      getById: vi.fn(),
    },
    emails: {
      getByContact: vi.fn(),
    },
    interactions: {
      getByContact: vi.fn(),
    },
  },
}));

describe('Contact Intelligence Agent', () => {
  const mockContact = createMockContact({
    id: 'contact-123',
    workspace_id: TEST_WORKSPACE.id,
    name: 'John Smith',
    company: 'TechCorp',
    job_title: 'VP Engineering',
    ai_score: 70,
    status: 'warm',
  });

  const mockEmails = [
    createMockEmail({
      contact_id: 'contact-123',
      subject: 'Re: Product inquiry',
      body: 'Thanks for the information. We are actively looking for a solution like this.',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    }),
    createMockEmail({
      contact_id: 'contact-123',
      subject: 'Budget and timeline',
      body: 'What are the pricing options? We would need to implement in Q1.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    const { db } = require('@/lib/db');
    db.contacts.getById.mockResolvedValue(mockContact);
    db.emails.getByContact.mockResolvedValue(mockEmails);
    db.interactions.getByContact.mockResolvedValue([]);
  });

  it('should analyze contact and return intelligence data', async () => {
    const result = await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(result).toBeDefined();
    expect(result.engagement_score).toBeGreaterThanOrEqual(0);
    expect(result.engagement_score).toBeLessThanOrEqual(100);
    expect(result.buying_intent).toMatch(/^(high|medium|low|unknown)$/);
    expect(result.decision_stage).toMatch(/^(awareness|consideration|decision|unknown)$/);
    expect(result.role_type).toMatch(/^(decision_maker|influencer|end_user|unknown)$/);
    expect(result.next_best_action).toBeTruthy();
    expect(Array.isArray(result.risk_signals)).toBe(true);
    expect(Array.isArray(result.opportunity_signals)).toBe(true);
  });

  it('should call Anthropic API with correct parameters', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockInstance = new Anthropic({ apiKey: 'test' });

    await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(mockInstance.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-opus-4-1-20250805',
        thinking: expect.objectContaining({
          type: 'enabled',
          budget_tokens: 10000,
        }),
      })
    );
  });

  it('should use prompt caching for system instructions', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockInstance = new Anthropic({ apiKey: 'test' });

    await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(mockInstance.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            cache_control: { type: 'ephemeral' },
          }),
        ]),
      })
    );
  });

  it('should handle contact with no emails', async () => {
    const { db } = require('@/lib/db');
    db.emails.getByContact.mockResolvedValue([]);

    const result = await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(result).toBeDefined();
    expect(result.engagement_score).toBeDefined();
  });

  it('should calculate engagement velocity correctly', async () => {
    const recentEmails = Array.from({ length: 5 }, (_, i) =>
      createMockEmail({
        created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      })
    );

    const { db } = require('@/lib/db');
    db.emails.getByContact.mockResolvedValue(recentEmails);

    const result = await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(result.engagement_velocity).toBeGreaterThan(0);
  });

  it('should throw error if contact not found', async () => {
    const { db } = require('@/lib/db');
    db.contacts.getById.mockResolvedValue(null);

    await expect(
      analyzeContactIntelligence('nonexistent-contact', TEST_WORKSPACE.id)
    ).rejects.toThrow('Contact nonexistent-contact not found');
  });

  it('should handle API errors gracefully', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockInstance = new Anthropic({ apiKey: 'test' });

    mockInstance.messages.create.mockRejectedValue(new Error('API Error'));

    await expect(
      analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id)
    ).rejects.toThrow();
  });

  it('should parse JSON response from Claude correctly', async () => {
    const result = await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(result.engagement_score).toBe(85);
    expect(result.buying_intent).toBe('high');
    expect(result.decision_stage).toBe('consideration');
    expect(result.role_type).toBe('decision_maker');
    expect(result.sentiment_score).toBe(75);
  });

  it('should include recent email history in analysis', async () => {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockInstance = new Anthropic({ apiKey: 'test' });

    await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    const callArgs = mockInstance.messages.create.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === 'user');

    expect(userMessage.content).toContain('Product inquiry');
    expect(userMessage.content).toContain('Budget and timeline');
  });

  it('should respect workspace isolation', async () => {
    const { db } = require('@/lib/db');

    await analyzeContactIntelligence('contact-123', TEST_WORKSPACE.id);

    expect(db.contacts.getById).toHaveBeenCalledWith('contact-123');
    expect(db.emails.getByContact).toHaveBeenCalledWith('contact-123');
  });
});
