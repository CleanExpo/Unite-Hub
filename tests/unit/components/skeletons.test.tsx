/**
 * Unit Tests for Skeleton Components
 * Tests loading state displays
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ContentCardSkeleton,
  ContentListSkeleton,
} from '@/components/skeletons/ContentListSkeleton';
import {
  StatsCardSkeleton,
  StatsGridSkeleton,
} from '@/components/skeletons/StatsCardSkeleton';

describe('ContentCardSkeleton', () => {
  it('should render skeleton structure', () => {
    const { container } = render(<ContentCardSkeleton />);

    // Should render skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have card wrapper', () => {
    const { container } = render(<ContentCardSkeleton />);

    // Should have card structure
    const card = container.querySelector('[class*="bg-muted"]');
    expect(card).toBeInTheDocument();
  });
});

describe('ContentListSkeleton', () => {
  it('should render default number of skeletons (6)', () => {
    const { container } = render(<ContentListSkeleton />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(6);
  });

  it('should render custom number of skeletons', () => {
    const { container } = render(<ContentListSkeleton count={3} />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(3);
  });

  it('should render in grid layout', () => {
    const { container } = render(<ContentListSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('should handle zero count', () => {
    const { container } = render(<ContentListSkeleton count={0} />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(0);
  });

  it('should handle large count', () => {
    const { container } = render(<ContentListSkeleton count={20} />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(20);
  });
});

describe('StatsCardSkeleton', () => {
  it('should render skeleton structure', () => {
    const { container } = render(<StatsCardSkeleton />);

    // Should render skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should have card wrapper', () => {
    const { container } = render(<StatsCardSkeleton />);

    const card = container.querySelector('[class*="bg-muted"]');
    expect(card).toBeInTheDocument();
  });

  it('should render icon and stats placeholder', () => {
    const { container } = render(<StatsCardSkeleton />);

    // Should have skeleton elements for icon and text
    const skeletons = container.querySelectorAll('[class*="bg-muted-foreground"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('StatsGridSkeleton', () => {
  it('should render default number of stat cards (4)', () => {
    const { container } = render(<StatsGridSkeleton />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(4);
  });

  it('should render custom number of stat cards', () => {
    const { container } = render(<StatsGridSkeleton count={6} />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(6);
  });

  it('should render in grid layout', () => {
    const { container } = render(<StatsGridSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('should handle zero count', () => {
    const { container } = render(<StatsGridSkeleton count={0} />);

    const cards = container.querySelectorAll('[class*="bg-muted"]');
    expect(cards.length).toBe(0);
  });

  it('should use responsive grid columns', () => {
    const { container } = render(<StatsGridSkeleton />);

    const grid = container.querySelector('.grid');
    expect(grid?.classList.toString()).toContain('grid-cols-1');
    expect(grid?.classList.toString()).toContain('lg:grid-cols-4');
  });
});

describe('Skeleton Loading States', () => {
  it('should display skeletons while content is loading', () => {
    const { container } = render(<ContentListSkeleton count={3} />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render skeletons immediately', () => {
    const startTime = Date.now();
    render(<ContentListSkeleton />);
    const endTime = Date.now();

    // Should render very quickly (under 100ms)
    expect(endTime - startTime).toBeLessThan(100);
  });
});
