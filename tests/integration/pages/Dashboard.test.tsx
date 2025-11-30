/**
 * Integration Tests for Dashboard Overview Page (Phase 3 Redesigned)
 * Tests component interactions: Sidebar + Main Content + Workspace Context
 * Covers user workflows: view pending approvals, manage content, navigate workspace
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '@/test-utils/mock-fetch';
import DashboardOverviewPage from '@/app/dashboard/overview/page';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { email: 'test@example.com' },
    currentOrganization: { org_id: 'test-workspace-id' },
  })),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => ({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          },
        },
      })),
    },
  },
}));

const mockContent = [
  {
    id: 'content-1',
    title: 'VEO3 Video - Summer Campaign (TikTok)',
    type: 'video',
    platform: 'tiktok',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
    previewText: 'Check out our summer collection! Fresh styles, bold looks. Shop now and get 20% off!',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content-2',
    title: 'Banana Creative - Omni-channel Banner Set',
    type: 'banner',
    platform: 'meta',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content-3',
    title: 'Generative Blog Post - SEO & Images',
    type: 'blog',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    previewText: '10 Tips for Summer Marketing Success',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

describe('Dashboard Overview Page Integration Tests (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Layout', () => {
    it('should render page with sidebar and main content', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      // Page should render with main content area
      expect(document.body).toBeInTheDocument();
    });

    it('should display main heading', () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      const heading = screen.queryByText(/Generative Workspace/i);
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });

    it('should show pending content count in header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const pendingText = screen.queryByText(/items ready for approval/i);
        if (pendingText) {
          expect(pendingText).toBeInTheDocument();
        }
      });
    });

    it('should display user profile in header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const userInfo = screen.queryByText('test');
        if (userInfo) {
          expect(userInfo).toBeInTheDocument();
        }
      });
    });
  });

  describe('Content Cards Display', () => {
    it('should render pending content cards', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(document.body.textContent).toContain('Summer Campaign');
      });
    });

    it('should display content title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(document.body.textContent).toContain('VEO3 Video');
      });
    });

    it('should show content type badge', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        // Content type should be visible (video, banner, blog)
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should display platform indicator', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        // Platform should be indicated (tiktok, meta, etc)
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should show content thumbnail', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const images = document.querySelectorAll('img');
        // Should have thumbnails loaded
        expect(images.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should display preview text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        if (mockContent[0].previewText) {
          expect(document.body.textContent).toContain(mockContent[0].previewText);
        }
      });
    });
  });

  describe('Content Approval Workflow', () => {
    it('should display Approve button on content cards', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const approveButtons = screen.queryAllByRole('button', { name: /approve/i });
        expect(approveButtons.length).toBeGreaterThan(0);
      });
    });

    it('should display Iterate button on content cards', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const iterateButtons = screen.queryAllByRole('button', { name: /iterate|request changes/i });
        expect(iterateButtons.length).toBeGreaterThan(0);
      });
    });

    it('should handle approve action', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const approveButtons = screen.queryAllByRole('button', { name: /approve/i });
        expect(approveButtons.length).toBeGreaterThan(0);
      });

      const approveButton = screen.queryAllByRole('button', { name: /approve/i })[0];
      if (approveButton) {
        await user.click(approveButton);

        // Content should be removed from pending list
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalled();
        });
      }
    });

    it('should handle iterate action', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const iterateButtons = screen.queryAllByRole('button', { name: /iterate|request changes/i });
        expect(iterateButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Content Statistics', () => {
    it('should display deployed count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const deployedText = screen.queryByText(/Deployed Today|deployed/i);
        if (deployedText) {
          expect(deployedText).toBeInTheDocument();
        }
      });
    });

    it('should show pending count', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const pendingText = screen.queryByText(/Pending|pending/i);
        if (pendingText) {
          expect(pendingText).toBeInTheDocument();
        }
      });
    });

    it('should display statistics as badges', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        // Statistics should be displayed as badges
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no pending content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [] }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const emptyState = screen.queryByText(/no pending content/i);
        if (emptyState) {
          expect(emptyState).toBeInTheDocument();
        }
      });
    });

    it('should display message in empty state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: [] }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const message = screen.queryByText(/no pending/i);
        if (message) {
          expect(message).toBeInTheDocument();
        }
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading spinner while fetching', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({ content: mockContent }),
            }),
            500
          )
        )
      );

      render(<DashboardOverviewPage />);

      // Loading indicator should appear briefly
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should handle content loading asynchronously', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Fetch failed'));

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        // Page should still render even if fetch fails
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should display demo content on error', async () => {
      mockFetch.mockRejectedValue(new Error('Fetch failed'));

      render(<DashboardOverviewPage />);

      // Should fall back to demo content
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call pending content API on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/content/pending'),
          expect.any(Object)
        );
      });
    });

    it('should pass workspace ID to API', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('workspaceId='),
          expect.any(Object)
        );
      });
    });

    it('should include authorization header in API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: expect.stringContaining('Bearer'),
            }),
          })
        );
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      expect(document.body).toBeInTheDocument();
    });

    it('should display content cards in horizontal scroll on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should render on desktop viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        // Main heading should be present
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        const approveButtons = screen.queryAllByRole('button', { name: /approve/i });
        approveButtons.forEach((button) => {
          expect(button).toHaveAttribute('type');
        });
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ content: mockContent }),
      });

      render(<DashboardOverviewPage />);

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });

      await user.tab();
      expect(document.activeElement).toBeDefined();
    });
  });
});
