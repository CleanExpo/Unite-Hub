/**
 * Alert Component
 *
 * Contextual alert messages for important information.
 * Supports multiple types with semantic colors and optional dismissal.
 *
 * @example
 * <Alert
 *   type="success"
 *   title="Success"
 *   description="Your changes have been saved successfully."
 * />
 *
 * @example
 * <Alert
 *   type="error"
 *   title="Error"
 *   description="Something went wrong. Please try again."
 *   icon={<AlertIcon />}
 *   dismissible
 *   action={{ label: 'Retry', onClick: () => handleRetry() }}
 * />
 */

import { forwardRef, ReactNode, useState, HTMLAttributes } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Alert type/severity */
  type: 'info' | 'success' | 'warning' | 'error';

  /** Alert title */
  title?: string;

  /** Alert description/message */
  description: string | ReactNode;

  /** Custom icon */
  icon?: ReactNode;

  /** Show close button */
  dismissible?: boolean;

  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
  };

  /** Callback when alert is closed */
  onClose?: () => void;

  /** Custom CSS class */
  className?: string;
}

/**
 * Alert Component
 *
 * Uses design tokens:
 * - Info: bg-accent-500/10, border-accent-500/30, text-accent-900
 * - Success: bg-success-500/10, border-success-500/30, text-success-900
 * - Warning: bg-warning-500/10, border-warning-500/30, text-warning-900
 * - Error: bg-error-500/10, border-error-500/30, text-error-900
 * - Icons: Semantic colors matching type
 * - Spacing: px-4, py-3, gap-3
 * - Animations: duration-fast, ease-out
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type,
      title,
      description,
      icon,
      dismissible = false,
      action,
      onClose,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    if (!isVisible) {
      return null;
    }

    const typeStyles = {
      info: {
        bg: 'bg-accent-500/10',
        border: 'border-accent-500/30',
        text: 'text-accent-900',
        icon: (
          <svg className="w-5 h-5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        ),
      },
      success: {
        bg: 'bg-success-500/10',
        border: 'border-success-500/30',
        text: 'text-success-900',
        icon: (
          <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
      },
      warning: {
        bg: 'bg-warning-500/10',
        border: 'border-warning-500/30',
        text: 'text-warning-900',
        icon: (
          <svg className="w-5 h-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.487 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
      error: {
        bg: 'bg-error-500/10',
        border: 'border-error-500/30',
        text: 'text-error-900',
        icon: (
          <svg className="w-5 h-5 text-error-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ),
      },
    };

    const style = typeStyles[type];

    return (
      <div
        ref={ref}
        className={`
          flex items-start gap-3
          px-4 py-3
          rounded-lg
          border
          animate-in fade-in slide-in-from-top-2 duration-200
          ${style.bg}
          ${style.border}
          ${style.text}
          ${className}
        `}
        role="alert"
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {icon || style.icon}
        </div>

        {/* Content */}
        <div className="flex-1">
          {title && (
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
          )}
          <div className={`text-sm ${title ? 'opacity-90' : ''}`}>
            {description}
          </div>
        </div>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className={`
              flex-shrink-0
              px-3 py-1.5
              text-sm
              font-medium
              rounded
              opacity-70
              hover:opacity-100
              transition-opacity duration-fast
              focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-offset-transparent
            `}
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        {dismissible && (
          <button
            onClick={handleClose}
            className={`
              flex-shrink-0
              p-1
              opacity-50
              hover:opacity-100
              transition-opacity duration-fast
              focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-offset-transparent
              rounded
            `}
            aria-label="Close alert"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
