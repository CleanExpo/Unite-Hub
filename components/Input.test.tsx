import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders basic input', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows helper text when no error', () => {
    render(<Input helperText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('hides helper text when error is present', () => {
    render(<Input error="Error message" helperText="Helper text" />)
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('handles change events', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-input')
  })

  it('associates label with input using htmlFor', () => {
    render(<Input label="Username" id="username-input" />)
    const label = screen.getByText('Username')
    const input = screen.getByRole('textbox')
    expect(label).toHaveAttribute('for', 'username-input')
    expect(input).toHaveAttribute('id', 'username-input')
  })

  it('generates unique id when not provided', () => {
    render(<Input label="Email" />)
    const label = screen.getByText('Email')
    const input = screen.getByRole('textbox')
    const labelFor = label.getAttribute('for')
    expect(labelFor).toBeTruthy()
    expect(input).toHaveAttribute('id', labelFor)
  })

  it('sets aria-describedby for error messages', () => {
    render(<Input error="Invalid email" />)
    const input = screen.getByRole('textbox')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    const errorElement = document.getElementById(errorId!)
    expect(errorElement).toHaveTextContent('Invalid email')
  })

  it('accepts all standard input props', () => {
    render(
      <Input
        type="email"
        required
        maxLength={50}
        disabled
        placeholder="test@example.com"
      />
    )
    const input = screen.getByPlaceholderText('test@example.com')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('maxLength', '50')
    expect(input).toBeDisabled()
  })
})