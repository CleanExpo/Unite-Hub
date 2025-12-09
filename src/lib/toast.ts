/**
 * Toast Utility
 * Simple wrapper for showing toast notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

// Simple event-based toast system
const TOAST_EVENT = 'show-toast';

export const toast = {
  success: (message: string, duration = 5000) => {
    showToast({ message, type: 'success', duration });
  },
  error: (message: string, duration = 5000) => {
    showToast({ message, type: 'error', duration });
  },
  warning: (message: string, duration = 5000) => {
    showToast({ message, type: 'warning', duration });
  },
  info: (message: string, duration = 5000) => {
    showToast({ message, type: 'info', duration });
  },
};

function showToast(options: ToastOptions) {
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT, {
        detail: options,
      })
    );
  }
}

// Hook for toast container to listen to events
export function useToastListener(callback: (options: ToastOptions) => void) {
  if (typeof window === 'undefined') {
return;
}

  const handleToast = (event: Event) => {
    const customEvent = event as CustomEvent<ToastOptions>;
    callback(customEvent.detail);
  };

  window.addEventListener(TOAST_EVENT, handleToast);

  return () => {
    window.removeEventListener(TOAST_EVENT, handleToast);
  };
}
