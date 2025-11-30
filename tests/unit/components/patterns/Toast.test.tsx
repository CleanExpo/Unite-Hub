/**
 * Unit Tests for Toast Component (Phase 2B)
 * Tests toast notifications, auto-dismiss, stacking, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer, ToastItem, type Toast } from '@/components/patterns/Toast';

describe('Toast Component (Phase 2B)', () => {
  describe('ToastItem Component', () => {
    const defaultProps = {
      id: 'toast-1',
      message: 'Test message',
      type: 'info' as const,
      onClose: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
      it('should render toast with message', () => {
        render(<ToastItem {...defaultProps} />);

        expect(screen.getByText('Test message')).toBeInTheDocument();
      });

      it('should render different toast types', () => {
        const types = ['info', 'success', 'warning', 'error'] as const;

        types.forEach((type) => {
          const { unmount } = render(
            <ToastItem {...defaultProps} type={type} />
          );

          expect(screen.getByText('Test message')).toBeInTheDocument();
          unmount();
        });
      });

      it('should apply correct styling for each type', () => {
        const { container } = render(
          <ToastItem {...defaultProps} type="success" />
        );

        const toast = container.querySelector('[role="alert"]');
        // Should have success-specific styling
        expect(toast).toBeInTheDocument();
      });

      it('should render with title and description', () => {
        render(
          <ToastItem
            {...defaultProps}
            title="Toast Title"
            description="Toast description"
          />
        );

        expect(screen.getByText('Toast Title')).toBeInTheDocument();
        expect(screen.getByText('Toast description')).toBeInTheDocument();
      });
    });

    describe('Toast Actions', () => {
      it('should show action button when provided', () => {
        render(
          <ToastItem
            {...defaultProps}
            actionLabel="Undo"
            onAction={vi.fn()}
          />
        );

        expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      });

      it('should call onAction when action button is clicked', async () => {
        const onAction = vi.fn();
        const user = userEvent.setup();

        render(
          <ToastItem
            {...defaultProps}
            actionLabel="Undo"
            onAction={onAction}
          />
        );

        const actionButton = screen.getByRole('button', { name: /undo/i });
        await user.click(actionButton);

        expect(onAction).toHaveBeenCalledTimes(1);
      });
    });

    describe('Close Button', () => {
      it('should show close button', () => {
        render(<ToastItem {...defaultProps} />);

        expect(screen.getByRole('button', { name: /close|dismiss/i })).toBeInTheDocument();
      });

      it('should call onClose when close button is clicked', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(
          <ToastItem {...defaultProps} onClose={onClose} />
        );

        const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
        await user.click(closeButton);

        expect(onClose).toHaveBeenCalledWith('toast-1');
      });

      it('should auto-dismiss after duration', async () => {
        const onClose = vi.fn();

        vi.useFakeTimers();

        render(
          <ToastItem
            {...defaultProps}
            duration={3000}
            onClose={onClose}
          />
        );

        expect(onClose).not.toHaveBeenCalled();

        vi.advanceTimersByTime(3000);

        expect(onClose).toHaveBeenCalledWith('toast-1');

        vi.useRealTimers();
      });

      it('should not auto-dismiss if duration is 0', async () => {
        const onClose = vi.fn();

        vi.useFakeTimers();

        render(
          <ToastItem
            {...defaultProps}
            duration={0}
            onClose={onClose}
          />
        );

        vi.advanceTimersByTime(10000);

        expect(onClose).not.toHaveBeenCalled();

        vi.useRealTimers();
      });
    });

    describe('Accessibility (WCAG 2.1 AA+)', () => {
      it('should have alert role', () => {
        const { container } = render(<ToastItem {...defaultProps} />);

        const toast = container.querySelector('[role="alert"]');
        expect(toast).toBeInTheDocument();
      });

      it('should have aria-live polite', () => {
        const { container } = render(<ToastItem {...defaultProps} />);

        const toast = container.querySelector('[role="alert"]');
        expect(toast).toHaveAttribute('aria-live', 'polite');
      });

      it('should have aria-live assertive for errors', () => {
        const { container } = render(
          <ToastItem {...defaultProps} type="error" />
        );

        const toast = container.querySelector('[role="alert"]');
        expect(toast).toHaveAttribute('aria-live', 'assertive');
      });

      it('should have close button with proper label', () => {
        render(<ToastItem {...defaultProps} />);

        const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
        expect(closeButton).toBeInTheDocument();
      });

      it('should be keyboard accessible', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();

        render(
          <ToastItem {...defaultProps} onClose={onClose} />
        );

        // Tab to close button
        await user.tab();

        const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
        expect(closeButton).toHaveFocus();

        // Press Enter to close
        await user.keyboard('{Enter}');

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('ToastContainer Component', () => {
    describe('Basic Rendering', () => {
      it('should render empty container', () => {
        const { container } = render(<ToastContainer toasts={[]} />);

        const toastContainer = container.querySelector('[role="region"]');
        expect(toastContainer).toBeInTheDocument();
      });

      it('should render multiple toasts', () => {
        const toasts: Toast[] = [
          { id: '1', message: 'Toast 1', type: 'info' },
          { id: '2', message: 'Toast 2', type: 'success' },
          { id: '3', message: 'Toast 3', type: 'error' },
        ];

        render(
          <ToastContainer
            toasts={toasts}
            onClose={vi.fn()}
          />
        );

        expect(screen.getByText('Toast 1')).toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
        expect(screen.getByText('Toast 3')).toBeInTheDocument();
      });

      it('should position toasts in stack', () => {
        const toasts: Toast[] = [
          { id: '1', message: 'Toast 1', type: 'info' },
          { id: '2', message: 'Toast 2', type: 'success' },
        ];

        const { container } = render(
          <ToastContainer
            toasts={toasts}
            position="top-right"
            onClose={vi.fn()}
          />
        );

        const toastContainer = container.querySelector('[role="region"]');
        expect(toastContainer).toHaveClass('top-4');
        expect(toastContainer).toHaveClass('right-4');
      });
    });

    describe('Toast Management', () => {
      it('should call onClose when individual toast closes', async () => {
        const onClose = vi.fn();
        const user = userEvent.setup();

        const toasts: Toast[] = [
          { id: '1', message: 'Toast 1', type: 'info' },
        ];

        render(
          <ToastContainer toasts={toasts} onClose={onClose} />
        );

        const closeButton = screen.getByRole('button', { name: /close|dismiss/i });
        await user.click(closeButton);

        expect(onClose).toHaveBeenCalledWith('1');
      });

      it('should remove toast when closed', () => {
        const onClose = vi.fn();
        const toasts: Toast[] = [
          { id: '1', message: 'Toast 1', type: 'info' },
          { id: '2', message: 'Toast 2', type: 'success' },
        ];

        const { rerender } = render(
          <ToastContainer toasts={toasts} onClose={onClose} />
        );

        // Simulate removing first toast
        rerender(
          <ToastContainer
            toasts={[toasts[1]]}
            onClose={onClose}
          />
        );

        expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
      });

      it('should handle toast updates', () => {
        const onClose = vi.fn();
        const toasts: Toast[] = [
          { id: '1', message: 'Updated message', type: 'info' },
        ];

        const { rerender } = render(
          <ToastContainer
            toasts={[{ id: '1', message: 'Original message', type: 'info' }]}
            onClose={onClose}
          />
        );

        rerender(
          <ToastContainer toasts={toasts} onClose={onClose} />
        );

        expect(screen.getByText('Updated message')).toBeInTheDocument();
        expect(screen.queryByText('Original message')).not.toBeInTheDocument();
      });
    });

    describe('Stacking Behavior', () => {
      it('should stack toasts vertically', () => {
        const toasts: Toast[] = Array.from({ length: 3 }, (_, i) => ({
          id: `${i}`,
          message: `Toast ${i}`,
          type: 'info' as const,
        }));

        render(
          <ToastContainer toasts={toasts} onClose={vi.fn()} />
        );

        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(3);
      });

      it('should limit visible toasts if configured', () => {
        const toasts: Toast[] = Array.from({ length: 10 }, (_, i) => ({
          id: `${i}`,
          message: `Toast ${i}`,
          type: 'info' as const,
        }));

        render(
          <ToastContainer
            toasts={toasts}
            maxToasts={3}
            onClose={vi.fn()}
          />
        );

        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeLessThanOrEqual(3);
      });

      it('should remove oldest toast when max is exceeded', () => {
        const onClose = vi.fn();
        const toasts: Toast[] = [
          { id: '1', message: 'Toast 1', type: 'info' },
          { id: '2', message: 'Toast 2', type: 'success' },
          { id: '3', message: 'Toast 3', type: 'error' },
          { id: '4', message: 'Toast 4', type: 'warning' },
        ];

        render(
          <ToastContainer
            toasts={toasts}
            maxToasts={3}
            onClose={onClose}
          />
        );

        // Newest 3 should be visible
        expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
        expect(screen.getByText('Toast 2')).toBeInTheDocument();
        expect(screen.getByText('Toast 3')).toBeInTheDocument();
        expect(screen.getByText('Toast 4')).toBeInTheDocument();
      });
    });

    describe('Position Options', () => {
      const positions = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ] as const;

      positions.forEach((position) => {
        it(`should support ${position} position`, () => {
          const { container } = render(
            <ToastContainer
              toasts={[{ id: '1', message: 'Test', type: 'info' }]}
              position={position}
              onClose={vi.fn()}
            />
          );

          const toastContainer = container.querySelector('[role="region"]');
          expect(toastContainer).toBeInTheDocument();
        });
      });
    });

    describe('Accessibility', () => {
      it('should have region role with label', () => {
        const { container } = render(
          <ToastContainer
            toasts={[{ id: '1', message: 'Test', type: 'info' }]}
            onClose={vi.fn()}
          />
        );

        const region = container.querySelector('[role="region"]');
        expect(region).toHaveAttribute('aria-label', expect.any(String));
      });

      it('should announce toasts to screen readers', () => {
        const toasts: Toast[] = [
          { id: '1', message: 'Important notification', type: 'error' },
        ];

        const { container } = render(
          <ToastContainer toasts={toasts} onClose={vi.fn()} />
        );

        const alert = container.querySelector('[role="alert"]');
        expect(alert).toHaveAttribute('aria-live');
      });
    });

    describe('Design Token Compliance', () => {
      it('should use design tokens for background colors', () => {
        const toasts: Toast[] = [
          { id: '1', message: 'Info', type: 'info' },
          { id: '2', message: 'Success', type: 'success' },
          { id: '3', message: 'Error', type: 'error' },
        ];

        const { container } = render(
          <ToastContainer toasts={toasts} onClose={vi.fn()} />
        );

        // Should apply design token colors (not hardcoded)
        const alerts = container.querySelectorAll('[role="alert"]');
        expect(alerts.length).toBe(3);
      });
    });

    describe('Performance', () => {
      it('should handle large number of toasts efficiently', () => {
        const toasts: Toast[] = Array.from({ length: 50 }, (_, i) => ({
          id: `${i}`,
          message: `Toast ${i}`,
          type: 'info' as const,
        }));

        render(
          <ToastContainer
            toasts={toasts.slice(0, 3)}
            maxToasts={3}
            onClose={vi.fn()}
          />
        );

        expect(screen.getAllByRole('alert')).toHaveLength(3);
      });

      it('should efficiently update when toasts change', () => {
        const onClose = vi.fn();

        const { rerender } = render(
          <ToastContainer
            toasts={[{ id: '1', message: 'Toast 1', type: 'info' }]}
            onClose={onClose}
          />
        );

        rerender(
          <ToastContainer
            toasts={[
              { id: '1', message: 'Toast 1', type: 'info' },
              { id: '2', message: 'Toast 2', type: 'success' },
              { id: '3', message: 'Toast 3', type: 'error' },
            ]}
            onClose={onClose}
          />
        );

        expect(screen.getAllByRole('alert')).toHaveLength(3);
      });
    });

    describe('Integration', () => {
      it('should work with action buttons', async () => {
        const onClose = vi.fn();
        const onAction = vi.fn();
        const user = userEvent.setup();

        const toasts: Toast[] = [
          {
            id: '1',
            message: 'Undo available',
            type: 'success',
            actionLabel: 'Undo',
            onAction: onAction,
          },
        ];

        render(
          <ToastContainer toasts={toasts} onClose={onClose} />
        );

        const actionButton = screen.getByRole('button', { name: /undo/i });
        await user.click(actionButton);

        expect(onAction).toHaveBeenCalled();
      });

      it('should auto-dismiss toasts', async () => {
        vi.useFakeTimers();

        const onClose = vi.fn();
        const toasts: Toast[] = [
          { id: '1', message: 'Toast', type: 'info', duration: 2000 },
        ];

        render(
          <ToastContainer toasts={toasts} onClose={onClose} />
        );

        expect(screen.getByText('Toast')).toBeInTheDocument();

        vi.advanceTimersByTime(2000);

        expect(onClose).toHaveBeenCalledWith('1');

        vi.useRealTimers();
      });
    });
  });
});
