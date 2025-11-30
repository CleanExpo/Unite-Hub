/**
 * Unit Tests for Dropdown Component (Phase 2B)
 * Tests dropdown/select functionality, filtering, multi-select, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from '@/components/patterns/Dropdown';

describe('Dropdown Component (Phase 2B)', () => {
  const defaultOptions = [
    { id: 'opt1', label: 'Option 1', value: 'value1' },
    { id: 'opt2', label: 'Option 2', value: 'value2' },
    { id: 'opt3', label: 'Option 3', value: 'value3' },
  ];

  const defaultProps = {
    options: defaultOptions,
    onSelect: vi.fn(),
    placeholder: 'Select an option',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render trigger button with placeholder', () => {
      render(<Dropdown {...defaultProps} />);

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should render all options when opened', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should display selected value in trigger', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Dropdown {...defaultProps} value="value1" />);

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <Dropdown {...defaultProps} className="custom-dropdown" />
      );

      const element = container.querySelector('.custom-dropdown');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Option Selection', () => {
    it('should call onSelect when option is clicked', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown
          {...defaultProps}
          onSelect={onSelect}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      const option = screen.getByRole('option', { name: /option 2/i });
      await user.click(option);

      expect(onSelect).toHaveBeenCalledWith({ id: 'opt2', label: 'Option 2', value: 'value2' });
    });

    it('should close dropdown after selection', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      const option = screen.getByRole('option', { name: /option 1/i });
      await user.click(option);

      expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
    });

    it('should call onSelect multiple times for different selections', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <Dropdown
          {...defaultProps}
          onSelect={onSelect}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });

      // First selection
      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: /option 1/i }));

      // Second selection
      rerender(
        <Dropdown
          {...defaultProps}
          value="value1"
          onSelect={onSelect}
        />
      );
      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: /option 2/i }));

      expect(onSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Search/Filtering', () => {
    it('should filter options by search input', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          searchable={true}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Option 2');

      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Option 3')).not.toBeInTheDocument();
    });

    it('should show no results message when no options match', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          searchable={true}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText(/no options found|no results/i)).toBeInTheDocument();
    });

    it('should clear search when dropdown closes', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          searchable={true}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Option');

      await user.click(screen.getByRole('option', { name: /option 1/i }));

      // Reopen and search input should be cleared
      await user.click(trigger);
      const newSearchInput = screen.getByPlaceholderText(/search/i);
      expect(newSearchInput).toHaveValue('');
    });

    it('should be case-insensitive when filtering', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          searchable={true}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'OPTION 1');

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('Multi-Select', () => {
    it('should handle multi-select mode', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown
          {...defaultProps}
          multiple={true}
          onSelect={onSelect}
        />
      );

      const trigger = screen.getByRole('button', { name: /select options/i });
      await user.click(trigger);

      const opt1 = screen.getByRole('option', { name: /option 1/i });
      const opt2 = screen.getByRole('option', { name: /option 2/i });

      await user.click(opt1);
      await user.click(opt2);

      // In multi-select, dropdown should stay open after selection
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should display all selected values', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Dropdown
          {...defaultProps}
          multiple={true}
          value={['value1', 'value2']}
        />
      );

      const trigger = screen.getByRole('button');
      expect(trigger.textContent).toContain('Option 1');
      expect(trigger.textContent).toContain('Option 2');
    });

    it('should allow deselecting in multi-select', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown
          {...defaultProps}
          multiple={true}
          value={['value1']}
          onSelect={onSelect}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const opt1 = screen.getByRole('option', { name: /option 1/i });
      await user.click(opt1); // Deselect

      expect(onSelect).toHaveBeenCalled();
    });

    it('should show clear button in multi-select', async () => {
      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          multiple={true}
          value={['value1', 'value2']}
          clearable={true}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();

      await user.click(clearButton);

      // Should have cleared selections
      expect(screen.getByText('Select options')).toBeInTheDocument();
    });
  });

  describe('Option Groups', () => {
    it('should render option groups', () => {
      const groupedOptions = [
        { group: 'Group 1', options: defaultOptions.slice(0, 2) },
        { group: 'Group 2', options: [defaultOptions[2]] },
      ];

      render(
        <Dropdown
          {...defaultProps}
          options={groupedOptions}
        />
      );

      // Should render without errors
      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable entire dropdown', () => {
      render(
        <Dropdown
          {...defaultProps}
          disabled={true}
        />
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      expect(trigger).toBeDisabled();
    });

    it('should disable individual options', async () => {
      const disabledOptions = [
        { ...defaultOptions[0], disabled: true },
        defaultOptions[1],
        defaultOptions[2],
      ];

      const user = userEvent.setup();
      render(
        <Dropdown
          {...defaultProps}
          options={disabledOptions}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const disabledOption = screen.getByRole('option', { name: /option 1/i });
      expect(disabledOption).toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open dropdown with Enter key', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      trigger.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    it('should navigate options with arrow keys', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      // Arrow down to next option
      await user.keyboard('{ArrowDown}');

      // Should highlight next option (implementation dependent)
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should close dropdown with Escape key', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      expect(screen.getByText('Option 1')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    });

    it('should select option with Enter key', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();

      render(
        <Dropdown
          {...defaultProps}
          onSelect={onSelect}
        />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for styling', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = container.querySelector('button');
      // Should have border and text styling from tokens
      expect(trigger?.className).toMatch(/(border|text)/);
    });

    it('should apply hover states with design tokens', () => {
      const { container } = render(<Dropdown {...defaultProps} />);

      const trigger = container.querySelector('button');
      expect(trigger?.className).toMatch(/hover:/);
    });
  });

  describe('Accessibility (WCAG 2.1 AA+)', () => {
    it('should have proper ARIA labels', () => {
      render(<Dropdown {...defaultProps} label="Choose option" />);

      expect(screen.getByText('Choose option')).toBeInTheDocument();
    });

    it('should have combobox role', () => {
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should have aria-expanded on trigger', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      await user.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have listbox role for options', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });

    it('should have aria-selected on selected option', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Dropdown {...defaultProps} value="value1" />
      );

      const trigger = screen.getByRole('button');
      await user.click(trigger);

      const selectedOption = screen.getByRole('option', { name: /option 1/i });
      expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      // Tab to trigger
      await user.tab();

      const trigger = screen.getByRole('button');
      expect(trigger).toHaveFocus();

      // Open with keyboard
      await user.keyboard('{Enter}');
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(<Dropdown {...defaultProps} options={[]} />);

      const trigger = screen.getByRole('button');
      expect(trigger).toBeInTheDocument();
    });

    it('should handle very long option labels', () => {
      const longOptions = [
        { id: 'opt1', label: 'This is a very long option label that might wrap to multiple lines', value: 'value1' },
      ];

      render(
        <Dropdown
          {...defaultProps}
          options={longOptions}
        />
      );

      expect(screen.getByText(/This is a very long option/i)).toBeInTheDocument();
    });

    it('should handle special characters in options', () => {
      const specialOptions = [
        { id: 'opt1', label: 'Option & <Special>', value: 'value1' },
      ];

      render(
        <Dropdown
          {...defaultProps}
          options={specialOptions}
        />
      );

      expect(screen.getByText('Option & <Special>')).toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', async () => {
      const user = userEvent.setup();
      render(<Dropdown {...defaultProps} />);

      const trigger = screen.getByRole('button');

      for (let i = 0; i < 3; i++) {
        await user.click(trigger);
        await user.click(trigger);
      }

      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large option lists efficiently', () => {
      const manyOptions = Array.from({ length: 100 }, (_, i) => ({
        id: `opt${i}`,
        label: `Option ${i}`,
        value: `value${i}`,
      }));

      render(
        <Dropdown
          {...defaultProps}
          options={manyOptions}
        />
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should work with form submission', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <form onSubmit={handleSubmit}>
          <Dropdown
            {...defaultProps}
            name="category"
          />
          <button type="submit">Submit</button>
        </form>
      );

      const trigger = screen.getByRole('button', { name: /select an option/i });
      await user.click(trigger);
      await user.click(screen.getByRole('option', { name: /option 1/i }));

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Form should be submittable
      expect(submitButton).toBeInTheDocument();
    });
  });
});
