import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePoints,
  calculateTier,
  ContributionType,
} from '@/lib/services/client-contribution';

describe('Client Contribution Service', () => {
  describe('calculatePoints', () => {
    it('should award 100 points for video', () => {
      expect(calculatePoints('video')).toBe(100);
    });

    it('should award 50 points for photo', () => {
      expect(calculatePoints('photo')).toBe(50);
    });

    it('should award 40 points for voice', () => {
      expect(calculatePoints('voice')).toBe(40);
    });

    it('should award 30 points for review', () => {
      expect(calculatePoints('review')).toBe(30);
    });

    it('should award 35 points for faq', () => {
      expect(calculatePoints('faq')).toBe(35);
    });

    it('should award 25 points for text', () => {
      expect(calculatePoints('text')).toBe(25);
    });

    it('should return default 20 points for unknown type', () => {
      expect(calculatePoints('unknown' as ContributionType)).toBe(20);
    });
  });

  describe('calculateTier', () => {
    it('should return bronze for 0 points', () => {
      expect(calculateTier(0)).toBe('bronze');
    });

    it('should return bronze for 499 points', () => {
      expect(calculateTier(499)).toBe('bronze');
    });

    it('should return silver for 500 points', () => {
      expect(calculateTier(500)).toBe('silver');
    });

    it('should return silver for 1499 points', () => {
      expect(calculateTier(1499)).toBe('silver');
    });

    it('should return gold for 1500 points', () => {
      expect(calculateTier(1500)).toBe('gold');
    });

    it('should return gold for 3499 points', () => {
      expect(calculateTier(3499)).toBe('gold');
    });

    it('should return platinum for 3500 points', () => {
      expect(calculateTier(3500)).toBe('platinum');
    });

    it('should return platinum for 5000+ points', () => {
      expect(calculateTier(5000)).toBe('platinum');
    });
  });

  describe('Tier Progression', () => {
    it('should progress through all tiers correctly', () => {
      const progressions = [
        { points: 0, expected: 'bronze' },
        { points: 500, expected: 'silver' },
        { points: 1500, expected: 'gold' },
        { points: 3500, expected: 'platinum' },
      ];

      progressions.forEach(({ points, expected }) => {
        expect(calculateTier(points)).toBe(expected);
      });
    });

    it('should not skip tiers', () => {
      const points = [100, 250, 499, 500, 750, 1499, 1500, 2000, 3499, 3500, 4000];
      const tiers = points.map((p) => calculateTier(p));

      // Verify no gaps in progression
      expect(tiers[0]).toBe('bronze'); // 100
      expect(tiers[4]).toBe('silver'); // 750
      expect(tiers[8]).toBe('gold'); // 3499
      expect(tiers[9]).toBe('platinum'); // 3500
    });
  });

  describe('Contribution Points Distribution', () => {
    it('should distribute points correctly across types', () => {
      const totalPoints = {
        video: calculatePoints('video'),
        photo: calculatePoints('photo'),
        voice: calculatePoints('voice'),
        review: calculatePoints('review'),
        faq: calculatePoints('faq'),
        text: calculatePoints('text'),
      };

      // Verify reasonable distribution
      expect(totalPoints.video).toBeGreaterThan(totalPoints.photo);
      expect(totalPoints.photo).toBeGreaterThan(totalPoints.voice);
      expect(totalPoints.voice).toBeGreaterThan(totalPoints.text);
    });

    it('should prioritize rich media over text', () => {
      expect(calculatePoints('video')).toBeGreaterThan(calculatePoints('text'));
      expect(calculatePoints('photo')).toBeGreaterThan(calculatePoints('text'));
      expect(calculatePoints('voice')).toBeGreaterThan(calculatePoints('text'));
    });
  });

  describe('Cumulative Points', () => {
    it('should calculate cumulative points for multiple contributions', () => {
      const contributions = [
        { type: 'video', points: calculatePoints('video') },
        { type: 'photo', points: calculatePoints('photo') },
        { type: 'voice', points: calculatePoints('voice') },
        { type: 'review', points: calculatePoints('review') },
      ];

      const total = contributions.reduce((sum, c) => sum + c.points, 0);
      expect(total).toBe(100 + 50 + 40 + 30);
    });

    it('should reach silver tier with 5 videos', () => {
      const videoPoints = calculatePoints('video');
      const totalPoints = videoPoints * 5;
      expect(calculateTier(totalPoints)).toBe('silver');
    });

    it('should reach gold tier with 15 videos', () => {
      const videoPoints = calculatePoints('video');
      const totalPoints = videoPoints * 15;
      expect(calculateTier(totalPoints)).toBe('gold');
    });

    it('should reach platinum tier with 35 videos', () => {
      const videoPoints = calculatePoints('video');
      const totalPoints = videoPoints * 35;
      expect(calculateTier(totalPoints)).toBe('platinum');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero points correctly', () => {
      expect(calculateTier(0)).toBe('bronze');
    });

    it('should handle tier threshold boundaries', () => {
      expect(calculateTier(499)).toBe('bronze');
      expect(calculateTier(500)).toBe('silver');

      expect(calculateTier(1499)).toBe('silver');
      expect(calculateTier(1500)).toBe('gold');

      expect(calculateTier(3499)).toBe('gold');
      expect(calculateTier(3500)).toBe('platinum');
    });

    it('should handle very high point values', () => {
      expect(calculateTier(1000000)).toBe('platinum');
    });
  });
});
