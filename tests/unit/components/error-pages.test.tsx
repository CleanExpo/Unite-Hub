/**
 * Error Boundary & Not Found Page Tests
 * Tests for production hardening error pages.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  AlertCircle: (props: any) => <div data-testid="alert-icon" {...props} />,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => (
    <div data-testid="card" {...props}>{children}</div>
  ),
}));

describe('NotFound Page (App)', () => {
  it('should render 404 text', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText('Page Not Found')).toBeDefined();
  });

  it('should render link back to home', async () => {
    const { default: NotFound } = await import('@/app/not-found');
    render(<NotFound />);
    const link = screen.getByText('Back to Home');
    expect(link).toBeDefined();
    expect(link.closest('a')?.getAttribute('href')).toBe('/');
  });
});

describe('DashboardNotFound Page', () => {
  it('should render 404 text', async () => {
    const { default: DashboardNotFound } = await import('@/app/dashboard/not-found');
    render(<DashboardNotFound />);
    expect(screen.getByText('404')).toBeDefined();
  });

  it('should link to dashboard overview', async () => {
    const { default: DashboardNotFound } = await import('@/app/dashboard/not-found');
    render(<DashboardNotFound />);
    const link = screen.getByText('Back to Dashboard');
    expect(link.closest('a')?.getAttribute('href')).toBe('/dashboard/overview');
  });
});

describe('DashboardError Page', () => {
  let captureException: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const Sentry = await import('@sentry/nextjs');
    captureException = Sentry.captureException as ReturnType<typeof vi.fn>;
  });

  it('should render error message', async () => {
    const { default: DashboardError } = await import('@/app/dashboard/error');
    const error = new Error('Test error message');
    const reset = vi.fn();
    render(<DashboardError error={error} reset={reset} />);
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Test error message')).toBeDefined();
  });

  it('should report error to Sentry', async () => {
    const { default: DashboardError } = await import('@/app/dashboard/error');
    const error = new Error('Sentry test');
    render(<DashboardError error={error} reset={vi.fn()} />);
    expect(captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: { section: 'dashboard' },
      }),
    );
  });

  it('should call reset on Try Again click', async () => {
    const { default: DashboardError } = await import('@/app/dashboard/error');
    const reset = vi.fn();
    render(<DashboardError error={new Error('test')} reset={reset} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('should show fallback message when error has no message', async () => {
    const { default: DashboardError } = await import('@/app/dashboard/error');
    const error = new Error('');
    render(<DashboardError error={error} reset={vi.fn()} />);
    expect(screen.getByText('An error occurred while loading this page.')).toBeDefined();
  });
});
