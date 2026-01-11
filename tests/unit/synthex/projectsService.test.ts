import { describe, expect, it } from 'vitest';
import { computeArtifactBundleHash } from '@/lib/synthex/projectsService';

describe('synthex/projectsService', () => {
  it('computeArtifactBundleHash is deterministic', () => {
    const a = { x: 1, y: ['a', 'b'] };
    const b = { x: 1, y: ['a', 'b'] };

    expect(computeArtifactBundleHash(a)).toBe(computeArtifactBundleHash(b));
  });

  it('computeArtifactBundleHash changes when payload changes', () => {
    const a = { x: 1 };
    const b = { x: 2 };

    expect(computeArtifactBundleHash(a)).not.toBe(computeArtifactBundleHash(b));
  });
});

