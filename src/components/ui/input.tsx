/**
 * Input Component - Phase 2 UI Library
 * Accessible form input with labels, errors, and Scientific Luxury styling
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white/60 mb-2"
        >
          {label}
          {props.required && <span className="text-[#FF4444] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            block w-full rounded-sm border-[0.5px] bg-white/[0.02] text-white/90 placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40 disabled:opacity-50 disabled:cursor-not-allowed
            ${hasError ? 'border-[#FF4444]/40 focus:border-[#FF4444]/60' : 'border-white/[0.06]'}
            ${leftIcon ? 'pl-10' : 'pl-4'}
            ${rightIcon ? 'pr-10' : 'pr-4'}
            py-2.5
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
          }
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/30">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-2 text-sm text-[#FF4444]"
          role="alert"
        >
          {error}
        </p>
      )}

      {helpText && !error && (
        <p
          id={`${inputId}-help`}
          className="mt-2 text-sm text-white/40"
        >
          {helpText}
        </p>
      )}
    </div>
  );
}

// Named export for compatibility
export { Input };
