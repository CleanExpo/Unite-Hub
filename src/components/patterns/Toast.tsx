/**
 * Toast Notification Component
 *
 * System-wide toast notifications with auto-dismiss, actions, and accessibility.
 * Use the useToast hook to display notifications from anywhere in your app.
 *
 * @example
 * const { toast } = useToast();
 *
 * toast.success('Profile updated successfully!');
 * toast.error('Failed to save changes');
 * toast.warning('This action cannot be undone');
 * toast.info('New feature available');
 *
 * @example
 * toast.success('File uploaded', {
 *   action: { label: 'View', onClick: () => navigate('/files') },
 *   duration: 5000,
 * });
 */

import { forwardRef, ReactNode, useEffect, HTMLAttributes } from 'react';

export interface Toast {
  /** Unique toast ID */
  id: string;

  /** Toast type/severity */
  type: 'success' | 'error' | 'warning' | 'info';

  /** Toast message */
  message: string | ReactNode;

  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };

  /** Auto-dismiss duration (ms), 0 = no auto-dismiss */
  duration?: number;

  /** Callback when toast closes */
  onClose?: () => void;
}

export interface ToastProps extends Toast, HTMLAttributes<HTMLDivElement> {
  /** Callback to remove this toast */
  onRemove: (id: string) => void;

  /** Custom CSS class */
  className?: string;
}

/**
 * Toast Component (Individual Toast)
 *
 * Uses design tokens:
 * - Success: bg-success-500, text-white
 * - Error: bg-error-500, text-white
 * - Warning: bg-warning-500, text-white
 * - Info: bg-accent-500, text-white
 * - Icon colors: text-white
 * - Animations: duration-normal, ease-out
 */
export const ToastItem = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      type,
      message,
      action,
      duration = 4000,
      onClose,
      onRemove,
      className = '',
      ...props
    },
    ref
  ) => {
    useEffect(() => {
      if (duration === 0) {
return;
}

      const timer = setTimeout(() => {
        onClose?.();
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }, [id, duration, onClose, onRemove]);

    const typeStyles = {
      success: {
        bg: 'bg-success-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ),
      },
      error: {
        bg: 'bg-error-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        ),
      },
      warning: {
        bg: 'bg-warning-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.487 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
      info: {
        bg: 'bg-accent-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
          text-white
          rounded-lg
          shadow-lg
          animate-in slide-in-from-right-full fade-in duration-300
          ${style.bg}
          ${className}
        `}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>

        {/* Action Button */}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onRemove(id);
            }}
            className={`
              flex-shrink-0
              px-3 py-1
              text-sm
              font-medium
              bg-white/20
              hover:bg-white/30
              rounded
              transition-colors duration-fast
              focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-${style.bg}
            `}
          >
            {action.label}
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            onClose?.();
            onRemove(id);
          }}
          className={`
            flex-shrink-0
            p-1
            text-white/70
            hover:text-white
            transition-colors duration-fast
            focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-${style.bg}
            rounded
          `}
          aria-label="Close notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }
);

ToastItem.displayName = 'Toast';

export interface ToastContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Array of toasts to display */
  toasts: Toast[];

  /** Callback to remove a toast */
  onRemove: (id: string) => void;

  /** Custom CSS class */
  className?: string;

  /** Position on screen */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

  /** Max number of visible toasts */
  maxVisible?: number;
}

/**
 * Toast Container
 * Manages multiple toasts and their positioning
 */
export const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>(
  (
    {
      toasts,
      onRemove,
      className = '',
      position = 'bottom-right',
      maxVisible = 5,
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
    };

    const visibleToasts = toasts.slice(0, maxVisible);

    return (
      <div
        ref={ref}
        className={`
          fixed
          z-50
          flex
          flex-col
          gap-3
          pointer-events-none
          ${positionClasses[position]}
          ${className}
        `}
        {...props}
      >
        {visibleToasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              {...toast}
              onRemove={onRemove}
            />
          </div>
        ))}
      </div>
    );
  }
);

ToastContainer.displayName = 'ToastContainer';

export default ToastItem;
