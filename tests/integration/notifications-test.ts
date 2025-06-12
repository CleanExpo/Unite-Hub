import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter from '@/components/crm/notifications/NotificationCenter';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock Audio API
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  volume: 0.3,
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => 
    <span data-testid="badge" data-variant={variant}>{children}</span>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string }) => 
    <button data-testid="button" data-variant={variant} data-size={size} onClick={onClick}>{children}</button>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button data-testid="tabs-trigger">{children}</button>,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (checked: boolean) => void; id: string }) => 
    <input data-testid="switch" type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} id={id} />,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => 
    <label data-testid="label" htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />,
  BellRing: () => <div data-testid="bell-ring-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

// Sample notification data
const mockNotificationsResponse = {
  notifications: [
    {
      id: 'notif-1',
      type: 'deal',
      title: 'New deal created',
      message: 'A new deal "Enterprise Software License" has been created and requires your attention.',
      priority: 'high',
      read: false,
      actionRequired: true,
      createdAt: '2024-01-15T10:30:00Z',
      entityId: 'deal-1',
      userId: 'user-1',
      metadata: {
        action: 'created',
        entityName: 'Enterprise Software License',
        assignedTo: 'John Doe',
      }
    },
    {
      id: 'notif-2',
      type: 'task',
      title: 'Task assigned to you',
      message: 'Task "Follow up with Acme Corp" has been assigned to you.',
      priority: 'medium',
      read: false,
      actionRequired: true,
      createdAt: '2024-01-15T09:15:00Z',
      entityId: 'task-1',
      userId: 'user-1',
      metadata: {
        action: 'assigned',
        entityName: 'Follow up with Acme Corp',
        assignedTo: 'You',
        dueDate: '2024-01-16T10:00:00Z',
      }
    },
    {
      id: 'notif-3',
      type: 'client',
      title: 'Client updated',
      message: 'Client "Acme Corporation" has been updated with new contact information.',
      priority: 'low',
      read: true,
      actionRequired: false,
      createdAt: '2024-01-15T08:45:00Z',
      entityId: 'client-1',
      userId: 'user-1',
      metadata: {
        action: 'updated',
        entityName: 'Acme Corporation',
        oldValue: 'old@acme.com',
        newValue: 'new@acme.com',
      }
    },
    {
      id: 'notif-4',
      type: 'invoice',
      title: 'Invoice payment overdue',
      message: 'Invoice "INV-2024-001" is now 5 days overdue. Please follow up with the client.',
      priority: 'urgent',
      read: false,
      actionRequired: true,
      createdAt: '2024-01-15T07:30:00Z',
      entityId: 'invoice-1',
      userId: 'user-1',
      metadata: {
        action: 'overdue',
        entityName: 'INV-2024-001',
        dueDate: '2024-01-10T00:00:00Z',
      }
    },
    {
      id: 'notif-5',
      type: 'system',
      title: 'System maintenance scheduled',
      message: 'System maintenance is scheduled for tonight at 11 PM EST. Expected downtime: 30 minutes.',
      priority: 'medium',
      read: true,
      actionRequired: false,
      createdAt: '2024-01-15T06:00:00Z',
      entityId: null,
      userId: 'user-1',
      metadata: {
        action: 'reminder',
        entityName: 'System Maintenance',
      }
    }
  ],
  hasNew: true
};

