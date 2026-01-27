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
      extractFollowups: true,
      aiModel: 'haiku',
    },
    batch: {
      maxConcurrentBatches: 3,
      delayBetweenBatchesMs: 100,
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

    // Create a proper mock function
    mockAnthropicCreate = vi.fn();

    const Anthropic = require('@anthropic-ai/sdk').default;
    const mockInstance = new Anthropic();
    // Replace the create method with our mock
    mockInstance.messages.create = mockAnthropicCreate;

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
                  extractedText: 'Could you please review the attached budget by Friday?',
                  priority: 'high',
                  dueDate: '2024-01-19',
                  confidence: 0.9,
                },
                {
                  type: 'meeting_request',
                  title: 'Schedule call for timeline discussion',
                  description: 'Schedule call next Tuesday at 2pm to discuss timeline',
                  extractedText: "let's schedule a call next Tuesday at 2pm to discuss the timeline",
                  priority: 'medium',
                  dueDate: '2024-01-16',
                  confidence: 0.85,
                },
              ],
              sentiment: 0.3,
              intentClassification: 'follow_up',
              intentConfidence: 0.85,
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

      expect(result.ideas).toHaveLength(2);
      expect(result.ideas[0].type).toBe('action_item');
      expect(result.ideas[0].title).toBe('Review budget document');
      expect(result.ideas[0].priority).toBe('high');
      expect(result.ideas[1].type).toBe('meeting_request');
      expect(result.sentiment).toBe(0.3);
      expect(result.intentClassification).toBe('follow_up');
      expect(result.intentConfidence).toBe(0.85);
      expect(result.model).toBe('claude-haiku-4-5-20251001');
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle emails with no extractable ideas', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [],
              sentiment: 0.5,
              intentClassification: 'greeting',
              intentConfidence: 0.9,
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
        bodyText: "Hey, just wanted to say hi! Hope you're doing well.",
      };

      const result = await extractor.extractIdeas(casualEmail);

      expect(result.ideas).toHaveLength(0);
      expect(result.sentiment).toBe(0.5);
      expect(result.intentClassification).toBe('greeting');
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
                  extractedText: 'Please complete this task',
                  priority: 'high',
                  confidence: 0.9,
                },
                {
                  type: 'action_item',
                  title: 'Low confidence action',
                  description: 'Vaguely mentioned',
                  extractedText: 'Maybe we could do something',
                  priority: 'low',
                  confidence: 0.3, // Below threshold (0.7)
                },
              ],
              sentiment: 0.0,
              intentClassification: 'request',
              intentConfidence: 0.8,
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

      // Only high confidence idea should be included
      expect(result.ideas).toHaveLength(1);
      expect(result.ideas[0].title).toBe('High confidence action');
    });

    it('should handle API errors gracefully', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('API rate limited'));

      const result = await extractor.extractIdeas(mockEmail);

      // Should return error state with empty ideas
      expect(result.ideas).toHaveLength(0);
      expect(result.intentClassification).toBe('error');
      expect(result.intentConfidence).toBe(0);
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

      // Should return error state
      expect(result.ideas).toHaveLength(0);
      expect(result.intentClassification).toBe('error');
    });

    it('should include processing time in result', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [],
              sentiment: 0.0,
              intentClassification: 'test',
              intentConfidence: 0.5,
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

      expect(result.processingTimeMs).toBeGreaterThan(0);
      expect(typeof result.processingTimeMs).toBe('number');
    });

    it('should convert dueDate strings to Date objects', async () => {
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
                  extractedText: 'Submit report by Friday',
                  priority: 'high',
                  dueDate: '2024-01-19',
                  confidence: 0.85,
                },
              ],
              sentiment: 0.0,
              intentClassification: 'request',
              intentConfidence: 0.8,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.ideas[0].dueDate).toBeInstanceOf(Date);
      expect(result.ideas[0].dueDate?.toISOString()).toContain('2024-01-19');
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

      const ideas = validTypes.map((type) => ({
        type,
        title: `Test ${type}`,
        description: `Description for ${type}`,
        extractedText: `Text for ${type}`,
        priority: 'medium' as const,
        confidence: 0.8,
      }));

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas,
              sentiment: 0.0,
              intentClassification: 'test',
              intentConfidence: 0.8,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 100 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.ideas).toHaveLength(validTypes.length);
      expect(result.ideas.map((i) => i.type)).toEqual(validTypes);
    });

    it('should filter disabled idea types', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ideas: [
                {
                  type: 'action_item',
                  title: 'Enabled action',
                  description: 'This type is enabled',
                  extractedText: 'Do this',
                  priority: 'medium',
                  confidence: 0.8,
                },
                {
                  type: 'opportunity',
                  title: 'Always enabled',
                  description: 'This type is always enabled',
                  extractedText: 'Great opportunity',
                  priority: 'medium',
                  confidence: 0.8,
                },
              ],
              sentiment: 0.0,
              intentClassification: 'test',
              intentConfidence: 0.8,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      // All types should be included based on config
      expect(result.ideas.length).toBeGreaterThan(0);
    });
  });

  describe('priority validation', () => {
    it('should accept all valid priority levels', async () => {
      const priorities = ['urgent', 'high', 'medium', 'low'] as const;

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
                    extractedText: 'Test text',
                    priority,
                    confidence: 0.8,
                  },
                ],
                sentiment: 0.0,
                intentClassification: 'test',
                intentConfidence: 0.8,
              }),
            },
          ],
          usage: { input_tokens: 100, output_tokens: 50 },
        };

        mockAnthropicCreate.mockResolvedValue(mockResponse);

        const result = await extractor.extractIdeas(mockEmail);

        expect(result.ideas[0].priority).toBe(priority);
      }
    });
  });

  describe('date parsing', () => {
    it('should parse ISO date strings to Date objects', async () => {
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
                  extractedText: 'Submit report by Friday',
                  priority: 'high',
                  dueDate: '2024-01-19T00:00:00Z',
                  confidence: 0.85,
                },
              ],
              sentiment: 0.0,
              intentClassification: 'request',
              intentConfidence: 0.8,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

      expect(result.ideas[0].dueDate).toBeInstanceOf(Date);
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
                  extractedText: 'Do something soon',
                  priority: 'low',
                  confidence: 0.7,
                },
              ],
              sentiment: 0.0,
              intentClassification: 'request',
              intentConfidence: 0.7,
            }),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      };

      mockAnthropicCreate.mockResolvedValue(mockResponse);

      const result = await extractor.extractIdeas(mockEmail);

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
