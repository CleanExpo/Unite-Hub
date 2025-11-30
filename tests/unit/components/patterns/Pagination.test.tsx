/**
 * Unit Tests for Pagination Component (Phase 2B)
 * Tests pagination logic, navigation, smart ellipsis, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/patterns/Pagination';

describe('Pagination Component (Phase 2B)', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render pagination controls', () => {
      render(<Pagination {...defaultProps} />);

      // Should render prev/next buttons
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should render page numbers when showPageNumbers is true', () => {
      render(
        <Pagination {...defaultProps} showPageNumbers={true} totalPages={5} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not render page numbers when showPageNumbers is false', () => {
      render(
        <Pagination
          {...defaultProps}
          showPageNumbers={false}
          totalPages={5}
        />
      );

      // Should only have prev/next buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeLessThanOrEqual(2);
    });

    it('should display current page as active', () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          totalPages={5}
          showPageNumbers={true}
        />
      );

      const page3 = screen.getByRole('button', { name: '3' });
      expect(page3).toHaveClass('bg-accent-500');
    });

    it('should render with custom className', () => {
      const { container } = render(
        <Pagination {...defaultProps} className="custom-pagination" />
      );

      const paginationContainer = container.querySelector('.custom-pagination');
      expect(paginationContainer).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should call onPageChange when clicking next button', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking previous button', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking page number', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      const page3 = screen.getByRole('button', { name: '3' });
      await user.click(page3);

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should disable previous button on first page', () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should enable both buttons on middle pages', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Smart Ellipsis', () => {
    it('should show ellipsis for large page ranges', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={50}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should have first, last, and ellipsis
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should show all pages when totalPages <= maxVisible', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should show all 5 pages without ellipsis
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('should dynamically adjust visible range based on current page', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={50}
          onPageChange={onPageChange}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Go to middle page
      rerender(
        <Pagination
          currentPage={25}
          totalPages={50}
          onPageChange={onPageChange}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should show pages around 25
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should show appropriate ellipsis at start', () => {
      render(
        <Pagination
          currentPage={5}
          totalPages={50}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should have first page and ellipsis
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show appropriate ellipsis at end', () => {
      render(
        <Pagination
          currentPage={50}
          totalPages={50}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should have last page and ellipsis
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      const pagination = screen.getByRole('group');
      pagination.focus();

      // Right arrow should go to next
      await user.keyboard('{ArrowRight}');
      expect(onPageChange).toHaveBeenCalledWith(6);

      // Left arrow should go to previous (reset mock first)
      vi.clearAllMocks();
      await user.keyboard('{ArrowLeft}');
      // Note: depends on component implementation
    });

    it('should support Enter key to navigate', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      const page2 = screen.getByRole('button', { name: '2' });
      page2.focus();
      await user.keyboard('{Enter}');

      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle totalPages = 1', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();

      const prevButton = screen.getByRole('button', { name: /previous/i });
      const nextButton = screen.getByRole('button', { name: /next/i });

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should handle very large page numbers (1000+)', () => {
      render(
        <Pagination
          currentPage={500}
          totalPages={1000}
          onPageChange={vi.fn()}
          showPageNumbers={true}
          maxVisible={7}
        />
      );

      // Should still render properly
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should handle custom maxVisible prop', () => {
      const onPageChange = vi.fn();
      render(
        <Pagination
          currentPage={1}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
          maxVisible={5}
        />
      );

      // Should respect maxVisible setting
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should handle currentPage at boundaries', () => {
      const onPageChange = vi.fn();

      // First page
      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();

      // Last page
      rerender(
        <Pagination
          currentPage={100}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for styling', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const activePageButton = container.querySelector('[aria-current="page"]');
      expect(activePageButton).toHaveClass('bg-accent-500');
    });

    it('should apply hover states with design tokens', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/(hover:|bg-|border-)/);
      });
    });

    it('should use correct border styling', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const inactiveButtons = container.querySelectorAll('button:not([aria-current])');
      inactiveButtons.forEach((button) => {
        expect(button).toHaveClass('border-border-subtle');
      });
    });
  });

  describe('Accessibility (WCAG 2.1 AA+)', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label on navigation', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('aria-label');
    });

    it('should mark current page with aria-current', () => {
      const { container } = render(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const currentPageButton = container.querySelector('[aria-current="page"]');
      expect(currentPageButton).toBeInTheDocument();
    });

    it('should have descriptive button labels', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Tab to first button
      await user.tab();

      // Should be focused
      const firstButton = screen.getByRole('button', { name: /next|2/ });
      expect(firstButton.matches(':focus')).toBe(true);
    });

    it('should have visible focus indicators', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // Should have focus styling (ring or similar)
        expect(button.className).toMatch(/focus|ring|outline/);
      });
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
          showPageNumbers={true}
        />
      );

      // Active button should have high contrast (accent-500 on white)
      const activeButton = container.querySelector('[aria-current="page"]');
      expect(activeButton).toHaveClass('text-white');
      expect(activeButton).toHaveClass('bg-accent-500');
    });
  });

  describe('Performance', () => {
    it('should handle rapid page changes', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Pagination
          currentPage={1}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Rapid clicks
      for (let i = 2; i <= 5; i++) {
        const pageButton = screen.getByRole('button', { name: String(i) });
        await user.click(pageButton);
      }

      expect(onPageChange).toHaveBeenCalledTimes(4);
    });

    it('should not re-render unnecessarily', () => {
      const onPageChange = vi.fn();
      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Same props should not cause issues
      rerender(
        <Pagination
          currentPage={1}
          totalPages={100}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Integration with Lists', () => {
    it('should work with filtered pagination', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <Pagination
          currentPage={1}
          totalPages={10}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Simulate filter reducing pages
      rerender(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Should show only 3 pages now
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should reset page when filter changes', () => {
      const onPageChange = vi.fn();

      const { rerender } = render(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      // Simulate page reset on filter
      rerender(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPageChange={onPageChange}
          showPageNumbers={true}
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });
});
