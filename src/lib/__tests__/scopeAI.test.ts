/**
 * Tests for scopeAI (Phase 3 Step 3)
 *
 * These tests verify the hybrid AI scope generation engine.
 * Real API tests require OPENROUTER_API_KEY - run manually or in CI.
 */

import { describe, it, expect } from 'vitest';
import { ScopeAI } from '../ai/scopeAI';
import type { ClientIdea } from '../projects/scope-planner';

describe('ScopeAI Hybrid Engine', () => {
  const mockIdea: ClientIdea = {
    id: 'test-idea-123',
    organizationId: 'org-test-456',
    clientId: 'client-test-789',
    title: 'Build a Professional Website',
    description: 'I need a modern, responsive website for my consulting business with contact forms and portfolio showcase.',
    createdAt: new Date().toISOString(),
  };

  const mockContext = {
    organizationId: 'org-test-456',
    workspaceId: 'workspace-test-789',
    clientId: 'client-test-789',
    userEmail: 'staff@unite-group.in',
  };

  describe('Class Structure', () => {
    it('should expose required methods', () => {
      expect(ScopeAI.generateHybridScope).toBeTypeOf('function');
      expect(ScopeAI.prompts).toBeTypeOf('object');
    });

    it('should have all prompt templates', () => {
      expect(ScopeAI.prompts.initialDraft).toBeTypeOf('function');
      expect(ScopeAI.prompts.structureCheck).toBeTypeOf('function');
      expect(ScopeAI.prompts.pricingAndEffort).toBeTypeOf('function');
      expect(ScopeAI.prompts.finalAudit).toBeTypeOf('function');
    });
  });

  describe('Prompt Generation', () => {
    it('should generate initial draft prompt with idea details', () => {
      const prompt = ScopeAI.prompts.initialDraft(mockIdea);

      expect(prompt).toContain(mockIdea.title);
      expect(prompt).toContain(mockIdea.description);
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('Good/Better/Best');
    });

    it('should generate structure check prompt', () => {
      const draftOutput = '{"sections": [], "packages": []}';
      const prompt = ScopeAI.prompts.structureCheck(draftOutput, mockIdea);

      expect(prompt).toContain(draftOutput);
      expect(prompt).toContain('Validate');
      expect(prompt).toContain('JSON');
    });

    it('should generate pricing prompt', () => {
      const structuredOutput = '{"sections": [], "packages": [{"tier": "good"}]}';
      const prompt = ScopeAI.prompts.pricingAndEffort(structuredOutput, mockIdea);

      expect(prompt).toContain(structuredOutput);
      expect(prompt).toContain('estimatedHours');
      expect(prompt).toContain('pricing');
    });

    it('should generate final audit prompt', () => {
      const pricingOutput = '{"sections": [], "packages": [{"tier": "good", "estimatedHours": 40}]}';
      const prompt = ScopeAI.prompts.finalAudit(pricingOutput, mockIdea);

      expect(prompt).toContain(pricingOutput);
      expect(prompt).toContain('FINAL VALIDATOR');
      expect(prompt).toContain('PERFECT');
    });
  });

  describe('Prompt Templates Structure', () => {
    it('should include all required sections in initial draft prompt', () => {
      const prompt = ScopeAI.prompts.initialDraft(mockIdea);

      expect(prompt).toContain('Project Overview');
      expect(prompt).toContain('Project Objectives');
      expect(prompt).toContain('Key Deliverables');
      expect(prompt).toContain('Assumptions & Constraints');
    });

    it('should include all package tiers in initial draft prompt', () => {
      const prompt = ScopeAI.prompts.initialDraft(mockIdea);

      expect(prompt).toContain('"tier": "good"');
      expect(prompt).toContain('"tier": "better"');
      expect(prompt).toContain('"tier": "best"');
    });

    it('should enforce JSON-only output in all prompts', () => {
      const idea = mockIdea;
      const draft = '{}';

      expect(ScopeAI.prompts.initialDraft(idea)).toContain('Output ONLY valid JSON');
      expect(ScopeAI.prompts.structureCheck(draft, idea)).toContain('Return ONLY');
      expect(ScopeAI.prompts.pricingAndEffort(draft, idea)).toContain('Return ONLY');
      expect(ScopeAI.prompts.finalAudit(draft, idea)).toContain('Output ONLY valid JSON');
    });
  });

  describe('Integration Tests (requires OPENROUTER_API_KEY)', () => {
    // Skip if API key not configured or if running in CI/test mode
    const isConfigured = !!process.env.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'test' && !process.env.CI;

    it.skipIf(!isConfigured)('should generate complete scope via hybrid pipeline', async () => {
      const scope = await ScopeAI.generateHybridScope(mockIdea, mockContext);

      // Verify structure
      expect(scope).toBeDefined();
      expect(scope.idea).toEqual(mockIdea);
      expect(scope.sections).toBeInstanceOf(Array);
      expect(scope.packages).toBeInstanceOf(Array);

      // Verify sections
      expect(scope.sections.length).toBeGreaterThan(0);
      scope.sections.forEach((section) => {
        expect(section.id).toBeDefined();
        expect(section.title).toBeDefined();
        expect(section.description).toBeDefined();
      });

      // Verify packages
      expect(scope.packages.length).toBe(3); // Good, Better, Best
      const tiers = scope.packages.map((p) => p.tier);
      expect(tiers).toContain('good');
      expect(tiers).toContain('better');
      expect(tiers).toContain('best');

      // Verify metadata
      expect(scope.metadata).toBeDefined();
      expect(scope.metadata?.generatedAt).toBeDefined();
      expect(scope.metadata?.totalCost).toBeGreaterThan(0);
      expect(scope.metadata?.totalTokens).toBeGreaterThan(0);
      expect(scope.metadata?.pipelineStages).toBe(4);
    }, 60000); // 60 second timeout for API calls

    it.skipIf(!isConfigured)('should track costs for all pipeline stages', async () => {
      const scope = await ScopeAI.generateHybridScope(mockIdea, mockContext);

      // Verify cost tracking metadata
      expect(scope.metadata?.totalCost).toBeGreaterThan(0);
      expect(scope.metadata?.totalTokens).toBeGreaterThan(0);

      // Cost should be reasonable (less than $0.50 for most scopes)
      expect(scope.metadata?.totalCost).toBeLessThan(0.5);
    }, 60000);

    it.skipIf(!isConfigured)('should generate increasing scope for Good → Better → Best', async () => {
      const scope = await ScopeAI.generateHybridScope(mockIdea, mockContext);

      const goodPkg = scope.packages.find((p) => p.tier === 'good');
      const betterPkg = scope.packages.find((p) => p.tier === 'better');
      const bestPkg = scope.packages.find((p) => p.tier === 'best');

      expect(goodPkg).toBeDefined();
      expect(betterPkg).toBeDefined();
      expect(bestPkg).toBeDefined();

      // Verify deliverables increase
      const goodDeliverables = goodPkg?.deliverables?.length || 0;
      const betterDeliverables = betterPkg?.deliverables?.length || 0;
      const bestDeliverables = bestPkg?.deliverables?.length || 0;

      expect(betterDeliverables).toBeGreaterThanOrEqual(goodDeliverables);
      expect(bestDeliverables).toBeGreaterThanOrEqual(betterDeliverables);

      // Verify hours increase
      if (goodPkg?.estimatedHours && betterPkg?.estimatedHours && bestPkg?.estimatedHours) {
        expect(betterPkg.estimatedHours).toBeGreaterThan(goodPkg.estimatedHours);
        expect(bestPkg.estimatedHours).toBeGreaterThan(betterPkg.estimatedHours);
      }
    }, 60000);
  });
});
