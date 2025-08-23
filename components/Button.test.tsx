import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('bg-primary-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary-200')

    rerender(<Button variant="danger">Danger</Button>)
    expect(screen.getByText('Danger')).toHaveClass('bg-error-600')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByText('Ghost')).toHaveClass('bg-transparent')
  })

  it('applies correct size styles', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('px-3', 'py-1.5')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByText('Medium')).toHaveClass('px-4', 'py-2')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('px-6', 'py-3')
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    const spinner = screen.getByRole('button').querySelector('svg')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not trigger click when disabled', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    fireEvent.click(screen.getByText('Disabled'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })

  it('passes through other props', () => {
    render(<Button data-testid="custom-button">Props</Button>)
    expect(screen.getByTestId('custom-button')).toBeInTheDocument()
  })
})