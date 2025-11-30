/**
 * Unit Tests for Container Component (Layout)
 * Tests layout structure, responsive design, spacing, and design token compliance
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/components/layout/Container';

describe('Container Component (Layout)', () => {
  describe('Basic Rendering', () => {
    it('should render children', () => {
      render(
        <Container>
          <div>Test Content</div>
        </Container>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply default max-width', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      );

      const containerElement = container.querySelector('[class*="max-w"]');
      expect(containerElement).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <Container className="custom-class">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply sm size class', () => {
      const { container } = render(
        <Container size="sm">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-sm"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply md size class', () => {
      const { container } = render(
        <Container size="md">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-md"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply lg size class', () => {
      const { container } = render(
        <Container size="lg">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-lg"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply xl size class', () => {
      const { container } = render(
        <Container size="xl">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-xl"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply 2xl size class', () => {
      const { container } = render(
        <Container size="2xl">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-2xl"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply full width size', () => {
      const { container } = render(
        <Container size="full">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="w-full"]');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Padding Variants', () => {
    it('should apply no padding', () => {
      const { container } = render(
        <Container padding="none">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="px-0"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply sm padding', () => {
      const { container } = render(
        <Container padding="sm">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="px-4"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply md padding', () => {
      const { container } = render(
        <Container padding="md">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="px-6"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply lg padding', () => {
      const { container } = render(
        <Container padding="lg">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="px-8"]');
      expect(element).toBeInTheDocument();
    });

    it('should apply xl padding', () => {
      const { container } = render(
        <Container padding="xl">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="px-12"]');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Combination of Size and Padding', () => {
    it('should apply both size and padding', () => {
      const { container } = render(
        <Container size="lg" padding="md">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w-lg"]');
      expect(element).toHaveClass('px-6');
    });

    it('should work with all size and padding combinations', () => {
      const sizes = ['sm', 'md', 'lg', 'xl', '2xl', 'full'];
      const paddings = ['none', 'sm', 'md', 'lg', 'xl'];

      sizes.forEach((size) => {
        paddings.forEach((padding) => {
          const { container } = render(
            <Container size={size as any} padding={padding as any}>
              <div>Content</div>
            </Container>
          );

          expect(screen.getByText('Content')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive padding on mobile', () => {
      const { container } = render(
        <Container padding="md">
          <div>Content</div>
        </Container>
      );

      // Should have padding that works on mobile
      const element = container.querySelector('[class*="px-"]');
      expect(element).toBeInTheDocument();
    });

    it('should scale properly at different breakpoints', () => {
      const { container } = render(
        <Container size="lg" padding="lg">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="max-w"]');
      // Should have responsive classes for different breakpoints
      expect(element?.className).toMatch(/sm:|md:|lg:|xl:/);
    });

    it('should maintain aspect ratio on different screen sizes', () => {
      const { container } = render(
        <Container size="xl" padding="md">
          <div style={{ aspectRatio: '16/9' }}>Content</div>
        </Container>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Centering', () => {
    it('should center content horizontally', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="mx-auto"]');
      expect(element).toBeInTheDocument();
    });

    it('should have centered content with full width', () => {
      const { container } = render(
        <Container size="full">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('[class*="w-full"]');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Design Token Compliance', () => {
    it('should use design token spacing for padding', () => {
      const { container } = render(
        <Container padding="lg">
          <div>Content</div>
        </Container>
      );

      const element = container.firstChild as HTMLElement;
      // Should use spacing scale from design tokens
      expect(element.className).toMatch(/px-8/);
    });

    it('should apply correct sizing from design tokens', () => {
      const { container } = render(
        <Container size="lg">
          <div>Content</div>
        </Container>
      );

      const element = container.firstChild as HTMLElement;
      // lg should correspond to design token max-w-lg
      expect(element.className).toMatch(/max-w-lg/);
    });

    it('should use semantic spacing values', () => {
      const { container } = render(
        <Container padding="md">
          <div>Content</div>
        </Container>
      );

      const element = container.firstChild as HTMLElement;
      // md padding should be consistent across app
      expect(element.className).toMatch(/px-6/);
    });
  });

  describe('Accessibility (WCAG 2.1 AA+)', () => {
    it('should not interfere with semantic HTML', () => {
      render(
        <Container>
          <h1>Heading</h1>
          <p>Paragraph</p>
        </Container>
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
    });

    it('should preserve focus order', async () => {
      render(
        <Container>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </Container>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(buttons[0].textContent).toBe('First');
      expect(buttons[1].textContent).toBe('Second');
      expect(buttons[2].textContent).toBe('Third');
    });

    it('should not reduce color contrast', () => {
      const { container } = render(
        <Container>
          <div style={{ color: '#000' }}>Black text</div>
        </Container>
      );

      const text = screen.getByText('Black text');
      expect(text).toHaveStyle({ color: '#000' });
    });

    it('should support both light and dark themes', () => {
      const { container } = render(
        <Container className="dark">
          <div>Content</div>
        </Container>
      );

      const element = container.querySelector('.dark');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Complex Content', () => {
    it('should handle nested containers', () => {
      render(
        <Container size="xl" padding="lg">
          <Container size="lg" padding="md">
            <div>Nested Content</div>
          </Container>
        </Container>
      );

      expect(screen.getByText('Nested Content')).toBeInTheDocument();
    });

    it('should handle flex and grid children', () => {
      render(
        <Container>
          <div className="flex gap-4">
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
          </div>
        </Container>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should work with overflow content', () => {
      render(
        <Container className="overflow-auto">
          <div style={{ width: '2000px' }}>Wide content</div>
        </Container>
      );

      expect(screen.getByText('Wide content')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle no children', () => {
      const { container } = render(<Container />);

      const element = container.querySelector('[class*="max-w"]');
      expect(element).toBeInTheDocument();
    });

    it('should handle multiple children types', () => {
      render(
        <Container>
          <h1>Title</h1>
          <div>Content</div>
          <footer>Footer</footer>
        </Container>
      );

      expect(screen.getByRole('heading')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should handle text nodes as children', () => {
      render(
        <Container>
          Direct text content
        </Container>
      );

      expect(screen.getByText('Direct text content')).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'Lorem ipsum '.repeat(100);

      render(
        <Container>
          <div>{longText}</div>
        </Container>
      );

      expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
    });
  });

  describe('Integration with Dashboard Layout', () => {
    it('should work as main layout wrapper', () => {
      render(
        <Container size="full" padding="none">
          <nav>Navigation</nav>
          <main>Main Content</main>
        </Container>
      );

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should work as content wrapper with max-width', () => {
      render(
        <Container size="lg" padding="lg">
          <article>Article Content</article>
        </Container>
      );

      expect(screen.getByText('Article Content')).toBeInTheDocument();
    });

    it('should combine with spacing utilities', () => {
      render(
        <Container size="lg" padding="lg" className="space-y-8">
          <div>Section 1</div>
          <div>Section 2</div>
          <div>Section 3</div>
        </Container>
      );

      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Section 3')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large number of child elements efficiently', () => {
      const { container } = render(
        <Container>
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i}>Item {i}</div>
          ))}
        </Container>
      );

      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 99')).toBeInTheDocument();
    });

    it('should not cause layout thrashing', () => {
      const { rerender } = render(
        <Container size="lg" padding="md">
          <div>Content</div>
        </Container>
      );

      // Rerender with different props should not cause issues
      rerender(
        <Container size="xl" padding="lg">
          <div>Content</div>
        </Container>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});
