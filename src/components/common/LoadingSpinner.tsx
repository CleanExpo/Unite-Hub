"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin text-blue-600", sizeMap[size])} />
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
