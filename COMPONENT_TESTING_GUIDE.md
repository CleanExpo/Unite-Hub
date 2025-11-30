# Component Testing Guide

Complete guide for testing Phase 2 components with examples and best practices.

**Last Updated**: November 30, 2025
**Status**: Ready for Implementation

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Accessibility Tests](#accessibility-tests)
5. [Visual Regression Tests](#visual-regression-tests)
6. [Performance Tests](#performance-tests)

---

## Testing Strategy

### Test Pyramid

```
              /\
             /  \      E2E & Visual
            /----\     (10% of tests)
           /      \
          /--------\   Integration Tests
         /          \  (30% of tests)
        /            \
       /              \ Unit Tests
      /________________\(60% of tests)
```

### Test Scope

**Unit Tests** (60%)
- Component rendering
- Props validation
- User interactions
- State changes
- Event handlers
- Accessibility attributes

**Integration Tests** (30%)
- Component composition
- Data flow between components
- Form submissions
- Navigation
- Modal interactions

**E2E & Visual** (10%)
- Complete user flows
- Visual regression
- Cross-browser testing
- Responsive design verification

---

## Unit Tests

### Button Component Test

```typescript
// src/components/ui/__tests__/Button.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with default props', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders button with text content', () => {
      render(<Button>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('applies primary variant styling', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-accent-500');
    });

    it('applies secondary variant styling', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-bg-card');
    });

    it('applies sm size styling', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-5');
    });

    it('applies md size styling', () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-7');
    });

    it('applies full width styling', () => {
      render(<Button fullWidth>Full Width</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles loading state', () => {
      render(<Button isLoading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Loading spinner should be visible
    });

    it('applies disabled styling', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-50');
    });
  });

  describe('Interactions', () => {
    it('calls onClick handler on click', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard activation with Enter', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('supports keyboard activation with Space', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: ' ' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not fire onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Click</Button>);

      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus ring', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-accent-500');
    });

    it('is keyboard navigable', () => {
      render(<Button>Tab to me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Icons', () => {
    it('renders icon before text', () => {
      const IconComponent = () => <span data-testid="icon">→</span>;
      render(<Button icon={<IconComponent />}>Text</Button>);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('renders icon after text when iconRight prop', () => {
      const IconComponent = () => <span data-testid="icon">→</span>;
      render(<Button iconRight={<IconComponent />}>Text</Button>);

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });
});
```

### Input Component Test

```typescript
// src/components/ui/__tests__/Input.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders textarea when as="textarea"', () => {
      render(<Input as="textarea" />);
      expect(screen.getByRole('textbox')).toHaveTagName('TEXTAREA');
    });

    it('applies correct input type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders helper text', () => {
      render(<Input helperText="Enter valid email" />);
      expect(screen.getByText('Enter valid email')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when error is true', () => {
      render(<Input error errorMessage="Invalid input" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    it('applies error styling', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-error');
    });

    it('has aria-invalid attribute when error', () => {
      render(<Input error />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('User Interactions', () => {
    it('updates value on input change', async () => {
      render(<Input defaultValue="" />);
      const input = screen.getByRole('textbox');

      await userEvent.type(input, 'test@example.com');
      expect(input).toHaveValue('test@example.com');
    });

    it('shows focus styling', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(input).toHaveFocus();
    });

    it('handles disabled state', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('associates label with input', () => {
      render(<Input label="Email" />);
      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('has focus ring on focus', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-accent-500');
    });
  });
});
```

---

## Integration Tests

### Hero Section Test

```typescript
// src/components/sections/__tests__/HeroSection.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroSection } from '../HeroSection';

describe('HeroSection Component', () => {
  const defaultProps = {
    title: 'Welcome to Synthex',
    primaryCTA: { label: 'Get Started', href: '/signup' }
  };

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<HeroSection {...defaultProps} />);
      expect(screen.getByText('Welcome to Synthex')).toBeInTheDocument();
    });

    it('renders tag when provided', () => {
      render(
        <HeroSection {...defaultProps} tag="Welcome" />
      );
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <HeroSection
          {...defaultProps}
          description="Start automating today"
        />
      );
      expect(screen.getByText('Start automating today')).toBeInTheDocument();
    });

    it('renders primary CTA button', () => {
      render(<HeroSection {...defaultProps} />);
      const link = screen.getByText('Get Started');
      expect(link).toHaveAttribute('href', '/signup');
    });

    it('renders secondary CTA when provided', () => {
      render(
        <HeroSection
          {...defaultProps}
          secondaryCTA={{ label: 'Watch Demo', href: '/demo' }}
        />
      );
      expect(screen.getByText('Watch Demo')).toBeInTheDocument();
    });

    it('renders stats when provided', () => {
      const stats = [
        { label: 'Businesses', value: '500+' },
        { label: 'Growth', value: '3.5x' }
      ];
      render(
        <HeroSection {...defaultProps} stats={stats} />
      );

      expect(screen.getByText('500+')).toBeInTheDocument();
      expect(screen.getByText('3.5x')).toBeInTheDocument();
      expect(screen.getByText('Businesses')).toBeInTheDocument();
    });
  });

  describe('Alignment', () => {
    it('applies left alignment by default', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const content = container.querySelector('[class*="text-left"]');
      expect(content).toBeInTheDocument();
    });

    it('applies center alignment when align="center"', () => {
      const { container } = render(
        <HeroSection {...defaultProps} align="center" />
      );
      expect(container.querySelector('[class*="text-center"]')).toBeInTheDocument();
    });
  });

  describe('Layouts', () => {
    it('renders default layout', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      expect(container.querySelector('[class*="max-w-4xl"]')).toBeInTheDocument();
    });

    it('renders split layout with children', () => {
      render(
        <HeroSection {...defaultProps} heroLayout="split">
          <div data-testid="image">Image content</div>
        </HeroSection>
      );
      expect(screen.getByTestId('image')).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('applies responsive padding', () => {
      const { container } = render(<HeroSection {...defaultProps} />);
      const hero = container.querySelector('[class*="py-20"]');
      expect(hero).toHaveClass('py-20', 'md:py-32', 'lg:py-40');
    });

    it('applies responsive typography', () => {
      render(<HeroSection {...defaultProps} />);
      const title = screen.getByText('Welcome to Synthex');
      expect(title).toHaveClass('text-5xl', 'md:text-6xl', 'lg:text-7xl');
    });
  });
});
```

---

## Accessibility Tests

### Button Accessibility Test

```typescript
// src/components/ui/__tests__/Button.a11y.test.tsx

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper focus management', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button');

    button.focus();
    expect(button).toHaveFocus();
    expect(button).toHaveClass('focus:ring-2');
  });

  it('is properly labeled', () => {
    render(<Button>Submit Form</Button>);
    expect(screen.getByRole('button', { name: 'Submit Form' })).toBeInTheDocument();
  });

  it('announces disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports keyboard activation', () => {
    render(<Button>Press Space/Enter</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('has proper semantic HTML', () => {
    const { container } = render(<Button>Button Text</Button>);
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});
```

---

## Visual Regression Tests

### Snapshot Testing

```typescript
// src/components/__tests__/snapshots.test.tsx

import { render } from '@testing-library/react';
import * as Components from '@/components';

describe('Component Snapshots', () => {
  describe('Primitives', () => {
    it('Button matches snapshot', () => {
      const { container } = render(
        <Components.Button variant="primary">Click me</Components.Button>
      );
      expect(container).toMatchSnapshot();
    });

    it('Card matches snapshot', () => {
      const { container } = render(
        <Components.Card padding="md">Card content</Components.Card>
      );
      expect(container).toMatchSnapshot();
    });

    it('Input matches snapshot', () => {
      const { container } = render(
        <Components.Input label="Email" placeholder="Enter email" />
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('Sections', () => {
    it('HeroSection matches snapshot', () => {
      const { container } = render(
        <Components.HeroSection
          title="Welcome"
          primaryCTA={{ label: 'Start', href: '/start' }}
        />
      );
      expect(container).toMatchSnapshot();
    });

    it('BenefitsGrid matches snapshot', () => {
      const { container } = render(
        <Components.BenefitsGrid
          title="Benefits"
          benefits={[
            { title: 'Feature 1', description: 'Description 1' }
          ]}
        />
      );
      expect(container).toMatchSnapshot();
    });
  });
});
```

### Visual Testing with Chromatic

```typescript
// src/components/__tests__/visual.test.tsx

import { render } from '@testing-library/react';
import { visual } from '@chromatic-qa/chromatic';
import * as Components from '@/components';

describe('Visual Regression', () => {
  describe('Button Variants', () => {
    it('Primary button visual', () => {
      const { container } = render(
        <Components.Button variant="primary">Primary</Components.Button>
      );
      visual(container, 'button-primary');
    });

    it('Secondary button visual', () => {
      const { container } = render(
        <Components.Button variant="secondary">Secondary</Components.Button>
      );
      visual(container, 'button-secondary');
    });
  });

  describe('Card Variants', () => {
    it('Default card visual', () => {
      const { container } = render(
        <Components.Card>Card content</Components.Card>
      );
      visual(container, 'card-default');
    });

    it('Card with accent bar visual', () => {
      const { container } = render(
        <Components.Card accentBar>Card with accent</Components.Card>
      );
      visual(container, 'card-accent-bar');
    });
  });
});
```

---

## Performance Tests

### Render Performance Test

```typescript
// src/components/__tests__/performance.test.tsx

import { render } from '@testing-library/react';
import { measureRender } from '@testing-library/react-hooks';
import * as Components from '@/components';

describe('Component Performance', () => {
  it('Button renders in under 10ms', () => {
    const duration = measureRender(() => (
      <Components.Button>Click me</Components.Button>
    ));
    expect(duration).toBeLessThan(10);
  });

  it('Card renders in under 10ms', () => {
    const duration = measureRender(() => (
      <Components.Card>Content</Components.Card>
    ));
    expect(duration).toBeLessThan(10);
  });

  it('HeroSection renders in under 20ms', () => {
    const duration = measureRender(() => (
      <Components.HeroSection
        title="Test"
        primaryCTA={{ label: 'CTA', href: '/' }}
      />
    ));
    expect(duration).toBeLessThan(20);
  });

  it('Table with 100 rows renders in under 100ms', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: i
    }));

    const duration = measureRender(() => (
      <Components.Table
        columns={[
          { id: 'name', label: 'Name' },
          { id: 'value', label: 'Value' }
        ]}
        data={data}
      />
    ));
    expect(duration).toBeLessThan(100);
  });
});
```

---

## Test Coverage Goals

| Category | Target | Status |
|----------|--------|--------|
| Unit Tests | 80%+ | ⏳ To Implement |
| Integration Tests | 60%+ | ⏳ To Implement |
| Accessibility Tests | 100% | ⏳ To Implement |
| Visual Regression | 100% | ⏳ To Implement |
| Overall Coverage | 75%+ | ⏳ To Implement |

---

## Running Tests

### Setup

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @types/jest
npm install --save-dev jest-axe @chromatic-qa/chromatic

# Configure Jest (jest.config.js)
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- Button.test.tsx

# Run with coverage
npm test -- --coverage

# Run accessibility tests only
npm test -- --testPathPattern="a11y"

# Run visual tests only
npm test -- --testPathPattern="visual"
```

### Coverage Report

```bash
# Generate coverage report
npm test -- --coverage

# Expected output:
# ✓ src/components/ui/Button.tsx         90% Statements, 85% Branches
# ✓ src/components/ui/Card.tsx           85% Statements, 80% Branches
# ✓ src/components/sections/HeroSection  88% Statements, 82% Branches
# ...
# Overall: 85% Statements, 80% Branches, 78% Functions, 80% Lines
```

---

## Best Practices

### 1. Test User Behavior, Not Implementation

```typescript
// ❌ AVOID - Testing implementation details
it('calls setState with new value', () => {
  const { getByTestId } = render(<Button />);
  fireEvent.click(getByTestId('button'));
  expect(setState).toHaveBeenCalled();
});

// ✅ DO - Test user behavior
it('fires click handler when clicked', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalled();
});
```

### 2. Use Semantic Queries

```typescript
// ❌ AVOID - CSS selectors
const button = container.querySelector('.bg-accent-500');

// ✅ DO - Semantic queries
const button = screen.getByRole('button');
```

### 3. Test Accessibility First

```typescript
// Every component test should include:
- Focus management
- ARIA attributes
- Keyboard navigation
- Semantic HTML
- Color contrast (in visual tests)
```

### 4. Arrange-Act-Assert Pattern

```typescript
it('updates input value on change', async () => {
  // Arrange
  render(<Input defaultValue="" />);
  const input = screen.getByRole('textbox');

  // Act
  await userEvent.type(input, 'test@example.com');

  // Assert
  expect(input).toHaveValue('test@example.com');
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v2

      - name: Run accessibility tests
        run: npm test -- --testPathPattern="a11y"
```

---

## Summary

This testing guide provides a comprehensive approach to testing Phase 2 components:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interactions
- **Accessibility Tests**: WCAG compliance
- **Visual Tests**: Snapshot and visual regression
- **Performance Tests**: Rendering speed and efficiency

All tests follow best practices and can be run locally or in CI/CD pipelines.

---

**Status**: Ready for Implementation
**Next Steps**: Implement tests according to this guide
