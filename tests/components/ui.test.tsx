/**
 * UI Components Tests - Phase 2
 * Basic rendering tests for UI components
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/next/components/ui/Button';
import Badge from '@/next/components/ui/Badge';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('disables when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Badge', () => {
    it('renders with correct variant', () => {
      render(<Badge variant="success">Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  // Add more component tests here
});
