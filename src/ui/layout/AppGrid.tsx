/**
 * AppGrid Layout Component
 * Phase 37: UI/UX Polish
 *
 * Standardized grid system for consistent page layouts
 */

import React from "react";

interface AppGridProps {
  children: React.ReactNode;
  className?: string;
}

interface PageContainerProps extends AppGridProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

interface GridProps extends AppGridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "none" | "sm" | "md" | "lg" | "xl";
}

// Standardized spacing values
export const spacing = {
  page: {
    paddingX: "px-4 sm:px-6 lg:px-8",
    paddingY: "py-6 sm:py-8",
  },
  section: {
    marginBottom: "mb-6 sm:mb-8",
  },
  card: {
    padding: "p-4 sm:p-6",
  },
};

// Max width classes
const maxWidthClasses = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

// Gap classes
const gapClasses = {
  none: "gap-0",
  sm: "gap-2 sm:gap-3",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-12",
};

// Grid column classes
const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-4 sm:grid-cols-6 lg:grid-cols-12",
};

/**
 * Page Container - wraps entire page content
 */
export function PageContainer({
  children,
  className = "",
  maxWidth = "xl",
}: PageContainerProps) {
  return (
    <div
      className={`
        min-h-screen bg-bg-raised
        ${spacing.page.paddingX} ${spacing.page.paddingY}
        ${className}
      `}
    >
      <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>{children}</div>
    </div>
  );
}

/**
 * Section - groups related content
 */
export function Section({ children, className = "" }: AppGridProps) {
  return (
    <section className={`${spacing.section.marginBottom} ${className}`}>
      {children}
    </section>
  );
}

/**
 * Grid - responsive grid layout
 */
export function Grid({
  children,
  className = "",
  cols = 1,
  gap = "md",
}: GridProps) {
  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Flex Row - horizontal flex layout
 */
export function FlexRow({
  children,
  className = "",
  gap = "md",
}: GridProps) {
  return (
    <div className={`flex flex-wrap items-center ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Stack - vertical flex layout
 */
export function Stack({
  children,
  className = "",
  gap = "md",
}: GridProps) {
  return (
    <div className={`flex flex-col ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Split - two-column split layout
 */
interface SplitProps extends AppGridProps {
  leftWidth?: "1/3" | "1/2" | "2/3";
}

export function Split({
  children,
  className = "",
  leftWidth = "1/2",
}: SplitProps) {
  const widthClasses = {
    "1/3": "lg:grid-cols-[1fr_2fr]",
    "1/2": "lg:grid-cols-2",
    "2/3": "lg:grid-cols-[2fr_1fr]",
  };

  return (
    <div
      className={`grid grid-cols-1 ${widthClasses[leftWidth]} gap-6 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Chatbot safe zone - ensures content doesn't overlap with chatbot
 */
export function ChatbotSafeZone({ children, className = "" }: AppGridProps) {
  return (
    <div className={`pb-20 lg:pb-0 lg:pr-96 ${className}`}>{children}</div>
  );
}

export default {
  PageContainer,
  Section,
  Grid,
  FlexRow,
  Stack,
  Split,
  ChatbotSafeZone,
  spacing,
};