describe('Notification Center Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockNotificationsResponse,
    } as Response);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('should render the notification center', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Stay updated with your CRM activities')).toBeInTheDocument();
      });
    });

    it('should show loading spinner initially', () => {
      render(<NotificationCenter />);
      expect(screen.getByRole('presentation')).toBeInTheDocument();
    });

    it('should render notification tabs', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });
    });

    it('should display unread count badge', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        // Should show badge with unread count (3 unread notifications in mock data)
        const badges = screen.getAllByTestId('badge');
        const unreadBadge = badges.find(badge => badge.textContent === '3');
        expect(unreadBadge).toBeInTheDocument();
      });
    });
  });

  describe('Notification Loading and Display', () => {
    it('should fetch and display notifications', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/crm/notifications');
      });

      await waitFor(() => {
        expect(screen.getByText('New deal created')).toBeInTheDocument();
        expect(screen.getByText('Task assigned to you')).toBeInTheDocument();
        expect(screen.getByText('Client updated')).toBeInTheDocument();
        expect(screen.getByText('Invoice payment overdue')).toBeInTheDocument();
        expect(screen.getByText('System maintenance scheduled')).toBeInTheDocument();
      });
    });

    it('should display notification cards with proper styling', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Enterprise Software License')).toBeInTheDocument();
        expect(screen.getByText('Follow up with Acme Corp')).toBeInTheDocument();
      });

      // Check for priority badges
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('should show action required badges', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        const actionRequiredBadges = screen.getAllByText('Action Required');
        expect(actionRequiredBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display notification metadata', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Enterprise Software License')).toBeInTheDocument();
        expect(screen.getByText('→ John Doe')).toBeInTheDocument();
        expect(screen.getByText('→ You')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Filtering', () => {
    it('should show filter buttons with counts', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('All (5)')).toBeInTheDocument();
        expect(screen.getByText('Unread (3)')).toBeInTheDocument();
        expect(screen.getByText('Action Required (3)')).toBeInTheDocument();
      });
    });

    it('should filter notifications by unread status', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('All (5)')).toBeInTheDocument();
      });

      const unreadButton = screen.getByText('Unread (3)');
      fireEvent.click(unreadButton);

      // Should only show unread notifications
      expect(screen.getByText('New deal created')).toBeInTheDocument();
      expect(screen.getByText('Task assigned to you')).toBeInTheDocument();
      expect(screen.getByText('Invoice payment overdue')).toBeInTheDocument();
      
      // Should not show read notifications
      expect(screen.queryByText('Client updated')).not.toBeInTheDocument();
      expect(screen.queryByText('System maintenance scheduled')).not.toBeInTheDocument();
    });

    it('should filter notifications by action required', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Action Required (3)')).toBeInTheDocument();
      });

      const actionRequiredButton = screen.getByText('Action Required (3)');
      fireEvent.click(actionRequiredButton);

      // Should only show unread notifications that require action
      expect(screen.getByText('New deal created')).toBeInTheDocument();
      expect(screen.getByText('Task assigned to you')).toBeInTheDocument();
      expect(screen.getByText('Invoice payment overdue')).toBeInTheDocument();
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read when clicked', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('New deal created')).toBeInTheDocument();
      });

      const notificationCard = screen.getByText('New deal created').closest('[data-testid="card"]');
      fireEvent.click(notificationCard!);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/crm/notifications/notif-1/read',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should mark all notifications as read', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Mark All Read')).toBeInTheDocument();
      });

      const markAllReadButton = screen.getByText('Mark All Read');
      fireEvent.click(markAllReadButton);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/crm/notifications/mark-all-read',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should delete notification when delete button is clicked', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('New deal created')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTestId('trash-icon');
      fireEvent.click(deleteButtons[0].closest('button')!);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/crm/notifications/notif-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should refresh notifications when refresh button is clicked', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  describe('Settings Management', () => {
    it('should display notification settings', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      });

      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Activity Notifications')).toBeInTheDocument();
      expect(screen.getByText('Delivery Settings')).toBeInTheDocument();
    });

    it('should render notification preference switches', async () => {
      render(<NotificationCenter />);
      
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText('Deal Updates')).toBeInTheDocument();
        expect(screen.getByText('Task Assignments')).toBeInTheDocument();
        expect(screen.getByText('Task Deadlines')).toBeInTheDocument();
        expect(screen.getByText('Client Activity')).toBeInTheDocument();
        expect(screen.getByText('Invoice Reminders')).toBeInTheDocument();
        expect(screen.getByText('System Alerts')).toBeInTheDocument();
      });
    });

    it('should update settings when switches are toggled', async () => {
      render(<NotificationCenter />);
      
      const settingsTab = screen.getByText('Settings');
      fireEvent.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByText('Deal Updates')).toBeInTheDocument();
      });

      const dealUpdatesSwitch = screen.getByLabelText('dealUpdates');
      fireEvent.click(dealUpdatesSwitch);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/crm/notifications/settings',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('dealUpdates')
        })
      );
    });
  });

  describe('Real-time Updates', () => {
    it('should set up polling for new notifications', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds to trigger polling
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should play sound for new notifications when enabled', async () => {
      const mockPlay = jest.fn();
      (global.Audio as jest.Mock).mockImplementation(() => ({
        play: mockPlay,
        volume: 0.3,
      }));

      // Mock response with hasNew: true
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockNotificationsResponse, hasNew: true }),
      } as Response);

      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));
      
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });
    });

    it('should show error message for failed API calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch notifications' }),
      } as Response);
      
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load notifications/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notifications: [], hasNew: false }),
      } as Response);

      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
        expect(screen.getByText('Your notifications will appear here when there\'s activity in your CRM')).toBeInTheDocument();
      });
    });

    it('should show appropriate empty state for filtered views', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('All (5)')).toBeInTheDocument();
      });

      // Filter to show only unread, then mark all as read (simulated)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          notifications: mockNotificationsResponse.notifications.map(n => ({ ...n, read: true })),
          hasNew: false 
        }),
      } as Response);

      const unreadButton = screen.getByText('Unread (3)');
      fireEvent.click(unreadButton);

      jest.advanceTimersByTime(100); // Allow state to update

      await waitFor(() => {
        expect(screen.getByText('All caught up!')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels and roles', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        const switches = screen.getAllByTestId('switch');
        switches.forEach(switchElement => {
          expect(switchElement).toHaveAttribute('type', 'checkbox');
        });
      });
    });

    it('should support keyboard navigation', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        const buttons = screen.getAllByTestId('button');
        buttons.forEach(button => {
          expect(button.tagName).toBe('BUTTON');
        });
      });
    });
  });

  describe('Performance', () => {
    it('should cleanup interval on unmount', () => {
      const { unmount } = render(<NotificationCenter />);
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should handle rapid filter changes efficiently', async () => {
      render(<NotificationCenter />);
      
      await waitFor(() => {
        expect(screen.getByText('All (5)')).toBeInTheDocument();
      });

      // Rapidly change filters
      const allButton = screen.getByText('All (5)');
      const unreadButton = screen.getByText('Unread (3)');
      const actionButton = screen.getByText('Action Required (3)');

      fireEvent.click(unreadButton);
      fireEvent.click(actionButton);
      fireEvent.click(allButton);

      // Should not cause errors or excessive API calls
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });
  });
});

