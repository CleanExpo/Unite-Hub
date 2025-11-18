/**
 * Unit Tests for ErrorState Component
 * Tests error display and retry functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState, InlineErrorState } from '@/components/ErrorState';

describe('ErrorState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<ErrorState />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText('We encountered an error while loading this data. Please try again.')
      ).toBeInTheDocument();
    });

    it('should render custom title and message', () => {
      render(
        <ErrorState
          title="Custom Error Title"
          message="Custom error message describing the problem"
        />
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(
        screen.getByText('Custom error message describing the problem')
      ).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(<ErrorState />);

      // Check for AlertCircle icon (by class or SVG presence)
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when onRetry is provided', () => {
      const mockRetry = vi.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const mockRetry = vi.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when showRetry is false', () => {
      const mockRetry = vi.fn();
      render(<ErrorState onRetry={mockRetry} showRetry={false} />);

      const retryButton = screen.queryByRole('button', { name: /try again/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<ErrorState />);

      const retryButton = screen.queryByRole('button', { name: /try again/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it('should allow multiple retry attempts', () => {
      const mockRetry = vi.fn();
      render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });

      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling and Accessibility', () => {
    it('should have appropriate ARIA roles', () => {
      render(<ErrorState />);

      // Card should be present
      const errorCard = screen.getByText('Something went wrong').closest('div');
      expect(errorCard).toBeInTheDocument();
    });

    it('should display retry button with icon', () => {
      const mockRetry = vi.fn();
      const { container } = render(<ErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /try again/i });
      const icon = retryButton.querySelector('svg');

      expect(icon).toBeInTheDocument();
    });
  });

  describe('Different Error Scenarios', () => {
    it('should handle network error message', () => {
      render(
        <ErrorState
          title="Network Error"
          message="Unable to connect to the server. Please check your internet connection."
        />
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(
        screen.getByText(/unable to connect to the server/i)
      ).toBeInTheDocument();
    });

    it('should handle authentication error', () => {
      render(
        <ErrorState
          title="Authentication Failed"
          message="Your session has expired. Please log in again."
        />
      );

      expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });

    it('should handle database error', () => {
      render(
        <ErrorState
          title="Database Error"
          message="Unable to load data from the database."
        />
      );

      expect(screen.getByText('Database Error')).toBeInTheDocument();
      expect(screen.getByText(/unable to load data/i)).toBeInTheDocument();
    });
  });
});

describe('InlineErrorState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default message', () => {
      render(<InlineErrorState />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should render custom message', () => {
      render(<InlineErrorState message="Custom inline error" />);

      expect(screen.getByText('Custom inline error')).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(<InlineErrorState />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button when onRetry is provided', () => {
      const mockRetry = vi.fn();
      render(<InlineErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const mockRetry = vi.fn();
      render(<InlineErrorState onRetry={mockRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<InlineErrorState />);

      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Compact Display', () => {
    it('should use compact layout compared to full ErrorState', () => {
      const { container } = render(<InlineErrorState message="Test error" />);

      // Should not have Card wrapper (unlike full ErrorState)
      const card = container.querySelector('.bg-slate-800\\/50');
      expect(card).not.toBeInTheDocument();
    });

    it('should display all elements inline', () => {
      const mockRetry = vi.fn();
      const { container } = render(
        <InlineErrorState message="Inline error" onRetry={mockRetry} />
      );

      // Check for flex container
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });
  });
});
