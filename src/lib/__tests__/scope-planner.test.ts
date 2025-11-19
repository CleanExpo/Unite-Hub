/**
 * Tests for scope-planner (Phase 3A stub)
 *
 * These tests verify the deterministic stub implementation.
 * Future tests will verify AI-assisted scope generation.
 */

import {
  planScopeFromIdea,
  calculatePackagePricing,
  type ClientIdea,
  type ProposalScope,
} from '../projects/scope-planner';

describe('scope-planner (Phase 3 stub)', () => {
  const mockIdea: ClientIdea = {
    id: 'idea-test-123',
    organizationId: 'org-test-456',
    clientId: 'client-test-789',
    title: 'Build a Website',
    description: 'I need a professional website for my business.',
    createdAt: new Date().toISOString(),
  };

  describe('planScopeFromIdea', () => {
    it('returns a ProposalScope with three packages', () => {
      const scope: ProposalScope = planScopeFromIdea(mockIdea);

      expect(scope.idea.id).toBe('idea-test-123');
      expect(scope.packages).toHaveLength(3);
    });

    it('includes Good, Better, and Best packages', () => {
      const scope = planScopeFromIdea(mockIdea);

      const tiers = scope.packages.map((p) => p.tier);
      expect(tiers).toContain('good');
      expect(tiers).toContain('better');
      expect(tiers).toContain('best');
    });

    it('includes sections with project overview', () => {
      const scope = planScopeFromIdea(mockIdea);

      expect(scope.sections).toHaveLength(1);
      expect(scope.sections[0].title).toBe('Project Overview');
      expect(scope.sections[0].description).toBe(mockIdea.description);
    });

    it('includes metadata with generation timestamp', () => {
      const scope = planScopeFromIdea(mockIdea);

      expect(scope.metadata).toBeDefined();
      expect(scope.metadata?.generatedAt).toBeDefined();
      expect(typeof scope.metadata?.generatedAt).toBe('string');
    });

    it('Good package has fewer deliverables than Better', () => {
      const scope = planScopeFromIdea(mockIdea);

      const goodPackage = scope.packages.find((p) => p.tier === 'good');
      const betterPackage = scope.packages.find((p) => p.tier === 'better');

      expect(goodPackage?.deliverables?.length).toBeLessThan(
        betterPackage?.deliverables?.length || 0
      );
    });

    it('Better package has fewer deliverables than Best', () => {
      const scope = planScopeFromIdea(mockIdea);

      const betterPackage = scope.packages.find((p) => p.tier === 'better');
      const bestPackage = scope.packages.find((p) => p.tier === 'best');

      expect(betterPackage?.deliverables?.length).toBeLessThan(
        bestPackage?.deliverables?.length || 0
      );
    });
  });

  describe('calculatePackagePricing', () => {
    it('calculates pricing based on hours and hourly rate', () => {
      const pricing = calculatePackagePricing(40, 150, 0.3);

      // 40 hours * $150/hour = $6,000 base cost
      // $6,000 * 1.3 (30% margin) = $7,800 min price
      // $7,800 * 1.2 (20% range) = $9,360 max price

      expect(pricing.priceMin).toBe(7800);
      expect(pricing.priceMax).toBe(9360);
    });

    it('uses default hourly rate of $150', () => {
      const pricing = calculatePackagePricing(40);

      expect(pricing.priceMin).toBeGreaterThan(0);
      expect(pricing.priceMax).toBeGreaterThan(pricing.priceMin);
    });

    it('applies 30% default margin', () => {
      const pricing = calculatePackagePricing(40, 150);

      // With 30% margin: base cost * 1.3
      const baseCost = 40 * 150; // $6,000
      const expectedMin = baseCost * 1.3; // $7,800

      expect(pricing.priceMin).toBe(expectedMin);
    });

    it('returns rounded prices', () => {
      const pricing = calculatePackagePricing(33, 147, 0.27);

      // Prices should be whole numbers
      expect(pricing.priceMin % 1).toBe(0);
      expect(pricing.priceMax % 1).toBe(0);
    });
  });
});
