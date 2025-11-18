/**
 * Unit Tests for EmptyState Component
 * Tests empty state display and action functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, InlineEmptyState } from '@/components/EmptyState';
import { Users, Mail, Calendar, FileText } from 'lucide-react';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Get started by adding your first contact"
        />
      );

      expect(screen.getByText('No contacts yet')).toBeInTheDocument();
      expect(
        screen.getByText('Get started by adding your first contact')
      ).toBeInTheDocument();
    });

    it('should display custom icon', () => {
      const { container } = render(
        <EmptyState
          icon={Mail}
          title="No emails"
          description="No emails to display"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render different icons correctly', () => {
      const testCases = [
        { icon: Users, title: 'No users' },
        { icon: Mail, title: 'No emails' },
        { icon: Calendar, title: 'No events' },
        { icon: FileText, title: 'No documents' },
      ];

      testCases.forEach(({ icon, title }) => {
        const { container, unmount } = render(
          <EmptyState
            icon={icon}
            title={title}
            description="Test description"
          />
        );

        expect(screen.getByText(title)).toBeInTheDocument();
        const iconElement = container.querySelector('svg');
        expect(iconElement).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('Action Button', () => {
    it('should show action button when provided', () => {
      const mockAction = vi.fn();

      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          actionLabel="Add Contact"
          onAction={mockAction}
        />
      );

      const actionButton = screen.getByRole('button', { name: /add contact/i });
      expect(actionButton).toBeInTheDocument();
    });

    it('should call onAction when action button is clicked', () => {
      const mockAction = vi.fn();

      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          actionLabel="Add Contact"
          onAction={mockAction}
        />
      );

      const actionButton = screen.getByRole('button', { name: /add contact/i });
      fireEvent.click(actionButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('should not show action button when actionLabel is missing', () => {
      const mockAction = vi.fn();

      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          onAction={mockAction}
        />
      );

      const actionButton = screen.queryByRole('button');
      expect(actionButton).not.toBeInTheDocument();
    });

    it('should not show action button when onAction is missing', () => {
      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          actionLabel="Add Contact"
        />
      );

      const actionButton = screen.queryByRole('button');
      expect(actionButton).not.toBeInTheDocument();
    });

    it('should allow multiple clicks on action button', () => {
      const mockAction = vi.fn();

      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          actionLabel="Add Contact"
          onAction={mockAction}
        />
      );

      const actionButton = screen.getByRole('button', { name: /add contact/i });

      fireEvent.click(actionButton);
      fireEvent.click(actionButton);
      fireEvent.click(actionButton);

      expect(mockAction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Custom Gradient', () => {
    it('should use default gradient when not provided', () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
        />
      );

      const gradientElement = container.querySelector(
        '.from-blue-500\\/20.to-purple-600\\/20'
      );
      expect(gradientElement).toBeInTheDocument();
    });

    it('should apply custom gradient', () => {
      const { container } = render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
          gradient="from-red-500/20 to-orange-500/20"
        />
      );

      const gradientElement = container.querySelector('.from-red-500\\/20');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('Different Empty State Scenarios', () => {
    it('should render empty contacts state', () => {
      render(
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Your contact list is empty. Start by importing contacts or adding them manually."
          actionLabel="Add Contact"
          onAction={vi.fn()}
        />
      );

      expect(screen.getByText('No contacts yet')).toBeInTheDocument();
      expect(screen.getByText(/contact list is empty/i)).toBeInTheDocument();
    });

    it('should render empty campaigns state', () => {
      render(
        <EmptyState
          icon={Mail}
          title="No campaigns"
          description="Create your first email campaign to engage with your contacts."
          actionLabel="Create Campaign"
          onAction={vi.fn()}
        />
      );

      expect(screen.getByText('No campaigns')).toBeInTheDocument();
      expect(screen.getByText(/create your first email campaign/i)).toBeInTheDocument();
    });

    it('should render empty content state', () => {
      render(
        <EmptyState
          icon={FileText}
          title="No content generated"
          description="AI-generated content will appear here once you start creating campaigns."
        />
      );

      expect(screen.getByText('No content generated')).toBeInTheDocument();
      expect(screen.getByText(/AI-generated content/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      render(
        <EmptyState
          icon={Users}
          title="No contacts"
          description="Add your first contact"
        />
      );

      // Title should be in a heading element
      const title = screen.getByText('No contacts');
      expect(title.tagName).toBe('H3');
    });

    it('should have appropriate text hierarchy', () => {
      render(
        <EmptyState
          icon={Users}
          title="Main Title"
          description="Supporting description text"
        />
      );

      const title = screen.getByText('Main Title');
      const description = screen.getByText('Supporting description text');

      expect(title.tagName).toBe('H3');
      expect(description.tagName).toBe('P');
    });
  });
});

describe('InlineEmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(<InlineEmptyState message="No items" icon={Users} />);

      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('should display icon', () => {
      const { container } = render(
        <InlineEmptyState message="No items" icon={Mail} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render different messages', () => {
      const messages = [
        'No results found',
        'Empty list',
        'No data available',
        'Nothing to display',
      ];

      messages.forEach((message) => {
        const { unmount } = render(
          <InlineEmptyState message={message} icon={Users} />
        );

        expect(screen.getByText(message)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Compact Display', () => {
    it('should use compact layout', () => {
      const { container } = render(
        <InlineEmptyState message="No items" icon={Users} />
      );

      // Should not have Card wrapper
      const card = container.querySelector('.bg-slate-800\\/50');
      expect(card).not.toBeInTheDocument();
    });

    it('should center content', () => {
      const { container } = render(
        <InlineEmptyState message="No items" icon={Users} />
      );

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Different Icons', () => {
    it('should render with different icon types', () => {
      const icons = [Users, Mail, Calendar, FileText];

      icons.forEach((Icon) => {
        const { container, unmount } = render(
          <InlineEmptyState message="Test" icon={Icon} />
        );

        const iconElement = container.querySelector('svg');
        expect(iconElement).toBeInTheDocument();

        unmount();
      });
    });
  });
});
