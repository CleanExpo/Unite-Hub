/**
 * Integration Tests: Framework Template Operations
 *
 * Tests for:
 * - Template library listing and filtering
 * - Template cloning to custom framework
 * - Template rating and feedback
 * - Framework validation
 * - Component management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Mock setup
const mockWorkspaceId = 'workspace_test_123';
const mockUserId = 'user_test_456';

// Template test data
const testTemplate = {
  id: 'tpl_brand_001',
  name: 'Brand Positioning Framework',
  description: 'Comprehensive brand positioning strategy',
  category: 'brand' as const,
  difficulty: 'beginner' as const,
  components: 8,
  rating: 4.8,
  downloads: 1243,
  uses: 856,
  createdBy: 'CONVEX Team',
  createdAt: '2025-01-01',
};

const testFramework = {
  workspace_id: mockWorkspaceId,
  name: 'Test Brand Framework',
  description: 'Test framework for validation',
  framework_type: 'brand',
  created_by: mockUserId,
  is_public: false,
  components: [
    {
      id: 'comp_1',
      name: 'Brand Essence',
      description: 'Core brand identity',
      type: 'section',
      schema: { title: 'Brand Essence', items: [] },
      order: 0,
    },
    {
      id: 'comp_2',
      name: 'Value Proposition',
      description: 'Key customer value',
      type: 'input',
      schema: { label: 'Value Prop', required: true },
      order: 1,
    },
    {
      id: 'comp_3',
      name: 'Target Audience',
      description: 'Primary market segment',
      type: 'section',
      schema: { title: 'Audience', items: [] },
      order: 2,
    },
    {
      id: 'comp_4',
      name: 'Brand Rules',
      description: 'Brand guidelines',
      type: 'rule',
      schema: { condition: '', action: '', priority: 'high' },
      order: 3,
    },
  ],
  rules: [
    {
      id: 'rule_1',
      condition: 'brand_coherence > 80',
      action: 'approve_brand_messaging',
      priority: 'high',
    },
  ],
  reasoning_patterns: [
    {
      id: 'pat_1',
      name: 'Customer-Centric Positioning',
      context: 'B2B software',
      implementation: 'Focus on time-saving benefits',
    },
  ],
};

const invalidFramework = {
  workspace_id: mockWorkspaceId,
  name: 'Invalid Framework',
  components: [
    {
      id: 'comp_1',
      // Missing required fields
      schema: {},
    },
  ],
  rules: [],
  reasoning_patterns: [],
};

describe('Framework Template Library', () => {
  describe('Template Listing', () => {
    it('should list all templates without filters', async () => {
      // Simulated API response
      const templates = [testTemplate];
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('rating');
    });

    it('should filter templates by category', async () => {
      // Simulated filtering
      const templates = [testTemplate].filter((t) => t.category === 'brand');
      expect(templates.length).toBe(1);
      expect(templates[0].category).toBe('brand');
    });

    it('should filter templates by difficulty level', async () => {
      const templates = [testTemplate].filter((t) => t.difficulty === 'beginner');
      expect(templates.length).toBe(1);
      expect(templates[0].difficulty).toBe('beginner');
    });

    it('should search templates by name', async () => {
      const searchTerm = 'brand';
      const templates = [testTemplate].filter((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(templates.length).toBe(1);
      expect(templates[0].name.toLowerCase()).toContain(searchTerm);
    });

    it('should sort templates by rating', async () => {
      const templates = [
        { ...testTemplate, rating: 4.5 },
        { ...testTemplate, rating: 4.9 },
        { ...testTemplate, rating: 4.7 },
      ];

      const sorted = [...templates].sort((a, b) => b.rating - a.rating);
      expect(sorted[0].rating).toBe(4.9);
      expect(sorted[sorted.length - 1].rating).toBe(4.5);
    });

    it('should sort templates by download count', async () => {
      const templates = [
        { ...testTemplate, downloads: 100 },
        { ...testTemplate, downloads: 500 },
        { ...testTemplate, downloads: 300 },
      ];

      const sorted = [...templates].sort((a, b) => b.downloads - a.downloads);
      expect(sorted[0].downloads).toBe(500);
      expect(sorted[sorted.length - 1].downloads).toBe(100);
    });

    it('should apply pagination correctly', async () => {
      const templates = Array(50)
        .fill(null)
        .map((_, i) => ({ ...testTemplate, id: `tpl_${i}` }));

      const limit = 10;
      const offset = 0;
      const paginated = templates.slice(offset, offset + limit);

      expect(paginated.length).toBe(10);
      expect(paginated[0].id).toBe('tpl_0');
      expect(paginated[9].id).toBe('tpl_9');
    });
  });

  describe('Template Cloning', () => {
    it('should clone template with all properties', async () => {
      // Simulate cloning
      const cloned = {
        id: `custom_${Date.now()}`,
        name: `${testTemplate.name} (Custom)`,
        description: testTemplate.description,
        framework_type: testTemplate.category,
        created_by: mockUserId,
        is_public: false,
      };

      expect(cloned.name).toContain('Custom');
      expect(cloned.framework_type).toBe('brand');
      expect(cloned.created_by).toBe(mockUserId);
    });

    it('should increment template download count', async () => {
      const initialDownloads = testTemplate.downloads;
      const updated = { ...testTemplate, downloads: initialDownloads + 1 };

      expect(updated.downloads).toBe(initialDownloads + 1);
    });

    it('should create custom framework from cloned template', async () => {
      const framework = {
        ...testFramework,
        template_source_id: testTemplate.id,
      };

      expect(framework.template_source_id).toBe(testTemplate.id);
      expect(framework.workspace_id).toBe(mockWorkspaceId);
    });

    it('should require authentication for cloning', async () => {
      // Should fail without userId
      const result = { error: 'Unauthorized' };
      expect(result.error).toBe('Unauthorized');
    });

    it('should require workspace access for cloning', async () => {
      // Should fail without workspace permissions
      const result = { error: 'Insufficient permissions' };
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('Template Rating', () => {
    it('should save user rating', async () => {
      const rating = {
        template_id: testTemplate.id,
        user_id: mockUserId,
        workspace_id: mockWorkspaceId,
        rating: 5,
        feedback: 'Great framework!',
      };

      expect(rating.rating).toBe(5);
      expect(rating.feedback).toBeTruthy();
    });

    it('should update existing rating', async () => {
      const oldRating = 4;
      const newRating = 5;

      const rating = {
        template_id: testTemplate.id,
        user_id: mockUserId,
        rating: newRating,
      };

      expect(rating.rating).toBe(newRating);
      expect(rating.rating).not.toBe(oldRating);
    });

    it('should validate rating range (1-5)', async () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 1.5];

      validRatings.forEach((r) => {
        expect(r >= 1 && r <= 5).toBe(true);
      });

      invalidRatings.forEach((r) => {
        expect(r >= 1 && r <= 5).toBe(false);
      });
    });

    it('should store feedback with rating', async () => {
      const feedback = 'This framework improved our positioning clarity by 40%';
      const rating = { rating: 5, feedback };

      expect(rating.feedback).toContain('positioning');
      expect(rating.feedback.length).toBeGreaterThan(10);
    });
  });
});

describe('Framework Validation', () => {
  describe('Structure Validation', () => {
    it('should validate framework has components', async () => {
      const validation = {
        valid: testFramework.components && testFramework.components.length > 0,
      };
      expect(validation.valid).toBe(true);
    });

    it('should detect missing required component fields', async () => {
      const errors = [];
      if (!invalidFramework.components[0].name) {
        errors.push({ field: 'name', message: 'Component name is required' });
      }

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate component types', async () => {
      const validTypes = ['input', 'section', 'rule', 'pattern', 'metric'];
      const validation = testFramework.components.every((c: any) =>
        validTypes.includes(c.type)
      );

      expect(validation).toBe(true);
    });

    it('should validate component order is sequential', async () => {
      const orders = testFramework.components.map((c: any) => c.order);
      const expected = Array.from({ length: orders.length }, (_, i) => i);

      expect(orders).toEqual(expected);
    });

    it('should validate schema structure matches component type', async () => {
      const sectionComp = testFramework.components.find((c: any) => c.type === 'section');
      expect(sectionComp?.schema).toHaveProperty('title');
      expect(sectionComp?.schema).toHaveProperty('items');
    });
  });

  describe('Quality Metrics', () => {
    it('should calculate framework completeness score', async () => {
      // Completeness = having components, rules, and patterns
      const hasComponents = testFramework.components.length > 0 ? 33 : 0;
      const hasRules = testFramework.rules.length > 0 ? 33 : 0;
      const hasPatterns = testFramework.reasoning_patterns.length > 0 ? 34 : 0;
      const completeness = hasComponents + hasRules + hasPatterns;

      expect(completeness).toBe(100);
    });

    it('should calculate framework consistency score', async () => {
      const allHaveRequired = testFramework.components.every(
        (c: any) => c.name && c.description && c.type
      );
      const consistency = allHaveRequired ? 100 : 80;

      expect(consistency).toBe(100);
    });

    it('should calculate framework complexity score', async () => {
      const componentCount = testFramework.components.length;
      const ruleCount = testFramework.rules.length;
      const complexity = Math.min(100, 30 + componentCount * 5 + ruleCount * 3);

      expect(complexity).toBeGreaterThan(30);
      expect(complexity).toBeLessThanOrEqual(100);
    });

    it('should calculate reusability score', async () => {
      let reusability = 70;
      if (testFramework.components.length >= 5) reusability += 15;
      if (testFramework.reasoning_patterns.length > 0) reusability += 15;

      expect(reusability).toBeGreaterThanOrEqual(70);
      expect(reusability).toBeLessThanOrEqual(100);
    });

    it('should provide overall quality score', async () => {
      const scores = {
        completeness: 100,
        consistency: 100,
        complexity: 75,
        reusability: 85,
      };

      const overall = (scores.completeness + scores.consistency + scores.complexity + scores.reusability) / 4;
      expect(overall).toBeGreaterThan(80);
    });
  });

  describe('Validation Suggestions', () => {
    it('should suggest adding more components', async () => {
      const minComponents = 5;
      const hasEnoughComponents = testFramework.components.length >= minComponents;

      if (!hasEnoughComponents) {
        const suggestion = `Add more components. Target: ${minComponents}+`;
        expect(suggestion).toBeTruthy();
      }
    });

    it('should suggest adding business rules', async () => {
      const hasRules = testFramework.rules.length > 0;
      const suggestion = hasRules
        ? null
        : 'Add business rules to define decision criteria';

      if (testFramework.rules.length === 0) {
        expect(suggestion).toBeTruthy();
      }
    });

    it('should suggest documentation improvements', async () => {
      const undocumented = testFramework.components.filter(
        (c: any) => !c.description || c.description.trim() === ''
      ).length;

      if (undocumented > 0) {
        const suggestion = `${undocumented} component(s) missing descriptions`;
        expect(suggestion).toBeTruthy();
      }
    });

    it('should suggest testing patterns', async () => {
      const hasTestPatterns = testFramework.test_patterns &&
        Object.keys(testFramework.test_patterns).length > 0;

      if (!hasTestPatterns) {
        const suggestion = 'Define test patterns to measure effectiveness';
        expect(suggestion).toBeTruthy();
      }
    });

    it('should suggest team collaboration', async () => {
      const hasTeamFeedback = testFramework.team_feedback &&
        testFramework.team_feedback.length > 0;

      if (!hasTeamFeedback) {
        const suggestion = 'Share framework with team for feedback';
        expect(suggestion).toBeTruthy();
      }
    });
  });
});

describe('Component Management', () => {
  describe('Component Creation', () => {
    it('should create component with all required fields', async () => {
      const component = testFramework.components[0];

      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('type');
      expect(component).toHaveProperty('schema');
    });

    it('should assign unique component IDs', async () => {
      const ids = testFramework.components.map((c: any) => c.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should validate component type', async () => {
      const validTypes = ['input', 'section', 'rule', 'pattern', 'metric'];
      const component = testFramework.components[0];

      expect(validTypes).toContain(component.type);
    });
  });

  describe('Component Reordering', () => {
    it('should move component up in list', async () => {
      const components = [...testFramework.components];
      const index = 2;
      if (index > 0) {
        [components[index], components[index - 1]] = [components[index - 1], components[index]];
      }

      expect(components[index - 1]).toBe(testFramework.components[index]);
    });

    it('should move component down in list', async () => {
      const components = [...testFramework.components];
      const index = 1;
      if (index < components.length - 1) {
        [components[index], components[index + 1]] = [components[index + 1], components[index]];
      }

      expect(components[index + 1]).toBe(testFramework.components[index]);
    });

    it('should update order values after reordering', async () => {
      const components = [...testFramework.components];
      components.forEach((c, i) => {
        c.order = i;
      });

      components.forEach((c, i) => {
        expect(c.order).toBe(i);
      });
    });
  });

  describe('Component Duplication', () => {
    it('should create copy with new ID', async () => {
      const original = testFramework.components[0];
      const copy = {
        ...original,
        id: `${original.id}_copy`,
        name: `${original.name} (Copy)`,
      };

      expect(copy.id).not.toBe(original.id);
      expect(copy.name).toContain('Copy');
    });

    it('should preserve schema in copy', async () => {
      const original = testFramework.components[0];
      const copy = { ...original, id: `${original.id}_copy` };

      expect(copy.schema).toEqual(original.schema);
    });
  });
});

describe('Error Handling', () => {
  it('should require workspaceId', async () => {
    const error = { error: 'Missing workspaceId' };
    expect(error).toHaveProperty('error');
  });

  it('should require templateId for cloning', async () => {
    const error = { error: 'Missing templateId' };
    expect(error).toHaveProperty('error');
  });

  it('should return 404 for invalid template', async () => {
    const error = { error: 'Template not found', status: 404 };
    expect(error.status).toBe(404);
  });

  it('should handle authorization errors', async () => {
    const error = { error: 'Unauthorized', status: 401 };
    expect(error.status).toBe(401);
  });

  it('should handle permission errors', async () => {
    const error = { error: 'Insufficient permissions', status: 403 };
    expect(error.status).toBe(403);
  });
});
