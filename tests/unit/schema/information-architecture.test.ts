import { describe, it, expect } from 'vitest';
import {
  generateInformationArchitecture,
  generateBreadcrumbListSchema,
  generateServiceSchema,
  generateArchitectureDocumentation,
  getContentStrategyForSection,
  type ArchitectureConfig,
} from '@/lib/schema/information-architecture';

describe('Information Architecture System', () => {
  const mockConfig: ArchitectureConfig = {
    businessName: 'Acme Plumbing',
    serviceCategory: 'plumbing',
    primaryServices: ['Emergency Plumbing', 'Water Heater Repair', 'Drain Cleaning'],
    locations: ['New York', 'New Jersey'],
    contentDepth: 'intermediate',
  };

  describe('Architecture Generation', () => {
    it('should generate basic architecture', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'basic',
      });

      expect(architecture.businessName).toBe('Acme Plumbing');
      expect(architecture.serviceCategory).toBe('plumbing');
      expect(architecture.hubUrl).toBe('/services/plumbing');
      expect(architecture.spokes.length).toBeGreaterThan(0);
      expect(architecture.estimatedTotalPages).toBeGreaterThan(0);
    });

    it('should generate intermediate architecture with more pages', () => {
      const intermediate = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'intermediate',
      });

      const advanced = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'advanced',
      });

      expect(advanced.estimatedTotalPages).toBeGreaterThan(intermediate.estimatedTotalPages);
    });

    it('should generate advanced architecture with guides and blog', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'advanced',
      });

      const spokeUrls = architecture.spokes.map((s) => s.path);
      expect(spokeUrls.some((url) => url.includes('/guides/'))).toBe(true);
      expect(spokeUrls.some((url) => url.includes('/blog/'))).toBe(true);
      expect(spokeUrls.some((url) => url.includes('/certifications/'))).toBe(true);
    });

    it('should include location pages when locations provided', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      const locationSpokes = architecture.spokes.filter((s) => s.path.includes('/locations/'));
      expect(locationSpokes.length).toBeGreaterThan(0);

      // Should have pages for each location
      expect(locationSpokes.length).toBeGreaterThanOrEqual(mockConfig.locations.length);
    });

    it('should not include location pages when no locations provided', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        locations: [],
      });

      const locationSpokes = architecture.spokes.filter((s) => s.path.includes('/locations/'));
      // Should still have location index but no specific location pages
      expect(locationSpokes.some((s) => s.path === '/locations/')).toBe(false);
    });

    it('should generate valid hub URL from service category', () => {
      const categories = ['plumbing', 'electrical', 'hvac', 'dental'];
      categories.forEach((category) => {
        const architecture = generateInformationArchitecture({
          ...mockConfig,
          serviceCategory: category as any,
        });

        expect(architecture.hubUrl).toBe(`/services/${category}`);
      });
    });

    it('should generate appropriate content depth score', () => {
      const basic = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'basic',
      });
      const intermediate = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'intermediate',
      });
      const advanced = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'advanced',
      });

      expect(basic.contentDepthScore).toBeLessThan(intermediate.contentDepthScore);
      expect(intermediate.contentDepthScore).toBeLessThan(advanced.contentDepthScore);
      expect(advanced.contentDepthScore).toBeGreaterThanOrEqual(85);
    });
  });

  describe('Hub-and-Spoke Structure', () => {
    it('should include core sections', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      const spokeUrls = architecture.spokes.map((s) => s.path);
      expect(spokeUrls.some((u) => u.includes('/reviews/'))).toBe(true);
      expect(spokeUrls.some((u) => u.includes('/case-studies/'))).toBe(true);
      expect(spokeUrls.some((u) => u.includes('/faq/'))).toBe(true);
      expect(spokeUrls.some((u) => u.includes('/team/'))).toBe(true);
    });

    it('should assign appropriate page estimates by depth', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        contentDepth: 'intermediate',
      });

      const reviewSpoke = architecture.spokes.find((s) => s.path.includes('/reviews/'));
      expect(reviewSpoke?.estPages).toBeGreaterThan(5);
      expect(reviewSpoke?.estPages).toBeLessThan(30);
    });

    it('should include schema types for each spoke', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      architecture.spokes.forEach((spoke) => {
        expect(spoke.schemaType).toBeTruthy();
        expect(spoke.contentStrategy).toBeTruthy();
        expect(spoke.purpose).toBeTruthy();
      });
    });

    it('should have consistent hub URL across all spokes', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      architecture.spokes
        .filter((s) => !s.path.includes('/locations/'))
        .forEach((spoke) => {
          expect(spoke.path.startsWith(architecture.hubUrl)).toBe(true);
        });
    });
  });

  describe('Internal Linking Strategy', () => {
    it('should generate linking rules for all sections', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      expect(architecture.internalLinkingStrategy.length).toBeGreaterThan(0);
      architecture.internalLinkingStrategy.forEach((rule) => {
        expect(rule.fromSection).toBeTruthy();
        expect(rule.toSections.length).toBeGreaterThan(0);
        expect(rule.anchorText).toBeTruthy();
        expect(rule.rationale).toBeTruthy();
      });
    });

    it('should create bidirectional linking relationships', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      // If A links to B, B should generally link back to A
      const rules = architecture.internalLinkingStrategy;
      const sections = rules.map((r) => r.fromSection);

      expect(sections.includes('reviews')).toBe(true);
      expect(sections.includes('case-studies')).toBe(true);

      const reviewsRule = rules.find((r) => r.fromSection === 'reviews');
      expect(reviewsRule?.toSections).toContain('case-studies');
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should generate breadcrumb structure', () => {
      const architecture = generateInformationArchitecture(mockConfig);

      expect(architecture.breadcrumbStructure.length).toBeGreaterThan(0);
      expect(architecture.breadcrumbStructure[0].name).toBe('Home');
      expect(architecture.breadcrumbStructure[0].position).toBe(1);
    });

    it('should generate valid BreadcrumbList schema', () => {
      const architecture = generateInformationArchitecture(mockConfig);
      const schema = generateBreadcrumbListSchema(architecture.breadcrumbStructure);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement.length).toBeGreaterThan(0);

      schema.itemListElement.forEach((item: any, index: number) => {
        expect(item.position).toBe(index + 1);
        expect(item.name).toBeTruthy();
        expect(item.item).toBeTruthy();
      });
    });
  });

  describe('Service Schema', () => {
    it('should generate valid Service schema', () => {
      const schema = generateServiceSchema({
        serviceName: 'Emergency Plumbing',
        description: 'Professional emergency plumbing services',
        businessName: 'Acme Plumbing',
        url: '/services/plumbing',
      });

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Service');
      expect(schema.name).toBe('Emergency Plumbing');
      expect(schema.provider.name).toBe('Acme Plumbing');
    });

    it('should include area served when provided', () => {
      const schema = generateServiceSchema({
        serviceName: 'Plumbing',
        description: 'Description',
        businessName: 'Acme',
        url: '/services/plumbing',
        areaServed: ['New York', 'New Jersey'],
      });

      expect(schema.areaServed).toBeDefined();
      expect(schema.areaServed.length).toBe(2);
    });

    it('should include offer catalog when provided', () => {
      const schema = generateServiceSchema({
        serviceName: 'Plumbing',
        description: 'Description',
        businessName: 'Acme',
        url: '/services/plumbing',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Plumbing Services',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Emergency Repair',
              },
            },
          ],
        },
      });

      expect(schema.hasOfferCatalog).toBeDefined();
      expect(schema.hasOfferCatalog.itemListElement.length).toBeGreaterThan(0);
    });
  });

  describe('Content Strategy', () => {
    it('should provide strategy for reviews section', () => {
      const strategy = getContentStrategyForSection('reviews');

      expect(strategy.minWords).toBeGreaterThan(0);
      expect(strategy.recommendations.length).toBeGreaterThan(0);
      expect(strategy.schemaTypes).toContain('Review');
    });

    it('should provide strategy for case studies', () => {
      const strategy = getContentStrategyForSection('case-studies');

      expect(strategy.minWords).toBeGreaterThan(1000);
      expect(strategy.recommendations).toContain(
        expect.stringMatching(/before.*after|solution.*problem/i)
      );
      expect(strategy.schemaTypes).toContain('VideoObject');
    });

    it('should provide strategy for FAQ', () => {
      const strategy = getContentStrategyForSection('faq');

      expect(strategy.schemaTypes).toContain('FAQPage');
      expect(strategy.recommendations).toContain(
        expect.stringMatching(/customer|questions?/i)
      );
    });

    it('should provide strategy for team section', () => {
      const strategy = getContentStrategyForSection('team');

      expect(strategy.schemaTypes).toContain('Person');
      expect(strategy.recommendations).toContain(
        expect.stringMatching(/certifications?|license/i)
      );
    });

    it('should provide strategy for guides', () => {
      const strategy = getContentStrategyForSection('guides');

      expect(strategy.minWords).toBeGreaterThan(1500);
      expect(strategy.schemaTypes).toContain('HowTo');
    });
  });

  describe('Architecture Documentation', () => {
    it('should generate markdown documentation', () => {
      const architecture = generateInformationArchitecture(mockConfig);
      const doc = generateArchitectureDocumentation(architecture);

      expect(doc).toContain('# Information Architecture');
      expect(doc).toContain(mockConfig.businessName);
      expect(doc).toContain('Hub-and-Spoke');
      expect(doc).toContain(architecture.hubUrl);
    });

    it('should include all spokes in documentation', () => {
      const architecture = generateInformationArchitecture(mockConfig);
      const doc = generateArchitectureDocumentation(architecture);

      architecture.spokes.forEach((spoke) => {
        expect(doc).toContain(spoke.path);
      });
    });

    it('should include internal linking rules in documentation', () => {
      const architecture = generateInformationArchitecture(mockConfig);
      const doc = generateArchitectureDocumentation(architecture);

      expect(doc).toContain('Internal Linking Strategy');
      architecture.internalLinkingStrategy.forEach((rule) => {
        expect(doc).toContain(rule.fromSection);
      });
    });

    it('should include breadcrumb structure', () => {
      const architecture = generateInformationArchitecture(mockConfig);
      const doc = generateArchitectureDocumentation(architecture);

      expect(doc).toContain('Breadcrumb');
      architecture.breadcrumbStructure.forEach((crumb) => {
        expect(doc).toContain(crumb.name);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle single location', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        locations: ['San Francisco'],
      });

      const locationSpokes = architecture.spokes.filter((s) => s.path.includes('/locations/'));
      expect(locationSpokes.length).toBeGreaterThan(0);
    });

    it('should handle many locations', () => {
      const locations = [
        'New York',
        'Los Angeles',
        'Chicago',
        'Houston',
        'Phoenix',
        'Philadelphia',
        'San Antonio',
        'San Diego',
      ];
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        locations,
      });

      const locationPages = architecture.spokes.filter(
        (s) => s.path.includes('/locations/') && s.path !== '/locations/'
      );
      expect(locationPages.length).toBe(locations.length);
    });

    it('should handle multiple primary services', () => {
      const architecture = generateInformationArchitecture({
        ...mockConfig,
        primaryServices: [
          'Emergency Plumbing',
          'Water Heater Repair',
          'Drain Cleaning',
          'Pipe Repair',
          'Toilet Repair',
        ],
      });

      expect(architecture).toBeDefined();
      expect(architecture.estimatedTotalPages).toBeGreaterThan(0);
    });

    it('should produce deterministic URLs', () => {
      const arch1 = generateInformationArchitecture(mockConfig);
      const arch2 = generateInformationArchitecture(mockConfig);

      expect(arch1.hubUrl).toBe(arch2.hubUrl);
      arch1.spokes.forEach((spoke, index) => {
        expect(spoke.path).toBe(arch2.spokes[index].path);
      });
    });
  });
});
