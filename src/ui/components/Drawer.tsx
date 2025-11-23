/**
 * Drawer Component
 * Phase 37: UI/UX Polish
 *
 * Slide-out panel with consistent styling
 */

"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  showOverlay?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const positionClasses = {
  left: {
    container: "left-0",
    transform: {
      open: "translate-x-0",
      closed: "-translate-x-full",
    },
  },
  right: {
    container: "right-0",
    transform: {
      open: "translate-x-0",
      closed: "translate-x-full",
    },
  },
};

export function Drawer({
  isOpen,
  onClose,
  children,
  className = "",
  position = "right",
  size = "md",
  showOverlay = true,
}: DrawerProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const posConfig = positionClasses[position];
  const transformClass = isOpen
    ? posConfig.transform.open
    : posConfig.transform.closed;

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`
            fixed inset-0 z-40
            bg-black/50 backdrop-blur-sm
            transition-opacity duration-300
            ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          `}
          onClick={onClose}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`
          fixed top-0 ${posConfig.container} z-50
          h-full w-full ${sizeClasses[size]}
          bg-white dark:bg-gray-800
          shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${transformClass}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </>
  );
}

export function DrawerHeader({
  children,
  className = "",
  onClose,
}: {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}) {
  return (
    <div
      className={`
        flex items-center justify-between
        px-6 py-4
        border-b border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      <div>{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="
            p-1 rounded-full
            text-gray-400 hover:text-gray-600
            dark:text-gray-500 dark:hover:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors
          "
          aria-label="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function DrawerTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}
    >
      {children}
    </h2>
  );
}

export function DrawerBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function DrawerFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        flex items-center justify-end gap-3
        px-6 py-4
        border-t border-gray-200 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Drawer;
