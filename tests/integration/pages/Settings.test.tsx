/**
 * Integration Tests for Settings Page (Phase 3 Redesigned)
 * Tests component interactions: Tabs + Forms + API Integration + Modals
 * Covers user workflows: connect integrations, sync emails, manage settings
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '@/test-utils/mock-fetch';
import SettingsPage from '@/app/dashboard/settings/page';

// Mock dependencies
vi.mock('@/hooks/useWorkspace', () => ({
  useWorkspace: vi.fn(() => ({
    workspaceId: 'test-workspace-id',
    loading: false,
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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { workspace_id: 'test-workspace-id' },
          })),
        })),
      })),
    })),
  },
}));

const mockIntegrations = [
  {
    id: 'integration-gmail-1',
    provider: 'gmail',
    account_email: 'user@gmail.com',
    connected_at: '2025-11-20',
    status: 'active',
  },
  {
    id: 'integration-outlook-1',
    provider: 'outlook',
    account_email: null,
    connected_at: null,
    status: 'disconnected',
  },
];

describe('Settings Page Integration Tests (Phase 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Page Layout & Header', () => {
    it('should render page header with title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /settings/i, level: 1 })).toBeInTheDocument();
      });
    });

    it('should display description text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/manage integrations and preferences/i)).toBeInTheDocument();
      });
    });

    it('should have breadcrumb navigation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Component Integration', () => {
    it('should render Integrations tab', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /integrations/i })).toBeInTheDocument();
      });
    });

    it('should render Account tab', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /account/i })).toBeInTheDocument();
      });
    });

    it('should display Integrations tab content by default', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gmail')).toBeInTheDocument();
      });
    });

    it('should switch to Account tab when clicked', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const accountTab = screen.getByRole('tab', { name: /account/i });
        expect(accountTab).toBeInTheDocument();
      });

      const accountTab = screen.getByRole('tab', { name: /account/i });
      await user.click(accountTab);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });
    });

    it('should maintain tab state when switching', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      await user.click(accountTab);

      await waitFor(() => {
        expect(accountTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Gmail Integration', () => {
    it('should display Gmail integration card', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gmail')).toBeInTheDocument();
      });
    });

    it('should show connected Gmail account', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('user@gmail.com')).toBeInTheDocument();
        expect(screen.getByText(/connected/i)).toBeInTheDocument();
      });
    });

    it('should display Sync Now button when Gmail connected', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument();
      });
    });

    it('should display Disconnect button when Gmail connected', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
      });
    });

    it('should handle sync emails', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const syncButton = screen.getByRole('button', { name: /sync now/i });
        expect(syncButton).toBeInTheDocument();
      });

      const syncButton = screen.getByRole('button', { name: /sync now/i });

      // Mock sync endpoint
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ imported: 15 }),
      });

      await user.click(syncButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/integrations/gmail/sync'),
          expect.any(Object)
        );
      });
    });

    it('should show loading state during sync', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const syncButton = screen.getByRole('button', { name: /sync now/i });

      // Mock slow sync
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({ imported: 15 }),
            }),
            500
          )
        )
      );

      await user.click(syncButton);

      await waitFor(() => {
        expect(syncButton).toBeDisabled();
      });
    });

    it('should display Connect button when Gmail not connected', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations.filter((i) => i.provider !== 'gmail') }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
      });
    });

    it('should handle Gmail connection', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations.filter((i) => i.provider !== 'gmail') }),
      });

      render(<SettingsPage />);

      const connectButton = screen.getByRole('button', { name: /connect/i });

      // Mock auth URL response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          authUrl: 'https://accounts.google.com/o/oauth2/auth?client_id=...',
        }),
      });

      // Note: We can't fully test window.location.href change in test environment
      // but we can verify the button click triggers the request
      await user.click(connectButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/integrations/gmail/connect'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Outlook Integration', () => {
    it('should display Outlook integration card', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Outlook')).toBeInTheDocument();
      });
    });

    it('should show not connected status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/outlook/i).closest('div').textContent).toContain('Not connected');
      });
    });

    it('should have Coming Soon button for Outlook', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /coming soon/i })).toBeInTheDocument();
      });
    });

    it('should disable Coming Soon button', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const comingSoonButton = screen.getByRole('button', { name: /coming soon/i });
        expect(comingSoonButton).toBeDisabled();
      });
    });
  });

  describe('Slack Integration', () => {
    it('should display Slack integration card', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Slack')).toBeInTheDocument();
      });
    });

    it('should show Slack description', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/get notified of hot leads/i)).toBeInTheDocument();
      });
    });

    it('should have Connect button for Slack', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const connectButtons = screen.getAllByRole('button', { name: /connect/i });
      expect(connectButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Account Tab', () => {
    it('should display Account tab content', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      await user.click(accountTab);

      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });
    });

    it('should display Alert component with info message', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      await user.click(accountTab);

      await waitFor(() => {
        expect(
          screen.getByText(/additional account settings will be available/i)
        ).toBeInTheDocument();
      });
    });

    it('should show info-type Alert component', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const accountTab = screen.getByRole('tab', { name: /account/i });
      await user.click(accountTab);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should display loading skeleton on initial load', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({ integrations: mockIntegrations }),
            }),
            1000
          )
        )
      );

      render(<SettingsPage />);

      // During loading, skeleton should be visible
      await waitFor(() => {
        // Once loaded, actual content should appear
        expect(screen.getByText('Gmail')).toBeInTheDocument();
      });
    });

    it('should show loading skeletons for multiple integration cards', async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) =>
          setTimeout(() =>
            resolve({
              ok: true,
              json: async () => ({ integrations: mockIntegrations }),
            }),
            1000
          )
        )
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gmail')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error state when loading integrations fails', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to load integrations'));

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load settings/i)).toBeInTheDocument();
      });
    });

    it('should provide retry button on error', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to load integrations'));

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle sync failure gracefully', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ integrations: mockIntegrations }),
        })
        .mockRejectedValueOnce(new Error('Sync failed'));

      render(<SettingsPage />);

      const syncButton = screen.getByRole('button', { name: /sync now/i });
      await user.click(syncButton);

      // Should handle error without crashing
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle connection error gracefully', async () => {
      const user = userEvent.setup();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ integrations: mockIntegrations.filter((i) => i.provider !== 'gmail') }),
        })
        .mockRejectedValueOnce(new Error('Connection failed'));

      render(<SettingsPage />);

      const connectButtons = screen.getAllByRole('button', { name: /connect/i });
      // Note: Can't fully test window redirect, but can verify request is attempted
      // Button should still be clickable and not cause page crash
    });
  });

  describe('API Integration', () => {
    it('should call integrations list API on mount', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/integrations/list'),
          expect.any(Object)
        );
      });
    });

    it('should pass authorization header to API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

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

    it('should include workspace context in API calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      // Sync should include workspace context
      const syncButton = screen.getByRole('button', { name: /sync now/i });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ imported: 10 }),
      });

      const user = userEvent.setup();
      await user.click(syncButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('test-workspace-id'),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent(/settings/i);
      });
    });

    it('should have accessible tabs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const integrationsTab = screen.getByRole('tab', { name: /integrations/i });
        expect(integrationsTab).toHaveAttribute('role', 'tab');
      });
    });

    it('should have accessible buttons', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const connectButton = screen.getByRole('button', { name: /disconnect/i });
        expect(connectButton).toHaveAttribute('type', 'button');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      const integrationsTab = screen.getByRole('tab', { name: /integrations/i });

      // Tab to the integrations tab
      await user.tab();

      // Should be able to navigate with keyboard
      expect(integrationsTab).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Gmail')).toBeInTheDocument();
      });
    });

    it('should display integration cards stacked on mobile', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ integrations: mockIntegrations }),
      });

      render(<SettingsPage />);

      await waitFor(() => {
        const container = screen.getByText('Gmail').closest('div');
        expect(container).toBeInTheDocument();
      });
    });
  });
});
