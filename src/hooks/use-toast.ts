/**
 * Toast Hook - shadcn/ui compatible
 * Provides toast notification functionality
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ToastState {
  toasts: Toast[];
}

let memoryState: ToastState = {
  toasts: [],
};

const listeners: Array<(state: ToastState) => void> = [];

function dispatch(action: Toast) {
  memoryState = {
    toasts: [...memoryState.toasts, action],
  };
  listeners.forEach((listener) => listener(memoryState));

  // Auto-remove after 5 seconds
  setTimeout(() => {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.id),
    };
    listeners.forEach((listener) => listener(memoryState));
  }, 5000);
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useState(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { ...props, id, open: true };

      dispatch(newToast);

      return {
        id,
        dismiss: () => {
          memoryState = {
            toasts: memoryState.toasts.filter((t) => t.id !== id),
          };
          listeners.forEach((listener) => listener(memoryState));
        },
      };
    },
    []
  );

  return {
    toast,
    toasts: state.toasts,
    dismiss: (toastId: string) => {
      memoryState = {
        toasts: memoryState.toasts.filter((t) => t.id !== toastId),
      };
      listeners.forEach((listener) => listener(memoryState));
    },
  };
}
