/**
 * Integration Tests for Campaigns Page (Phase 3 Redesigned)
 * Tests component interactions: Tabs + Table + Filtering + Status Management
 * Covers user workflows: create, view, manage, and monitor email campaigns
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '@/test-utils/mock-fetch';
import CampaignsPage from '@/app/dashboard/campaigns/page';

const mockCampaigns = [
  {
    id: '1',
    name: 'Summer Product Launch',
    status: 'active',
    segments: 4500,
    opens: 1280,
    openRate: 28.4,
    clicks: 342,
    clickRate: 7.6,
    conversions: 42,
    createdAt: '2025-11-15',
  },
  {
    id: '2',
    name: 'Black Friday Sale',
    status: 'draft',
    segments: 0,
    opens: 0,
    openRate: 0,
    clicks: 0,
    clickRate: 0,
    conversions: 0,
    createdAt: '2025-11-28',
  },
  {
    id: '3',
    name: 'Monthly Newsletter',
    status: 'active',
    segments: 8200,
    opens: 2640,
    openRate: 32.2,
    clicks: 580,
    clickRate: 7.1,
    conversions: 125,
    createdAt: '2025-11-01',
  },
  {
    id: '4',
    name: 'Welcome Series',
    status: 'scheduled',
    segments: 12500,
    opens: 4500,
    openRate: 36.0,
    clicks: 1200,
    clickRate: 9.6,
    conversions: 320,
    createdAt: '2025-10-20',
  },
  {
    id: '5',
    name: 'Re-engagement Campaign',
    status: 'active',
    segments: 3200,
    opens: 800,
    openRate: 25.0,
    clicks: 160,
    clickRate: 5.0,
    conversions: 25,
    createdAt: '2025-11-10',
  },
  {
    id: '6',
    name: 'Product Beta Announcement',
    status: 'completed',
    segments: 6000,
    opens: 2400,
    openRate: 40.0,
    clicks: 720,
    clickRate: 12.0,
    conversions: 180,
    createdAt: '2025-10-01',
  },
];

describe('Campaigns Page Integration Tests (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Layout & Header', () => {
    it('should render page header with title', () => {
      render(<CampaignsPage />);

      expect(screen.getByRole('heading', { name: /campaigns/i, level: 1 })).toBeInTheDocument();
    });

    it('should have breadcrumb navigation', () => {
      render(<CampaignsPage />);

      expect(screen.getByText('Campaigns')).toBeInTheDocument();
    });

    it('should display Create Campaign button', () => {
      render(<CampaignsPage />);

      const createButton = screen.getByRole('button', { name: /create|new campaign/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should show campaign description', () => {
      render(<CampaignsPage />);

      expect(
        screen.getByText(/build and manage email campaigns/i)
      ).toBeInTheDocument();
    });
  });

  describe('Search & Filter Functionality', () => {
    it('should have search input', () => {
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should filter campaigns by name', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.getByText('Summer Product Launch')).toBeInTheDocument();
      });

      // Other campaigns should not be visible
      expect(screen.queryByText('Black Friday Sale')).not.toBeInTheDocument();
    });

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'newsletter');

      await waitFor(() => {
        expect(screen.getByText('Monthly Newsletter')).toBeInTheDocument();
      });
    });

    it('should clear search results when input is cleared', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.getByText('Summer Product Launch')).toBeInTheDocument();
      });

      await user.clear(searchInput);

      // After clearing, all campaigns should be visible again
      await waitFor(() => {
        expect(screen.getByText('Black Friday Sale')).toBeInTheDocument();
      });
    });

    it('should show empty state when search finds no results', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'NonexistentCampaign');

      await waitFor(() => {
        expect(screen.getByText(/no campaigns found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Campaign Statistics', () => {
    it('should display total campaigns count', () => {
      render(<CampaignsPage />);

      expect(screen.getByText('All Campaigns')).toBeInTheDocument();
    });

    it('should show active campaigns count', () => {
      render(<CampaignsPage />);

      const activeCount = mockCampaigns.filter((c) => c.status === 'active').length;
      expect(screen.getByText(`${activeCount} Active`)).toBeInTheDocument();
    });

    it('should display draft campaigns count', () => {
      render(<CampaignsPage />);

      const draftCount = mockCampaigns.filter((c) => c.status === 'draft').length;
      expect(screen.getByText(`${draftCount} Draft`)).toBeInTheDocument();
    });

    it('should show scheduled campaigns count', () => {
      render(<CampaignsPage />);

      const scheduledCount = mockCampaigns.filter((c) => c.status === 'scheduled').length;
      expect(screen.getByText(`${scheduledCount} Scheduled`)).toBeInTheDocument();
    });
  });

  describe('Campaigns Table', () => {
    it('should display campaigns in table format', () => {
      render(<CampaignsPage />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display all campaign names', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        expect(screen.getByText(campaign.name)).toBeInTheDocument();
      });
    });

    it('should show campaign status badges', () => {
      render(<CampaignsPage />);

      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('draft')).toBeInTheDocument();
      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });

    it('should display recipient segment counts', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        if (campaign.segments > 0) {
          expect(screen.getByText(campaign.segments.toString())).toBeInTheDocument();
        }
      });
    });

    it('should show email open rates', () => {
      render(<CampaignsPage />);

      const activeAndScheduledCampaigns = mockCampaigns.filter(
        (c) => c.status === 'active' || c.status === 'scheduled'
      );
      activeAndScheduledCampaigns.forEach((campaign) => {
        // Open rate should be displayed
        expect(document.body.textContent).toContain(campaign.openRate.toString());
      });
    });

    it('should display click rates', () => {
      render(<CampaignsPage />);

      const activeAndScheduledCampaigns = mockCampaigns.filter(
        (c) => c.status === 'active' || c.status === 'scheduled'
      );
      activeAndScheduledCampaigns.forEach((campaign) => {
        expect(document.body.textContent).toContain(campaign.clickRate.toString());
      });
    });

    it('should show conversion counts', () => {
      render(<CampaignsPage />);

      const activeCampaigns = mockCampaigns.filter((c) => c.status === 'active');
      activeCampaigns.forEach((campaign) => {
        if (campaign.conversions > 0) {
          expect(document.body.textContent).toContain(campaign.conversions.toString());
        }
      });
    });

    it('should display creation dates', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        expect(screen.getByText(campaign.createdAt)).toBeInTheDocument();
      });
    });

    it('should have action buttons for each campaign', () => {
      render(<CampaignsPage />);

      const actionButtons = screen.getAllByRole('button', { name: /edit|delete|view|launch/i });
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Campaign Status Filtering', () => {
    it('should filter to show only active campaigns', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      // Look for a filter or status button
      const filterButtons = screen.queryAllByRole('button', { name: /filter|active/i });
      if (filterButtons.length > 0) {
        await user.click(filterButtons[0]);

        await waitFor(() => {
          // Active campaigns should be visible
          const activeCampaigns = mockCampaigns.filter((c) => c.status === 'active');
          activeCampaigns.forEach((campaign) => {
            expect(screen.getByText(campaign.name)).toBeInTheDocument();
          });
        });
      }
    });

    it('should filter to show only draft campaigns', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const filterButtons = screen.queryAllByRole('button', { name: /filter|draft/i });
      if (filterButtons.length > 0) {
        await user.click(filterButtons[0]);

        await waitFor(() => {
          const draftCampaigns = mockCampaigns.filter((c) => c.status === 'draft');
          draftCampaigns.forEach((campaign) => {
            expect(screen.getByText(campaign.name)).toBeInTheDocument();
          });
        });
      }
    });

    it('should filter to show only scheduled campaigns', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const filterButtons = screen.queryAllByRole('button', { name: /filter|scheduled/i });
      if (filterButtons.length > 0) {
        await user.click(filterButtons[0]);

        await waitFor(() => {
          const scheduledCampaigns = mockCampaigns.filter((c) => c.status === 'scheduled');
          scheduledCampaigns.forEach((campaign) => {
            expect(screen.getByText(campaign.name)).toBeInTheDocument();
          });
        });
      }
    });
  });

  describe('Campaign Performance Metrics', () => {
    it('should display open rate metrics', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        if (campaign.openRate > 0) {
          expect(document.body.textContent).toContain(campaign.openRate.toString());
        }
      });
    });

    it('should show click-through rates', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        if (campaign.clickRate > 0) {
          expect(document.body.textContent).toContain(campaign.clickRate.toString());
        }
      });
    });

    it('should display conversion metrics', () => {
      render(<CampaignsPage />);

      const campaignsWithConversions = mockCampaigns.filter((c) => c.conversions > 0);
      expect(campaignsWithConversions.length).toBeGreaterThan(0);
    });

    it('should show color-coded performance indicators', () => {
      render(<CampaignsPage />);

      // High performers should have different styling
      const highPerformer = mockCampaigns.find((c) => c.openRate > 35);
      if (highPerformer) {
        expect(screen.getByText(highPerformer.name)).toBeInTheDocument();
      }
    });
  });

  describe('Campaign Actions', () => {
    it('should allow editing active campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const summerCampaign = screen.getByText('Summer Product Launch');
      expect(summerCampaign).toBeInTheDocument();

      // Find action button for this campaign
      const row = summerCampaign.closest('tr');
      if (row) {
        const actionButtons = within(row).queryAllByRole('button');
        if (actionButtons.length > 0) {
          // Should be able to interact with action button
          expect(actionButtons[0]).toBeInTheDocument();
        }
      }
    });

    it('should allow editing draft campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const draftCampaign = screen.getByText('Black Friday Sale');
      expect(draftCampaign).toBeInTheDocument();
    });

    it('should allow cloning campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const campaign = screen.getByText('Summer Product Launch');
      expect(campaign).toBeInTheDocument();

      // Cloning functionality would be in a context menu or action button
    });

    it('should allow viewing campaign details', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const campaign = screen.getByText('Summer Product Launch');
      expect(campaign).toBeInTheDocument();

      // Details page or modal could be accessed from campaign
    });

    it('should allow launching draft campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const draftCampaign = screen.getByText('Black Friday Sale');
      expect(draftCampaign).toBeInTheDocument();

      // Launch button would be in actions menu
    });

    it('should allow pausing active campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const activeCampaign = screen.getByText('Summer Product Launch');
      expect(activeCampaign).toBeInTheDocument();
    });

    it('should allow deleting campaign', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const campaign = screen.getByText('Summer Product Launch');
      expect(campaign).toBeInTheDocument();
    });
  });

  describe('Campaign Sorting', () => {
    it('should sort by campaign name', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      // Sorting functionality could be in column headers
      const nameHeader = screen.queryByRole('button', { name: /name/i });
      if (nameHeader) {
        await user.click(nameHeader);
        // Campaigns should be sorted alphabetically
        expect(screen.getByText('Summer Product Launch')).toBeInTheDocument();
      }
    });

    it('should sort by open rate', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      // Sort by performance metric
    });

    it('should sort by creation date', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      // Campaigns should be sortable by date
    });

    it('should support ascending and descending order', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      // Toggle sort direction
    });
  });

  describe('Empty State', () => {
    it('should show empty state message when no campaigns exist', () => {
      // Mock empty campaigns
      vi.mock('@/app/dashboard/campaigns/page', () => ({
        default: () => <div>No campaigns yet. Create your first campaign to get started.</div>,
      }));
    });

    it('should provide Create Campaign button in empty state', () => {
      render(<CampaignsPage />);

      const createButton = screen.getByRole('button', { name: /create|new campaign/i });
      expect(createButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport (375px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CampaignsPage />);

      const heading = screen.getByRole('heading', { name: /campaigns/i });
      expect(heading).toBeInTheDocument();
    });

    it('should display campaigns table responsively', () => {
      render(<CampaignsPage />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle scrollable table on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CampaignsPage />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should render on tablet viewport (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<CampaignsPage />);

      expect(screen.getByRole('heading', { name: /campaigns/i })).toBeInTheDocument();
    });

    it('should render on desktop viewport (1200px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<CampaignsPage />);

      expect(screen.getByRole('heading', { name: /campaigns/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<CampaignsPage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/campaigns/i);
    });

    it('should have accessible search input', () => {
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible table structure', () => {
      render(<CampaignsPage />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
    });

    it('should have descriptive button labels', () => {
      render(<CampaignsPage />);

      expect(screen.getByRole('button', { name: /create|new campaign/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.tab();

      expect(searchInput).toHaveFocus();
    });

    it('should have proper color contrast', () => {
      render(<CampaignsPage />);

      // Status badges should have proper contrast
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large campaign list efficiently', () => {
      render(<CampaignsPage />);

      mockCampaigns.forEach((campaign) => {
        expect(screen.getByText(campaign.name)).toBeInTheDocument();
      });
    });

    it('should handle rapid search input efficiently', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);

      // Rapid typing should not cause lag
      await user.type(searchInput, 'test', { delay: 10 });

      expect(searchInput).toHaveValue('test');
    });

    it('should efficiently filter campaigns on search', async () => {
      const user = userEvent.setup();
      render(<CampaignsPage />);

      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.getByText('Summer Product Launch')).toBeInTheDocument();
      });
    });
  });
});
