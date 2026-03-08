// Minimal use-toast stub for Nexus 2.0
// Replace with full implementation when toast UI is built

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: ToastAction;
}

export function useToast() {
  return {
    toasts: [] as Toast[],
    toast: (_props: Omit<Toast, "id">) => {},
    dismiss: (_toastId?: string) => {},
  };
}

export function toast(_props: Omit<Toast, "id">) {}
