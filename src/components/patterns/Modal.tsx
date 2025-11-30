/**
 * Modal Component
 *
 * Accessible modal dialog with focus trap and keyboard support.
 * Supports multiple sizes and actions.
 *
 * @example
 * <Modal
 *   isOpen={isModalOpen}
 *   onClose={() => setModalOpen(false)}
 *   title="Confirm Action"
 *   size="md"
 * >
 *   <p>Are you sure you want to proceed?</p>
 *   <Modal.Footer>
 *     <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
 *     <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
 *   </Modal.Footer>
 * </Modal>
 */

import { forwardRef, ReactNode, HTMLAttributes, useEffect, useRef } from 'react';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  /** Is modal open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Modal title */
  title?: string;

  /** Modal content */
  children?: ReactNode;

  /** Modal size @default 'md' */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** Show close button @default true */
  showCloseButton?: boolean;

  /** Close on backdrop click @default true */
  closeOnBackdropClick?: boolean;

  /** Close on escape key @default true */
  closeOnEscape?: boolean;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Modal Component
 *
 * Uses design tokens:
 * - Overlay: bg-black/50, backdrop-blur-sm
 * - Dialog: bg-bg-card, border-border-subtle
 * - Close button: text-text-secondary, hover:text-accent-500
 * - Full accessibility with focus management
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      children,
      size = 'md',
      showCloseButton = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
      sm: 'w-96',
      md: 'w-md md:w-lg',
      lg: 'w-lg md:w-2xl',
      xl: 'w-2xl md:w-4xl',
    };

    // Focus trap
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && closeOnEscape) {
          onClose();
        }

        // Focus trap
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop Overlay */}
        <div
          className={`
            fixed inset-0
            z-40
            bg-black bg-opacity-50
            backdrop-blur-sm
            transition-opacity duration-200
          `}
          onClick={() => closeOnBackdropClick && onClose()}
          aria-hidden="true"
        />

        {/* Modal Dialog */}
        <div
          ref={ref}
          className={`
            fixed
            inset-0
            z-50
            flex items-center justify-center
            p-4
            ${className}
          `.trim()}
          role="presentation"
          {...props}
        >
          <div
            ref={dialogRef}
            className={`
              bg-bg-card
              border border-border-subtle
              rounded-lg
              shadow-lg
              max-h-[90vh]
              overflow-y-auto
              ${sizeClasses[size]}
              animate-in fade-in zoom-in-95 duration-200
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-card">
              {title && (
                <h2 id="modal-title" className="text-lg md:text-xl font-bold text-text-primary">
                  {title}
                </h2>
              )}

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={`
                    flex-shrink-0 ml-auto
                    p-2
                    text-text-secondary
                    hover:text-accent-500
                    rounded-md
                    transition-colors duration-fast
                    focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-card
                  `}
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4">
              {children}
            </div>
          </div>
        </div>
      </>
    );
  }
);

Modal.displayName = 'Modal';

/**
 * Modal.Footer
 * Helper component for modal footer with action buttons
 */
export const ModalFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`
      flex flex-col-reverse sm:flex-row gap-3
      justify-end
      px-6 py-4
      border-t border-border-subtle
      bg-bg-hover
      rounded-b-lg
      -mx-6 -mb-4
      ${className}
    `.trim()}
    {...props}
  >
    {children}
  </div>
));

ModalFooter.displayName = 'Modal.Footer';

// Attach Footer to Modal
Modal.Footer = ModalFooter;

export default Modal;
