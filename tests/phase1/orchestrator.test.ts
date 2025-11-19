/**
 * Phase 1 AI Orchestrator Tests
 * Tests for event routing and AI provider selection
 */

import { describe, it, expect } from 'vitest';
import { runAI } from '@/next/core/ai/orchestrator';

describe('Phase 1 AI Orchestrator', () => {
  describe('Event routing', () => {
    it('should route idea submission to Anthropic', async () => {
      const result = await runAI('idea_submitted', {
        ideaId: 'test-123',
        content: 'Build a mobile app for restaurant management',
      });

      expect(result.provider).toBe('anthropic');
      expect(result.success).toBe(true);
    });

    it('should route email intelligence to Gemini', async () => {
      const result = await runAI('email_received', {
        emailId: 'email-123',
        body: 'I would like to inquire about your services...',
      });

      expect(result.provider).toBe('gemini');
    });

    it('should route content generation to OpenRouter', async () => {
      const result = await runAI('content_requested', {
        contentType: 'blog_post',
        context: 'Write about AI trends in 2025',
      });

      expect(result.provider).toBe('openrouter');
    });
  });

  describe('Error handling', () => {
    it('should handle unknown event types gracefully', async () => {
      const result = await runAI('unknown_event' as any, {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
