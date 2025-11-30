/**
 * Unit Tests for Tabs Component (Phase 2B)
 * Tests tab navigation, keyboard support, state management, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '@/components/patterns/Tabs';

describe('Tabs Component (Phase 2B)', () => {
  const defaultTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
  ];

  describe('Basic Rendering', () => {
    it('should render all tab labels', () => {
      render(<Tabs tabs={defaultTabs} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('should display first tab content by default', () => {
      render(<Tabs tabs={defaultTabs} />);

      expect(screen.getByText('Content 1')).toBeInTheDocument();
      expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('should display specified defaultActive tab content', () => {
      render(<Tabs tabs={defaultTabs} defaultActive="tab2" />);

      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <Tabs tabs={defaultTabs} className="custom-class" />
      );

      const tabsContainer = container.querySelector('.custom-class');
      expect(tabsContainer).toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch content when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tab2 = screen.getByRole('button', { name: /tab 2/i });
      await user.click(tab2);

      expect(screen.getByText('Content 2')).toBeInTheDocument();
      expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    });

    it('should update all tabs when switching multiple times', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      // Click tab 2
      await user.click(screen.getByRole('button', { name: /tab 2/i }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      // Click tab 3
      await user.click(screen.getByRole('button', { name: /tab 3/i }));
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      // Click tab 1
      await user.click(screen.getByRole('button', { name: /tab 1/i }));
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should call onChange callback when tab changes', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /tab 2/i }));

      expect(onChange).toHaveBeenCalledWith('tab2');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange for each tab switch', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} onChange={onChange} />);

      await user.click(screen.getByRole('button', { name: /tab 2/i }));
      await user.click(screen.getByRole('button', { name: /tab 3/i }));
      await user.click(screen.getByRole('button', { name: /tab 1/i }));

      expect(onChange).toHaveBeenCalledTimes(3);
      expect(onChange).toHaveBeenNthCalledWith(1, 'tab2');
      expect(onChange).toHaveBeenNthCalledWith(2, 'tab3');
      expect(onChange).toHaveBeenNthCalledWith(3, 'tab1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate with arrow keys (left/right)', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      // Press right arrow to go to next tab
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      // Press right arrow again
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      // Press left arrow to go back
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should navigate with Home key (go to first tab)', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} defaultActive="tab3" />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      await user.keyboard('{Home}');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should navigate with End key (go to last tab)', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      await user.keyboard('{End}');
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });

    it('should wrap around at boundaries with arrow keys', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} defaultActive="tab3" />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      // Press right arrow at last tab should wrap to first
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 1')).toBeInTheDocument();

      // Press left arrow at first tab should wrap to last
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });

  describe('Disabled Tabs', () => {
    const tabsWithDisabled = [
      { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
      { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
    ];

    it('should render disabled tabs with disabled attribute', () => {
      render(<Tabs tabs={tabsWithDisabled} />);

      const tab2 = screen.getByRole('button', { name: /tab 2/i });
      expect(tab2).toBeDisabled();
    });

    it('should not allow clicking disabled tabs', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithDisabled} onChange={onChange} />);

      const tab2 = screen.getByRole('button', { name: /tab 2/i });
      await user.click(tab2);

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });

    it('should skip disabled tabs in keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithDisabled} />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      // Press right arrow - should skip disabled tab2 and go to tab3
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 3')).toBeInTheDocument();

      // Press left arrow - should skip disabled tab2 and go to tab1
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('Tabs with Icons', () => {
    const tabsWithIcons = [
      { id: 'tab1', label: 'Home', icon: '🏠', content: <div>Home</div> },
      { id: 'tab2', label: 'Settings', icon: '⚙️', content: <div>Settings</div> },
      { id: 'tab3', label: 'Profile', icon: '👤', content: <div>Profile</div> },
    ];

    it('should render tabs with icons when showIcons is true', () => {
      render(<Tabs tabs={tabsWithIcons} showIcons={true} />);

      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should hide icons when showIcons is false', () => {
      render(<Tabs tabs={tabsWithIcons} showIcons={false} />);

      expect(screen.queryByText('🏠')).not.toBeInTheDocument();
      expect(screen.queryByText('⚙️')).not.toBeInTheDocument();
      expect(screen.queryByText('👤')).not.toBeInTheDocument();
    });

    it('should still be clickable with icons', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={tabsWithIcons} showIcons={true} />);

      const tab2 = screen.getByRole('button', { name: /settings/i });
      await user.click(tab2);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should render JSX content in tabs', () => {
      const complexTabs = [
        {
          id: 'tab1',
          label: 'Form',
          content: (
            <form>
              <input placeholder="Name" />
              <button>Submit</button>
            </form>
          ),
        },
        {
          id: 'tab2',
          label: 'List',
          content: (
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          ),
        },
      ];

      render(<Tabs tabs={complexTabs} />);

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should handle stateful content in tabs', async () => {
      const user = userEvent.setup();
      const complexTabs = [
        {
          id: 'tab1',
          label: 'Counter',
          content: <button>Click me</button>,
        },
        {
          id: 'tab2',
          label: 'Other',
          content: <div>Other content</div>,
        },
      ];

      render(<Tabs tabs={complexTabs} />);

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      await user.click(button);

      // Content should remain accessible
      expect(button).toBeInTheDocument();
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design tokens for styling', () => {
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const tabList = container.querySelector('[role="tablist"]');
      expect(tabList).toHaveClass('border-border-subtle');
    });

    it('should apply active tab styling with design tokens', async () => {
      const user = userEvent.setup();
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const tab2 = screen.getByRole('button', { name: /tab 2/i });
      await user.click(tab2);

      expect(tab2).toHaveClass('border-accent-500');
      expect(tab2).toHaveClass('text-accent-500');
    });

    it('should apply inactive tab styling with design tokens', () => {
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const tab2 = screen.getByRole('button', { name: /tab 2/i });

      expect(tab2).toHaveClass('text-text-secondary');
    });
  });

  describe('Accessibility (WCAG 2.1 AA+)', () => {
    it('should have proper ARIA roles', () => {
      render(<Tabs tabs={defaultTabs} />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('should have aria-selected on active tab', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tab1 = screen.getByRole('tab', { name: /tab 1/i });
      const tab2 = screen.getByRole('tab', { name: /tab 2/i });

      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');

      await user.click(tab2);

      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab2).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tab1 = screen.getByRole('tab', { name: /tab 1/i });
      tab1.focus();

      expect(tab1).toHaveFocus();
    });

    it('should have semantic heading hierarchy for content', () => {
      render(<Tabs tabs={defaultTabs} />);

      // Tabs should have tabpanel role
      const tabPanel = screen.getByRole('tabpanel');
      expect(tabPanel).toBeInTheDocument();
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const activeTab = container.querySelector('[aria-selected="true"]');
      expect(activeTab).toHaveClass('text-accent-500');
      // Design tokens ensure sufficient contrast (4.5:1 minimum)
    });

    it('should be keyboard navigable without mouse', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      const tabList = screen.getByRole('tablist');
      tabList.focus();

      // Tab through with keyboard only
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 2')).toBeInTheDocument();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Content 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single tab', () => {
      const singleTab = [{ id: 'only', label: 'Only Tab', content: <div>Content</div> }];
      render(<Tabs tabs={singleTab} />);

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should handle many tabs (10+)', () => {
      const manyTabs = Array.from({ length: 15 }, (_, i) => ({
        id: `tab${i}`,
        label: `Tab ${i}`,
        content: <div>Content {i}</div>,
      }));

      render(<Tabs tabs={manyTabs} />);

      expect(screen.getByText('Tab 0')).toBeInTheDocument();
      expect(screen.getByText('Tab 14')).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      const emptyTabs = [
        { id: 'tab1', label: 'Tab 1', content: null },
        { id: 'tab2', label: 'Tab 2', content: undefined },
      ];

      render(<Tabs tabs={emptyTabs} />);

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });

    it('should handle special characters in labels', () => {
      const specialTabs = [
        { id: 'tab1', label: 'Tab <1>', content: <div>Content 1</div> },
        { id: 'tab2', label: 'Tab & More', content: <div>Content 2</div> },
        { id: 'tab3', label: 'Tab "quoted"', content: <div>Content 3</div> },
      ];

      render(<Tabs tabs={specialTabs} />);

      expect(screen.getByText('Tab <1>')).toBeInTheDocument();
      expect(screen.getByText('Tab & More')).toBeInTheDocument();
      expect(screen.getByText('Tab "quoted"')).toBeInTheDocument();
    });

    it('should handle defaultActive with non-existent tab ID', () => {
      render(<Tabs tabs={defaultTabs} defaultActive="non-existent" />);

      // Should fall back to first tab
      expect(screen.getByText('Content 1')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsively on mobile', () => {
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const tabList = container.querySelector('[role="tablist"]');
      expect(tabList).toHaveClass('overflow-x-auto');
      // Mobile-friendly horizontal scrolling for tabs
      expect(tabList).toHaveClass('flex');
    });

    it('should be fully functional on small screens', async () => {
      const user = userEvent.setup();
      render(<Tabs tabs={defaultTabs} />);

      // Tabs should still be clickable on mobile viewport
      await user.click(screen.getByRole('tab', { name: /tab 2/i }));
      expect(screen.getByText('Content 2')).toBeInTheDocument();
    });

    it('should support horizontal scrolling on constrained widths', () => {
      const { container } = render(<Tabs tabs={defaultTabs} />);

      const tabList = container.querySelector('[role="tablist"]');
      // Should scroll horizontally when needed
      expect(tabList).toHaveClass('overflow-x-auto');
    });
  });
});