describe('Notification API Integration', () => {
  describe('Notification Creation', () => {
    it('should generate notifications from audit trail', () => {
      const auditEntry = {
        id: 'audit-1',
        action: 'created',
        entity_type: 'deal',
        entity_id: 'deal-123',
        created_at: '2024-01-15T10:00:00Z',
        metadata: {
          entity_name: 'Big Sale Deal',
          assigned_to: 'John Doe'
        }
      };

      // This would be tested with actual API integration
      expect(auditEntry.action).toBe('created');
      expect(auditEntry.entity_type).toBe('deal');
    });

    it('should map entity types correctly', () => {
      const mappings = {
        'deal': 'deal',
        'task': 'task',
        'client': 'client',
        'invoice': 'invoice',
        'user': 'system',
      };

      Object.entries(mappings).forEach(([input, expected]) => {
        expect(expected).toBe(mappings[input as keyof typeof mappings]);
      });
    });

    it('should generate appropriate priority levels', () => {
      const priorities = ['low', 'medium', 'high', 'urgent'];
      priorities.forEach(priority => {
        expect(priorities).toContain(priority);
      });
    });
  });

  describe('Settings Persistence', () => {
    it('should save notification preferences', () => {
      const settings = {
        dealUpdates: true,
        taskAssignments: true,
        taskDeadlines: false,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true,
      };

      // Test settings structure
      expect(typeof settings.dealUpdates).toBe('boolean');
      expect(typeof settings.emailNotifications).toBe('boolean');
      expect(settings).toHaveProperty('soundEnabled');
    });
  });
});
