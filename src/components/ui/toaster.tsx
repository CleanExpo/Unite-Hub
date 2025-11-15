"use client";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => {
        const Icon =
          toast.variant === "destructive"
            ? XCircle
            : toast.variant === "default"
            ? CheckCircle2
            : AlertCircle;

        return (
          <div
            key={toast.id}
            className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all ${
              toast.variant === "destructive"
                ? "border-red-500 bg-red-950 text-red-100"
                : "border-slate-700 bg-slate-800 text-slate-100"
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <Icon
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  toast.variant === "destructive"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              />
              <div className="grid gap-1 flex-1">
                {toast.title && (
                  <div className="text-sm font-semibold">{toast.title}</div>
                )}
                {toast.description && (
                  <div className="text-sm opacity-90">{toast.description}</div>
                )}
              </div>
            </div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-slate-600 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="absolute right-2 top-2 rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-slate-100 focus:opacity-100 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
