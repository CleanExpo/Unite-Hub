/**
 * Email Idea Extractor Tests
 *
 * Tests for AI-powered email idea extraction.
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import EmailIdeaExtractor, {
  getEmailIdeaExtractor,
  EmailContent,
  ExtractionResult,
  ExtractedIdea,
} from '@/lib/emailIngestion/emailIdeaExtractor';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

// Mock the config
vi.mock('@config/emailIngestion.config', () => ({
  emailIngestionConfig: {
    aiExtraction: {
      enabled: true,
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 1024,
      confidenceThreshold: 0.6,
    },
    ideaExtraction: {
      enabled: true,
      minConfidence: 0.7,
      maxIdeasPerEmail: 5,
      extractActionItems: true,
      extractMeetingRequests: true,
      extractDeadlines: true,
      aiModel: 'haiku',
    },
  },
  getIdeaExtractionModel: vi.fn(() => 'claude-haiku-4-5-20251001'),
}));

describe('EmailIdeaExtractor', () => {
  let extractor: EmailIdeaExtractor;
  let mockAnthropicCreate: Mock;

  const mockEmail: EmailContent = {
    subject: 'Follow up on project proposal',
    fromEmail: 'john@example.com',
    fromName: 'John Doe',
    date: new Date('2024-01-15T10:00:00Z'),
    bodyText: `Hi Jane,

I wanted to follow up on our proposal discussion from last week.

Could you please review the attached budget by Friday?

Also, let's schedule a call next Tuesday at 2pm to discuss the timeline.

Thanks,
John`,
    isIncoming: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    const Anthropic = require('@anthropic-ai/sdk').default;
    const mockInstance = new Anthropic();
    mockAnthropicCreate = mockInstance.messages.create as Mock;

    extractor = new EmailIdeaExtractor();
    // Inject the mock
    (extractor as any).anthropic = mockInstance;
  });

  describe('extractIdeas', () => {
    it('should extract ideas from email content', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'action_item',
                  title: 'Review budget document',
                  description: 'Review the attached budget by Friday',
                  priority: 'high',
                  dueDate: '2024-01-19',
                  confidence: 0.9,
                },
                {
                  type: 'meeting_request',
                  title: 'Schedule call for timeline discussion',
                  description: 'Schedule call next Tuesday at 2pm to discuss timeline',
                  priority: 'medium',
                  dueDate: '2024-01-16',
                  confidence: 0.85,
                },
              ],
              summary: 'John is following up on a proposal discussion, requesting budget review and a meeting.',
              sentiment: 0.3,
            }),
          },
        ],
        usage: {
          input_tokens: 500,
          output_tokens: 200,
        },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(true);
      expect(result.ideas).toHaveLength(2);
      expect(result.ideas[0].type).toBe('action_item');
      expect(result.ideas[0].title).toBe('Review budget document');
      expect(result.ideas[0].priority).toBe('high');
      expect(result.ideas[1].type).toBe('meeting_request');
      expect(result.summary).toContain('following up');
      expect(result.sentiment).toBe(0.3);
    });

    it('should handle emails with no extractable ideas', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [],
              summary: 'Casual greeting email with no actionable items.',
              sentiment: 0.5,
            }),
          },
        ],
        usage: {
          input_tokens: 200,
          output_tokens: 50,
        },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const casualEmail: EmailContent = {
        ...mockEmail,
        subject: 'Quick hello',
        bodyText: 'Hey, just wanted to say hi! Hope you\'re doing well.',
      };

      const result = await extractor.extractIdeas(casualEmail);

      expect(result.success).toBe(true);
      expect(result.ideas).toHaveLength(0);
      expect(result.sentiment).toBe(0.5);
    });

    it('should filter ideas below confidence threshold', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'action_item',
                  title: 'High confidence action',
                  description: 'Clearly stated action',
                  priority: 'high',
                  confidence: 0.9,
                },
                {
                  type: 'action_item',
                  title: 'Low confidence action',
                  description: 'Vaguely mentioned',
                  priority: 'low',
                  confidence: 0.3, // Below threshold
                },
              ],
              summary: 'Test email',
              sentiment: 0.0,
            }),
          },
        ],
        usage: {
          input_tokens: 300,
          output_tokens: 100,
        },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(true);
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe('High confidence action');
    });

    it('should handle API errors gracefully', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('API rate limited'));

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limited');
      expect(result.ideas).toHaveLength(0);
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON { broken',
          },
        ],
        usage: {
          input_tokens: 200,
          output_tokens: 50,
        },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.ideas).toHaveLength(0);
    });

    it('should include token usage in result', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [],
              summary: 'Test',
              sentiment: 0.0,
            }),
          },
        ],
        usage: {
          input_tokens: 450,
          output_tokens: 125,
        },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.tokensUsed).toBe(575); // 450 + 125
    });
  });

  describe('idea type validation', () => {
    it('should accept all valid idea types', async () => {
      const validTypes = [
        'action_item',
        'meeting_request',
        'deadline',
        'follow_up',
        'opportunity',
        'concern',
        'feedback',
        'question',
        'decision_needed',
      ];

      const ideas = validTypes.map((type, i) => ({
        type,
        title: `Test ${type}`,
        description: `Description for ${type}`,
        priority: 'medium',
        confidence: 0.8,
      }));

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas,
              summary: 'Test email with all types',
              sentiment: 0.0,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 100 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(true);
      expect(result.ideas).toHaveLength(validTypes.length);
    });

    it('should handle unknown idea types', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'unknown_type',
                  title: 'Unknown action',
                  description: 'Some description',
                  priority: 'medium',
                  confidence: 0.8,
                },
              ],
              summary: 'Test',
              sentiment: 0.0,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      // Should map unknown types to 'action_item' as fallback
      expect(result.success).toBe(true);
      expect(result.ideas[0].type).toBe('action_item');
    });
  });

  describe('priority validation', () => {
    it('should accept all valid priority levels', async () => {
      const priorities = ['urgent', 'high', 'medium', 'low'];

      for (const priority of priorities) {
        const mockResponse = {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                ideas: [
                  {
                    type: 'action_item',
                    title: 'Test',
                    description: 'Test',
                    priority,
                    confidence: 0.8,
                  },
                ],
                summary: 'Test',
                sentiment: 0.0,
              }),
            },
          ],
          usage: { input_tokens: 100, output_tokens: 50 },
        };

        mockAnthropicCreate.mockResolvedValue(mockResponse);

        const result = await extractor.extractIdeas(mockEmail);

        expect(result.success).toBe(true);
        expect(result.ideas[0].priority).toBe(priority);
      }
    });
  });

  describe('date parsing', () => {
    it('should parse relative dates', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'deadline',
                  title: 'Submit report',
                  description: 'Submit by Friday',
                  priority: 'high',
                  dueDate: '2024-01-19',
                  confidence: 0.85,
                },
              ],
              summary: 'Report deadline',
              sentiment: 0.0,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(true);
      expect(result.ideas[0].dueDate).toBe('2024-01-19');
    });

    it('should handle missing due dates', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'action_item',
                  title: 'Do something',
                  description: 'No specific date',
                  priority: 'low',
                  confidence: 0.7,
                },
              ],
              summary: 'Test',
              sentiment: 0.0,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.success).toBe(true);
      expect(result.ideas[0].dueDate).toBeUndefined();
    });
  });
});

describe('getEmailIdeaExtractor singleton', () => {
  it('should return a singleton instance', () => {
    const instance1 = getEmailIdeaExtractor();
    const instance2 = getEmailIdeaExtractor();
    expect(instance1).toBeDefined();
    expect(instance1).toBeInstanceOf(EmailIdeaExtractor);
    expect(instance1).toBe(instance2); // Same instance
  });

  it('should have extractIdeas method', () => {
    const instance = getEmailIdeaExtractor();
    expect(typeof instance.extractIdeas).toBe('function');
  });
});
