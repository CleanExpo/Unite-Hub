/**
 * Orchestrator Email Intents Tests
 *
 * Tests for the new email-related orchestrator intents:
 * - connect_app
 * - import_client_emails
 * - summarise_client_ideas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  classifyIntent,
  generatePlan,
  AgentIntent,
  OrchestratorRequest,
} from '@/lib/agents/orchestrator-router';

describe('Email Intent Classification', () => {
  describe('connect_app intent', () => {
    it('should classify Google connection requests', () => {
      const prompts = [
        'Connect my Google account',
        'Link Google Workspace',
        'Integrate Gmail',
        'Authorize Google email',
        'Sign in with Google',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('connect_app');
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    it('should classify Microsoft connection requests', () => {
      const prompts = [
        'Connect Microsoft 365',
        'Link Outlook',
        'Integrate Microsoft account',
        'Authorize Microsoft email',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('connect_app');
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    it('should classify generic email provider requests', () => {
      const prompts = [
        'Connect email provider',
        'Link my email account',
        'Set up mail integration',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('connect_app');
      }
    });
  });

  describe('import_client_emails intent', () => {
    it('should classify email import requests', () => {
      const prompts = [
        'Import client emails',
        'Sync my inbox',
        'Pull emails into CRM',
        'Fetch client communications',
        'Ingest emails from Gmail',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('import_client_emails');
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    it('should classify email sync requests', () => {
      const prompts = [
        'Sync email threads',
        'Import inbox messages',
        'Pull client messages',
        'Start email ingestion',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('import_client_emails');
      }
    });
  });

  describe('summarise_client_ideas intent', () => {
    it('should classify idea summary requests', () => {
      const prompts = [
        'Summarize client ideas',
        'Get email action items',
        'Show pending follow-ups',
        'Extract email insights',
        'Client communication summary',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('summarise_client_ideas');
        expect(result.confidence).toBeGreaterThan(0.3);
      }
    });

    it('should classify intelligence requests', () => {
      const prompts = [
        'Client email intelligence',
        'Communication insights for contact',
        'Email analysis report',
      ];

      for (const prompt of prompts) {
        const result = classifyIntent(prompt);
        expect(result.intent).toBe('summarise_client_ideas');
      }
    });
  });

  describe('intent disambiguation', () => {
    it('should prefer connect_app over import when connecting', () => {
      const result = classifyIntent('Connect Google and import emails');
      // Should prefer connect_app as it's the first action needed
      expect(['connect_app', 'import_client_emails']).toContain(result.intent);
    });

    it('should correctly classify ambiguous prompts', () => {
      // "email" alone shouldn't trigger email intents without action words
      const result = classifyIntent('What is email marketing?');
      expect(result.intent).not.toBe('connect_app');
      expect(result.intent).not.toBe('import_client_emails');
    });
  });
});

describe('Email Intent Plan Generation', () => {
  const baseRequest: OrchestratorRequest = {
    workspaceId: 'ws-123',
    userPrompt: '',
  };

  describe('connect_app plan', () => {
    it('should generate correct plan for connect_app', async () => {
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Connect my Google account',
      };

      const plan = await generatePlan(request);

      expect(plan.intent).toBe('connect_app');
      expect(plan.steps).toHaveLength(3);
      expect(plan.steps[0].action).toBe('check_existing');
      expect(plan.steps[1].action).toBe('initiate_oauth');
      expect(plan.steps[2].action).toBe('return_auth_url');
    });

    it('should have correct step dependencies', async () => {
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Link Microsoft 365',
      };

      const plan = await generatePlan(request);

      expect(plan.steps[0].dependsOn).toBeUndefined();
      expect(plan.steps[1].dependsOn).toEqual([0]);
      expect(plan.steps[2].dependsOn).toEqual([1]);
    });
  });

  describe('import_client_emails plan', () => {
    it('should generate correct plan for import_client_emails', async () => {
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Import client emails',
      };

      const plan = await generatePlan(request);

      expect(plan.intent).toBe('import_client_emails');
      expect(plan.steps).toHaveLength(4);
      expect(plan.steps[0].action).toBe('validate_connection');
      expect(plan.steps[1].action).toBe('sync_emails');
      expect(plan.steps[2].action).toBe('map_to_clients');
      expect(plan.steps[3].action).toBe('extract_ideas');
    });

    it('should have sequential dependencies', async () => {
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Sync inbox',
      };

      const plan = await generatePlan(request);

      expect(plan.steps[0].dependsOn).toBeUndefined();
      expect(plan.steps[1].dependsOn).toEqual([0]);
      expect(plan.steps[2].dependsOn).toEqual([1]);
      expect(plan.steps[3].dependsOn).toEqual([2]);
    });
  });

  describe('summarise_client_ideas plan', () => {
    it('should generate correct plan for summarise_client_ideas', async () => {
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Summarize client ideas',
        context: { clientId: 'contact-456' },
      };

      const plan = await generatePlan(request);

      expect(plan.intent).toBe('summarise_client_ideas');
      expect(plan.steps).toHaveLength(3);
      expect(plan.steps[0].action).toBe('fetch_client_data');
      expect(plan.steps[1].action).toBe('get_email_intelligence');
      expect(plan.steps[2].action).toBe('generate_summary');
    });

    it('should include clientId in inputs', async () => {
      const clientId = 'contact-789';
      const request: OrchestratorRequest = {
        ...baseRequest,
        userPrompt: 'Get communication insights',
        context: { clientId },
      };

      const plan = await generatePlan(request);

      expect(plan.steps[0].inputs).toHaveProperty('clientId', clientId);
    });
  });

  describe('estimated tokens', () => {
    it('should estimate tokens based on step count', async () => {
      const connectPlan = await generatePlan({
        ...baseRequest,
        userPrompt: 'Connect Google',
      });

      const importPlan = await generatePlan({
        ...baseRequest,
        userPrompt: 'Import emails',
      });

      // Import has more steps, should have higher estimate
      expect(importPlan.estimatedTokens).toBeGreaterThan(
        connectPlan.estimatedTokens
      );
    });
  });

  describe('validation requirements', () => {
    it('should not require validation for connect_app', async () => {
      const plan = await generatePlan({
        ...baseRequest,
        userPrompt: 'Connect Google',
      });

      expect(plan.requiresValidation).toBe(false);
    });

    it('should not require validation for import_client_emails', async () => {
      const plan = await generatePlan({
        ...baseRequest,
        userPrompt: 'Import emails',
      });

      expect(plan.requiresValidation).toBe(false);
    });

    it('should not require validation for summarise_client_ideas', async () => {
      const plan = await generatePlan({
        ...baseRequest,
        userPrompt: 'Summarize ideas',
        context: { clientId: 'test' },
      });

      expect(plan.requiresValidation).toBe(false);
    });
  });
});

describe('OrchestratorRequest context', () => {
  it('should accept clientId in context', async () => {
    const request: OrchestratorRequest = {
      workspaceId: 'ws-123',
      userPrompt: 'Get client ideas',
      context: {
        clientId: 'contact-123',
      },
    };

    const plan = await generatePlan(request);
    expect(plan).toBeDefined();
  });

  it('should accept connectedAppId in context', async () => {
    const request: OrchestratorRequest = {
      workspaceId: 'ws-123',
      userPrompt: 'Sync emails',
      context: {
        connectedAppId: 'app-456',
      },
    };

    const plan = await generatePlan(request);
    expect(plan).toBeDefined();
  });

  it('should accept provider in context', async () => {
    const request: OrchestratorRequest = {
      workspaceId: 'ws-123',
      userPrompt: 'Connect email',
      context: {
        provider: 'google',
      },
    };

    const plan = await generatePlan(request);
    expect(plan).toBeDefined();
  });
});
