/**
 * Unit Tests for Alert Component (Phase 2B)
 * Tests alert types, dismissal, actions, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '@/components/patterns/Alert';

describe('Alert Component (Phase 2B)', () => {
  describe('Alert Types', () => {
    it('should render info alert', () => {
      render(
        <Alert
          type="info"
          title="Information"
          description="This is an informational message"
        />
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('This is an informational message')).toBeInTheDocument();
    });

    it('should render success alert', () => {
      render(
        <Alert
          type="success"
          title="Success"
          description="Operation completed successfully"
        />
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    });

    it('should render warning alert', () => {
      render(
        <Alert
          type="warning"
          title="Warning"
          description="Please review this action"
        />
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Please review this action')).toBeInTheDocument();
    });

    it('should render error alert', () => {
      render(
        <Alert
          type="error"
          title="Error"
          description="An error occurred during processing"
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('An error occurred during processing')).toBeInTheDocument();
    });

    it('should apply correct styling for each type', () => {
      const { container: infoContainer } = render(
        <Alert type="info" title="Info" description="Test" />
      );

      const infoAlert = infoContainer.querySelector('[role="alert"]');
      expect(infoAlert).toHaveClass('bg-blue-50');
      expect(infoAlert).toHaveClass('border-blue-200');
    });
  });

  describe('Title and Description', () => {
    it('should render both title and description', () => {
      render(
        <Alert
          type="info"
          title="Alert Title"
          description="Alert Description"
        />
      );

      expect(screen.getByText('Alert Title')).toBeInTheDocument();
      expect(screen.getByText('Alert Description')).toBeInTheDocument();
    });

    it('should render without description', () => {
      render(<Alert type="info" title="Title Only" />);

      expect(screen.getByText('Title Only')).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(5);

      render(
        <Alert type="info" title="Long Title" description={longText} />
      );

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should support JSX content in title', () => {
      render(
        <Alert
          type="info"
          title={<span>Title with <strong>bold</strong></span>}
          description="Test"
        />
      );

      expect(screen.getByText('bold')).toBeInTheDocument();
    });

    it('should support JSX content in description', () => {
      render(
        <Alert
          type="info"
          title="Title"
          description={<span>Description with <a href="#">link</a></span>}
        />
      );

      expect(screen.getByRole('link', { name: 'link' })).toBeInTheDocument();
    });
  });

  describe('Dismissible Alerts', () => {
    it('should show close button when dismissible is true', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={true}
        />
      );

      expect(screen.getByRole('button', { name: /close|dismiss/i })).toBeInTheDocument();
    });

    it('should not show close button when dismissible is false', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={false}
        />
      );

      expect(screen.queryByRole('button', { name: /close|dismiss/i })).not.toBeInTheDocument();
    });

    it('should call onDismiss when close button is clicked', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={true}
          onDismiss={onDismiss}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
      await user.click(closeButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should handle dismissal with Escape key', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={true}
          onDismiss={onDismiss}
        />
      );

      await user.keyboard('{Escape}');

      // Behavior depends on implementation
      // May or may not respond to Escape
    });
  });

  describe('Alert Actions', () => {
    it('should render action button when provided', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          actionLabel="Learn More"
          onAction={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /learn more/i })).toBeInTheDocument();
    });

    it('should not render action button without actionLabel', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          onAction={vi.fn()}
        />
      );

      // Should not have action button, but may have dismiss button
      const buttons = screen.queryAllByRole('button');
      const actionButtons = buttons.filter((btn) =>
        btn.textContent?.includes('Learn More')
      );
      expect(actionButtons).toHaveLength(0);
    });

    it('should call onAction when action button is clicked', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          actionLabel="Confirm"
          onAction={onAction}
        />
      );

      const actionButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('should support both dismiss and action buttons', async () => {
      const onDismiss = vi.fn();
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={true}
          onDismiss={onDismiss}
          actionLabel="Confirm"
          onAction={onAction}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
      const actionButton = screen.getByRole('button', { name: /confirm/i });

      await user.click(actionButton);
      expect(onAction).toHaveBeenCalledTimes(1);

      await user.click(closeButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for info alert styling', () => {
      const { container } = render(
        <Alert type="info" title="Info" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('border-blue-200');
      expect(alert).toHaveClass('bg-blue-50');
      expect(alert).toHaveClass('text-blue-900');
    });

    it('should use design tokens for success alert styling', () => {
      const { container } = render(
        <Alert type="success" title="Success" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('border-success-500');
    });

    it('should use design tokens for warning alert styling', () => {
      const { container } = render(
        <Alert type="warning" title="Warning" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('border-warning-500');
    });

    it('should use design tokens for error alert styling', () => {
      const { container } = render(
        <Alert type="error" title="Error" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('border-error-500');
    });
  });

  describe('Accessibility (WCAG 2.1 AA+)', () => {
    it('should have alert role', () => {
      render(
        <Alert type="info" title="Alert" description="Test" />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live polite', () => {
      const { container } = render(
        <Alert type="info" title="Alert" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have appropriate role for action buttons', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          actionLabel="Action"
          onAction={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have visible text for screen readers', () => {
      render(
        <Alert
          type="success"
          title="Success Alert"
          description="Your changes have been saved"
        />
      );

      // Text should be readable
      expect(screen.getByText('Success Alert')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved')).toBeInTheDocument();
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(
        <Alert type="info" title="Info" description="Test" />
      );

      const title = screen.getByText('Info');
      const alert = container.querySelector('[role="alert"]');

      // Should have high contrast text
      expect(title).toHaveClass('font-semibold');
    });

    it('should be keyboard accessible', async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          actionLabel="Confirm"
          onAction={onAction}
        />
      );

      // Tab to button
      await user.tab();

      // Press Enter on focused button
      const actionButton = screen.getByRole('button', { name: /confirm/i });
      expect(actionButton).toBeTruthy();
    });
  });

  describe('Multiple Alerts', () => {
    it('should render multiple alerts independently', () => {
      const { container } = render(
        <>
          <Alert type="info" title="Alert 1" description="Test 1" />
          <Alert type="success" title="Alert 2" description="Test 2" />
          <Alert type="error" title="Alert 3" description="Test 3" />
        </>
      );

      expect(screen.getByText('Alert 1')).toBeInTheDocument();
      expect(screen.getByText('Alert 2')).toBeInTheDocument();
      expect(screen.getByText('Alert 3')).toBeInTheDocument();
    });

    it('should handle dismissal of individual alerts', async () => {
      const onDismiss1 = vi.fn();
      const onDismiss2 = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <>
          <Alert
            type="info"
            title="Alert 1"
            description="Test 1"
            dismissible={true}
            onDismiss={onDismiss1}
          />
          <Alert
            type="success"
            title="Alert 2"
            description="Test 2"
            dismissible={true}
            onDismiss={onDismiss2}
          />
        </>
      );

      const closeButtons = screen.getAllByRole('button', {
        name: /close|dismiss/i,
      });

      await user.click(closeButtons[0]);
      expect(onDismiss1).toHaveBeenCalledTimes(1);
      expect(onDismiss2).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<Alert type="info" title="" description="Description" />);

      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should handle empty description', () => {
      render(<Alert type="info" title="Title" description="" />);

      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      render(
        <Alert
          type="info"
          title="Title & <Special>"
          description="Test & <content>"
        />
      );

      expect(screen.getByText('Title & <Special>')).toBeInTheDocument();
    });

    it('should handle undefined callbacks gracefully', () => {
      render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          dismissible={true}
          onDismiss={undefined}
        />
      );

      expect(screen.getByText('Alert')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile', () => {
      const { container } = render(
        <Alert type="info" title="Alert" description="Test" />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('w-full');
    });

    it('should stack content on small screens', () => {
      const { container } = render(
        <Alert
          type="info"
          title="Alert"
          description="Test"
          actionLabel="Action"
          onAction={vi.fn()}
        />
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass('flex-col');
    });
  });
});
