/**
 * Input Component
 *
 * Text input component with support for multiple input types,
 * error states, and validation feedback.
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter your name" />
 *
 * @example
 * // Input with error
 * <Input error={true} errorMessage="Email is required" />
 *
 * @example
 * // Textarea
 * <Input as="textarea" rows={4} placeholder="Enter message" />
 */

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Whether the input has an error @default false */
  error?: boolean;

  /** Error message to display below input */
  errorMessage?: string;

  /** Label text for the input */
  label?: string;

  /** Helper text displayed below input */
  helperText?: string;

  /** Whether to render as textarea @default false */
  as?: 'input' | 'textarea';

  /** Number of rows for textarea */
  rows?: number;

  /** Icon to display on the left side of input */
  icon?: ReactNode;

  /** Icon to display on the right side of input */
  iconRight?: ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Size variant @default 'md' */
  size?: 'sm' | 'md';

  /** Full width input @default false */
  fullWidth?: boolean;
}

/**
 * Input Component
 *
 * Uses design tokens:
 * - Background: bg-input (#111214)
 * - Border: border-subtle (rgba(255, 255, 255, 0.08))
 * - Text: text-primary (#f8f8f8)
 * - Placeholder: text-muted (#6b7280)
 * - Focus ring: focus:ring-accent-500
 *
 * States:
 * - Default: normal input
 * - Focus: border-accent-500, ring-accent-500
 * - Error: border-error, text-error
 * - Disabled: opacity-50, cursor-not-allowed
 */
export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(
  (
    {
      error = false,
      errorMessage,
      label,
      helperText,
      as = 'input',
      rows = 4,
      icon,
      iconRight,
      className = '',
      size = 'md',
      fullWidth = false,
      disabled = false,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      w-full
      bg-input
      text-text-primary
      border
      rounded-md
      transition-all
      duration-normal
      ease-out
      placeholder-text-muted
      focus:outline-none
      focus:border-accent-500
      focus:ring-2
      focus:ring-accent-500
      focus:ring-offset-2
      focus:ring-offset-bg-base
      disabled:opacity-50
      disabled:cursor-not-allowed
    `;

    const borderStyles = error
      ? 'border-error'
      : 'border-border-subtle';

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
    };

    const fullWidthStyle = fullWidth ? 'w-full' : '';

    const wrapperStyles = `
      flex
      flex-col
      gap-1
      ${fullWidthStyle}
    `;

    const inputWrapperStyles = `
      relative
      flex
      items-center
      ${fullWidthStyle}
    `;

    const Element = as === 'textarea' ? 'textarea' : 'input';

    return (
      <div className={wrapperStyles}>
        {/* Label */}
        {label && (
          <label
            className="
              text-sm
              font-medium
              text-text-primary
            "
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className={inputWrapperStyles}>
          {/* Left icon */}
          {icon && (
            <span
              className="
                absolute
                left-3
                text-text-secondary
                pointer-events-none
              "
            >
              {icon}
            </span>
          )}

          {/* Input element */}
          <Element
            ref={ref as any}
            disabled={disabled}
            rows={as === 'textarea' ? rows : undefined}
            type={as === 'input' ? type : undefined}
            className={`
              ${baseStyles}
              ${borderStyles}
              ${sizeStyles[size]}
              ${icon ? 'pl-10' : ''}
              ${iconRight ? 'pr-10' : ''}
              ${className}
            `.trim()}
            {...(props as any)}
          />

          {/* Right icon */}
          {iconRight && (
            <span
              className="
                absolute
                right-3
                text-text-secondary
                pointer-events-none
              "
            >
              {iconRight}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && errorMessage && (
          <p
            className="
              text-sm
              text-error
              font-medium
            "
          >
            {errorMessage}
          </p>
        )}

        {/* Helper text */}
        {!error && helperText && (
          <p
            className="
              text-sm
              text-text-secondary
            "
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
