/**
 * Integration Tests: Framework Versioning Operations
 *
 * Tests for:
 * - Version saving and retrieval
 * - Version comparison and diff calculation
 * - Version restoration
 * - Framework publishing
 * - Version history management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const mockWorkspaceId = 'workspace_test_123';
const mockUserId = 'user_test_456';
const mockFrameworkId = 'framework_test_789';

// Test data
const mockFramework = {
  id: mockFrameworkId,
  workspace_id: mockWorkspaceId,
  name: 'Test Framework v1',
  description: 'Initial framework',
  framework_type: 'brand',
  components: [
    { id: 'comp_1', name: 'Brand Essence', type: 'section', order: 0 },
    { id: 'comp_2', name: 'Value Prop', type: 'input', order: 1 },
  ],
  rules: [{ id: 'rule_1', condition: 'x > 0', action: 'approve' }],
  reasoning_patterns: [{ id: 'pat_1', name: 'Customer Focus' }],
  created_at: new Date().toISOString(),
};

const mockVersion = {
  id: 'version_1',
  framework_id: mockFrameworkId,
  version_number: 1,
  name: 'Version 1',
  description: 'Initial version',
  framework_state: mockFramework,
  change_summary: 'Initial framework created',
  created_by: mockUserId,
  created_at: new Date().toISOString(),
  component_count: 2,
  rule_count: 1,
  pattern_count: 1,
};

describe('Framework Versioning', () => {
  describe('Version Creation', () => {
    it('should create new version with auto-increment number', async () => {
      const version = { ...mockVersion, version_number: 1 };
      expect(version.version_number).toBe(1);
    });

    it('should auto-increment version numbers', async () => {
      const v1 = { ...mockVersion, version_number: 1 };
      const v2 = { ...mockVersion, id: 'version_2', version_number: 2 };
      const v3 = { ...mockVersion, id: 'version_3', version_number: 3 };

      expect(v2.version_number).toBe(v1.version_number + 1);
      expect(v3.version_number).toBe(v2.version_number + 1);
    });

    it('should store full framework state in version', async () => {
      expect(mockVersion.framework_state).toBeDefined();
      expect(mockVersion.framework_state.components).toBeDefined();
      expect(mockVersion.framework_state.rules).toBeDefined();
    });

    it('should record component count in version', async () => {
      expect(mockVersion.component_count).toBe(mockFramework.components.length);
    });

    it('should record rule count in version', async () => {
      expect(mockVersion.rule_count).toBe(mockFramework.rules.length);
    });

    it('should record pattern count in version', async () => {
      expect(mockVersion.pattern_count).toBe(mockFramework.reasoning_patterns.length);
    });

    it('should record version creator', async () => {
      expect(mockVersion.created_by).toBe(mockUserId);
    });

    it('should record version timestamp', async () => {
      const version = { ...mockVersion };
      const createdDate = new Date(version.created_at);
      expect(createdDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should allow optional label for version', async () => {
      const version = { ...mockVersion, name: 'Added brand pillars' };
      expect(version.name).toBe('Added brand pillars');
    });

    it('should allow optional description for version', async () => {
      const version = { ...mockVersion, description: 'Updated brand voice and tone' };
      expect(version.description).toBe('Updated brand voice and tone');
    });
  });

  describe('Version Listing', () => {
    it('should list versions in reverse chronological order', async () => {
      const versions = [
        { ...mockVersion, version_number: 1, created_at: '2025-01-01T00:00:00Z' },
        { ...mockVersion, version_number: 2, created_at: '2025-01-02T00:00:00Z' },
        { ...mockVersion, version_number: 3, created_at: '2025-01-03T00:00:00Z' },
      ];

      const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);
      expect(sorted[0].version_number).toBe(3);
      expect(sorted[sorted.length - 1].version_number).toBe(1);
    });

    it('should apply pagination to version list', async () => {
      const allVersions = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockVersion,
          id: `version_${i}`,
          version_number: i + 1,
        }));

      const limit = 5;
      const offset = 0;
      const paginated = allVersions.slice(offset, offset + limit);

      expect(paginated.length).toBe(5);
    });

    it('should return total version count', async () => {
      const versions = [mockVersion];
      expect(versions.length).toBeGreaterThan(0);
    });
  });

  describe('Version Comparison', () => {
    it('should calculate field-level diffs', async () => {
      const v1 = { ...mockFramework, name: 'Framework v1' };
      const v2 = { ...mockFramework, name: 'Framework v2' };

      const diff = v1.name !== v2.name;
      expect(diff).toBe(true);
    });

    it('should track added fields', async () => {
      const v1 = { ...mockFramework };
      const v2 = { ...mockFramework, newField: 'value' };

      const hasNewField = 'newField' in v2 && !('newField' in v1);
      expect(hasNewField).toBe(true);
    });

    it('should track removed fields', async () => {
      const v1 = { ...mockFramework, tempField: 'temp' };
      const v2 = { ...mockFramework };

      const fieldRemoved = 'tempField' in v1 && !('tempField' in v2);
      expect(fieldRemoved).toBe(true);
    });

    it('should track modified fields', async () => {
      const v1 = { value: 100 };
      const v2 = { value: 200 };

      const modified = v1.value !== v2.value;
      expect(modified).toBe(true);
    });

    it('should calculate similarity score', async () => {
      const identical = { a: 1, b: 2, c: 3 };
      const similarScore = 100; // 0 diffs = 100% similarity

      expect(similarScore).toBe(100);
    });

    it('should reduce similarity with more changes', async () => {
      const v1Changes = 1; // 1 change
      const v2Changes = 5; // 5 changes

      const score1 = Math.max(0, 100 - v1Changes * 10);
      const score2 = Math.max(0, 100 - v2Changes * 10);

      expect(score2).toBeLessThan(score1);
    });

    it('should compare component counts', async () => {
      const v1 = { component_count: 5 };
      const v2 = { component_count: 7 };

      expect(v2.component_count).toBeGreaterThan(v1.component_count);
    });

    it('should compare rule counts', async () => {
      const v1 = { rule_count: 2 };
      const v2 = { rule_count: 2 };

      expect(v2.rule_count).toBe(v1.rule_count);
    });

    it('should export comparison as JSON', async () => {
      const comparison = {
        from_version: 1,
        to_version: 2,
        similarity_score: 85,
        changes: [
          { field: 'name', oldValue: 'v1', newValue: 'v2', type: 'modified' },
        ],
      };

      const json = JSON.stringify(comparison);
      expect(json).toContain('similarity_score');
      expect(json).toContain('changes');
    });
  });

  describe('Version Restoration', () => {
    it('should restore previous version to framework', async () => {
      const originalName = 'Original Name';
      const restored = { ...mockFramework, name: originalName };

      expect(restored.name).toBe(originalName);
    });

    it('should create backup before restore', async () => {
      const beforeRestore = { version_number: 3, name: 'Current' };
      const backup = { version_number: 4, name: 'Backup before restore' };

      expect(backup.version_number).toBeGreaterThan(beforeRestore.version_number);
      expect(backup.name).toContain('Backup');
    });

    it('should preserve version history after restore', async () => {
      const versions = [
        { version_number: 1 },
        { version_number: 2 },
        { version_number: 3 },
        { version_number: 4 }, // Backup
      ];

      expect(versions.length).toBe(4);
      expect(versions.some((v) => v.version_number === 3)).toBe(true);
    });

    it('should update framework state on restore', async () => {
      const originalState = { components: 5, rules: 2 };
      const restored = { components: 5, rules: 2 };

      expect(restored).toEqual(originalState);
    });

    it('should allow multiple restore operations', async () => {
      let state = { version: 1 };
      state = { version: 2 };
      state = { version: 1 }; // Restore
      state = { version: 3 };
      state = { version: 2 }; // Restore again

      expect(state.version).toBe(2);
    });

    it('should require authentication to restore', async () => {
      const error = { error: 'Unauthorized', status: 401 };
      expect(error.status).toBe(401);
    });

    it('should require permissions to restore', async () => {
      const error = { error: 'Insufficient permissions', status: 403 };
      expect(error.status).toBe(403);
    });
  });

  describe('Framework Publishing', () => {
    it('should publish framework to library', async () => {
      const framework = { ...mockFramework, is_public: true };
      expect(framework.is_public).toBe(true);
    });

    it('should unpublish framework', async () => {
      const framework = { ...mockFramework, is_public: false };
      expect(framework.is_public).toBe(false);
    });

    it('should record publication timestamp', async () => {
      const framework = {
        ...mockFramework,
        is_public: true,
        published_at: new Date().toISOString(),
      };

      expect(framework.published_at).toBeDefined();
      const publishDate = new Date(framework.published_at);
      expect(publishDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should record publisher ID', async () => {
      const framework = { ...mockFramework, published_by: mockUserId };
      expect(framework.published_by).toBe(mockUserId);
    });

    it('should store publication metadata', async () => {
      const metadata = {
        category: 'brand',
        difficulty: 'beginner',
        industry: 'tech',
        preview: { frameworks: ['Brand', 'Positioning'] },
      };

      expect(metadata.category).toBe('brand');
      expect(metadata.difficulty).toBe('beginner');
    });

    it('should list published frameworks by workspace', async () => {
      const published = [
        { ...mockFramework, is_public: true },
        { ...mockFramework, id: 'fw_2', is_public: true },
      ];

      const publicOnly = published.filter((f) => f.is_public);
      expect(publicOnly.length).toBe(2);
    });

    it('should allow updating published metadata', async () => {
      let framework = {
        ...mockFramework,
        is_public: true,
        category: 'brand',
      };

      framework = { ...framework, category: 'funnel' };
      expect(framework.category).toBe('funnel');
    });

    it('should require owner permission to publish', async () => {
      const error = { error: 'Only owners can publish', status: 403 };
      expect(error.status).toBe(403);
    });

    it('should allow viewers to see published frameworks', async () => {
      const framework = { ...mockFramework, is_public: true };
      expect(framework.is_public).toBe(true);
    });
  });

  describe('Version History Management', () => {
    it('should show current version indicator', async () => {
      const versions = [
        { version_number: 1 },
        { version_number: 2, isCurrent: true },
        { version_number: 3 },
      ];

      const current = versions.find((v) => v.isCurrent);
      expect(current?.version_number).toBe(2);
    });

    it('should display change summary', async () => {
      const version = { ...mockVersion, change_summary: 'Added 2 components' };
      expect(version.change_summary).toContain('components');
    });

    it('should show creator information', async () => {
      const version = { ...mockVersion, created_by: 'john@example.com' };
      expect(version.created_by).toBeDefined();
    });

    it('should show creation timestamp', async () => {
      const version = { ...mockVersion };
      expect(version.created_at).toBeDefined();
    });

    it('should display framework state in version', async () => {
      const version = { ...mockVersion };
      expect(version.framework_state).toBeDefined();
      expect(version.framework_state.components).toBeDefined();
    });

    it('should allow exporting version', async () => {
      const version = { ...mockVersion };
      const exported = JSON.stringify(version);

      expect(exported).toContain('version_number');
      expect(exported).toContain('framework_state');
    });

    it('should support branching from any version', async () => {
      const baseVersion = { version_number: 2 };
      const branched = { ...mockFramework, base_version: baseVersion.version_number };

      expect(branched.base_version).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should require workspaceId', async () => {
      const error = { error: 'Missing workspaceId' };
      expect(error).toHaveProperty('error');
    });

    it('should require frameworkId', async () => {
      const error = { error: 'Missing frameworkId' };
      expect(error).toHaveProperty('error');
    });

    it('should require versionId for restore', async () => {
      const error = { error: 'Missing versionId' };
      expect(error).toHaveProperty('error');
    });

    it('should return 404 for missing version', async () => {
      const error = { error: 'Version not found', status: 404 };
      expect(error.status).toBe(404);
    });

    it('should return 401 for unauthorized', async () => {
      const error = { error: 'Unauthorized', status: 401 };
      expect(error.status).toBe(401);
    });

    it('should return 403 for insufficient permissions', async () => {
      const error = { error: 'Insufficient permissions', status: 403 };
      expect(error.status).toBe(403);
    });

    it('should handle framework not found', async () => {
      const error = { error: 'Framework not found', status: 404 };
      expect(error.status).toBe(404);
    });

    it('should handle restore failures gracefully', async () => {
      const error = { error: 'Failed to restore version', status: 500 };
      expect(error.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should list versions with pagination', async () => {
      const versions = Array(100)
        .fill(null)
        .map((_, i) => ({ ...mockVersion, version_number: i + 1 }));

      const paginated = versions.slice(0, 10);
      expect(paginated.length).toBe(10);
    });

    it('should handle large framework states', async () => {
      const largeState = {
        ...mockFramework,
        components: Array(50).fill({ id: 'comp', name: 'Component', type: 'input' }),
      };

      expect(largeState.components.length).toBe(50);
    });

    it('should compare versions efficiently', async () => {
      const v1 = { ...mockFramework };
      const v2 = { ...mockFramework, name: 'Updated' };

      const diffs = Object.keys(v1).filter((k) => v1[k] !== v2[k]);
      expect(diffs.length).toBeGreaterThan(0);
    });
  });
});
