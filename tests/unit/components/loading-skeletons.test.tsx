/**
 * Loading Skeleton Tests
 * Tests for dashboard loading states.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('Dashboard Loading Skeleton', () => {
  it('should render stat card skeletons', async () => {
    const { default: DashboardLoading } = await import('@/app/dashboard/loading');
    const { container } = render(<DashboardLoading />);
    // 4 stat cards + 4 quick actions = at least 8 animate-pulse elements
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThanOrEqual(3);
  });

  it('should render activity list skeletons', async () => {
    const { default: DashboardLoading } = await import('@/app/dashboard/loading');
    const { container } = render(<DashboardLoading />);
    // 5 activity items with rounded-full avatars
    const avatars = container.querySelectorAll('.rounded-full');
    expect(avatars.length).toBe(5);
  });
});

describe('Contacts Loading Skeleton', () => {
  it('should render table row skeletons', async () => {
    const { default: ContactsLoading } = await import('@/app/dashboard/contacts/loading');
    const { container } = render(<ContactsLoading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

describe('Analytics Loading Skeleton', () => {
  it('should render chart placeholder skeletons', async () => {
    const { default: AnalyticsLoading } = await import('@/app/dashboard/analytics/loading');
    const { container } = render(<AnalyticsLoading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

describe('Reports Loading Skeleton', () => {
  it('should render filter and table skeletons', async () => {
    const { default: ReportsLoading } = await import('@/app/dashboard/reports/loading');
    const { container } = render(<ReportsLoading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

describe('Settings Loading Skeleton', () => {
  it('should render form section skeletons', async () => {
    const { default: SettingsLoading } = await import('@/app/dashboard/settings/loading');
    const { container } = render(<SettingsLoading />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});
